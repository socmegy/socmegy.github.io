const CACHE='watermark-pro-shell-v156-'+new URL('./',self.location.href).pathname;
const BASE=new URL('./',self.location.href).pathname;
const SHELL=['','index.html','control.html','manifest.webmanifest','logo.jpg','bg.jpg','pwa.js','avatar-render.js','wmark-shared.js','release-ui.js','control-release.js','request-layout.css','export-assets.js'].map(p=>BASE+p);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url))))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.endsWith('-'+BASE)&&k!==CACHE).map(k=>caches.delete(k))))));
// Only shell files: API, uploads, blobs and processed media bypass the worker.
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 const isPage=req.mode==='navigate'&&['','index.html','profil','pelan','sokongan','tetapan'].includes(url.pathname.slice(BASE.length).replace(/\/$/,''));
 if(!isPage&&!SHELL.includes(url.pathname))return;
 event.respondWith((async()=>{
  try{const response=await fetch(req);if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)));}return response;}
  catch(error){const cached=await caches.match(req)||(isPage?await caches.match(BASE):null);if(cached)return cached;throw error;}
 })());
});
