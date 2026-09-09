(()=>{
 'use strict';
 window.WPStableAvatar=(node,user)=>{
  if(!node||!user)return;
  const draft=window.wpAvatarDraft;
  const raw=String(draft!==undefined?draft:(user.photo||user.avatar||user.avatarUrl||user.profilePhoto||''));
  let src='';try{if(raw)src=new URL(raw,document.baseURI).href}catch{}
  const identity=String(user.id||user.username||''),name=String(user.username||'?'),letter=name.replace(/^@/,'').charAt(0).toLowerCase()||'?';
  const key=identity+'|'+src;
  node.classList.toggle('is-pro-avatar',user.plan==='pro'&&user.role!=='admin');
  if(node.dataset.stableAvatar===key&&(node.dataset.stableAvatarFailed===key||node.__wpAvatarPending||(!src&&node.querySelector('.wp-avatar-letter'))||node.querySelector('img')?.src===src))return;
  const sameUser=node.dataset.stableAvatarUser===identity;
  node.dataset.stableAvatar=key;node.dataset.stableAvatarUser=identity;
  const fallback=()=>{const image=new Image();image.alt=name;image.className='wp-avatar-ready';image.src=new URL('logo.jpg',document.baseURI).href;image.onerror=()=>{const span=document.createElement('span');span.className='wp-avatar-letter';span.textContent=letter;node.replaceChildren(span)};node.replaceChildren(image)};
  if(!src){node.dataset.stableAvatarFailed=key;fallback();return}
  const existing=node.querySelector('img');
  if(existing?.src===src&&existing.naturalWidth){existing.hidden=false;existing.classList.add('wp-avatar-ready');node.querySelectorAll('.wp-avatar-letter').forEach(n=>n.hidden=true);return}
  if(!sameUser)fallback();
  const image=new Image();image.alt=name;image.referrerPolicy='no-referrer';image.decoding='async';
  node.__wpAvatarPending=image;
  image.onload=()=>{if(node.dataset.stableAvatar!==key)return;node.__wpAvatarPending=null;image.classList.add('wp-avatar-ready');node.replaceChildren(image)};
  image.onerror=()=>{if(node.dataset.stableAvatar!==key)return;node.__wpAvatarPending=null;node.dataset.stableAvatarFailed=key;fallback()};
  image.src=src;
 };
 let finishing=false;
 window.WPFinishBoot=async()=>{
  if(finishing)return;finishing=true;
  if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
  await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]);
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  document.getElementById('wpSessionBoot')?.remove();
 };
})();
