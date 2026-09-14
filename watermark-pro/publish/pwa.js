(()=>{
  const ownId=new URL('/watermark-pro/',location.origin).href;
  const manifest=new URL('/watermark-pro/manifest.webmanifest',location.origin).href;
  const installedKey='wp-installed-v2:'+ownId,launchKey='wp-app-launch-v2:'+ownId;
  const read=(storage,key)=>{try{return storage.getItem(key)}catch{return null}};
  const write=(storage,key,value)=>{try{value===null?storage.removeItem(key):storage.setItem(key,value)}catch{}};
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const inScope=()=>location.pathname.startsWith('/watermark-pro/');
  if(inScope()&&standalone()&&new URLSearchParams(location.search).get('app')==='watermark-pro')write(sessionStorage,launchKey,'1');
  const ownStandalone=()=>inScope()&&standalone()&&read(sessionStorage,launchKey)==='1';
  // Auto-rotate is disabled for the installed app. Browser tabs retain the
  // device's normal orientation behaviour.
  let portraitRetry=0;
  const keepPortrait=()=>{
    if(!inScope()||!standalone()||!screen.orientation?.lock)return;
    try{
      Promise.resolve(screen.orientation.lock('portrait-primary')).then(()=>{portraitRetry=0}).catch(()=>{
        /* Some Android WebViews only accept the broader portrait keyword. */
        return Promise.resolve(screen.orientation.lock('portrait')).then(()=>{portraitRetry=0}).catch(()=>{});
      });
    }catch{}
  };
  keepPortrait();
  window.addEventListener('pageshow',keepPortrait);
  window.addEventListener('focus',keepPortrait);
  window.addEventListener('resize',keepPortrait,{passive:true});
  screen.orientation?.addEventListener?.('change',()=>{
    keepPortrait();
    clearTimeout(portraitRetry);
    portraitRetry=setTimeout(keepPortrait,250);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)keepPortrait()});
  let revision=0;
  const state={prompt:null,installed:ownStandalone()||read(localStorage,installedKey)==='1'};
  const recordInstalled=()=>{revision++;state.installed=true;write(localStorage,installedKey,'1');state.prompt=null;notify()};
  const notify=()=>window.dispatchEvent(new CustomEvent('watermarkproinstallchange',{detail:{available:Boolean(state.prompt),installed:state.installed}}));
  window.WatermarkProInstall={
    get available(){return Boolean(state.prompt)},
    get installed(){return state.installed},
    async prompt(){
      if(!state.prompt)return {outcome:'unavailable'};
      const event=state.prompt;state.prompt=null;revision++;notify();
      try{await event.prompt();const choice=await event.userChoice;notify();return choice}
      catch(error){notify();return {outcome:'unavailable',error:String(error)}}
    }
  };
  function addShortcut(){
    const target=new URL('/watermark-pro/',location.origin).href;
    const shortcut='[InternetShortcut]\r\nURL='+target+'\r\nIconFile='+new URL('/watermark-pro/favicon-rounded.png',location.origin).href+'\r\n';
    const link=document.createElement('a');
    link.href=URL.createObjectURL(new Blob([shortcut],{type:'application/internet-shortcut'}));
    link.download='Watermark Pro.url';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(link.href),1000);
    return {outcome:'shortcut-created'};
  }
  window.WatermarkProInstall.addShortcut=addShortcut;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();revision++;write(localStorage,installedKey,null);state.installed=false;state.prompt=event;notify()});
  window.addEventListener('appinstalled',recordInstalled);
  matchMedia('(display-mode: standalone)').addEventListener('change',()=>{revision++;state.installed=ownStandalone()||read(localStorage,installedKey)==='1';if(state.installed)state.prompt=null;notify()});
  if(ownStandalone())write(localStorage,installedKey,'1');
  window.addEventListener('storage',event=>{if(event.key===installedKey){revision++;state.installed=event.newValue==='1'||ownStandalone();if(state.installed)state.prompt=null;notify()}});
  if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol)){
    const hadController=Boolean(navigator.serviceWorker.controller),reloadKey='wp-sw-reload-v167';
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||sessionStorage.getItem(reloadKey))return;sessionStorage.setItem(reloadKey,'1');location.reload()});
    window.addEventListener('load',async()=>{if(!inScope())return;try{const registration=await navigator.serviceWorker.register('/watermark-pro/sw.js?v=167',{scope:'/watermark-pro/',updateViaCache:'none'});await registration.update()}catch(error){console.warn('Watermark Pro service worker:',error)}});
  }
  async function checkInstalled(){
    if(ownStandalone()){recordInstalled();return;}
    if(location.protocol==='file:'||typeof navigator.getInstalledRelatedApps!=='function')return;
    const started=revision;
    try{const apps=await navigator.getInstalledRelatedApps();
      if(started!==revision||state.prompt)return;
      const absolute=value=>{try{return new URL(value,location.origin).href}catch{return ''}};
      const installed=apps.some(app=>app.platform==='webapp'&&(app.id?absolute(app.id)===ownId:absolute(app.url)===manifest));
      // An empty result is not proof of uninstall; support varies by browser.
      if(installed)recordInstalled();
    }catch{}
  }
  window.addEventListener('pageshow',checkInstalled);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkInstalled()});checkInstalled();
  function showInstallHelp(){
    let d=document.getElementById('wpInstallHelp');
    if(!d){
      d=document.createElement('dialog');d.id='wpInstallHelp';d.setAttribute('aria-labelledby','wpInstallTitle');
      const local=location.protocol==='file:',ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
      const copy=ios?'Pilih cara anda mahu menggunakan Watermark Pro. Untuk iPhone/iPad, fail shortcut boleh dibuka selepas dimuat turun.':'Pilih pemasangan aplikasi penuh atau cipta shortcut terus ke Watermark Pro.';
      d.innerHTML='<div class="wp-install-heading"><img src="logo.jpg" alt=""><div><h2 id="wpInstallTitle">Install App</h2><span>Akses terus daripada peranti anda</span></div><button type="button" class="wp-install-close" aria-label="Tutup">×</button></div><p>'+copy+'</p><div class="wp-install-actions"><button type="button" id="wpInstallNative" class="wp-install-primary">Install App</button><button type="button" id="wpAddShortcut">Add to Shortcut</button></div>';
      d.querySelector('.wp-install-close').onclick=()=>d.close();
      d.querySelector('#wpInstallNative').onclick=async()=>{d.close();if(state.prompt)await window.WatermarkProInstall.prompt();else if(local)location.href='https://socmegy.com/watermark-pro/';else{d.showModal();d.querySelector('p').textContent=ios?'Safari memerlukan Share → Add to Home Screen untuk pemasangan aplikasi. Pilihan Add to Shortcut masih boleh digunakan terus.':'Pemasangan aplikasi belum disediakan oleh pelayar ini. Pilihan Add to Shortcut masih boleh digunakan terus.'}};
      d.querySelector('#wpAddShortcut').onclick=()=>{addShortcut();d.close()};
      d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});document.body.append(d);
    }
    d.showModal();
  }
  function mount(){
    let button=document.getElementById('wpInstallApp');
    if(state.installed){button?.remove();document.getElementById('wpInstallHelp')?.close();return;}
    if(!button){button=document.createElement('button');button.id='wpInstallApp';button.type='button';button.className='pwa-install-button';button.setAttribute('aria-label','Install App atau Add to Shortcut');button.title='Install App';button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>';button.onclick=showInstallHelp;document.body.append(button);}
  }
  const style=document.createElement('style');style.textContent='body #wpInstallApp{position:fixed!important;left:auto!important;right:max(20px,env(safe-area-inset-right))!important;bottom:max(20px,env(safe-area-inset-bottom))!important;width:48px;height:48px;display:none;place-items:center;border:1px solid #d6dde6;border-radius:14px;background:#fff;color:#143d68;box-shadow:0 5px 18px #102b4920;z-index:90;cursor:pointer}body.auth-mode #wpInstallApp{display:grid;z-index:100001}';document.head.append(style);
  style.textContent+='body #wpInstallApp{display:grid!important;width:48px!important;height:48px!important;padding:0!important}body #wpInstallApp svg{display:block;width:22px;height:22px}@media(max-width:980px){body:not(.auth-mode) #wpInstallApp{bottom:90px!important}}';
  style.textContent+=`#wpInstallHelp{box-sizing:border-box;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;margin:auto;padding:24px;border:1px solid #dce5ee;border-radius:20px;background:#fff;color:#142234;box-shadow:0 24px 80px #0c213540;font:400 14px/1.6 'DM Sans',Arial,sans-serif}#wpInstallHelp::backdrop{background:#0d213957;backdrop-filter:blur(3px)}#wpInstallHelp .wp-install-heading{display:flex;align-items:center;gap:12px}#wpInstallHelp .wp-install-heading img{width:42px;height:42px;border-radius:12px}#wpInstallHelp h2{margin:0;font-size:18px;line-height:1.3}#wpInstallHelp .wp-install-heading span{font-size:11px;color:#64748b}#wpInstallHelp .wp-install-close{margin-left:auto;background:#f1f5f9;border:0;border-radius:8px;width:30px;height:30px;flex:0 0 30px;font-size:22px;color:#516174;cursor:pointer}#wpInstallHelp p{margin:20px 0;color:#536477}#wpInstallHelp .wp-install-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}#wpInstallHelp .wp-install-actions>*{box-sizing:border-box;padding:10px 16px;border:1px solid #d3dfeb;border-radius:10px;background:#fff;color:#254360;font:600 13px/1.4 'DM Sans',Arial,sans-serif;cursor:pointer;text-decoration:none}#wpInstallHelp .wp-install-actions .wp-install-primary{background:#143d68;color:#fff;border-color:#143d68}@media(max-width:480px){#wpInstallHelp{padding:18px}#wpInstallHelp h2{font-size:16px}}`;
  style.textContent+='@media print{html:root body #wpInstallApp,html:root body #wpInstallHelp{display:none!important}}';
  window.addEventListener('watermarkproinstallchange',mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
