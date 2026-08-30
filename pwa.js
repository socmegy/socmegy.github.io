(function(){
  'use strict';
  if('serviceWorker' in navigator)window.addEventListener('load',()=>{const production=location.hostname==='socmegy.com'||location.hostname==='www.socmegy.com',base=production?'/watermark-pro/':new URL('.',document.baseURI).pathname;navigator.serviceWorker.register(base+'sw.js',{scope:base}).catch(()=>{})});
  let installPrompt=null;
  const isInstalled=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function mountInstallButton(){
    const existing=document.querySelector('.pwa-install-button');
    if(!installPrompt||isInstalled()){existing?.remove();return}
    if(existing)return;
    const button=document.createElement('button');button.type='button';button.className='pwa-install-button';button.title='Install Watermark Pro';button.setAttribute('aria-label','Install Watermark Pro');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>';
    button.onclick=async event=>{event.stopPropagation();const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice.catch(()=>null);mountInstallButton()};
    document.body.appendChild(button);
  }
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;mountInstallButton()});
  addEventListener('appinstalled',()=>{installPrompt=null;mountInstallButton()});
  new MutationObserver(mountInstallButton).observe(document.getElementById('headerAccount')||document.documentElement,{childList:true,subtree:true});
})();
