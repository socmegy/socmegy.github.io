const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const scenario of ['own','other','stale','standalone','available']){
   const context=await browser.newContext({viewport:{width:412,height:915},serviceWorkers:'block'});
   await context.addInitScript(s=>{
    if(s==='stale')localStorage.setItem('wp-installed:/watermark-pro/','1');
    Object.defineProperty(navigator,'getInstalledRelatedApps',{value:async()=>s==='own'?[{platform:'webapp',id:'https://socmegy.com/watermark-pro/'}]:s==='other'?[{platform:'webapp',id:'https://socmegy.com/admintest'}]:[]});
    if(s==='standalone'){const original=window.matchMedia;window.matchMedia=query=>{const m=original(query);if(query==='(display-mode: standalone)')Object.defineProperty(m,'matches',{value:true});return m}}
   },scenario);
   const page=await context.newPage();
   await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body><main class="main-inner" style="margin:0 12px">Watermark Pro</main><script>'+fs.readFileSync('pwa.js','utf8')+'</script></body></html>'}));
   await page.goto('https://socmegy.com/watermark-pro/');await page.waitForTimeout(100);
   assert.equal(await page.locator('#wpInstallApp').count(),['own','standalone'].includes(scenario)?0:1,scenario);
   if(scenario==='available'){
    await page.evaluate(()=>{window.nativeInstalls=0;const event=new Event('beforeinstallprompt');event.prompt=async()=>{window.nativeInstalls++};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event)});
    const left=await page.locator('#wpInstallApp').evaluate(e=>e.getBoundingClientRect().left);assert.equal(left,await page.locator('.main-inner').evaluate(e=>e.getBoundingClientRect().left));
    await page.locator('#wpInstallApp').click();assert.equal(await page.evaluate(()=>window.nativeInstalls),1);
   }
   await context.close();console.log('PASS install',scenario);
  }
  const own=JSON.parse(fs.readFileSync('manifest.webmanifest'));for(const name of ['admintest','adminnntesttt']){const other=JSON.parse(fs.readFileSync('publish-root-apps/'+name+'.webmanifest'));assert.notEqual(other.id,own.id);assert(!own.start_url.startsWith(other.scope));assert(!other.start_url.startsWith(own.scope));}
  console.log('PASS separate manifest IDs and non-overlapping admin/Watermark Pro scopes');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
