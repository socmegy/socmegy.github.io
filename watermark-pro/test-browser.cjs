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
   let relative=pathname.replace(/^\/watermark-pro\//,'').replace(/^\//,'')||'index.html';
   if(['profil','pelan','tetapan','sokongan'].includes(relative))relative='index.html';
   if(pathname.startsWith('/published/watermark-pro/')){relative='publish/'+pathname.slice('/published/watermark-pro/'.length);if(relative.endsWith('/'))relative+='index.html';}
   const file=path.resolve(__dirname,relative);
   if(!file.startsWith(__dirname+path.sep)||!fs.existsSync(file)){out.writeHead(404);out.end();return;}
   const types={'.css':'text/css','.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
   out.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});out.end(fs.readFileSync(file));
  }catch(e){out.writeHead(500);out.end(e.message)}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;env.ALLOWED_ORIGINS=origin+',http://localhost:4173';
 let browser;
 try{
  browser=await playwright.chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  await context.addInitScript(base=>window.WATERMARK_API_BASE=base,origin);
  await context.addInitScript(()=>{window.__titleWrites=[];const d=Object.getOwnPropertyDescriptor(Document.prototype,'title');Object.defineProperty(document,'title',{get(){return d.get.call(this)},set(value){window.__titleWrites.push(value);d.set.call(this,value)}})});
  const page=await context.newPage(),errors=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});
  await page.goto(origin+'/watermark-pro/index.html');
  const titleWrites=await page.evaluate(()=>window.__titleWrites);assert(titleWrites.every(t=>t==='Watermark Pro - Watermark dulu. Baru post.'),JSON.stringify(titleWrites));
  assert.equal(await page.locator('body').innerText().then(t=>t.includes('popup.document.open()')),false,'no leaked receipt source');
  for(const width of [390,1366]){
   await page.setViewportSize({width,height:900});
   await page.locator('#proPaymentModal').evaluate(e=>{e.classList.add('open');e.setAttribute('aria-hidden','false')});
   const box=await page.locator('#proPaymentModal .payment-shell').boundingBox();
   assert(box.width<=width&&box.x>=0&&box.y>=0,'payment stays in viewport');
   await page.screenshot({path:'test-payment-'+width+'.png'});
   await page.locator('#proPaymentModal').evaluate(e=>{e.classList.remove('open');e.setAttribute('aria-hidden','true')});
  }
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
  await page.evaluate(()=>document.querySelector('.wp-live-notice').click());
  await page.waitForFunction(()=>document.querySelector('.wp-live-notice').dataset.unread==='false');
  await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('auth-mode'));
  await page.waitForFunction(()=>document.querySelector('.wp-live-notice')?.dataset.unread==='false');
  await page.locator('#logoWatermarkGroup > .tool-toggle').scrollIntoViewIfNeeded();const logoBox=await page.locator('#logoWatermarkGroup > .tool-toggle').boundingBox();await page.mouse.click(logoBox.x+20,logoBox.y+logoBox.height/2);
  assert(await page.locator('#proUpsellModal').isVisible(),'free logo opens Pro modal');
  await page.evaluate(()=>window.setProUpsellOpen(false));
  const payment=await page.evaluate(()=>window.WPCloudflare.api('/api/payments',{method:'POST',body:JSON.stringify({paymentTime:'12:30'})}));
  for(const width of [390,1366]){
   await page.setViewportSize({width,height:900});
   await page.locator('#proPaymentModal').evaluate(e=>{e.classList.add('open');e.setAttribute('aria-hidden','false')});
   await page.waitForTimeout(200);
   const modal=page.locator('#proPaymentModal .payment-shell');assert(await modal.isVisible());
   const box=await modal.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);
   await page.screenshot({path:'test-payment-'+width+'.png'});
   await page.locator('#proPaymentModal').evaluate(e=>{e.classList.remove('open');e.setAttribute('aria-hidden','true')});
  }
  assert.equal((await req('/api/control/submissions/'+payment.submission.id+'/review','POST',{action:'approve'},admin)).status,200);
  await page.evaluate(()=>window.WPCloudflare.sync());
  await page.waitForFunction(()=>['Akaun dicipta','Pembayaran Pro dihantar','Akaun Sokongan Pro diaktifkan'].every(title=>document.querySelector('#notificationPanel').textContent.includes(title)));
  await page.locator('[data-page="profile"]').first().click();
  assert.equal(new URL(page.url()).pathname,'/watermark-pro/profil');
  await page.locator('[data-page="subscriptions"]').first().click();
  await page.locator('.admin-history-receipt').first().click();
  await page.evaluate(()=>{
   window.__printCalls=0;const descriptor=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'contentWindow');
   window.__restorePrintGetter=()=>Object.defineProperty(HTMLIFrameElement.prototype,'contentWindow',descriptor);
   Object.defineProperty(HTMLIFrameElement.prototype,'contentWindow',{...descriptor,get(){const w=descriptor.get.call(this);if(w)w.print=()=>{window.__printCalls++};return w}});
  });
  await page.locator('#printReceipt').click();await page.waitForFunction(()=>window.__printCalls===1);
  await page.locator('#printReceipt').click();assert.equal(await page.evaluate(()=>window.__printCalls),1);
  const printFrame=page.frames().find(f=>f!==page.mainFrame());assert(printFrame);
  const printPage=await context.newPage();await printPage.setViewportSize({width:718,height:1047});await printPage.setContent(await printFrame.content());await printPage.emulateMedia({media:'print'});
  await printPage.screenshot({path:'test-receipt-print.png',fullPage:true});
  const stampLayout=await printPage.locator('.lr-total').evaluate(e=>{const s=e.querySelector('.lr-stamp').getBoundingClientRect(),p=e.querySelector('.lr-total-price').getBoundingClientRect();return {gap:p.left-s.right,dy:Math.abs(s.y+s.height/2-p.y-p.height/2)}});
  assert(stampLayout.gap<20&&stampLayout.gap>-20&&stampLayout.dy<2,'stamp beside price '+JSON.stringify(stampLayout));
  const printHeight=await printPage.locator('#receiptSheet').evaluate(e=>e.getBoundingClientRect().height);assert(printHeight>100&&printHeight<1047,'A4 receipt height '+printHeight);
  await printPage.close();await page.evaluate(()=>{document.querySelector('iframe[title="Resit Watermark Pro"]').contentWindow.dispatchEvent(new Event('afterprint'));window.__restorePrintGetter();document.querySelector('#receiptModal').classList.remove('open')});
  await page.locator('[data-page="profile"]').first().click();
  await page.evaluate(()=>window.WPCloudflare.api('/api/account/profile',{method:'PATCH',body:JSON.stringify({photo:new URL('logo.jpg',document.baseURI).href})}));
  await page.evaluate(()=>window.WPCloudflare.sync());
  for(const selector of ['#downloadProgressImage','#downloadSupporterCard']){
   const downloaded=page.waitForEvent('download');await page.locator(selector).click();const file=await downloaded;assert.equal(await file.failure(),null);assert.match(file.suggestedFilename(),/\.png$/i);
   if(selector==='#downloadSupporterCard')await file.saveAs('test-supporter-export.png');
  }
  await page.waitForFunction(()=>document.querySelector('#headerProfileAvatar img')?.naturalWidth>0);
  await page.evaluate(()=>window.__avatarBefore=document.querySelector('#headerProfileAvatar img'));
  for(let i=0;i<3;i++)await page.evaluate(()=>window.WPCloudflare.sync());
  assert.equal(await page.evaluate(()=>window.__avatarBefore===document.querySelector('#headerProfileAvatar img')),true,'avatar node must survive repeated sync');
  const planBorder=await page.locator('#page-subscriptions .plan.pro').evaluate(e=>({before:getComputedStyle(e,'::before').content,border:getComputedStyle(e).borderTopWidth}));
  assert.equal(planBorder.before,'none');assert.equal(planBorder.border,'2px');
  await page.locator('[data-page="settings"]').first().click();
  assert.equal(await page.locator('.sidebar .navbtn svg').count(),4);
  assert.equal(await page.locator('.sidebar .navbtn>img').count(),0);
  assert.equal(await page.evaluate(()=>{const cards=[...document.querySelectorAll('#page-settings .card')];const policy=cards.find(n=>[...n.querySelectorAll('h2,h3')].some(h=>h.textContent.trim()==='Dasar dan Syarat'));const version=document.querySelector('#page-settings .version-section');return Boolean(policy&&version&&(policy.compareDocumentPosition(version)&Node.DOCUMENT_POSITION_FOLLOWING))}),true,'policy card precedes version card');
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
  for(const owner of [false,true]){
   await page.evaluate(owner=>document.body.classList.toggle('owner-account',owner),owner);
   const ring=await page.locator('#avatarPreview').evaluate(e=>{const a=e.getBoundingClientRect(),i=e.querySelector('img').getBoundingClientRect();return {border:parseFloat(getComputedStyle(e).borderTopWidth),dx:Math.abs(a.x+a.width/2-i.x-i.width/2),dy:Math.abs(a.y+a.height/2-i.y-i.height/2)}});
   assert(ring.border>0&&ring.border<=2&&ring.dx<1&&ring.dy<1,'centered thin Pro/owner ring '+JSON.stringify(ring));
   assert(await page.locator('.sidebar-user .wp-wmark').count()>0,'Pro and owner W mark');
  }
  await page.evaluate(()=>document.body.classList.remove('owner-account'));
  const layout=await page.evaluate(()=>{
   const logo=document.querySelector('.topbar .header-brand-logo').getBoundingClientRect();
   return {logo:[logo.width,logo.height],border:getComputedStyle(document.querySelector('.topbar')).borderBottomWidth,headerBadge:getComputedStyle(document.querySelector('#headerProfileAvatar'),'::after').content,settingsBadge:getComputedStyle(document.querySelector('#avatarPreview'),'::after').content,community:document.body.innerText.includes('Pautan komuniti akan tersedia tidak lama lagi.')};
  });
  assert.deepEqual(layout.logo,[40,40]);assert.equal(layout.border,'0px');assert.equal(layout.headerBadge,'none');assert.equal(layout.settingsBadge,'none');assert.equal(layout.community,false);
  await page.evaluate(()=>{
   const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);
  });
  assert.equal(await page.locator('#wpInstallApp').isVisible(),true);
  assert.equal(await page.locator('#wpAccountInstallButton').count(),0);
  assert.equal(await page.locator('#wpInstallCard').count(),0);
  assert.equal(await page.locator('#wpAccountInstallCard').count(),0);
  assert.equal(await page.locator('#wpInstallApp').count(),1);
  assert.equal(await page.locator('#wpInstallApp svg').count(),1);
  assert.equal(await page.locator('#wpInstallApp').evaluate(e=>getComputedStyle(e).position),'fixed');
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  assert.equal(await page.locator('#wpInstallApp').count(),0,'install button disappears after install');
  assert.equal(await page.evaluate(()=>localStorage.getItem('wp-installed:/watermark-pro/')),'1');
  assert.equal(await page.locator('#wpAccountInstallButton').count(),0);
  const geometry=await page.evaluate(async()=>{
   const viewer=document.querySelector('#mediaLightbox'),image=document.querySelector('#mediaLightboxImage');
   image.src=new URL('bg.jpg',document.baseURI).href;await image.decode();viewer.dataset.viewerKind='banner';viewer.classList.add('open');
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const a=image.getBoundingClientRect(),b=document.querySelector('#closeMediaViewer').getBoundingClientRect();
   const result={dx:Math.abs(a.left+a.width/2-(b.left+b.width/2)),dy:Math.abs(a.bottom-(b.top+b.height/2))};viewer.dataset.viewerKind='photo-avatar';
   result.avatarClose=getComputedStyle(document.querySelector('#closeMediaViewer')).display;viewer.classList.remove('open');return result;
  });
  assert(geometry.dx<2&&geometry.dy<2,JSON.stringify(geometry));assert.equal(geometry.avatarClose,'none');
  const control=await context.newPage();control.on('pageerror',e=>errors.push(e.message));control.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});
  await control.addInitScript(token=>localStorage.setItem('watermarkProControlApiToken',token),admin);
  await control.goto(origin+'/watermark-pro/control.html');
  const topDownload=control.waitForEvent('download');await control.locator('#downloadTopUsers').click();const topFile=await topDownload;assert.equal(await topFile.failure(),null);assert.match(topFile.suggestedFilename(),/\.png$/i);
  await topFile.saveAs('test-top3-export.png');
  await control.evaluate(()=>{window.__originalState=structuredClone(window.WPControl.state);const s=structuredClone(window.WPControl.state);s.users[0].username='@username20characters';s.users[0].plan='pro';s.users[0].proUntil=null;s.users[0].downloads={images:999,videos:0};window.WPControl.apply(s)});
  await control.setViewportSize({width:412,height:915});
  const aligned=await control.locator('.top-user-row .identity-copy strong').first().evaluate(e=>{const a=e.querySelector('.identity-name').getBoundingClientRect(),b=e.querySelector('img').getBoundingClientRect();return Math.abs(a.y+a.height/2-b.y-b.height/2)<1});assert(aligned,'mobile control W mark stays centered');
  await control.locator('#dashboardTopUsers').scrollIntoViewIfNeeded();await control.screenshot({path:'test-control-mobile.png'});
  const controlRing=await control.locator('#dashboardTopUsers .is-pro-avatar img').first().evaluate(e=>{const a=e.parentElement.getBoundingClientRect(),b=e.getBoundingClientRect(),border=parseFloat(getComputedStyle(e.parentElement).borderLeftWidth);return {dx:Math.abs(a.x+a.width/2-b.x-b.width/2),dy:Math.abs(a.y+a.height/2-b.y-b.height/2),gap:a.width-b.width-2*border}});
  assert(controlRing.dx<.6&&controlRing.dy<.6&&Math.abs(controlRing.gap)<.6,'control image fills ring '+JSON.stringify(controlRing));
  await control.setViewportSize({width:1366,height:900});await control.locator('[data-view="users"]').first().click();
  assert(await control.locator('.user-row').first().evaluate(e=>{const a=e.children[0].getBoundingClientRect(),b=e.children[1].getBoundingClientRect();return a.right<=b.left}),'identity does not overlap created date');
  await control.screenshot({path:'test-control-users.png'});
  await control.evaluate(()=>window.WPControl.apply(window.__originalState));
  await control.locator('#addUserBtn').click();await control.locator('#userModal.open').waitFor();assert.equal(await control.locator('#resetPasswordSection').isVisible(),false);
  await control.locator('#userUsername').fill('browsercreated');await control.locator('#userEmail').fill('browsercreated@example.invalid');await control.locator('#userForm [type="submit"]').click();await control.locator('#temporaryPasswordModal.open').waitFor();
  const temporary=await control.locator('#temporaryPasswordValue').inputValue();assert(temporary.length>=8);
  await control.locator('#copyTemporaryPassword').click();await control.screenshot({path:'test-control-result.png'});await control.locator('#closeTemporaryPassword').click();assert.equal(await control.locator('#temporaryPasswordValue').count(),0);
  const login=await req('/api/auth/login','POST',{email:'browsercreated@example.invalid',password:temporary});assert.equal(login.status,200);
  await control.locator('[data-edit-user="'+login.data.user.id+'"]').click();assert.equal(await control.locator('#resetPasswordSection').isVisible(),true);
  await control.locator('#resetUserPassword').fill('Reset123');await control.locator('#resetUserPasswordBtn').click();await control.waitForFunction(()=>document.querySelector('#resetUserPasswordStatus').textContent.includes('berjaya'));
  assert.equal((await req('/api/auth/login','POST',{email:'browsercreated@example.invalid',password:'Reset123'})).status,200);
  await page.goto(origin+'/index.html');await page.waitForFunction(()=>typeof window.WPCloudflare==='object');
  assert.equal(await page.evaluate(()=>new URL('release-ui.js',document.baseURI).pathname),'/release-ui.js');
  if(fs.existsSync(path.join(__dirname,'publish/profil/index.html'))){
   for(const [route,id] of [['profil','profile'],['pelan','subscriptions'],['tetapan','settings']]){
    await page.goto(origin+'/published/watermark-pro/'+route+'/');await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('auth-mode'));
    assert.equal(await page.locator('#page-'+id).isVisible(),true,'static refresh '+route);
   }
   assert.equal(await page.evaluate(()=>new URL('release-ui.js',document.baseURI).pathname),'/published/watermark-pro/release-ui.js');
  }
  assert.deepEqual(dialogs,[]);assert.deepEqual(errors,[]);
  const fileContext=await browser.newContext({viewport:{width:390,height:844}});
  await fileContext.addInitScript(base=>window.WATERMARK_API_BASE=base,origin);
  const filePage=await fileContext.newPage();
  await filePage.goto(require('node:url').pathToFileURL(path.join(__dirname,'index.html')).href);
  await filePage.waitForFunction(()=>typeof window.drawSupporterCard==='function'&&Boolean(window.WPExportAssets));
  const exported=await filePage.evaluate(async()=>{savedUsername='@filepreview';currentAvatarDataURL=window.WPExportAssets['logo.jpg'];document.body.classList.add('pro-account');const canvas=await window.drawSupporterCard();await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve():reject(new Error('Missing PNG'))));return canvas.toDataURL('image/png')});
  fs.writeFileSync('test-file-supporter.png',Buffer.from(exported.split(',')[1],'base64'));
  assert.equal(await filePage.locator('.sidebar .brand>span').evaluate(e=>getComputedStyle(e).backgroundClip),'text','sidebar Pro brand fill');
  await filePage.locator('#wpInstallApp').click();await filePage.locator('#wpInstallHelp[open]').waitFor();
  assert(await filePage.locator('#wpInstallHelp .wp-install-primary').isVisible(),'file install has actionable website link');
  await filePage.screenshot({path:'test-install-modal-mobile.png'});
  await filePage.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));await filePage.reload();await filePage.waitForFunction(()=>Boolean(window.WatermarkProInstall));
  assert.equal(await filePage.locator('#wpInstallApp').count(),0,'installed state survives reload');
  await fileContext.close();
  console.log('PASS browser: revealed registration, Malay errors, notifications, persisted toggle, logout/back/login, Control create/copy/reset, root/subfolder assets; no JS errors or dialogs');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
};
