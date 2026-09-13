const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');

// Exercise the shipped page with its real observers and scripts. No live
// accounts or external services are needed for this boot regression.
const root=__dirname;
let playwright;
try{playwright=require('playwright')}catch{
  playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const user={id:'boot-user',username:'@bootuser',email:'boot@example.invalid',role:'user',plan:'free',photo:'',publicProfile:true,createdAt:'2026-01-01T00:00:00Z',downloads:{images:2,videos:1}};
const publicState={admin:{username:'@watermarkpro',photo:''},settings:{paymentsOpen:true,qrImage:'',whatsapp:'',banners:[]},plans:[],topUsers:[user],legal:{terms:{sections:[]},privacy:{sections:[]}}};
const accountState={user,submissions:[],subscriptions:[],notifications:[{id:'boot-notice',title:'Boot test',text:'Notification without an avatar',senderUsername:'@watermarkpro',senderPhoto:'',createdAt:'2026-01-01T00:00:00Z'}]};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};

(async()=>{
  const server=http.createServer((request,response)=>{
    const pathname=new URL(request.url,'http://test').pathname;
    const relative=pathname.replace(/^\/watermark-pro\/?/,'')||'index.html';
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
      response.writeHead(404);response.end();return;
    }
    response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  const deadline=setTimeout(()=>{console.error('FAIL boot suite exceeded 75 seconds; page event loop may be stuck');process.exit(1)},75000);
  try{
    browser=await playwright.chromium.launch({channel:'chrome',headless:true});
    for(const scenario of ['guest','authenticated','unavailable','timeout']){
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
      try{
        await context.addInitScript(({base,authenticated})=>{
          window.WATERMARK_API_BASE=base;
          if(authenticated)localStorage.setItem('watermarkProUserApiToken','boot-test-token');
          window.__bootHeartbeats=0;
          setInterval(()=>window.__bootHeartbeats++,50);
        },{base:origin,authenticated:scenario==='authenticated'});
        let publicRequests=0,accountRequests=0;
        await context.route('**/*',async route=>{
          const url=new URL(route.request().url());
          if(url.origin!==origin){await route.abort();return;}
          if(url.pathname==='/api/public/state'){
            publicRequests++;
            if(scenario==='timeout')return; // Keep pending until the real API abort timer fires.
            await route.fulfill({status:scenario==='unavailable'?503:200,contentType:'application/json',body:JSON.stringify(scenario==='unavailable'?{error:'Temporary test outage'}:publicState)});return;
          }
          if(url.pathname==='/api/account/state'){
            accountRequests++;
            const authenticated=scenario==='authenticated';
            if(authenticated)assert.equal(route.request().headers().authorization,'Bearer boot-test-token');
            await route.fulfill({status:authenticated?200:401,contentType:'application/json',body:JSON.stringify(authenticated?accountState:{error:'Not authenticated'})});return;
          }
          if(url.pathname.startsWith('/api/')){
            await route.fulfill({status:200,contentType:'application/json',body:'{}'});return;
          }
          await route.continue();
        });
        const page=await context.newPage(),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.setDefaultTimeout(18000);
        await page.goto(origin+'/watermark-pro/index.html',{waitUntil:'domcontentloaded',timeout:18000});
        await page.waitForFunction(()=>{
          const boot=document.getElementById('wpSessionBoot');
          return window.WPCloudflare&&(!boot||boot.hidden||getComputedStyle(boot).display==='none');
        },null,{timeout:18000});
        assert(publicRequests>0,scenario+': public API was never requested');
        const authenticated=scenario==='authenticated';
        assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('account-authenticated')),authenticated,scenario+': authentication state');
        assert.equal(await page.evaluate(()=>document.body.classList.contains('auth-mode')),!authenticated,scenario+': visible application mode');
        if(authenticated){
          assert(accountRequests>0,'Authenticated boot must request the account');
          assert.equal(await page.evaluate(()=>window.WPCloudflare.user?.username),'@bootuser');
          assert.equal(await page.evaluate(()=>localStorage.getItem('watermarkProUserApiToken')),'boot-test-token');
        }else{
          assert(await page.locator('#loginEmail').isVisible(),scenario+': login form is not reachable');
          if(scenario==='unavailable'||scenario==='timeout')assert.match(await page.locator('#loginStatus').innerText(),/Sambungan tidak tersedia/);
        }
        // Uppercase fallback avatars used to trigger an observer that rewrote
        // its own DOM forever. Timers and later user input must keep working.
        const before=await page.evaluate(()=>{
          const probe=document.createElement('span');probe.id='boot-avatar-probe';probe.className='wp-avatar-letter';probe.textContent='Z';document.body.append(probe);
          return window.__bootHeartbeats;
        });
        await page.waitForFunction(()=>document.getElementById('boot-avatar-probe')?.textContent==='z'&&window.__bootHeartbeats>0);
        for(let pass=0;pass<3;pass++){
          await page.evaluate(()=>{
            const node=document.getElementById('boot-avatar-probe');node.textContent='Q';
            const unrelated=document.createElement('i');document.body.append(unrelated);unrelated.remove();
          });
          await page.waitForFunction(()=>document.getElementById('boot-avatar-probe').textContent==='q');
        }
        await page.waitForFunction(count=>window.__bootHeartbeats>=count+3,before);
        const uppercase=await page.locator('.wp-avatar-letter,.admin-notification-avatar').evaluateAll(nodes=>nodes.filter(node=>!node.children.length&&node.textContent!==node.textContent.toLowerCase()).map(node=>node.textContent));
        assert.deepEqual(uppercase,[],scenario+': avatar fallback case regressed');
        assert.deepEqual(errors,[],scenario+': uncaught page errors');
        console.log('PASS boot '+scenario+': page opens, avatars lowercase, event loop responsive');
      }finally{await context.close()}
    }
  }finally{
    clearTimeout(deadline);
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1});
