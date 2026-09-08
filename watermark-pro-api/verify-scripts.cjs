const fs=require('node:fs'),vm=require('node:vm');
let bad=0;
for(const file of ['index.html','control.html']){
 const html=fs.readFileSync(file,'utf8');let count=0;
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/src=|application\/ld\+json|application\/x-watermark-disabled/.test(m[1]))continue;
  count++;try{new vm.Script(m[2],{filename:file});}catch(e){bad++;console.error(file,'line',html.slice(0,m.index).split('\n').length,e.message);}
 }
 console.log(file,count,'inline scripts checked');
}
for(const file of ['wmark-shared.js','release-ui.js','control-release.js','pwa.js','sw.js','local-preview-server.js']){try{new vm.Script(fs.readFileSync(file,'utf8'));console.log(file,'OK')}catch(e){bad++;console.error(file,e.message)}}
process.exitCode=bad?1:0;
