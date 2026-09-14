const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const playwright = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

const root = path.resolve(__dirname, '..');
const user = {id:'mockup-user',username:'@helmi',email:'helmi@example.invalid',role:'user',plan:'pro',photo:'',publicProfile:true,createdAt:'2026-08-30T00:00:00Z',downloads:{images:7914,videos:578}};
const publicState = {admin:{username:'@watermarkpro',photo:''},settings:{paymentsOpen:true,qrImage:'',whatsapp:'',banners:[]},plans:[],topUsers:[user],legal:{terms:{sections:[]},privacy:{sections:[]}}};
const accountState = {user,submissions:[],subscriptions:[],notifications:[]};
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};

(async () => {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://test').pathname;
    let relative = pathname.replace(/^\/watermark-pro\/?/, '') || 'index.html';
    if (['profil','pelan','tetapan','sokongan'].includes(relative)) relative = 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end(); return;
    }
    response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await playwright.chromium.launch({channel:'chrome', headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1024,height:768}, deviceScaleFactor:2, serviceWorkers:'block'});
    await context.addInitScript(base => {
      window.WATERMARK_API_BASE = base;
      localStorage.setItem('watermarkProUserApiToken', 'mockup-token');
    }, origin);
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) { await route.abort(); return; }
      if (url.pathname === '/api/public/state') { await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(publicState)}); return; }
      if (url.pathname === '/api/account/state') { await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(accountState)}); return; }
      if (url.pathname.startsWith('/api/')) { await route.fulfill({status:200,contentType:'application/json',body:'{}'}); return; }
      await route.continue();
    });
    const page = await context.newPage();
    await page.goto(origin + '/watermark-pro/', {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.WPCloudflare && !document.body.classList.contains('auth-mode'));
    await page.locator('#page-home').waitFor({state:'visible'});
    await page.evaluate(() => document.fonts.ready);
    for(const zoom of [1,0.9,0.8,0.75,0.67,0.5]){
      console.log(await page.evaluate(zoom=>{
        document.documentElement.style.zoom=String(zoom);
        const mark=document.querySelector('.sidebar-user .wp-wmark'),name=document.querySelector('.sidebar-user strong');
        const a=mark.getBoundingClientRect(),b=name.getBoundingClientRect();
        return {zoom,offset:getComputedStyle(mark).transform,centerDifference:(a.top+a.height/2-b.top-b.height/2)/zoom,sameRow:a.top<b.bottom&&a.bottom>b.top};
      },zoom));
    }
    await page.evaluate(()=>document.documentElement.style.removeProperty('zoom'));
    console.log(await page.evaluate(() => ({
      theme:document.querySelector('meta[name="theme-color"]').content,
      wmarkCopy:document.querySelector('#wpWMarkDialog p')?.textContent,
      sidebarMark:document.querySelector('.sidebar-user .wp-wmark')&&getComputedStyle(document.querySelector('.sidebar-user .wp-wmark')).transform
    })));
    await page.setViewportSize({width:390,height:844});
    console.log(await page.evaluate(() => ({safeAreaColor:getComputedStyle(document.body,'::after').backgroundColor,safeAreaPosition:getComputedStyle(document.body,'::after').bottom,theme:document.querySelector('meta[name="theme-color"]').content})));
    await page.setViewportSize({width:1024,height:768});
    await page.screenshot({path:path.join(root,'tmp','main-page-tablet.png')});
    await context.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
