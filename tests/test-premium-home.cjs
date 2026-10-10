const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const base='<!doctype html><html><head><meta name="theme-color" content="#f4f7fb"></head><body>'+
 '<header><div class="brand"><h1>WortWeg 370</h1></div></header><main>'+
 '<section id="dashboard" class="section active"></section>'+
 '<section id="study" class="section"></section><section id="topics" class="section"></section>'+
 '<section id="bank" class="section"></section><section id="review" class="section"></section>'+
 '<section id="stats" class="section"></section></main><div class="bottom"></div></body></html>';
const settings=fs.readFileSync('settings.js','utf8');
const grammar=fs.readFileSync('grammar.js','utf8');
const css=fs.readFileSync('home-premium.css','utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
function boot(order){
 const dom=new JSDOM(base,{url:'https://eric9435.github.io/wortweg-370/',
  runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};
 w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.WortWeg={navigate:id=>{
  for(const section of w.document.querySelectorAll('.section'))section.classList.toggle('active',section.id===id);
 }};
 // Do not require real audio devices for layout smoke tests.
 w.AudioContext=class {
  constructor(){this.state='suspended';this.currentTime=0;this.destination={};}
  createGain(){return {gain:{setValueAtTime(){}},connect(){}}}
  resume(){this.state='suspended';return Promise.resolve()}
 };
 for(const js of order)w.eval(js==='grammar'?grammar:settings);
 return {dom,w};
}
(async()=>{
 for(const order of [['settings','grammar'],['grammar','settings']]){
  const {dom,w}=boot(order);
  await tick();
  const menu=w.document.querySelector('#dashboard .ww-menu-options');
  const grammarButton=w.document.getElementById('wg-grammar-launch');
  const start=menu.querySelector('.ww-menu-primary');
  assert.ok(grammarButton,'Grammar navigation exists for '+order.join(' → '));
  assert.equal(grammarButton.parentElement,menu,'Grammar is grouped with all Home actions for '+order.join(' → '));
  assert.equal(grammarButton.previousElementSibling,start,'Grammar follows Start Learning rather than floating outside the menu');
  assert.equal(w.document.querySelectorAll('#wg-grammar-launch').length,1,'No duplicate grammar shortcut');
  assert.ok(grammarButton.querySelector('.ww-grammar-label strong')?.textContent.includes('Grammar Academy'));
  assert.ok(grammarButton.querySelector('.ww-menu-icon'),'Grammar matches the standard icon/card hierarchy');
  grammarButton.click();
  assert.equal(w.document.getElementById('wg-academy').hidden,false,'Grammar button opens the functional Academy');
  w.WortWegGrammar.open();
  assert.equal(w.document.getElementById('wg-academy').hidden,false,'Existing grammar API is intact');
  dom.window.close();
 }
 assert.match(css,/ww-donut-hero/,'Existing double donut has updated spacing');
 assert.match(css,/ww-home-milestone/,'Milestone has a distinct visual treatment');
 assert.match(css,/ww-grammar-menu-card/,'Grammar button uses the same grouped nav style');
 assert.match(css,/@media\(max-width:650px\)/,'Compact phone layout is provided');
 assert.match(css,/data-mode=dark/,'Dark mode remains supported');
 assert.match(css,/prefers-reduced-motion:reduce/,'Reduced motion respected');
 assert.match(fs.readFileSync('settings.js','utf8'),/home-premium\.css/,'Web dynamically loads new stylesheet');
 assert.match(fs.readFileSync('mobile/scripts/prepare.mjs','utf8'),/home-premium\.css/,'Offline APK bundles new stylesheet');
 assert.match(fs.readFileSync('sw.js','utf8'),/'\.\/home-premium\.css'/,'PWA precaches new Home stylesheet');
 assert.match(fs.readFileSync('sw.js','utf8'),/'home-premium\.css'/,'New stylesheet has network-first refresh');
 console.log('PASS: iOS Home grouped Grammar card in both load orders, working Grammar navigation, mobile/dark CSS, offline assets.');
})().catch(error=>{console.error(error);process.exitCode=1});
