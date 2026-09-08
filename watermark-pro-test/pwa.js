(()=>{
  const state={prompt:null,installed:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true};
  const notify=()=>window.dispatchEvent(new CustomEvent('watermarkproinstallchange',{detail:{available:Boolean(state.prompt),installed:state.installed}}));
  window.WatermarkProInstall={
    get available(){return Boolean(state.prompt)},
    get installed(){return state.installed},
    async prompt(){
      if(!state.prompt)return {outcome:'unavailable'};
      const event=state.prompt;state.prompt=null;notify();await event.prompt();const choice=await event.userChoice;notify();return choice;
    }
  };
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.prompt=event;notify()});
  window.addEventListener('appinstalled',()=>{state.prompt=null;state.installed=true;notify()});
  matchMedia('(display-mode: standalone)').addEventListener('change',event=>{state.installed=event.matches||navigator.standalone===true;if(state.installed)state.prompt=null;notify()});
  if(!('serviceWorker' in navigator))return;
  if(['http:','https:'].includes(location.protocol))window.addEventListener('load',()=>navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{scope:new URL('./',document.baseURI).pathname}).catch(error=>console.warn('Watermark Pro service worker:',error)));
  function mount(){
    let button=document.getElementById('wpInstallApp');
    if(state.installed||!state.prompt){button?.remove();return;}
    if(!button){button=document.createElement('button');button.id='wpInstallApp';button.type='button';button.className='pwa-install-button';button.setAttribute('aria-label','Pasang aplikasi Watermark Pro');button.title='Pasang aplikasi Watermark Pro';button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>';button.onclick=async()=>{if(state.prompt)await window.WatermarkProInstall.prompt();};document.body.append(button);}
  }
  const style=document.createElement('style');style.textContent='body #wpInstallApp{position:fixed!important;right:20px!important;bottom:max(20px,env(safe-area-inset-bottom))!important;width:48px;height:48px;display:none;place-items:center;border:1px solid #d6dde6;border-radius:14px;background:#fff;color:#143d68;box-shadow:0 5px 18px #102b4920;z-index:90;cursor:pointer}body.auth-mode #wpInstallApp{display:grid}';document.head.append(style);
  window.addEventListener('watermarkproinstallchange',mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
