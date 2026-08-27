(function(){
  'use strict';
  if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
  let installPrompt=null;
  const isInstalled=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function mountInstallButton(){
    const existing=document.querySelector('.pwa-install-button');
    if(!installPrompt||isInstalled()){existing?.remove();return}
    if(existing)return;
    const button=document.createElement('button');button.type='button';button.className='pwa-install-button';button.textContent='Install App';
    button.onclick=async event=>{event.stopPropagation();const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice.catch(()=>null);mountInstallButton()};
    const menu=document.getElementById('headerUserMenu');
    if(menu)menu.insertBefore(button,menu.querySelector('#shellLogout'));
    else document.getElementById('headerAccount')?.prepend(button);
  }
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;mountInstallButton()});
  addEventListener('appinstalled',()=>{installPrompt=null;mountInstallButton()});
  new MutationObserver(mountInstallButton).observe(document.getElementById('headerAccount')||document.documentElement,{childList:true,subtree:true});
})();
