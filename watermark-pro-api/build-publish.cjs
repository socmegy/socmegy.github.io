// Generate a static publish directory, including real route directories for
// hosts such as GitHub Pages that cannot interpret _redirects.
const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'publish');
const files=['index.html','control.html','avatar-render.js','release-ui.js','control-release.js','wmark-shared.js','pwa.js','sw.js','manifest.webmanifest','logo.jpg','bg.jpg','qr.jpg','threads.svg'];
for(const file of files)if(!fs.existsSync(path.join(__dirname,file)))throw new Error('Missing publish asset: '+file);
fs.mkdirSync(out,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(__dirname,file),path.join(out,file));
for(const route of ['profil','pelan','tetapan','sokongan']){
 const dir=path.join(out,route);fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(path.join(__dirname,'index.html'),path.join(dir,'index.html'));
}
console.log('Built publish/ — upload its contents into /watermark-pro/. Static route directories support refresh without .html URLs.');
