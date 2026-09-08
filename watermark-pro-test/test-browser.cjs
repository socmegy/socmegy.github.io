const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
module.exports=async({worker,env,req,admin})=>{
 let playwright;try{playwright=require('playwright')}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
 const server=http.createServer(async(incoming,out)=>{
  try{
   const pathname=new URL(incoming.url,'http://test').pathname;
   if(pathname.startsWith('/api/')){
    const chunks=[];for await(const chunk of incoming)chunks.push(chunk);
    const response=await worker.fetch(new Request(origin+incoming.url,{method:incoming.method,headers:incoming.headers,...(!['GET','HEAD'].includes(incoming.method)?{body:Buffer.concat(chunks)}:{})}),env);
    out.writeHead(response.status,Object.fromEntries(response.headers));out.end(Buffer.from(await response.arrayBuffer()));return;
   }
   const relative=pathname.replace(/^\/watermark-pro\//,'').replace(/^\//,'')||'index.html';
   const file=path.resolve(__dirname,relative);
   if(!file.startsWith(__dirname+path.sep)||!fs.existsSync(file)){out.writeHead(404);out.end();return;}
   const types={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
   out.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});out.end(fs.readFileSync(file));
  }catch(e){out.writeHead(500);out.end(e.message)}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;env.ALLOWED_ORIGINS=origin+',http://localhost:4173';
 let browser;
 try{
  browser=await playwright.chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  await context.addInitScript(base=>window.WATERMARK_API_BASE=base,origin);
  const page=await context.newPage(),errors=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});
  await page.goto(origin+'/watermark-pro/index.html');
  for(const width of [390,800,981,1366]){
   await page.setViewportSize({width,height:900});
   const padding=await page.locator('.auth-main-v51.auth-style1-actual').evaluate(e=>{const s=getComputedStyle(e);return [s.paddingTop,s.paddingBottom]});
   assert.deepEqual(padding,['0px','0px'],'auth padding at '+width);
   if(width>=648){
    const columns=await page.evaluate(()=>{const a=document.querySelector('.auth-intro-v132').getBoundingClientRect(),b=document.querySelector('.auth-panel-v131').getBoundingClientRect();return b.left>=a.right});
    assert(columns,'tablet/desktop auth must have two columns at '+width);
   }
   if(width===800)await page.screenshot({path:'test-auth-tablet.png'});
  }
  await page.locator('[data-auth-tab="register"]').click();
  await page.locator('#registerUsername').fill('browseruser');await page.locator('#registerEmail').fill('browser@example.invalid');await page.locator('#registerPassword').fill('1234567');await page.locator('#registerTerms').check();
  await page.locator('#registerForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#registerStatus').textContent.includes('8 hingga 256'));
  await page.locator('#registerPassword').fill('12345678');await page.locator('#registerPassword').locator('..').locator('button').click();
  assert.equal(await page.locator('#registerPassword').getAttribute('type'),'text');
  await page.locator('#registerForm [type="submit"]').click();await page.waitForFunction(()=>!document.body.classList.contains('auth-mode'));
  await page.waitForFunction(()=>document.querySelector('#notificationPanel').textContent.includes('Akaun dicipta'));
  const payment=await page.evaluate(()=>window.WPCloudflare.api('/api/payments',{method:'POST',body:JSON.stringify({paymentTime:'12:30'})}));
  assert.equal((await req('/api/control/submissions/'+payment.submission.id+'/review','POST',{action:'approve'},admin)).status,200);
  await page.evaluate(()=>window.WPCloudflare.sync());
  await page.waitForFunction(()=>['Akaun dicipta','Pembayaran Pro dihantar','Akaun Sokongan Pro diaktifkan'].every(title=>document.querySelector('#notificationPanel').textContent.includes(title)));
  await page.locator('[data-page="profile"]').first().click();
  for(const selector of ['#downloadProgressImage','#downloadSupporterCard']){
   const downloaded=page.waitForEvent('download');await page.locator(selector).click();const file=await downloaded;assert.equal(await file.failure(),null);assert.match(file.suggestedFilename(),/\.png$/i);
  }
  await page.locator('[data-page="settings"]').first().click();
  await page.locator('#publicProfileSwitch').click();await page.waitForFunction(()=>!window.wpVisibilitySaving&&!document.querySelector('#publicProfileSwitch').classList.contains('on'));
  await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('auth-mode'));
  await page.locator('[data-page="settings"]').first().click();assert.equal(await page.locator('#publicProfileSwitch').evaluate(e=>e.classList.contains('on')),false);
  await page.locator('#publicProfileSwitch').click();await page.waitForFunction(()=>!window.wpVisibilitySaving&&document.querySelector('#publicProfileSwitch').classList.contains('on'));
  await page.screenshot({path:'test-account-desktop.png'});
  await page.locator('#logoutBtn').click();await page.waitForFunction(()=>document.body.classList.contains('auth-mode'));assert.equal(new URL(page.url()).hash,'');
  await page.goBack();assert.equal(await page.locator('.app').isVisible(),false);assert.equal(new URL(page.url()).hash,'');
  await page.locator('#loginEmail').fill('browser@example.invalid');await page.locator('#loginPassword').fill('12345678');await page.locator('#loginForm [type="submit"]').click();await page.waitForFunction(()=>!document.body.classList.contains('auth-mode'));
  await page.locator('[data-page="settings"]').first().click();assert.equal(await page.locator('#publicProfileSwitch').evaluate(e=>e.classList.contains('on')),true);
  await page.locator('[name="currentPassword"]').fill('12345678');await page.locator('[name="newPassword"]').fill('short');await page.locator('#passwordChangeForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#passwordChangeStatus').textContent.includes('8 hingga 256'));
  await page.locator('[name="newPassword"]').fill('Changed123');await page.locator('#passwordChangeForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#passwordChangeStatus').textContent.includes('berjaya'));
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-account-mobile.png'});
  const layout=await page.evaluate(()=>{
   const logo=document.querySelector('.topbar .header-brand-logo').getBoundingClientRect();
   return {logo:[logo.width,logo.height],border:getComputedStyle(document.querySelector('.topbar')).borderBottomWidth,headerBadge:getComputedStyle(document.querySelector('#headerProfileAvatar'),'::after').content,settingsBadge:getComputedStyle(document.querySelector('#avatarPreview'),'::after').content,community:document.body.innerText.includes('Pautan komuniti akan tersedia tidak lama lagi.')};
  });
  assert.deepEqual(layout.logo,[40,40]);assert.equal(layout.border,'0px');assert.equal(layout.headerBadge,'none');assert.equal(layout.settingsBadge,'none');assert.equal(layout.community,false);
  await page.evaluate(()=>{
   const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);
  });
  assert.equal(await page.locator('#wpInstallApp').isVisible(),false);
  assert.equal(await page.locator('#wpAccountInstallButton').isVisible(),true);
  assert.equal(await page.locator('#wpInstallCard').count(),0);
  assert.equal(await page.locator('#wpAccountInstallCard').count(),1);
  assert.equal(await page.locator('#wpInstallApp').count(),1);
  assert.equal(await page.locator('#wpInstallApp svg').count(),1);
  assert.equal(await page.locator('#wpAccountInstallButton').evaluate(e=>getComputedStyle(e).position),'static');
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  assert.equal(await page.locator('#wpAccountInstallButton').count(),0);
  const geometry=await page.evaluate(async()=>{
   const viewer=document.querySelector('#mediaLightbox'),image=document.querySelector('#mediaLightboxImage');
   image.src=new URL('bg.jpg',document.baseURI).href;await image.decode();viewer.dataset.viewerKind='banner';viewer.classList.add('open');
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const a=image.getBoundingClientRect(),b=document.querySelector('#closeMediaViewer').getBoundingClientRect();
   const result={dx:Math.abs(a.right-(b.left+b.width/2)),dy:Math.abs(a.bottom-(b.top+b.height/2))};viewer.dataset.viewerKind='photo-avatar';
   result.avatarClose=getComputedStyle(document.querySelector('#closeMediaViewer')).display;viewer.classList.remove('open');return result;
  });
  assert(geometry.dx<2&&geometry.dy<2,JSON.stringify(geometry));assert.equal(geometry.avatarClose,'none');
  const control=await context.newPage();control.on('pageerror',e=>errors.push(e.message));control.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});
  await control.addInitScript(token=>localStorage.setItem('watermarkProControlApiToken',token),admin);
  await control.goto(origin+'/watermark-pro/control.html');
  const topDownload=control.waitForEvent('download');await control.locator('#downloadTopUsers').click();const topFile=await topDownload;assert.equal(await topFile.failure(),null);assert.match(topFile.suggestedFilename(),/\.png$/i);
  await control.locator('[data-view="users"]').first().click();await control.locator('#addUserBtn').click();await control.locator('#userModal.open').waitFor();assert.equal(await control.locator('#resetPasswordSection').isVisible(),false);
  await control.locator('#userUsername').fill('browsercreated');await control.locator('#userEmail').fill('browsercreated@example.invalid');await control.locator('#userForm [type="submit"]').click();await control.locator('#temporaryPasswordModal.open').waitFor();
  const temporary=await control.locator('#temporaryPasswordValue').inputValue();assert(temporary.length>=8);
  await control.locator('#copyTemporaryPassword').click();await control.screenshot({path:'test-control-result.png'});await control.locator('#closeTemporaryPassword').click();assert.equal(await control.locator('#temporaryPasswordValue').count(),0);
  const login=await req('/api/auth/login','POST',{email:'browsercreated@example.invalid',password:temporary});assert.equal(login.status,200);
  await control.locator('[data-edit-user="'+login.data.user.id+'"]').click();assert.equal(await control.locator('#resetPasswordSection').isVisible(),true);
  await control.locator('#resetUserPassword').fill('Reset123');await control.locator('#resetUserPasswordBtn').click();await control.waitForFunction(()=>document.querySelector('#resetUserPasswordStatus').textContent.includes('berjaya'));
  assert.equal((await req('/api/auth/login','POST',{email:'browsercreated@example.invalid',password:'Reset123'})).status,200);
  await page.goto(origin+'/index.html');await page.waitForFunction(()=>typeof window.WPCloudflare==='object');
  assert.equal(await page.evaluate(()=>new URL('release-ui.js',document.baseURI).pathname),'/release-ui.js');
  assert.deepEqual(dialogs,[]);assert.deepEqual(errors,[]);
  console.log('PASS browser: revealed registration, Malay errors, notifications, persisted toggle, logout/back/login, Control create/copy/reset, root/subfolder assets; no JS errors or dialogs');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
};
