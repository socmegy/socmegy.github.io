const fs=require('node:fs'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
(async()=>{
const db=new DatabaseSync(':memory:');
db.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT UNIQUE,email TEXT UNIQUE,password_hash TEXT,password_salt TEXT,role TEXT,photo TEXT,plan TEXT,status TEXT,created_at TEXT,pro_until TEXT,downloads_images INTEGER DEFAULT 0,downloads_videos INTEGER DEFAULT 0,public_profile INTEGER DEFAULT 1);
CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),created_at TEXT,expires_at TEXT);
CREATE TABLE settings(id INTEGER PRIMARY KEY,admin_username TEXT,admin_photo TEXT,payments_open INTEGER,qr_image TEXT,whatsapp TEXT,auth_banners TEXT,overview_banners TEXT,community_url TEXT);
CREATE TABLE plans(id TEXT,slug TEXT,name TEXT,normal_price REAL,discount_price REAL,discount_label TEXT,billing_label TEXT,description TEXT,features_json TEXT,active INTEGER);
CREATE TABLE submissions(id TEXT PRIMARY KEY,user_id TEXT,username TEXT,email TEXT,plan_name TEXT,reference TEXT UNIQUE,amount REAL,payment_time TEXT,submitted_at TEXT,status TEXT);
CREATE TABLE subscriptions(id TEXT,user_id TEXT,username TEXT,plan_name TEXT,reference TEXT,receipt_no TEXT,amount REAL,months INTEGER,starts_at TEXT,ends_at TEXT,created_at TEXT,payment_time TEXT,status TEXT);
CREATE TABLE notifications(id TEXT PRIMARY KEY,title TEXT,text TEXT,audience TEXT,sender_username TEXT,sender_photo TEXT,created_at TEXT);
CREATE TABLE legal_sections(id TEXT,type TEXT,title TEXT,text TEXT,position INTEGER,updated_at TEXT);
INSERT INTO settings VALUES(1,'@watermarkpro','',1,'','','[]','[]','');
INSERT INTO plans VALUES('pro','pro','Penyokong Pro',12.90,4.90,'','bulan','','[]',1);`);
function statement(sql,args=[]){const s=db.prepare(sql);return{bind(...a){return statement(sql,a)},async first(){return s.get(...args)||null},async all(){return{results:s.all(...args)}},async run(){const r=s.run(...args);return{meta:{changes:r.changes}}},_sql:sql,_args:args};}
const env={DB:{prepare:statement,async batch(stmts){db.exec('BEGIN');try{const out=stmts.map(s=>{const p=db.prepare(s._sql);if(/^\s*SELECT/i.test(s._sql))return{results:p.all(...s._args)};return{meta:{changes:p.run(...s._args).changes}}});db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}}};
const worker=(await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('worker.js','utf8')).toString('base64'))).default;
async function req(path,method='GET',body,token){const r=await worker.fetch(new Request('https://test.invalid'+path,{method,headers:{'Content-Type':'application/json',Origin:'http://localhost:4173',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);return{status:r.status,data:await r.json()};}
let r=await req('/api/auth/register','POST',{username:'testuser',email:'test@example.invalid',password:'Test-password-2026'});assert.equal(r.status,201);let token=r.data.token,id=r.data.user.id;
let state=await req('/api/account/state','GET',null,token);assert.equal(state.data.notifications[0].title,'Akaun dicipta');console.log('PASS register -> notification');
{
 const photo='https://www.jisoo.io/assets/test.jpg',originalFetch=globalThis.fetch;
 db.prepare('UPDATE users SET photo=? WHERE id=?').run(photo,id);
 const proxy=()=>worker.fetch(new Request('https://test.invalid/api/account/image-proxy?url='+encodeURIComponent(photo),{headers:{Authorization:'Bearer '+token,Origin:'http://localhost:4173'}}),env);
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(url,photo);assert.equal(options.redirect,'manual');assert.equal(options.headers.Authorization,undefined);return new Response(new Uint8Array([255,216,255]),{headers:{'Content-Type':'image/jpeg'}})};
  const image=await proxy();assert.equal(image.status,200);assert.equal((await image.arrayBuffer()).byteLength,3);
  assert.equal((await req('/api/account/image-proxy?url=https://127.0.0.1/','GET',null,token)).status,403);
  globalThis.fetch=async()=>new Response('redirect',{status:302,headers:{Location:'http://127.0.0.1/'}});assert.equal((await proxy()).status,502);
  globalThis.fetch=async()=>new Response('not an image',{headers:{'Content-Type':'text/html'}});assert.equal((await proxy()).status,502);
 }finally{globalThis.fetch=originalFetch;db.prepare("UPDATE users SET photo='' WHERE id=?").run(id)}
 console.log('PASS avatar export: stored-photo authorization, raster response, redirect rejection');
}
r=await req('/api/payments','POST',{paymentTime:'12:30'},token);assert.equal(r.status,201);const sub=r.data.submission.id;
state=await req('/api/account/state','GET',null,token);assert(state.data.notifications.some(n=>n.title==='Pembayaran Pro dihantar'));console.log('PASS payment -> pending notification');
r=await req('/api/control/users/'+id+'/password','PATCH',{newPassword:'Reset-test-2026'},token);assert.equal(r.status,403);
db.prepare("INSERT INTO users SELECT 'admin','@admin','admin@example.invalid',password_hash,password_salt,'admin','','pro','active',created_at,NULL,0,0,1 FROM users WHERE id=?").run(id);
r=await req('/api/auth/login','POST',{email:'admin@example.invalid',password:'Test-password-2026',adminOnly:true});assert.equal(r.status,200);const admin=r.data.token;
r=await req('/api/control/submissions/'+sub+'/review','POST',{action:'approve'},admin);assert.equal(r.status,200);
state=await req('/api/account/state','GET',null,token);assert.equal(state.data.user.plan,'pro');assert(state.data.notifications.some(n=>n.title==='Akaun Sokongan Pro diaktifkan'));assert.equal(state.data.notifications.length,3);
r=await req('/api/control/submissions/'+sub+'/review','POST',{action:'approve'},admin);assert.equal(r.status,409);console.log('PASS approve -> active Pro notification; duplicate blocked');
r=await req('/api/account/password','PATCH',{currentPassword:'Test-password-2026',newPassword:'Changed-test-2026'},token);assert.equal(r.status,200);const old=token;token=r.data.token;assert.equal((await req('/api/account/state','GET',null,old)).status,401);assert.equal((await req('/api/account/state','GET',null,token)).status,200);
r=await req('/api/control/users/'+id+'/password','PATCH',{newPassword:'Reset-test-2026'},admin);assert.equal(r.status,200);assert.equal((await req('/api/account/state','GET',null,token)).status,401);assert.equal((await req('/api/auth/login','POST',{email:'test@example.invalid',password:'Reset-test-2026'})).status,200);console.log('PASS password change/reset; old sessions revoked; non-admin denied');
r=await req('/api/control/settings','PUT',{admin:{username:'@watermarkpro'},settings:{communityUrl:'https://t.me/testchannel'}},admin);assert.equal(r.status,200);assert.equal((await req('/api/public/state')).data.settings.communityUrl,'https://t.me/testchannel');
r=await req('/api/control/settings','PUT',{settings:{communityUrl:'javascript:alert(1)'}},admin);assert.equal(r.status,400);console.log('PASS Telegram persistence and URL validation');
for(const password of ['1234567','x'.repeat(257)])assert.equal((await req('/api/auth/register','POST',{username:'lengthtest',email:'length@example.invalid',password})).status,400);
r=await req('/api/control/users','POST',{username:'createdbyadmin',email:'created@example.invalid'},admin);assert.equal(r.status,201);const temporaryPassword=r.data.temporaryPassword;
r=await req('/api/auth/login','POST',{email:'created@example.invalid',password:temporaryPassword});assert.equal(r.status,200);const createdToken=r.data.token,createdId=r.data.user.id;
state=await req('/api/account/state','GET',null,createdToken);assert.deepEqual(state.data.notifications.map(n=>n.title),['Akaun dicipta']);
assert.equal((await req('/api/control/users','POST',{username:'createdbyadmin',email:'created@example.invalid'},admin)).status,409);
for(const publicProfile of [false,true,false]){
 r=await req('/api/account/profile','PATCH',{publicProfile},createdToken);assert.equal(r.status,200);assert.equal(r.data.user.publicProfile,publicProfile);
 assert.equal((await req('/api/account/state','GET',null,createdToken)).data.user.publicProfile,publicProfile);
 assert.equal((await req('/api/public/state')).data.topUsers.some(u=>u.id===createdId),publicProfile);
}
r=await req('/api/auth/login','POST',{email:'created@example.invalid',password:temporaryPassword});assert.equal(r.data.user.publicProfile,false);
r=await req('/api/account/profile','PATCH',{username:'renameduser'},createdToken);assert.equal(r.status,200);
assert.equal((await req('/api/account/state','GET',null,createdToken)).data.notifications.length,1);
r=await req('/api/auth/register','POST',{username:'createdbyadmin',email:'newowner@example.invalid',password:'12345678'});assert.equal(r.status,201);assert.equal((await req('/api/account/state','GET',null,r.data.token)).data.notifications.length,1);
assert.equal(db.prepare('SELECT count(*) n FROM notifications WHERE id=?').get('notice-registered-'+createdId).n,1);
console.log('PASS Control creation, temporary login, length boundaries, visibility persistence, notification targeting after rename');
const forgotExisting=await req('/api/auth/forgot-password','POST',{email:'test@example.invalid'}),forgotMissing=await req('/api/auth/forgot-password','POST',{email:'missing@example.invalid'});assert.deepEqual(forgotExisting,forgotMissing);assert(forgotExisting.data.message.includes('Kata laluan lama tidak diperlukan'));
assert.equal((await req('/api/control/users/'+createdId,'PUT',{username:'adminrenamed',email:'created@example.invalid'},admin)).status,200);
assert.equal((await req('/api/account/state','GET',null,createdToken)).data.notifications.length,1);
assert.equal((await req('/api/control/users/'+createdId,'DELETE',null,admin)).status,200);
assert.equal(db.prepare('SELECT count(*) n FROM notifications WHERE id=?').get('notice-registered-'+createdId).n,0);
assert.equal((await req('/api/account/state','GET',null,createdToken)).status,401);
console.log('PASS recovery instructions, admin rename targeting, deleted-user notification/session cleanup');
if(process.argv.includes('--browser'))await require('./test-browser.cjs')({worker,env,db,req,admin});
db.exec("CREATE TRIGGER fail_notice BEFORE INSERT ON notifications BEGIN SELECT RAISE(ABORT,'test failure'); END;");
const oldError=console.error;console.error=()=>{};
r=await req('/api/auth/register','POST',{username:'rollback',email:'rollback@example.invalid',password:'Test-password-2026'});console.error=oldError;assert.equal(r.status,500);assert.equal(db.prepare("SELECT count(*) AS n FROM users WHERE username='@rollback'").get().n,0);console.log('PASS notification failure rolls back account creation');
db.close();console.log('ALL WORKER INTEGRATION TESTS PASSED (isolated SQLite)');
})().catch(e=>{console.error(e);process.exitCode=1});
