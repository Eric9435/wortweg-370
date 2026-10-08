// Verify a staged website package without publishing anything.
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join,resolve,dirname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'.migration-preview','website');
const required=[
 'index.html','manifest.webmanifest','icon.svg','sw.js',
 'cloud.js','account.css','audio.js','audio.css',
 'settings.js','settings.css','enterprise.js','enterprise.css','.nojekyll',
 'vendor/mespeak/mespeak.js','vendor/mespeak/mespeak_config.json','vendor/mespeak/de.json'
];
async function exists(name){
 try{await stat(join(out,name));return true;}catch{return false;}
}
for(const file of required)assert(await exists(file),'Website asset missing: '+file);

async function walk(dir,prefix=''){
 let list=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=[prefix,entry.name].filter(Boolean).join('/');
  if(entry.isDirectory())list.push(...await walk(join(dir,entry.name),path));
  else {assert(entry.isFile(),'Unexpected symlink or non-file in website output');list.push(path);}
 }
 return list;
}
const packaged=await walk(out);
const validRoot=new Set(required.filter(x=>!x.startsWith('vendor/')));
for(const path of packaged){
 assert(validRoot.has(path)||path.startsWith('vendor/mespeak/'),'Unexpected source or secret file in published site: '+path);
 assert(!/\.(?:jks|keystore|pem|key|env)$/i.test(path),'Potential secret file exported: '+path);
}
const clean=p=>p.split('#')[0].split('?')[0].replace(/^\.\//,'');
const check=async p=>{
 if(!p||p==='.'||p==='/'||p==='./')return;
 if(/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(p))return;
 const local=clean(p);
 assert(!local.includes('..'),'Disallowed parent path: '+p);
 assert(await exists(local),'Broken relative site reference: '+p);
};
const html=await readFile(join(out,'index.html'),'utf8');
for(const tag of html.matchAll(/<(?:link|script|img)\b[^>]*>/gi)){
 for(const item of tag[0].matchAll(/\b(?:src|href)=["']([^"']+)["']/gi))await check(item[1]);
}
const sw=await readFile(join(out,'sw.js'),'utf8');
const list=sw.match(/const ASSETS=\[([^\]]+)\]/);
assert(list,'Service-worker offline assets missing');
for(const item of list[1].matchAll(/["']([^"']+)["']/g))await check(item[1]);
const manifest=JSON.parse(await readFile(join(out,'manifest.webmanifest'),'utf8'));
await check(manifest.start_url);
for(const icon of manifest.icons||[])await check(icon.src);
assert(html.includes('WortWeg'),'Website entry point not detected');
console.log('PASS: website assets, manifest, offline cache, and local references');
console.log('PASS: output excludes Android/iOS source, .git history, CI, private keys and development files');
console.log('NOTICE: deployed HTML/JS and Firebase client identifiers will remain publicly inspectable.');
