'use strict';

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp({
  databaseURL: 'https://watermark-pro-1dada-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();
const auth = admin.auth();
const firebaseApiKey = 'AIzaSyALnFEmFsuF8i5LrXJJ4nUcfCyitFpoyGg';

function usernameKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\./g, '%2E');
}

function validUsername(value) {
  return /^[A-Za-z0-9._]{2,20}$/.test(String(value || ''));
}

async function assertUsernameAvailable(name, uid) {
  const wanted = String(name || '').trim().toLowerCase();
  const snapshot = await db.ref('users').once('value');
  let conflict = false;
  snapshot.forEach(child => {
    if (child.key !== uid && String(child.val()?.name || '').trim().toLowerCase() === wanted) conflict = true;
  });
  if (conflict) throw new functions.https.HttpsError('already-exists', 'This username is already in use.');
}

exports.claimUsername = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login is required.');
  const name = String(data?.username || '').trim();
  if (!validUsername(name)) throw new functions.https.HttpsError('invalid-argument', 'Username must contain 2–20 letters, numbers, dots or underscores.');
  await assertUsernameAvailable(name, context.auth.uid);
  const key = usernameKey(name);
  const reservation = await db.ref('usernames/' + key).transaction(current => current === null || current === context.auth.uid ? context.auth.uid : undefined);
  if (!reservation.committed) throw new functions.https.HttpsError('already-exists', 'This username is already in use.');
  return { ok: true, key };
});

exports.syncOwnEmail = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login is required.');
  const email = String(context.auth.token.email || '').trim().toLowerCase();
  if (!email) throw new functions.https.HttpsError('failed-precondition', 'No email is attached to this account.');
  await db.ref('users/' + context.auth.uid + '/email').set(email);
  return { email };
});

exports.recordDownloadActivity = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login is required to record downloads.');
  const images = Math.max(0, Math.floor(Number(data?.images || 0)));
  const videos = Math.max(0, Math.floor(Number(data?.videos || 0)));
  const total = images + videos;
  if (!total || total > 1000) throw new functions.https.HttpsError('invalid-argument', 'Invalid download count.');
  const uid = context.auth.uid;
  const clientId = String(data?.clientId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  if (!clientId) throw new functions.https.HttpsError('invalid-argument', 'A download event ID is required.');
  const activityRef = db.ref('activities/' + uid + '/' + clientId);
  const activity = {
    clientId,
    createdAt: admin.database.ServerValue.TIMESTAMP,
    images,
    videos,
    total,
    watermarkType: data?.watermarkType === 'signature' ? 'signature' : 'text',
    font: String(data?.font || 'arial').slice(0, 50),
    position: String(data?.position || 'center').slice(0, 40),
    color: String(data?.color || 'white').slice(0, 30),
    totalsApplied: false
  };
  const claim = await activityRef.transaction(current => current === null ? activity : undefined);
  const existing = claim.snapshot.val() || {};
  if (!claim.committed && existing.totalsApplied === true) {
    return { recorded: false, duplicate: true, images, videos, total, activityId: clientId };
  }
  // Apply the counters and completion marker atomically. A retry after an
  // interrupted claim can safely finish the same event without double-counting.
  await db.ref().update({
    ['users/' + uid + '/images']: admin.database.ServerValue.increment(images),
    ['users/' + uid + '/videos']: admin.database.ServerValue.increment(videos),
    ['users/' + uid + '/downloads']: admin.database.ServerValue.increment(total),
    ['activities/' + uid + '/' + clientId + '/totalsApplied']: true
  });
  return { recorded: true, images, videos, total, activityId: clientId };
});

async function requireAdmin(context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin login is required.');
  const allowed = (await db.ref('admins/' + context.auth.uid).once('value')).val() === true;
  if (!allowed) throw new functions.https.HttpsError('permission-denied', 'This account is not an admin.');
}

async function getSupporterNumber(existing) {
  if (Number(existing) > 0) return Number(existing);
  const result = await db.ref('counters/supporters').transaction(value => Number(value || 0) + 1);
  return Number(result.snapshot.val());
}

exports.adminGrantPro = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  await requireAdmin(context);
  const identity = String(data?.identity || '').trim().toLowerCase();
  const months = Math.max(1, Math.min(12, Math.floor(Number(data?.months || 1))));
  if (!identity) throw new functions.https.HttpsError('invalid-argument', 'Enter an email or username.');
  const usersSnapshot = await db.ref('users').once('value');
  let uid = null;
  usersSnapshot.forEach(child => { const value=child.val()||{};if(!uid&&(String(value.email||'').toLowerCase()===identity||String(value.name||'').toLowerCase()===identity))uid=child.key });
  if (!uid) throw new functions.https.HttpsError('not-found', 'User not found.');
  const old=(await db.ref('subscriptions/'+uid).once('value')).val()||{},now=Date.now();
  let expiresAt=old.status==='pro'&&Number(old.expiresAt)>now?Number(old.expiresAt):now;
  for(let index=0;index<months;index++){const start=new Date(expiresAt),next=new Date(start),day=start.getDate();next.setDate(1);next.setMonth(next.getMonth()+1);next.setDate(Math.min(day,new Date(next.getFullYear(),next.getMonth()+1,0).getDate()));expiresAt=next.getTime()}
  const proSince=Number(old.proSince||now),supporterNumber=await getSupporterNumber(old.supporterNumber);
  const pricing=(await db.ref('settings/pricing').once('value')).val()||{},normal=Number(pricing.normal||5),discount=Number(pricing.discount||0),monthlyPrice=discount>0&&discount<normal?discount:normal;
  await db.ref().update({['subscriptions/'+uid]:{status:'pro',source:'free_grant',proSince,approvedAt:now,expiresAt,grantedMonths:months,monthlyPrice,grantedSubtotal:months*monthlyPrice,priceBasis:'locked',priceLockedAt:now,supporterNumber},['users/'+uid+'/proSince']:proSince,['users/'+uid+'/proExpiresAt']:expiresAt});
  return {uid,proSince,expiresAt,months};
});

exports.adminUpdateUser = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  await requireAdmin(context);
  const uid = String(data?.uid || '').trim();
  const name = String(data?.name || '').trim();
  const email = String(data?.email || '').trim().toLowerCase();
  const avatarUrl = String(data?.avatarUrl || '').trim();
  if (!uid || !validUsername(name)) {
    throw new functions.https.HttpsError('invalid-argument', 'Username must contain 2–20 letters, numbers, dots or underscores.');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Enter a valid email address.');
  }
  if (avatarUrl.length > 2048 || (avatarUrl && !/^(?:https?:\/\/|\.{0,2}\/|[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?)$/i.test(avatarUrl))) {
    throw new functions.https.HttpsError('invalid-argument', 'Avatar must be an image URL or local image filename.');
  }

  const userRef = db.ref('users/' + uid);
  const oldProfile = (await userRef.once('value')).val();
  if (!oldProfile) throw new functions.https.HttpsError('not-found', 'User record was not found.');
  const oldKey = usernameKey(oldProfile.name);
  const newKey = usernameKey(name);
  let reservedNewName = false;

  if (newKey !== oldKey) {
    await assertUsernameAvailable(name, uid);
    const reservation = await db.ref('usernames/' + newKey).transaction(current => current === null || current === uid ? uid : undefined);
    if (!reservation.committed) throw new functions.https.HttpsError('already-exists', 'This username is already in use.');
    reservedNewName = true;
  }

  try {
    const authUpdate = { email, displayName: name };
    authUpdate.photoURL = avatarUrl || null;
    await auth.updateUser(uid, authUpdate);
    await userRef.update({ name, email, avatarUrl });
    if (reservedNewName && oldKey) {
      const oldRef = db.ref('usernames/' + oldKey);
      const oldValue = (await oldRef.once('value')).val();
      if (oldValue === uid) await oldRef.remove();
    }
    return { ok: true };
  } catch (error) {
    if (reservedNewName) await db.ref('usernames/' + newKey).remove().catch(() => {});
    console.error('Admin user update failed:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Unable to update the user.');
  }
});

exports.adminDeleteUser = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  await requireAdmin(context);
  const uid = String(data?.uid || '').trim();
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'A user UID is required.');
  if (uid === context.auth.uid) throw new functions.https.HttpsError('failed-precondition', 'The active Admin account cannot be deleted here.');
  const profile = (await db.ref('users/' + uid).once('value')).val() || {};
  const key = usernameKey(profile.name);
  const updates = {
    ['users/' + uid]: null,
    ['publicProfiles/' + uid]: null,
    ['subscriptions/' + uid]: null,
    ['activities/' + uid]: null
  };
  const payments = await db.ref('payments').orderByChild('uid').equalTo(uid).once('value');
  payments.forEach(child => { updates['payments/' + child.key] = null; });
  if (key && (await db.ref('usernames/' + key).once('value')).val() === uid) updates['usernames/' + key] = null;
  await db.ref().update(updates);
  await auth.deleteUser(uid);
  return { ok: true };
});

function addOneMonth(timestamp) {
  const start = new Date(Number(timestamp));
  const result = new Date(start);
  const day = start.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result.getTime();
}

exports.adminReviewPayment = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  await requireAdmin(context);
  const paymentId = String(data?.paymentId || '').trim();
  const action = String(data?.action || '').trim();
  if (!paymentId || !['approve', 'reject'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid payment and action are required.');
  }
  const paymentRef = db.ref('payments/' + paymentId);
  const reviewedAt = Date.now();
  const lock = await paymentRef.transaction(current => {
    if (!current || current.status !== 'pending') return;
    if (current.reviewLock && Number(current.reviewStartedAt || 0) > reviewedAt - 120000) return;
    return { ...current, reviewLock: context.auth.uid, reviewStartedAt: reviewedAt };
  });
  if (!lock.committed) {
    throw new functions.https.HttpsError('failed-precondition', 'This payment is no longer pending.');
  }
  const payment = lock.snapshot.val();
  if (!payment?.uid) {
    await paymentRef.update({ reviewLock: null, reviewStartedAt: null });
    throw new functions.https.HttpsError('failed-precondition', 'This payment has no linked account.');
  }
  if (action === 'reject') {
    await paymentRef.update({ status: 'rejected', rejectedAt: reviewedAt, reviewedBy: context.auth.uid, reviewLock: null, reviewStartedAt: null });
    return { status: 'rejected' };
  }
  const paymentAmount = Number(payment.amount);
  const paymentOriginalPrice = Number(payment.originalPrice);
  const validPriceSnapshot = Number.isFinite(paymentAmount) && paymentAmount > 0 && Number.isFinite(paymentOriginalPrice) && paymentOriginalPrice > 0 && paymentOriginalPrice >= paymentAmount;
  if (!validPriceSnapshot) {
    await paymentRef.update({ reviewLock: null, reviewStartedAt: null });
    throw new functions.https.HttpsError('failed-precondition', 'This payment has an invalid price snapshot and cannot be approved.');
  }

  const uid = String(payment.uid);
  const subscription = (await db.ref('subscriptions/' + uid).once('value')).val() || {};
  const currentExpiry = Number(subscription.expiresAt || 0);
  const renewalBase = subscription.status === 'pro' && currentExpiry > reviewedAt ? currentExpiry : reviewedAt;
  const expiresAt = addOneMonth(renewalBase);
  const proSince = Number(subscription.proSince || reviewedAt);
  const supporterNumber = await getSupporterNumber(subscription.supporterNumber);
  const updates = {};
  updates['subscriptions/' + uid] = {
    status: 'pro',
    proSince,
    approvedAt: reviewedAt,
    expiresAt,
    lastPaymentId: paymentId,
    lastPaymentAmount: paymentAmount,
    lastPaymentOriginalPrice: paymentOriginalPrice,
    lastPaymentPriceLockedAt: Number(payment.submittedAt || reviewedAt),
    supporterNumber
  };
  updates['users/' + uid + '/proSince'] = proSince;
  updates['users/' + uid + '/proExpiresAt'] = expiresAt;
  updates['payments/' + paymentId + '/status'] = 'paid';
  updates['payments/' + paymentId + '/approvedAt'] = reviewedAt;
  updates['payments/' + paymentId + '/approvedBy'] = context.auth.uid;
  updates['payments/' + paymentId + '/subscriptionStartsAt'] = renewalBase;
  updates['payments/' + paymentId + '/expiresAt'] = expiresAt;
  updates['payments/' + paymentId + '/reviewLock'] = null;
  updates['payments/' + paymentId + '/reviewStartedAt'] = null;
  await db.ref().update(updates);
  return { status: 'paid', approvedAt: reviewedAt, expiresAt };
});

async function syncPublicProfile(uid) {
  const [userSnapshot, subscriptionSnapshot] = await Promise.all([
    db.ref('users/' + uid).once('value'),
    db.ref('subscriptions/' + uid).once('value')
  ]);
  const user = userSnapshot.val();
  if (!user) {
    await db.ref('publicProfiles/' + uid).remove();
    return;
  }
  const subscription = subscriptionSnapshot.val() || {};
  const avatarValue=String(user.avatarUrl||''),avatarUrl=/^(?:https?:\/\/|\.{0,2}\/|[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?)$/i.test(avatarValue)?avatarValue:'';
  await db.ref('publicProfiles/' + uid).set({
    name: String(user.name || 'User'),
    avatarUrl,
    downloads: Number(user.downloads || 0),
    showOnTopUsers: user.showOnTopUsers !== false,
    censorUsername: user.censorUsername === true,
    proSince: Number(subscription.proSince || user.proSince || 0),
    proExpiresAt: Number(subscription.expiresAt || user.proExpiresAt || 0)
  });
}

exports.syncPublicUser = functions.region('asia-southeast1').database.ref('/users/{uid}').onWrite((change, context) => syncPublicProfile(context.params.uid));
exports.syncPublicSubscription = functions.region('asia-southeast1').database.ref('/subscriptions/{uid}').onWrite((change, context) => syncPublicProfile(context.params.uid));

exports.rebuildPublicProfiles = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  await requireAdmin(context);
  let pageToken;
  let authUsers = 0;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const record of page.users) {
      const userRef = db.ref('users/' + record.uid);
      const existing = (await userRef.once('value')).val();
      if (!existing) {
        const createdAt = Date.parse(record.metadata.creationTime || '') || Date.now();
        const name = record.displayName || String(record.email || 'User').split('@')[0];
        await userRef.set({ name, email: record.email || '', avatarUrl: record.photoURL || '', accountCreatedAt: createdAt, downloads: 0, images: 0, videos: 0, showOnTopUsers: true, censorUsername: false });
        const subscriptionRef = db.ref('subscriptions/' + record.uid);
        if (!(await subscriptionRef.once('value')).exists()) await subscriptionRef.set({ status: 'plain_free' });
      } else if ((!existing.email || !String(existing.email).trim()) && record.email) {
        await userRef.child('email').set(String(record.email).trim().toLowerCase());
      }
      authUsers += 1;
    }
    pageToken = page.pageToken;
  } while (pageToken);
  const snapshot = await db.ref('users').once('value');
  const jobs = [];
  snapshot.forEach(child => jobs.push(syncPublicProfile(child.key)));
  await Promise.all(jobs);
  return { count: jobs.length, authUsers };
});
