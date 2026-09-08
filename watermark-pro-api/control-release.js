(()=>{
 window.WPControlExportError=error=>{let status=document.getElementById('controlExportStatus');if(!status){status=document.createElement('p');status.id='controlExportStatus';status.setAttribute('role','status');document.getElementById('downloadTopUsers')?.after(status)}status.textContent=error?.message||'PNG tidak dapat disediakan. Cuba semula melalui laman HTTP/HTTPS.'};
 const layout=document.createElement('style');layout.textContent='.sidebar .nav{align-content:start!important;grid-auto-rows:44px!important;gap:5px!important}.sidebar .navbtn{height:44px!important;min-height:44px!important}';document.head.append(layout);
 const section=document.createElement('section');section.id='resetPasswordSection';section.hidden=true;section.className='modal-body';
 section.innerHTML='<h3>Tetapkan semula kata laluan</h3><form id="resetPasswordForm" novalidate><div class="field"><label for="resetUserPassword">Kata laluan baharu</label><input id="resetUserPassword" type="password" autocomplete="new-password"></div><p id="resetUserPasswordStatus" role="status" aria-live="polite"></p><button id="resetUserPasswordBtn" class="btn" type="submit">Simpan kata laluan baharu</button></form>';
 document.querySelector('#userModal .modal-shell').append(section);
 const style=document.createElement('style');style.textContent='.identity-copy strong{display:inline-flex;align-items:center;gap:3px}.control-wmark{width:13px;height:auto;flex:0 0 13px}.password-toggle{margin-top:6px;font-size:12px}';document.head.append(style);
 document.querySelectorAll('input[type="password"]').forEach(input=>{const b=document.createElement('button');b.type='button';b.className='btn small password-toggle';b.textContent='Papar kata laluan';b.setAttribute('aria-pressed','false');input.after(b);b.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';b.textContent=show?'Sorok kata laluan':'Papar kata laluan';b.setAttribute('aria-pressed',String(show))}});
 const b=document.getElementById('resetUserPasswordBtn');if(!b)return;document.getElementById('resetPasswordForm').onsubmit=async event=>{
  event.preventDefault();
  const id=document.getElementById('userId').value,input=document.getElementById('resetUserPassword'),status=document.getElementById('resetUserPasswordStatus');
  if(!id)return;
  b.disabled=true;status.textContent='Menyimpan…';
  try{const r=await window.WPControlCloudflare.resetPassword(id,input.value);input.value='';input.type='password';status.textContent=r.message;}catch(e){status.textContent=e.message||'Gagal menyimpan.';}finally{b.disabled=false;}
 };
})();
