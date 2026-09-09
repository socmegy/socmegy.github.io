(()=>{
  const scope=new URL('./',document.baseURI).pathname,launchKey='wp-app-launch:'+scope;
  if(new URLSearchParams(location.search).get('app')==='watermark-pro')sessionStorage.setItem(launchKey,'watermark-pro');
  const ownStandalone=()=>(sessionStorage.getItem(launchKey)==='watermark-pro'||location.pathname.startsWith('/watermark-pro/'))&&(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true);
  const installedKey='wp-installed:'+scope;
  const state={prompt:null,installed:ownStandalone()||localStorage.getItem(installedKey)==='1'};
  const recordInstalled=()=>{state.installed=true;localStorage.setItem(installedKey,'1');state.prompt=null;notify()};
  const notify=()=>window.dispatchEvent(new CustomEvent('watermarkproinstallchange',{detail:{available:Boolean(state.prompt),installed:state.installed}}));
  window.WatermarkProInstall={
    get available(){return Boolean(state.prompt)},
    get installed(){return state.installed},
    async prompt(){
      if(!state.prompt)return {outcome:'unavailable'};
      const event=state.prompt;state.prompt=null;notify();await event.prompt();const choice=await event.userChoice;notify();return choice;
    }
  };
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();localStorage.removeItem(installedKey);state.installed=false;state.prompt=event;notify()});
  window.addEventListener('appinstalled',recordInstalled);
  matchMedia('(display-mode: standalone)').addEventListener('change',()=>{state.installed=ownStandalone()||localStorage.getItem(installedKey)==='1';if(state.installed)state.prompt=null;notify()});
  if(ownStandalone())localStorage.setItem(installedKey,'1');
  window.addEventListener('storage',event=>{if(event.key===installedKey){state.installed=event.newValue==='1'||ownStandalone();notify()}});
  if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol))window.addEventListener('load',()=>navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{scope:new URL('./',document.baseURI).pathname}).catch(error=>console.warn('Watermark Pro service worker:',error)));
  async function checkInstalled(){
    if(ownStandalone()){recordInstalled();return;}
    if(location.protocol==='file:'||typeof navigator.getInstalledRelatedApps!=='function')return;
    try{const apps=await navigator.getInstalledRelatedApps();const ownId=new URL('/watermark-pro/',location.origin).href,manifest=new URL('manifest.webmanifest',document.baseURI).href;
      const installed=apps.some(app=>app.platform==='webapp'&&(app.id===ownId||(!app.id&&app.url===manifest)));
      state.installed=installed;if(installed)localStorage.setItem(installedKey,'1');else localStorage.removeItem(installedKey);notify();
    }catch{}
  }
  window.addEventListener('pageshow',checkInstalled);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkInstalled()});checkInstalled();
  function showInstallHelp(){
    let d=document.getElementById('wpInstallHelp');
    if(!d){
      d=document.createElement('dialog');d.id='wpInstallHelp';d.setAttribute('aria-labelledby','wpInstallTitle');
      const local=location.protocol==='file:',ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
      const copy=local?'Pemasangan tersedia melalui laman web Watermark Pro. Buka laman web untuk memasang aplikasi pada peranti ini.':ios?'Tekan butang Kongsi dalam Safari, kemudian pilih Tambah ke Skrin Utama.':'Buka menu pelayar, pilih Pasang Watermark Pro, kemudian sahkan pemasangan.';
      d.innerHTML='<div class="wp-install-heading"><img src="logo.jpg" alt=""><div><h2 id="wpInstallTitle">Pasang Watermark Pro</h2><span>Akses terus daripada peranti anda</span></div><button type="button" class="wp-install-close" aria-label="Tutup">×</button></div><p>'+copy+'</p><div class="wp-install-actions">'+(local?'<a href="https://socmegy.com/watermark-pro/" target="_blank" rel="noopener" class="wp-install-primary">Buka laman web</a>':'')+'<button type="button" class="wp-install-done">'+(local?'Tutup':'Faham')+'</button></div>';
      d.querySelectorAll('button').forEach(b=>b.onclick=()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});document.body.append(d);
    }
    d.showModal();
  }
  function mount(){
    const dialog=document.getElementById('wpInstallHelp');
    if(dialog&&state.prompt&&!dialog.querySelector('#wpInstallNative')){const b=document.createElement('button');b.id='wpInstallNative';b.type='button';b.className='wp-install-primary';b.textContent='Pasang aplikasi';b.onclick=async()=>{dialog.close();await window.WatermarkProInstall.prompt()};dialog.querySelector('.wp-install-actions').prepend(b)}

    let button=document.getElementById('wpInstallApp');
    if(state.installed){button?.remove();document.getElementById('wpInstallHelp')?.close();return;}
    if(!button){button=document.createElement('button');button.id='wpInstallApp';button.type='button';button.className='pwa-install-button';button.setAttribute('aria-label','Pasang aplikasi Watermark Pro');button.title='Pasang aplikasi Watermark Pro';button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>';button.onclick=async()=>{if(state.prompt)await window.WatermarkProInstall.prompt();else showInstallHelp()};document.body.append(button);}
  }
  const style=document.createElement('style');style.textContent='body #wpInstallApp{position:fixed!important;left:var(--wp-install-left,12px)!important;right:auto!important;bottom:max(20px,env(safe-area-inset-bottom))!important;width:48px;height:48px;display:none;place-items:center;border:1px solid #d6dde6;border-radius:14px;background:#fff;color:#143d68;box-shadow:0 5px 18px #102b4920;z-index:90;cursor:pointer}body.auth-mode #wpInstallApp{display:grid;z-index:100001}';document.head.append(style);
  style.textContent+='body #wpInstallApp{display:grid!important;width:48px!important;height:48px!important;padding:0!important}body #wpInstallApp svg{display:block;width:22px;height:22px}@media(max-width:980px){body:not(.auth-mode) #wpInstallApp{bottom:90px!important}}';
  style.textContent+=`#wpInstallHelp{box-sizing:border-box;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;margin:auto;padding:24px;border:1px solid #dce5ee;border-radius:20px;background:#fff;color:#142234;box-shadow:0 24px 80px #0c213540;font:400 14px/1.6 'DM Sans',Arial,sans-serif}#wpInstallHelp::backdrop{background:#0d213957;backdrop-filter:blur(3px)}#wpInstallHelp .wp-install-heading{display:flex;align-items:center;gap:12px}#wpInstallHelp .wp-install-heading img{width:42px;height:42px;border-radius:12px}#wpInstallHelp h2{margin:0;font-size:18px;line-height:1.3}#wpInstallHelp .wp-install-heading span{font-size:11px;color:#64748b}#wpInstallHelp .wp-install-close{margin-left:auto;background:#f1f5f9;border:0;border-radius:8px;width:30px;height:30px;flex:0 0 30px;font-size:22px;color:#516174;cursor:pointer}#wpInstallHelp p{margin:20px 0;color:#536477}#wpInstallHelp .wp-install-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}#wpInstallHelp .wp-install-actions>*{box-sizing:border-box;padding:10px 16px;border:1px solid #d3dfeb;border-radius:10px;background:#fff;color:#254360;font:600 13px/1.4 'DM Sans',Arial,sans-serif;cursor:pointer;text-decoration:none}#wpInstallHelp .wp-install-actions .wp-install-primary{background:#143d68;color:#fff;border-color:#143d68}@media(max-width:480px){#wpInstallHelp{padding:18px}#wpInstallHelp h2{font-size:16px}}`;
  function alignInstall(){const candidates=[...document.querySelectorAll('body.auth-mode .auth-main-v51,body:not(.auth-mode) .page.active .card,body:not(.auth-mode) .main-inner')];const box=candidates.map(n=>n.getBoundingClientRect()).find(r=>r.width>0&&r.left>=0);document.documentElement.style.setProperty('--wp-install-left',Math.max(12,box?.left||12)+'px')}
  window.addEventListener('resize',alignInstall);document.addEventListener('click',()=>requestAnimationFrame(alignInstall));window.addEventListener('load',alignInstall);alignInstall();
  style.textContent+='@media print{html:root body #wpInstallApp,html:root body #wpInstallHelp{display:none!important}}';
  window.addEventListener('watermarkproinstallchange',mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
