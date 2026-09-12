// Generate a static publish directory, including real route directories for
// hosts such as GitHub Pages that cannot interpret _redirects.
const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'publish');
fs.writeFileSync(path.join(__dirname,'export-assets.js'),'window.WPExportAssets='+JSON.stringify(Object.fromEntries(['bg.jpg','logo.jpg'].map(name=>[name,'data:image/jpeg;base64,'+fs.readFileSync(path.join(__dirname,name)).toString('base64')])))+';');
const files=['request-layout.css','index.html','control.html','avatar-render.js','release-ui.js','control-release.js','wmark-shared.js','pwa.js','sw.js','manifest.webmanifest','logo.jpg','bg.jpg','qr.jpg','threads.svg'];
for(const file of files)if(!fs.existsSync(path.join(__dirname,file)))throw new Error('Missing publish asset: '+file);
fs.mkdirSync(out,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(__dirname,file),path.join(out,file));
fs.copyFileSync(path.join(__dirname,'export-assets.js'),path.join(out,'export-assets.js'));
for(const name of ['app-icon-192.png','app-icon-512.png']){const source=path.join(__dirname,name);fs.copyFileSync(source,path.join(out,name));}
const controlDir=path.join(out,'control');fs.mkdirSync(controlDir,{recursive:true});fs.writeFileSync(path.join(controlDir,'index.html'),fs.readFileSync(path.join(__dirname,'control.html'),'utf8').replace('<head>','<head><base href="../">'));
for(const route of ['profil','pelan','tetapan','sokongan']){
 for(const root of [out,__dirname]){const dir=path.join(root,route);fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(path.join(__dirname,'index.html'),path.join(dir,'index.html'));}
}
console.log('Built publish/ — upload its contents into /watermark-pro/. Static route directories support refresh without .html URLs.');
