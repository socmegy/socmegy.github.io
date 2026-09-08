(()=>{
'use strict';
const q=s=>document.querySelector(s);
const style=document.createElement('style');
style.textContent=`
html body .topbar .header-brand-logo,html body #authPage .auth-page-brand-v53 .brandmark{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;flex:0 0 40px!important;aspect-ratio:1!important;border-radius:11px!important;object-fit:contain!important}
html body.pro-account:not(.owner-account) #headerProfileAvatar::after,html body.pro-account:not(.owner-account) #avatarPreview::after{content:none!important;display:none!important}
html body #mediaLightbox[data-viewer-kind="banner"] #closeMediaViewer,html body #mediaLightbox[data-viewer-kind="photo-banner"] #closeMediaViewer{left:50%!important;right:auto!important;transform:translateX(-50%)!important}
.wp-password-wrap{position:relative;display:block;min-width:0;width:100%}
html body .wp-password-wrap input{padding-right:76px!important;width:100%;box-sizing:border-box}
html body .wp-password-wrap .wp-password-toggle{position:absolute!important;right:6px;top:50%;transform:translateY(-50%);width:auto!important;min-width:0!important;min-height:32px!important;height:32px!important;padding:4px 8px!important;border:0!important;background:transparent!important;color:#315579!important;font:600 11px system-ui!important;box-shadow:none!important}
html body #passwordChangeStatus:not(:empty){display:block!important;padding:12px!important;background:#eef7ff!important;border-radius:10px;color:#174970}
.wp-community-link{display:inline-flex;align-items:center;gap:8px;text-decoration:none}
.topbar{border-bottom:0!important;box-shadow:none!important}
.wp-wmark-normal{display:inline-flex!important;align-items:center!important;gap:3px!important;line-height:1!important}
.lab-home-uname,.lab-profile-uname,.lab-topuser-uname,.sidebar-user strong{font-size:16px!important;line-height:1!important}
.wp-wmark-normal.wp-wmark-truncated{gap:0!important}.wp-wmark-normal.wp-wmark-truncated>.wp-wmark{margin-left:-1px!important}
.plan.pro .wp-wmark-feature .wp-wmark{margin-left:0!important}
.supporter-card-brand,.supporter-card-small{text-transform:none!important;letter-spacing:0!important}
#supporterCardUsername{color:#000!important}
.avatar-save-help{display:block!important;width:auto!important;max-width:100%!important;white-space:normal!important;text-align:left!important;word-spacing:normal!important}.avatar-save-help strong{display:inline!important}
#wpWMarkDialog button{display:none!important}
#mediaLightbox:not([data-viewer-kind="banner"]):not([data-viewer-kind="photo-banner"]) #closeMediaViewer{display:none!important}
@media(max-width:800px){html body .topbar .header-brand-logo{width:40px!important;height:40px!important;min-width:40px!important;flex-basis:40px!important}.auth-main-v51.auth-style1-actual{padding-top:0!important;padding-bottom:0!important}.page>.hero{margin-top:-8px!important}.avatar-save-help{white-space:normal!important;display:inline!important}.avatar-save-help strong{display:inline!important}}
`;
style.textContent+=`
html body .topbar #pageTitle.header-brand{height:40px!important;min-height:40px!important;padding:0!important;overflow:visible!important}
html body .topbar #pageTitle.header-brand .header-brand-logo{width:40px!important;height:40px!important;max-width:none!important;max-height:none!important;padding:0!important;transform:none!important;object-fit:cover!important}
@media(min-width:648px) and (max-width:1100px){
html body.auth-mode #authPage .auth-main-v51.auth-style1-actual{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-rows:auto!important;gap:24px!important;align-items:center!important}
html body.auth-mode #authPage .auth-intro-v132{grid-column:1!important;grid-row:1!important;min-width:0!important}
html body.auth-mode #authPage .auth-panel-v131{grid-column:2!important;grid-row:1!important;min-width:0!important}
}
html body.auth-mode #authPage .auth-main-v51.auth-style1-actual{padding-top:0!important;padding-bottom:0!important}
html body .page>.hero{margin-top:-8px!important}
html body #headerProfileAvatar::after,html body #avatarPreview::after{content:none!important;display:none!important}
html body #mediaLightbox[data-viewer-kind="banner"] #closeMediaViewer,html body #mediaLightbox[data-viewer-kind="photo-banner"] #closeMediaViewer{position:fixed!important;left:var(--viewer-close-x)!important;top:var(--viewer-close-y)!important;bottom:auto!important;right:auto!important;transform:translate(-50%,-50%)!important;z-index:3!important}
@supports (mask-image:url("bg.jpg")){
body.pro-account .mobile-nav .wp-nav-art{display:inline-block;background:url("bg.jpg") center/cover;mask:var(--nav-shape) center/contain no-repeat;-webkit-mask:var(--nav-shape) center/contain no-repeat}
html body.pro-account .mobile-nav .wp-nav-art>img,html body.pro-account .mobile-nav .wp-nav-art>svg{visibility:hidden!important}
}
`;
document.head.append(style);
const viewer=q('#mediaLightbox'),viewerImage=q('#mediaLightboxImage');
const positionClose=()=>{if(!viewerImage||!viewer?.classList.contains('open'))return;const r=viewerImage.getBoundingClientRect();viewer.style.setProperty('--viewer-close-x',r.right+'px');viewer.style.setProperty('--viewer-close-y',r.bottom+'px')};
if(viewer){new MutationObserver(positionClose).observe(viewer,{attributes:true,attributeFilter:['class','data-viewer-kind']});new ResizeObserver(positionClose).observe(viewerImage);viewerImage.addEventListener('load',positionClose);addEventListener('resize',positionClose)}
document.querySelectorAll('.mobile-nav .navbtn').forEach(button=>{
 const icon=button.querySelector('img,svg');if(!icon)return;
 const r=icon.getBoundingClientRect(),wrap=document.createElement('span');wrap.className='wp-nav-art';
 const shape=icon.tagName.toLowerCase()==='img'?icon.src:'data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(icon));
 wrap.style.setProperty('--nav-shape','url("'+shape+'")');wrap.style.width=(r.width||23)+'px';wrap.style.height=(r.height||23)+'px';icon.before(wrap);wrap.append(icon);
});
document.documentElement.style.setProperty('--wp-wmark-image','url("'+window.WPWMarkAsset+'")');
function mountPasswords(){
 document.querySelectorAll('input[type="password"]').forEach(input=>{
  if(input.closest('.wp-password-wrap'))return;
  const wrap=document.createElement('span');wrap.className='wp-password-wrap';input.before(wrap);wrap.append(input);
  const b=document.createElement('button');b.type='button';b.className='wp-password-toggle';b.textContent='Papar';b.setAttribute('aria-label','Papar kata laluan');b.setAttribute('aria-pressed','false');
  b.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';b.textContent=show?'Sorok':'Papar';b.setAttribute('aria-label',show?'Sorok kata laluan':'Papar kata laluan');b.setAttribute('aria-pressed',String(show));};wrap.append(b);
 });
}
mountPasswords();
const f=q('#passwordChangeForm');
if(f)f.noValidate=true;
if(q('#loginForm'))q('#loginForm').noValidate=true;
if(f)f.onsubmit=async e=>{
 e.preventDefault();const form=e.currentTarget,status=q('#passwordChangeStatus'),button=form.querySelector('[type="submit"]');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent='Menyimpan…';button.disabled=true;
 try{
  const api=window.WPCloudflare?.api;if(!api)throw new Error('Sambungan akaun belum sedia. Cuba lagi.');
  const data=await api('/api/account/password',{method:'PATCH',body:JSON.stringify(Object.fromEntries(new FormData(form)))});
  if(data.token)localStorage.setItem('watermarkProUserApiToken',data.token);
  form.reset();form.querySelectorAll('.wp-password-wrap input').forEach(i=>i.type='password');form.querySelectorAll('.wp-password-toggle').forEach(b=>{b.textContent='Papar';b.setAttribute('aria-pressed','false')});
  status.textContent='Kata laluan berjaya disimpan.';status.scrollIntoView({block:'nearest'});
 }catch(error){status.textContent=error.message||'Kata laluan gagal disimpan.'}
 finally{button.disabled=false;}
};
function community(settings){
 let card=q('#communitySection');
 if(!card){const wa=q('#whatsappSupportBtn')?.closest('.card');if(!wa)return;card=document.createElement('section');card.className='card pad';card.id='communitySection';card.innerHTML='<div class="sectionhead"><div><h2>Sertai komuniti</h2><p>Ikuti berita dan kemas kini Watermark Pro.</p></div></div><a class="btn wp-community-link" target="_blank" rel="noopener noreferrer">Telegram channel</a>';wa.after(card);}
 const a=card.querySelector('a');let url;try{url=new URL(settings?.communityUrl)}catch{}
 const valid=url?.protocol==='https:'&&['t.me','telegram.me','www.t.me'].includes(url.hostname);
 card.hidden=!valid;a.hidden=!valid;if(valid)a.href=url.href;
}
function mountAccountInstall(){
 document.getElementById('wpInstallCard')?.remove();
 const settings=q('#page-settings');if(!settings)return;let card=q('#wpAccountInstallCard');
 if(window.WatermarkProInstall?.installed||!window.WatermarkProInstall?.available){card?.remove();return;}
 if(!card){card=document.createElement('section');card.id='wpAccountInstallCard';card.className='section card pad';card.innerHTML='<div class="sectionhead"><div><h2>Aplikasi Watermark Pro</h2><p>Pasang pada peranti untuk akses lebih cepat.</p></div></div><button class="btn" id="wpAccountInstallButton" type="button"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg><span>Pasang aplikasi</span></button>';settings.querySelector('.settings-critical-actions')?.before(card)||settings.append(card);card.querySelector('button').onclick=()=>window.WatermarkProInstall?.prompt();}
 card.hidden=Boolean(window.WatermarkProInstall?.installed);
}
mountAccountInstall();window.addEventListener('watermarkproinstallchange',mountAccountInstall);
window.addEventListener('beforeinstallprompt',()=>{document.getElementById('wpInstallCard')?.remove();mountAccountInstall()});
window.addEventListener('DOMContentLoaded',()=>{document.getElementById('wpInstallCard')?.remove();mountAccountInstall()},{once:true});
const routeMap={home:'',profile:'profil',subscriptions:'sokongan',settings:'tetapan'};
const authURL=new URL('index.html',document.baseURI);
const fromPath=()=>Object.keys(routeMap).find(k=>routeMap[k]===(location.hash?location.hash.replace(/^#\/?/,''):location.pathname.match(/\/(profil|sokongan|tetapan)\/?$/)?.[1]||''))||'home';
window.WPLogoutRoute=()=>{routeApplied=false;history.replaceState({},'',authURL.pathname);};
let routeApplied=false;
const apply=window.WPApplyLiveState;
if(typeof apply==='function')window.WPApplyLiveState=(pub,acc)=>{
 apply(pub,acc);community(pub?.settings);mountPasswords();
 if(acc?.user&&!routeApplied){routeApplied=true;const page=fromPath();if(typeof openPage==='function')openPage(page);}
 if(!acc?.user)window.WPLogoutRoute();
};
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-page]');if(!nav||document.body.classList.contains('auth-mode'))return;
 const page=nav.dataset.page;if(!(page in routeMap))return;
 const path=authURL.pathname+(routeMap[page]?'#/'+routeMap[page]:'');if(location.pathname+location.hash!==path)history.pushState({page},'',path);
});
addEventListener('popstate',()=>{if(document.body.classList.contains('auth-mode'))window.WPLogoutRoute();else if(typeof openPage==='function')openPage(fromPath());});
addEventListener('pageshow',()=>{if(!localStorage.getItem('watermarkProUserApiToken')){document.documentElement.classList.remove('account-authenticated');if(typeof showAuthScreen==='function')showAuthScreen('login');window.WPLogoutRoute();}});
})();
