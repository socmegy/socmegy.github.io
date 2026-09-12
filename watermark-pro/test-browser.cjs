const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
module.exports=async({worker,env,db,req,admin})=>{
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
  assert.equal(await page.evaluate(async()=>{try{await window.drawSupporterCard();return false}catch{return true}}),true,'free user cannot export supporter card');
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
  await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++});
  await page.locator('#printReceipt').click();await page.waitForFunction(()=>window.__printCalls===1);
  await page.evaluate(()=>window.printReceiptIsolated());assert.equal(await page.evaluate(()=>window.__printCalls),1);
  assert.equal(page.frames().length,1,'no second print document');
  assert.equal(await page.locator('#receiptSheet').count(),1,'only one receipt exists, including screen capture printing');
  fs.mkdirSync('tmp/pdfs',{recursive:true});
  for(const [name,width] of [['desktop',1366],['mobile',412]]){
   if(!await page.locator('#wpReceiptPrintRoot').count())await page.evaluate(()=>window.printReceiptIsolated());
   await page.setViewportSize({width,height:915});await page.emulateMedia({media:'screen'});
   const capture=await page.locator('#wpReceiptPrintRoot #receiptSheet').evaluate(e=>{const r=e.getBoundingClientRect(),css=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,shadow:css.boxShadow,radius:css.borderRadius,columns:getComputedStyle(e.querySelector('.lr-meta')).gridTemplateColumns}});
   assert.equal(capture.x,0);assert.equal(capture.y,0);assert.equal(capture.shadow,'none');assert.equal(capture.radius,'0px');assert(capture.width>700&&capture.width<710,JSON.stringify(capture));assert.equal(capture.columns.split(' ').length,2,'screen capture uses desktop receipt columns');
   await page.emulateMedia({media:'print'});
   assert.equal(await page.locator('.app').isVisible(),false,await page.evaluate(()=>JSON.stringify({body:document.body.className,root:!!document.querySelector('#wpReceiptPrintRoot'),app:getComputedStyle(document.querySelector('.app')).display,styles:[...document.querySelectorAll('style')].slice(-1).map(n=>n.textContent.slice(0,120))}))); 
   assert.equal(await page.locator('#receiptModal').isVisible(),false,'original modal hidden');
   assert.equal(await page.locator('.wp-print-root').count(),1);
   const sheet=page.locator('.wp-print-root #receiptSheet');await sheet.evaluate(e=>e.dataset.receiptStatus='granted');
   assert.equal(await sheet.evaluate(e=>getComputedStyle(e).boxShadow),'none');
   assert.equal(await sheet.locator('.lr-status').evaluate(e=>getComputedStyle(e).color),'rgb(255, 0, 136)');
   await page.pdf({path:'tmp/pdfs/'+name+'-receipt.pdf',format:'A4',preferCSSPageSize:true,printBackground:true});
  }
  await page.emulateMedia({media:'screen'});await page.setViewportSize({width:1366,height:900});await page.evaluate(()=>{window.dispatchEvent(new Event('afterprint'));document.querySelector('#receiptModal').classList.remove('open')});
  assert.equal(await page.locator('#receiptModal #receiptSheet').count(),1,'receipt restored after printing');
  await page.evaluate(()=>{document.querySelector('#receiptModal').classList.add('open');window.dispatchEvent(new Event('beforeprint'))});
  assert.equal(await page.locator('#wpReceiptPrintRoot #receiptSheet').count(),1,'browser-menu printing isolates receipt too');
  await page.evaluate(()=>{window.dispatchEvent(new Event('afterprint'));document.querySelector('#receiptModal').classList.remove('open')});
  await page.locator('[data-page="profile"]').first().click();
  await page.evaluate(()=>window.WPCloudflare.api('/api/account/profile',{method:'PATCH',body:JSON.stringify({photo:new URL('logo.jpg',document.baseURI).href})}));
  await page.evaluate(()=>window.WPCloudflare.sync());
  const reference=await context.newPage();await reference.goto(origin+'/preview.html');await reference.evaluate(()=>document.fonts.ready);
  const profileName=page.locator('#page-profile .wp-wmark-name').first();
  await reference.locator('.lab-profile-uname').first().evaluate((e,name)=>e.textContent=name,await profileName.locator('.lab-profile-uname').innerText());
  const nameGeometry=el=>{const name=el.querySelector('.lab-profile-uname'),img=el.querySelector('button img'),a=name.getBoundingClientRect(),b=img.getBoundingClientRect(),s=getComputedStyle(name);return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,gap:b.left-a.right,dy:(b.top+b.height/2)-(a.top+a.height/2),badgeWidth:b.width,badgeHeight:b.height}};
  const actualMark=await profileName.evaluate(nameGeometry),expectedMark=await reference.locator('.lab-inline-name').first().evaluate(nameGeometry);
  for(const key of ['font','size','weight','line'])assert.equal(actualMark[key],expectedMark[key],'preview name '+key);
  for(const key of ['gap','dy','badgeWidth','badgeHeight'])assert(Math.abs(actualMark[key]-expectedMark[key])<.2,'preview badge '+key+': '+JSON.stringify({actualMark,expectedMark}));
  await profileName.screenshot({path:'tmp/wmark-desktop.png'});await reference.locator('.lab-inline-name').first().screenshot({path:'tmp/wmark-preview.png'});await reference.close();
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
  assert.equal(await page.locator('.version-section:visible').count(),0,'version removed');
  await page.locator('#publicProfileSwitch').click();await page.waitForFunction(()=>!window.wpVisibilitySaving&&!document.querySelector('#publicProfileSwitch').classList.contains('on'));
  await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('auth-mode'));
  await page.locator('[data-page="settings"]').first().click();assert.equal(await page.locator('#publicProfileSwitch').evaluate(e=>e.classList.contains('on')),false);
  await page.locator('#publicProfileSwitch').click();await page.waitForFunction(()=>!window.wpVisibilitySaving&&document.querySelector('#publicProfileSwitch').classList.contains('on'));
  await page.screenshot({path:'test-account-desktop.png'});
  await page.locator('#logoutBtn').click();await page.waitForFunction(()=>document.body.classList.contains('auth-mode'));assert.equal(new URL(page.url()).hash,'');assert.equal(await page.locator('#supporterExportStatus').count(),0,'logout clears export status');
  await page.goBack();assert.equal(await page.locator('.app').isVisible(),false);assert.equal(new URL(page.url()).hash,'');
  await page.locator('#loginEmail').fill('browser@example.invalid');await page.locator('#loginPassword').fill('12345678');await page.locator('#loginForm [type="submit"]').click();await page.waitForFunction(()=>!document.body.classList.contains('auth-mode'));
  await page.locator('[data-page="settings"]').first().click();assert.equal(await page.locator('#publicProfileSwitch').evaluate(e=>e.classList.contains('on')),true);
  await page.locator('[name="currentPassword"]').fill('12345678');await page.locator('[name="newPassword"]').fill('short');await page.locator('#passwordChangeForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#passwordChangeStatus').textContent.includes('8 hingga 256'));
  await page.locator('[name="newPassword"]').fill('Changed123');await page.locator('#passwordChangeForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#passwordChangeStatus').textContent.includes('berjaya'));
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-account-mobile.png'});
  for(const owner of [false,true]){
   await page.evaluate(owner=>document.body.classList.toggle('owner-account',owner),owner);
   const ring=await page.locator('#avatarPreview').evaluate(e=>{const a=e.getBoundingClientRect(),i=e.querySelector('img').getBoundingClientRect();return {border:parseFloat(getComputedStyle(e).borderTopWidth),dx:Math.abs(a.x+a.width/2-i.x-i.width/2),dy:Math.abs(a.y+a.height/2-i.y-i.height/2)}});
   assert(ring.border>0&&ring.border<=2.5&&ring.dx<1&&ring.dy<1,'centered thin Pro/owner ring '+JSON.stringify(ring));
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
  await control.waitForFunction(()=>window.WPControl?.state?.users?.length>0);
  /* Control receipt printing must not inherit the page-wide rule that hides
     every body child in print media. Keep this regression test close to the
     real print serializer that previously produced a blank PDF. */
  const controlReceiptPrint=await control.evaluate(async()=>{
   const record=window.WPControl.state.subscriptions[0]||window.WPControl.state.submissions[0];
   if(!record)return {skipped:true};
   openReceipt(record);
   let printed=false;const printDoc=document.implementation.createHTMLDocument('print');
   const fake={document:printDoc,focus(){},print(){printed=true},closed:false};
   const originalOpen=window.open;window.open=()=>fake;
   try{window.printControlReceipt();await new Promise(resolve=>setTimeout(resolve,1000))}finally{window.open=originalOpen}
   const receipt=printDoc.body.querySelector('.control-live-receipt'),logo=receipt?.querySelector('img');
   return {skipped:false,receipt:!!receipt,text:receipt?.textContent.trim().length||0,logo:logo?.getAttribute('src')||'',css:[...printDoc.querySelectorAll('style')].map(n=>n.textContent).join(''),printed};
  });
  if(!controlReceiptPrint.skipped){assert(controlReceiptPrint.receipt&&controlReceiptPrint.text>30,'control printable receipt has content');assert(controlReceiptPrint.css.includes('body>.control-live-receipt{display:block!important'),'control printable receipt remains visible in print media');assert.match(controlReceiptPrint.logo,/\/watermark-pro\/logo\.jpg/,'control printable receipt resolves logo beside the app')}
  const externalUser=await control.evaluate(()=>window.WPControl.state.users.find(u=>u.username==='@browseruser'));
  const fixtureUser=externalUser||await control.evaluate(()=>window.WPControl.state.users.find(u=>u.role!=='admin'));
  const priorPhoto=fixtureUser.photo,priorImages=fixtureUser.downloads.images;
  const avatarURL='https://uploadsimage.org/i/c1f29f801b8ba07491bc.png';
  const liveAvatar=process.argv.includes('--live-avatar');
  const avatarBytes=liveAvatar?Buffer.from(await (await fetch(avatarURL)).arrayBuffer()):fs.readFileSync('logo.jpg');
  db.prepare('UPDATE users SET photo=?,downloads_images=999999 WHERE id=?').run(avatarURL,fixtureUser.id);
  const originalFetch=globalThis.fetch;let avatarProxyCalls=0;
  globalThis.fetch=async(url,options)=>{if(String(url)===avatarURL){avatarProxyCalls++;if(!liveAvatar)return new Response(avatarBytes,{headers:{'Content-Type':'image/jpeg'}})}return originalFetch(url,options)};
  await control.route('https://uploadsimage.org/**',route=>route.fulfill({contentType:liveAvatar?'image/png':'image/jpeg',body:avatarBytes}));
  const topDownload=control.waitForEvent('download');await control.locator('#downloadTopUsers').click();const topFile=await topDownload;assert.equal(await topFile.failure(),null);assert.match(topFile.suggestedFilename(),/\.png$/i);
  await topFile.saveAs('test-top3-export.png');
  globalThis.fetch=originalFetch;assert(avatarProxyCalls>0,'external saved avatar uses the Worker proxy');
  const avatarPixels=await control.evaluate(async({pngData,photoData})=>{const png=new Image();png.src=pngData;await png.decode();const logo=new Image();logo.src=photoData;await logo.decode();const actual=document.createElement('canvas'),expected=document.createElement('canvas');actual.width=expected.width=118;actual.height=expected.height=118;actual.getContext('2d').drawImage(png,200,417,118,118,0,0,118,118);const side=Math.min(logo.naturalWidth,logo.naturalHeight);expected.getContext('2d').drawImage(logo,(logo.naturalWidth-side)/2,(logo.naturalHeight-side)/2,side,side,0,0,118,118);const a=actual.getContext('2d').getImageData(30,30,58,58).data,b=expected.getContext('2d').getImageData(30,30,58,58).data;return a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length},{pngData:'data:image/png;base64,'+fs.readFileSync('test-top3-export.png').toString('base64'),photoData:'data:'+(liveAvatar?'image/png':'image/jpeg')+';base64,'+avatarBytes.toString('base64')});
  assert(avatarPixels<2,'Top 3 PNG contains the saved photo pixels, not an initial: '+avatarPixels);
  db.prepare('UPDATE users SET photo=?,downloads_images=? WHERE id=?').run(priorPhoto,priorImages,fixtureUser.id);await control.evaluate(()=>window.WPControlCloudflare.refresh());
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
  const fileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
  await fileContext.addInitScript(base=>window.WATERMARK_API_BASE=base,origin);
  const filePage=await fileContext.newPage();
  await filePage.goto(require('node:url').pathToFileURL(path.join(__dirname,'index.html')).href);
  await filePage.waitForFunction(()=>typeof window.drawSupporterCard==='function'&&Boolean(window.WPExportAssets));
  await filePage.evaluate(()=>{const modal=document.getElementById('authTopUsersModal');modal.innerHTML='<div class="topuser-row is-pro"><button class="topuser-avatar-action is-pro-avatar"><img src="'+window.WPExportAssets['logo.jpg']+'"></button></div>';modal.classList.add('open')});
  await filePage.locator('#authTopUsersModal .topuser-avatar-action img').evaluate(e=>e.decode());
  const mobileRing=await filePage.locator('#authTopUsersModal .topuser-avatar-action').evaluate(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('img').getBoundingClientRect(),b=parseFloat(getComputedStyle(e).borderLeftWidth);return {b,dx:Math.abs(r.x+r.width/2-i.x-i.width/2),dy:Math.abs(r.y+r.height/2-i.y-i.height/2),gap:r.width-i.width-2*b}});
  assert(mobileRing.b>=2&&mobileRing.b<=2.5&&mobileRing.dx<.5&&mobileRing.dy<.5&&Math.abs(mobileRing.gap)<.5,'mobile DPR3 top-user ring '+JSON.stringify(mobileRing));
  await filePage.evaluate(()=>document.getElementById('authTopUsersModal').classList.remove('open'));
  const exported=await filePage.evaluate(async()=>{Object.defineProperty(window.WPCloudflare,'user',{configurable:true,value:{id:'filetest',username:'filepreview',plan:'pro'}});savedUsername='@filepreview';currentAvatarDataURL=window.WPExportAssets['logo.jpg'];document.body.classList.add('pro-account');const canvas=await window.drawSupporterCard();await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve():reject(new Error('Missing PNG'))));return canvas.toDataURL('image/png')});
  fs.writeFileSync('test-file-supporter.png',Buffer.from(exported.split(',')[1],'base64'));
  assert.equal(await filePage.locator('.sidebar .brand>span').evaluate(e=>getComputedStyle(e).backgroundClip),'text','sidebar Pro brand fill');
  await filePage.locator('#wpInstallApp').click();await filePage.locator('#wpInstallHelp[open]').waitFor();
  assert(await filePage.locator('#wpInstallHelp .wp-install-primary').isVisible(),'file install has actionable website link');
  await filePage.screenshot({path:'test-install-modal-mobile.png'});
  const nativeCalls=await filePage.evaluate(async()=>{let calls=0;const e=new Event('beforeinstallprompt');e.prompt=async()=>{calls++};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e);document.querySelector('#wpInstallNative').click();await Promise.resolve();return calls});assert.equal(nativeCalls,1,'modal invokes native installation');
  await filePage.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));await filePage.reload();await filePage.waitForFunction(()=>Boolean(window.WatermarkProInstall));
  assert.equal(await filePage.locator('#wpInstallApp').count(),0,'installed state survives reload');
  await fileContext.close();
  console.log('PASS browser: revealed registration, Malay errors, notifications, persisted toggle, logout/back/login, Control create/copy/reset, root/subfolder assets; no JS errors or dialogs');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
};
