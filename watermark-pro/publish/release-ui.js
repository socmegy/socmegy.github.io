(()=>{
'use strict';
const q=s=>document.querySelector(s);
const style=document.createElement('style');
style.textContent=`
html body #proPaymentModal.open{display:flex!important;align-items:center!important;justify-content:center!important;position:fixed!important;inset:0!important;padding:16px!important}
html body #proPaymentModal .payment-shell{width:min(760px,100%)!important;max-width:760px!important;height:auto!important;max-height:calc(100dvh - 32px)!important;margin:auto!important;overflow:auto!important}
html body #proPaymentModal .payment-layout{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:24px!important}
html body #proPaymentModal .payment-column{min-width:0!important}
html body #proPaymentModal .payment-qr-wrap img[hidden]{display:none!important}
@media(max-width:600px){html body #proPaymentModal .payment-layout{grid-template-columns:minmax(0,1fr)!important;gap:16px!important}}
html body .topbar .header-brand-logo,html body #authPage .auth-page-brand-v53 .brandmark{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;flex:0 0 40px!important;aspect-ratio:1!important;border-radius:11px!important;object-fit:contain!important}
html body.pro-account #headerProfileAvatar::after,html body.pro-account #avatarPreview::after{content:none!important;display:none!important}
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
#supporterCardUsername{color:#fff!important}
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
const policyCard=[...document.querySelectorAll('#page-settings .card')].find(n=>[...n.querySelectorAll('h2,h3')].some(h=>h.textContent.trim()==='Dasar dan Syarat'));
const versionCard=document.querySelector('#page-settings .version-section');if(policyCard&&versionCard)versionCard.before(policyCard);
const finalStyle=document.createElement('style');finalStyle.textContent=`
html body #page-subscriptions .plan.pro::before,html body #authPricingModal .plan.pro::before{content:none!important;display:none!important}
html body #page-subscriptions .plan.pro,html body #authPricingModal .plan.pro{box-shadow:none!important;outline:0!important;border-image:none!important;border-radius:22px!important}
html:root{--wp-pro-ring:2.5px!important}
html body .sidebar .is-pro-avatar,html body .topuser-avatar-action.is-pro-avatar{border-width:2px!important;box-shadow:none!important}
html body.pro-account .sidebar .user-avatar{border-width:2px!important;padding:0!important}
html body.pro-account .sidebar .user-avatar>img,html body .topuser-avatar-action.is-pro-avatar>img{inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important}
html body #supporterCardUsername{color:#fff!important}
html body.pro-account #headerProfileAvatar,html body.pro-account #avatarPreview,html body .topuser-row.is-pro .topuser-avatar-action,html body.pro-account .supporter-card-avatar{border:2px solid transparent!important;padding:0!important;box-sizing:border-box!important;background:linear-gradient(#e9eef4,#e9eef4) padding-box,url('bg.jpg') center/cover border-box!important;border-radius:50%!important;overflow:hidden!important}
html body.pro-account #headerProfileAvatar>img,html body.pro-account #avatarPreview>img,html body .topuser-row.is-pro .topuser-avatar-action>img,html body.pro-account .supporter-card-avatar>img{inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important}
html body #wpSessionBoot{gap:18px!important}html body #wpSessionBoot .wp-boot-logo{width:96px!important;height:96px!important}html body #wpSessionBoot #wpSessionBootText{font:800 19px/1.25 'DM Sans',Arial,sans-serif!important;color:#536171!important}
@media(max-width:700px){html body #wpSessionBoot .wp-boot-logo{width:84px!important;height:84px!important}html body #wpSessionBoot #wpSessionBootText{font-size:18px!important}}
html body #receiptPaymentStatus[data-receipt-status='granted']{color:#ff0088!important;border-color:#ff0088!important}
html body #page-subscriptions .plan.pro,html body #authPricingModal .plan.pro{border:2px solid #174a7a!important;background-clip:padding-box!important}
html body .mobile-nav .navbtn .wp-nav-art{display:inline-flex!important;width:23px!important;height:23px!important;background:none!important;mask:none!important;-webkit-mask:none!important}
html body .mobile-nav .navbtn .wp-nav-art>svg{display:block!important;visibility:visible!important;opacity:1!important;width:23px!important;height:23px!important;stroke:currentColor!important;fill:none!important}
html body .sidebar{padding:22px 16px!important;gap:24px!important}html body .sidebar .nav{display:grid!important;gap:5px!important;align-content:start!important;grid-auto-rows:44px!important}html body .sidebar .navbtn{height:44px!important;min-height:44px!important;padding:0 12px!important;gap:11px!important;font-size:13px!important;border-radius:10px!important}
html body .sidebar-user strong{font-weight:400!important}.sidebar-user{cursor:pointer}
html body #authPage .auth-intro-v132>h1{font-size:32px!important;line-height:1.2!important;margin-bottom:24px!important}
@media(min-width:1101px){html body #authPage .auth-intro-v132>h1{font-size:clamp(24px,2.2vw,32px)!important;white-space:nowrap!important}html body #authPage .auth-intro-v132>h1 br{display:none!important}html body #authPage .auth-intro-v132>h1 br::after{content:' '}}
.wp-live-notice[data-unread='true']::after{content:'';display:block;width:7px;height:7px;border-radius:50%;background:#1478ee;position:absolute;right:12px;top:16px}.wp-live-notice{position:relative}
`;document.head.append(finalStyle);
const professionalTitle='Watermark Pro - Watermark dulu. Baru post.';
document.querySelectorAll('.supporter-card-foot').forEach(foot=>{const first=foot.firstElementChild,site=foot.querySelector('.supporter-card-site');if(first&&site)site.style.setProperty('font-size',getComputedStyle(first).fontSize,'important')});
finalStyle.textContent+='html body #wpSessionBoot #wpSessionBootText{font-weight:400!important}.supporter-card-footer span,.supporter-card-footer a{font-size:inherit!important}';
finalStyle.textContent+='html body #wpSessionBoot #wpSessionBootText{font-family:Arial,sans-serif!important}';
finalStyle.textContent+='html body.pro-account #page-settings #avatarPreview{border:2px solid #245986!important;background:#245986!important;padding:0!important;border-radius:50%!important}html body.pro-account .sidebar .wp-sidebar-art{width:19px;height:19px;flex:0 0 19px;display:block;background:url("bg.jpg") center/cover;mask:var(--nav-shape) center/contain no-repeat;-webkit-mask:var(--nav-shape) center/contain no-repeat}html body .sidebar .wp-sidebar-art svg{width:19px;height:19px;display:block}html body.pro-account .sidebar .wp-sidebar-art svg{opacity:0}';
finalStyle.textContent+=`
html body #receiptModal #receiptPaymentStatus[data-receipt-status="granted"]{color:#ff0088!important;-webkit-text-fill-color:#ff0088!important;border-color:#ff0088!important}
html body #supporterExportStatus:not(:empty){padding:12px 16px;border-radius:10px;background:#eef7ff;color:#174a7a;font-size:13px;line-height:1.5;margin:12px 0 0;overflow-wrap:anywhere}
html body .topuser-avatar-action>img{position:absolute!important;inset:0!important;margin:0!important;transform:none!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important}
html body.pro-account #avatarPreview{border:2px solid #245986!important;border-radius:50%!important;box-sizing:border-box!important}
html body.pro-account .mobile-nav .wp-nav-art{background:url('bg.jpg') center/cover!important;mask:var(--nav-shape) center/contain no-repeat!important;-webkit-mask:var(--nav-shape) center/contain no-repeat!important}
html body.pro-account .mobile-nav .wp-nav-art svg{opacity:0!important}
@media(max-width:600px){html body #receiptModal{padding:8px!important}html body #receiptModal .modal-shell{width:100%!important;margin:0!important}html body #receiptSheet{padding:16px!important;margin:0!important;width:100%!important;box-sizing:border-box!important}}
`;
const fixTitle=()=>{if(document.title!==professionalTitle)document.title=professionalTitle};fixTitle();new MutationObserver(fixTitle).observe(document.querySelector('title'),{childList:true});
document.querySelector('.sidebar-user')?.setAttribute('data-page','settings');
const sidebarIdentity=q('.sidebar-user');if(sidebarIdentity){sidebarIdentity.setAttribute('role','button');sidebarIdentity.tabIndex=0;sidebarIdentity.addEventListener('click',()=>window.openPage?.('settings'));sidebarIdentity.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sidebarIdentity.click()}})}
// Use stable line icons, independent of legacy image visibility rules and Pro state.
const navPaths={home:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',profile:'M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0M3.5 19a5.5 5.5 0 0 1 11 0M17 8h4M19 6v4',subscriptions:'M4 6h16v12H4zM4 10h16M8 15h3',settings:'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6.1a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L5 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.4 3.1h5l.4-3.1a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.5a7 7 0 0 0 .1-1z'};
const slogan=q('#authPage .auth-intro-v132>h1'),banner=q('#authShowcase .auth-showcase-media');
if(slogan&&banner){slogan.classList.add('wp-banner-slogan');slogan.innerHTML='<span>Watermark dulu.</span><span>Baru post.</span>';banner.append(slogan);}
document.querySelectorAll('.version-section,.legacy-version-section').forEach(n=>n.remove());
finalStyle.textContent+=`html body .wp-wmark-name.wp-wmark-normal{line-height:1.2!important}html body .wp-wmark-name.wp-wmark-normal>.lab-uname,html body .wp-wmark-name.wp-wmark-normal>strong{font:400 16px/1.22 'DM Sans',Arial,sans-serif!important}html body .wp-wmark-name.wp-wmark-normal>.wp-wmark,html body .wp-wmark-name.wp-wmark-normal>.wp-wmark img{height:auto!important;align-self:center!important;object-fit:contain!important}`;
document.querySelectorAll('.mobile-nav .navbtn').forEach(b=>{const p=navPaths[b.dataset.page];if(!p)return;b.querySelectorAll('svg,img,.wp-nav-art').forEach(n=>n.remove());b.insertAdjacentHTML('afterbegin','<span class="wp-nav-art"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+p+'"/></svg></span>')});
const viewer=q('#mediaLightbox'),viewerImage=q('#mediaLightboxImage');
queueMicrotask(()=>document.querySelectorAll('.sidebar .navbtn>svg').forEach(svg=>{const wrap=document.createElement('span'),shape=svg.cloneNode(true);shape.setAttribute('xmlns','http://www.w3.org/2000/svg');shape.setAttribute('stroke','black');wrap.className='wp-sidebar-art';wrap.style.setProperty('--nav-shape','url("data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(shape))+'")');svg.before(wrap);wrap.append(svg)}));
document.querySelectorAll('.mobile-nav .wp-nav-art').forEach(w=>{const svg=w.querySelector('svg').cloneNode(true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('stroke','black');w.style.setProperty('--nav-shape','url("data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(svg))+'")')});
document.querySelectorAll('.sidebar .navbtn[data-page]').forEach(b=>{const icon=document.querySelector('.mobile-nav [data-page="'+b.dataset.page+'"] svg');if(!icon)return;b.querySelectorAll('img,svg').forEach(n=>n.remove());b.prepend(icon.cloneNode(true))});
finalStyle.textContent+='html body .sidebar .navbtn>svg{display:block!important;visibility:visible!important;width:19px!important;height:19px!important;flex:0 0 19px!important;fill:none!important;stroke:currentColor!important}html body .sidebar-user{padding:12px!important;border:1px solid var(--line)!important;border-radius:12px!important;background:#f8fafc!important;margin-top:auto!important}';
const positionClose=()=>{if(!viewerImage||!viewer?.classList.contains('open'))return;const r=viewerImage.getBoundingClientRect();viewer.style.setProperty('--viewer-close-x',(r.left+r.width/2)+'px');viewer.style.setProperty('--viewer-close-y',r.bottom+'px')};
if(viewer){new MutationObserver(positionClose).observe(viewer,{attributes:true,attributeFilter:['class','data-viewer-kind']});new ResizeObserver(positionClose).observe(viewerImage);viewerImage.addEventListener('load',positionClose);addEventListener('resize',positionClose)}
document.querySelectorAll('.mobile-nav .navbtn').forEach(button=>{
 const icon=button.querySelector('img,svg');if(!icon||icon.closest('.wp-nav-art'))return;
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
window.addEventListener('click',async e=>{
 const button=e.target.closest?.('#downloadSupporterCard');if(!button)return;e.preventDefault();e.stopImmediatePropagation();if(button.disabled)return;
 const user=window.WPCloudflare?.user;if(!user||(user.plan!=='pro'&&user.role!=='admin')){window.setProUpsellOpen?.(true);return;}
 const accountId=user.id;
 let status=q('#supporterExportStatus');if(!status){status=document.createElement('p');status.id='supporterExportStatus';status.setAttribute('role','status');button.after(status)}
 button.disabled=true;status.dataset.state='loading';status.textContent='Menyediakan Kad Penyokong...';
 try{await window.WPWMarkReady;const canvas=await window.drawSupporterCard();const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG gagal disediakan.')),'image/png'));if(window.WPCloudflare?.user?.id!==accountId)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='watermark-pro-kad-penyokong.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.dataset.state='success';status.textContent='Kad Penyokong berjaya dimuat turun.';setTimeout(()=>{if(status.dataset.state==='success')status.textContent=''},5000)}catch(error){console.error('Supporter PNG export:',error);status.dataset.state='error';status.textContent='Kad belum dapat dimuat turun. Cuba sekali lagi. Jika masih gagal, buka Watermark Pro melalui laman web dan cuba semula.'}finally{const u=window.WPCloudflare?.user;button.disabled=!u||(u.plan!=='pro'&&u.role!=='admin');if(window.WPCloudflare?.user?.id!==accountId)status.textContent='';}
},true);
let receiptPrinting=false;
window.printReceiptIsolated=async()=>{
 if(receiptPrinting)return;const sheet=q('#receiptSheet');if(!sheet)return;receiptPrinting=true;
 // Print one document only; Android also prints this same isolated root.
 document.querySelectorAll('style').forEach(node=>{const css=node.sheet;if(!css)return;for(let i=css.cssRules.length-1;i>=0;i--){const rule=css.cssRules[i];if(rule.type===6||(rule.type===4&&/print/.test(rule.conditionText)))css.deleteRule(i)}});
 document.querySelectorAll('.wp-print-root').forEach(n=>n.remove());
 const root=document.createElement('div');root.className='wp-print-root';root.id='wpReceiptPrintRoot';root.append(sheet.cloneNode(true));document.body.append(root);document.body.classList.add('wp-receipt-printing');
 const printStyle=document.createElement('style');printStyle.textContent=`@media print{
 @page{size:A4 portrait;margin:12mm!important}
 html:root,html:root body{display:block!important;position:static!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important}
 html:root body:has(#wpReceiptPrintRoot)>:not(.wp-print-root){display:none!important}
 html:root body.wp-receipt-printing>.wp-print-root{display:block!important;position:static!important;visibility:visible!important;margin:0!important;padding:0!important;width:100%!important;height:auto!important;min-height:0!important;transform:none!important}
 html:root body.wp-receipt-printing>.wp-print-root #receiptSheet{display:block!important;visibility:visible!important;position:static!important;transform:none!important;width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:white!important;overflow:visible!important;break-after:auto!important;page-break-after:auto!important}
 }`;document.head.append(printStyle);
 const cleanup=()=>{root.remove();printStyle.remove();document.body.classList.remove('wp-receipt-printing');receiptPrinting=false};
 window.addEventListener('afterprint',cleanup,{once:true});
 try{await document.fonts.ready;await Promise.all([...root.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));window.print()}catch(error){cleanup();throw error}
};
window.addEventListener('click',e=>{if(!e.target.closest?.('#printReceipt'))return;e.preventDefault();e.stopImmediatePropagation();window.printReceiptIsolated()},true);
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
 document.getElementById('wpAccountInstallCard')?.remove();
 return;
 document.getElementById('wpInstallCard')?.remove();
 const settings=q('#page-settings');if(!settings)return;let card=q('#wpAccountInstallCard');
 if(window.WatermarkProInstall?.installed||!window.WatermarkProInstall?.available){card?.remove();return;}
 if(!card){card=document.createElement('section');card.id='wpAccountInstallCard';card.className='section card pad';card.innerHTML='<div class="sectionhead"><div><h2>Aplikasi Watermark Pro</h2><p>Pasang pada peranti untuk akses lebih cepat.</p></div></div><button class="btn" id="wpAccountInstallButton" type="button"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg><span>Pasang aplikasi</span></button>';settings.querySelector('.settings-critical-actions')?.before(card)||settings.append(card);card.querySelector('button').onclick=()=>window.WatermarkProInstall?.prompt();}
 card.hidden=Boolean(window.WatermarkProInstall?.installed);
}
mountAccountInstall();window.addEventListener('watermarkproinstallchange',mountAccountInstall);
window.addEventListener('beforeinstallprompt',()=>{document.getElementById('wpInstallCard')?.remove();mountAccountInstall()});
window.addEventListener('DOMContentLoaded',()=>{document.getElementById('wpInstallCard')?.remove();mountAccountInstall()},{once:true});
const routeMap={home:'',profile:'profil',subscriptions:'pelan',settings:'tetapan'};
const authURL=new URL(location.protocol==='file:'?'index.html':'./',document.baseURI);
const fromPath=()=>{const slug=(location.hash?location.hash.replace(/^#\/?/,''):location.pathname.match(/\/(profil|pelan|sokongan|tetapan)\/?$/)?.[1]||'');return Object.keys(routeMap).find(k=>routeMap[k]===(slug==='sokongan'?'pelan':slug))||'home'};
window.WPLogoutRoute=()=>{q('#supporterExportStatus')?.remove();routeApplied=false;history.replaceState({},'',authURL.pathname);};
let routeApplied=false;
const apply=window.WPApplyLiveState;
window.WPNoticeReadAuthority=true;
let noticeAccount=null;
const readKey=()=> 'wpReadNoticeIds:'+noticeAccount?.user?.id;
const readIds=()=>new Set((noticeAccount?.notifications||[]).filter(n=>n.readAt).map(n=>n.id));
const paintNotices=()=>{
 const seen=readIds(),items=noticeAccount?.notifications||[];
 document.querySelectorAll('.wp-live-notice[data-id]').forEach(n=>{const value=String(!seen.has(n.dataset.id));if(n.dataset.unread!==value)n.dataset.unread=value});
 const unread=items.some(n=>!seen.has(n.id)),dot=q('#notificationDot');if(dot){dot.classList.toggle('show',unread);dot.style.setProperty('display',unread?'block':'none','important');}
};
q('#notificationPanel')?.addEventListener('click',async e=>{const item=e.target.closest('.wp-live-notice[data-id]');if(!item||!noticeAccount?.user)return;const account=noticeAccount;try{await window.WPCloudflare.api('/api/account/notifications/read',{method:'POST',body:JSON.stringify({id:item.dataset.id})});const n=account.notifications.find(n=>n.id===item.dataset.id);if(n)n.readAt=new Date().toISOString();paintNotices()}catch(error){console.warn('Status baca belum disimpan:',error.message)}},true);
if(q('#notificationPanel'))new MutationObserver(paintNotices).observe(q('#notificationPanel'),{childList:true,subtree:true});
if(typeof apply==='function')window.WPApplyLiveState=(pub,acc)=>{
 if(noticeAccount?.user?.id!==acc?.user?.id){q('#supporterExportStatus')?.remove();}
 noticeAccount=acc;apply(pub,acc);const cardButton=q('#downloadSupporterCard');if(cardButton)cardButton.disabled=!acc?.user||(acc.user.plan!=='pro'&&acc.user.role!=='admin');community(pub?.settings);mountPasswords();paintNotices();
 if(acc?.user&&!routeApplied){routeApplied=true;const page=fromPath();if(location.protocol!=='file:')history.replaceState({page},'',authURL.pathname+routeMap[page]);queueMicrotask(()=>{if(typeof openPage==='function')openPage(page)});}
 if(!acc?.user&&!localStorage.getItem('watermarkProUserApiToken'))window.WPLogoutRoute();
};
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-page]');if(!nav||document.body.classList.contains('auth-mode'))return;
 const page=nav.dataset.page;if(!(page in routeMap))return;
 const path=authURL.pathname+(routeMap[page]?(location.protocol==='file:'?'#/':'')+routeMap[page]:'');if(location.pathname+location.hash!==path)history.pushState({page},'',path);
});
addEventListener('popstate',()=>{if(document.body.classList.contains('auth-mode'))window.WPLogoutRoute();else if(typeof openPage==='function')openPage(fromPath());});
addEventListener('pageshow',()=>{if(!localStorage.getItem('watermarkProUserApiToken')){document.documentElement.classList.remove('account-authenticated');if(typeof showAuthScreen==='function')showAuthScreen('login');window.WPLogoutRoute();}});
})();

window.addEventListener('click',event=>{if(!document.body.classList.contains('pro-account')&&event.target.closest?.('#logoWatermarkGroup > .tool-toggle')){event.preventDefault();event.stopImmediatePropagation();window.setProUpsellOpen(true)}},true);
const logoAccess=document.querySelector('#logoWatermarkGroup > .tool-toggle');
if(logoAccess){logoAccess.tabIndex=0;logoAccess.addEventListener('keydown',event=>{if(!document.body.classList.contains('pro-account')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();window.setProUpsellOpen(true)}})}
