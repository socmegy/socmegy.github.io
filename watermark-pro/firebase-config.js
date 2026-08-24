(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: 'AIzaSyALnFEmFsuF8i5LrXJJ4nUcfCyitFpoyGg',
    authDomain: 'watermark-pro-1dada.firebaseapp.com',
    databaseURL: 'https://watermark-pro-1dada-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'watermark-pro-1dada',
    storageBucket: 'watermark-pro-1dada.firebasestorage.app',
    messagingSenderId: '861815002148',
    appId: '1:861815002148:web:f364fce94c097bcb3eb4b1',
    measurementId: 'G-VM9MWEQ3WW'
  };

  const isAdminContext = /(?:^|\/)admin\.html(?:$|[?#])/i.test(location.pathname + location.search + location.hash);
  let app;
  if (isAdminContext) {
    app = firebase.apps.find(candidate => candidate.name === 'watermarkAdmin') || firebase.initializeApp(firebaseConfig, 'watermarkAdmin');
  } else {
    app = firebase.apps.find(candidate => candidate.name === '[DEFAULT]') || firebase.initializeApp(firebaseConfig);
  }
  const auth = app.auth();
  const db = app.database();
  const functions = typeof app.functions === 'function' ? app.functions('asia-southeast1') : null;

  function addOneMonth(timestamp) {
    const start = new Date(timestamp);
    const result = new Date(start);
    const day = start.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + 1);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));
    return result.getTime();
  }

  function effectivePlan(subscription) {
    if (!subscription || !subscription.status || subscription.status === 'plain_free') return 'plain_free';
    if (subscription.status === 'pro' && Number(subscription.expiresAt) > Date.now()) return 'pro';
    return 'expired_free';
  }

  function canRenew(subscription) {
    const plan = effectivePlan(subscription);
    if (plan !== 'pro') return true;
    return Math.ceil((Number(subscription.expiresAt) - Date.now()) / 86400000) <= 7;
  }

  function usernameKey(username) {
    return String(username || '').trim().toLowerCase().replace(/\./g, '%2E');
  }

  async function ensureUser(user, name) {
    if (!user) return null;
    const userRef = db.ref('users/' + user.uid);
    const snapshot = await userRef.once('value');
    if (!snapshot.exists()) {
      await userRef.set({
        name: name || user.displayName || user.email.split('@')[0],
        email: user.email || '',
        avatarUrl: '',
        accountCreatedAt: Date.parse(user.metadata && user.metadata.creationTime || '') || Date.now(),
        downloads: 0,
        images: 0,
        videos: 0,
        showOnTopUsers: true
      });
    } else {
      const current = snapshot.val() || {};
      const repair = {};
      if (!current.email && user.email) repair.email = user.email;
      if (!Number(current.accountCreatedAt)) repair.accountCreatedAt = Date.parse(user.metadata && user.metadata.creationTime || '') || Date.now();
      if (Object.keys(repair).length) await userRef.update(repair);
    }
    const subscriptionRef = db.ref('subscriptions/' + user.uid);
    const subscription = await subscriptionRef.once('value');
    if (!subscription.exists()) await subscriptionRef.set({ status: 'plain_free' });
    const profile = (await userRef.once('value')).val() || {};
    const publicRef = db.ref('publicProfiles/' + user.uid);
    if (!(await publicRef.once('value')).exists()) {
      await publicRef.set({
        name: profile.name || user.displayName || user.email.split('@')[0],
        avatarUrl: profile.avatarUrl || '',
        downloads: Number(profile.images || 0) + Number(profile.videos || 0),
        showOnTopUsers: profile.showOnTopUsers !== false,
        censorUsername: profile.censorUsername === true,
        proSince: Number(profile.proSince || 0),
        proExpiresAt: Number(profile.proExpiresAt || 0)
      });
    }
    return profile;
  }

  async function approvePro(uid, paymentId) {
    const approvedAt = Date.now();
    const subRef = db.ref('subscriptions/' + uid);
    const oldSub = (await subRef.once('value')).val() || {};
    const currentExpiry = Number(oldSub.expiresAt || 0);
    const renewalBase = effectivePlan(oldSub) === 'pro' && currentExpiry > approvedAt
      ? currentExpiry
      : approvedAt;
    const expiresAt = addOneMonth(renewalBase);
    await subRef.set({
      status: 'pro',
      proSince: oldSub.proSince || approvedAt,
      approvedAt,
      expiresAt,
      lastPaymentId: paymentId || null
    });
    await db.ref('users/' + uid).update({
      proSince: oldSub.proSince || approvedAt,
      proExpiresAt: expiresAt
    });
    if (paymentId) await db.ref('payments/' + paymentId).update({
      status: 'paid',
      approvedAt,
      subscriptionStartsAt: renewalBase,
      expiresAt
    });
    return { approvedAt, expiresAt };
  }

  window.WMFirebase = { config: firebaseConfig, auth, db, functions, addOneMonth, effectivePlan, canRenew, usernameKey, ensureUser, approvePro };
})();
