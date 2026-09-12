const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,devices}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({...devices['Pixel 7'],serviceWorkers:'block'});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{bottom:24,bottomMax:24}});
  await page.goto('http://localhost:4173/watermark-pro/');
  await page.waitForFunction(()=>Boolean(window.WatermarkProInstall));
  assert.match(await page.locator('meta[name="viewport"]').getAttribute('content'),/viewport-fit=cover/);
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#143d68');
  assert.equal(await page.locator('meta[name="navigation-bar-color"]').getAttribute('content'),'#ffffff');
  // Headless Chrome cannot emulate the OS display mode; activate its existing CSS branch only.
  await page.evaluate(()=>{const sheet=[...document.styleSheets].find(s=>s.href?.endsWith('/request-layout.css')),rule=[...sheet.cssRules].find(r=>r.conditionText?.includes('display-mode: standalone')||r.conditionText?.includes('display-mode:standalone'));if(!rule)throw new Error('Missing standalone CSS');rule.media.mediaText='screen'});
  const area=await page.evaluate(()=>({height:getComputedStyle(document.body,'::after').height,color:getComputedStyle(document.body,'::after').backgroundColor,bottom:getComputedStyle(document.querySelector('.mobile-nav')).bottom,scheme:getComputedStyle(document.documentElement).colorScheme}));
  assert.equal(area.height,'24px');assert.equal(area.color,'rgb(255, 255, 255)');assert.equal(area.bottom,'0px');assert(area.scheme.includes('light')&&area.scheme.includes('only'));
  await page.screenshot({path:'tmp/pwa-bottom-mobile.png'});
  console.log('PASS simulated Android safe area: top theme navy, bottom light, navigation above gesture area (native OS not emulated)');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
