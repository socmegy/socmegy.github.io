const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const script=fs.readFileSync(path.join(__dirname,'pwa.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));
  const page=await context.newPage();
  await page.goto('https://socmegy.com/watermark-pro/');
  await page.evaluate(()=>{
   localStorage.setItem('wp-installed:/watermark-pro/','1');
   window.pendingApps=[];
   Object.defineProperty(navigator,'getInstalledRelatedApps',{value:()=>new Promise(resolve=>pendingApps.push(resolve)),configurable:true});
   window.matchMedia=()=>({matches:true,addEventListener(){}});
  });
  await page.addScriptTag({content:script});
  assert.equal(await page.evaluate(()=>WatermarkProInstall.installed),false,'other standalone app / legacy directory flag is not Watermark Pro');
  await page.evaluate(()=>pendingApps.splice(0).forEach(resolve=>resolve([{platform:'webapp',id:'https://socmegy.com/admintest',url:'https://socmegy.com/manifest.webmanifest'}])));
  assert.equal(await page.evaluate(()=>WatermarkProInstall.installed),false,'admintest does not mark Watermark Pro installed');
  assert.equal(await page.locator('#wpInstallApp').count(),0,'no misleading install button before browser prompt');
  const offer=()=>page.evaluate(()=>{
   window.promptCalls=0;
   const event=new Event('beforeinstallprompt',{cancelable:true});
   event.prompt=async()=>{window.promptCalls++};
   event.userChoice=Promise.resolve({outcome:'dismissed'});
   dispatchEvent(event);
  });
  await offer();
  await page.locator('#wpInstallApp').click();
  assert.equal(await page.evaluate(()=>promptCalls),1,'click directly invokes native prompt');
  assert.equal(await page.locator('#wpInstallHelp').count(),0,'native path does not open help dialog');
  assert.equal(await page.evaluate(()=>WatermarkProInstall.installed),false,'dismissal does not mean installed');
  await page.evaluate(()=>dispatchEvent(new Event('pageshow')));
  await offer();
  await page.evaluate(()=>dispatchEvent(new Event('appinstalled')));
  await page.evaluate(()=>pendingApps.splice(0).forEach(resolve=>resolve([])));
  assert.equal(await page.evaluate(()=>WatermarkProInstall.installed),true,'late detection cannot undo installation');
  assert.equal(await page.locator('#wpInstallApp').count(),0,'installed button removed');
  await page.evaluate(()=>dispatchEvent(new Event('pageshow')));
  await page.evaluate(()=>pendingApps.splice(0).forEach(resolve=>resolve([])));
  assert.equal(await page.evaluate(()=>WatermarkProInstall.installed),true,'empty related apps is not proof of uninstall');
  await page.reload();
  await page.addScriptTag({content:script});
  assert.equal(await page.evaluate(()=>WatermarkProInstall.installed),true,'own installation persists after reload');
  await offer();
  assert.equal(await page.evaluate(()=>WatermarkProInstall.installed),false,'fresh install eligibility clears stale own flag');
  assert.equal(await page.locator('#wpInstallApp').count(),1);
  await context.close();
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.webmanifest'),'utf8'));
  assert.equal('orientation' in manifest,false,'system orientation preference is not overridden');
  assert.equal(manifest.id,'/watermark-pro/');
  assert.equal(manifest.scope,'/watermark-pro/');
  console.log('PASS: app identity isolation, native prompt, dismissal, install race, persistence, reinstall, system orientation manifest');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
