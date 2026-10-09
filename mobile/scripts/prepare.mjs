import {readFile, writeFile, cp, mkdir, rm} from 'node:fs/promises';
import {build} from 'esbuild';
const root = new URL('../../',import.meta.url);
const out = new URL('../www/',import.meta.url);
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for (const file of ['settings.css','settings-navigation.css','settings-navigation.js','ios-polish.css','ios-polish.js','home-premium.css','seen-words.css','seen-words.js','vocab-writing.css','vocab-writing.js','grammar.js','grammar-deep.js','grammar-expanded.js','grammar-more-a1-a2.js','grammar-more-b1.js','grammar-more-b2.js','grammar-more-c1.js','grammar.css','topic-lessons.css','topic-lessons.js','audio.css','account.css','app-updates.css','live-content.css','live-content.js','content','icon.svg','vendor/mespeak']) {
  await cp(new URL(file,root),new URL(file,out),{recursive:true});
}
function replace(source,before,after) {
  if (!source.includes(before)) throw Error('Native packaging marker missing: '+before.slice(0,80));
  return source.replace(before,after);
}
let html=await readFile(new URL('index.html',root),'utf8');
html=html.replace(/<meta[^>]*name="viewport"[^>]*>/g,'');
html=replace(html,'</head>','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}.mobile-note{font-size:.85rem;margin:6px 0}.mobile-status{color:var(--muted)}</style><script>window.WortWegNative={bundledSpeech:true};</script></head>');
// Native assets load locally; neither network navigation nor the website's SW is needed.
html=replace(html,"if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});",'');
html=replace(html,'<script type="module" src="./cloud.js?v=14"></script>','<script src="./native.js"></script>');
html=replace(html,'<script src="./audio.js"></script>','<script src="./vendor/mespeak/mespeak.js"></script><script src="./audio.js"></script>');
html=html.replace(/<link[^>]+rel="manifest"[^>]*>/g,'');
await writeFile(new URL('index.html',out),html);
let audio=await readFile(new URL('audio.js',root),'utf8');
audio=replace(audio,"const CACHE =", "const trace=message=>{(window.WortWegNative.audioTrace||=[]).push(message);};\n  const CACHE =");
audio=replace(audio,'async function engine() {',"async function engine() {trace('engine requested');");
audio=replace(audio,'async function offlineSpeak(text, id) {',"async function offlineSpeak(text, id) {trace('offline speech requested');");
audio=replace(audio,'function speak(text) {',"function speak(text) {trace('speaker requested');");
audio=replace(audio,"if (!('caches' in window)) return false;","if (window.WortWegNative?.bundledSpeech) return true;\n    if (!('caches' in window)) return false;");
audio=replace(audio,'if (downloadPromise) {',"if (window.WortWegNative?.bundledSpeech) {setState({state:'ready',message:'German speech included · ready offline.',progress:100});return true;}\n    if (downloadPromise) {");
audio=replace(audio,'const cache = await caches.open(CACHE);\n      const blobs = [];','const cache = window.WortWegNative?.bundledSpeech ? null : await caches.open(CACHE);\n      const blobs = [];');
audio=replace(audio,'const blobs = [];\n      for (const asset of ASSETS) {',"const blobs = [];\n      for (const asset of window.WortWegNative?.bundledSpeech ? [] : ASSETS) {");
audio=replace(audio,'const scriptUrl = URL.createObjectURL(blobs[0]);',"const scriptUrl = window.WortWegNative?.bundledSpeech ? url(ASSETS[0].path) : URL.createObjectURL(blobs[0]);");
audio=replace(audio,'const configUrl = URL.createObjectURL(blobs[1]), voiceUrl = URL.createObjectURL(blobs[2]);',"const configUrl = window.WortWegNative?.bundledSpeech ? url(ASSETS[1].path) : URL.createObjectURL(blobs[1]), voiceUrl = window.WortWegNative?.bundledSpeech ? url(ASSETS[2].path) : URL.createObjectURL(blobs[2]);");
await writeFile(new URL('audio.js',out),audio);
let settings=await readFile(new URL('settings.js',root),'utf8');
settings=settings.replaceAll('in this browser','on this device').replaceAll('browser storage','device storage');
settings=replace(settings,'About 3 MB. Saved on this device for offline pronunciation, even if your phone has no German voice.','Included with the app. German pronunciation works offline, even if your phone has no German voice.');
settings=settings.replaceAll('German speech downloaded','German speech included');
settings=replace(settings,'function tick(){','function tick(){if(window.WortWegNative)return;');
settings=replace(settings,'media.addEventListener(\'change\',apply);',"window.WortWegSettings={get:()=>s,save};\nmedia.addEventListener('change',apply);");
await writeFile(new URL('settings.js',out),settings);
await build({entryPoints:['src/native.js'],bundle:true,outfile:'www/native.js',format:'iife',target:'es2022'});
console.log('Native offline bundle prepared; website sources unchanged.');
