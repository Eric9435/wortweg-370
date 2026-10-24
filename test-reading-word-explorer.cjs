/* Word Explorer regression: hover, content accuracy, keyboard, detail and audio */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const file=p=>fs.readFileSync(p,'utf8');
for(const p of ['reading-word-explorer.js','reading-studio.js'])new Function(file(p));
const utterances=[];
const dom=new JSDOM(file('index.html'),{
 url:'https://eric9435.github.io/wortweg-370/index.html',
 runScripts:'dangerously',
 beforeParse(win){
  win.structuredClone=structuredClone;
  win.scrollTo=()=>{};
  win.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  win.speechSynthesis={getVoices(){return[{lang:'de-DE'}]},cancel(){},pause(){},resume(){},speak(u){utterances.push(u)}};
 }
});
const w=dom.window;
for(const p of ['topic-reading-seeds-1.js','topic-reading-seeds-2.js','topic-reading-seeds-3.js','topic-reading-seeds-4.js','topic-reading-engine.js','reading-studio-topics-01-12.js','reading-studio-topics-13-24.js','topic-lessons.js','reading-studio.js','reading-word-explorer.js'])w.eval(file(p));
assert(w.WortWegReadingStudio.open(1),'Full-screen reader opens');
const word=w.document.querySelector('.wwr-de .wwr-word');
assert(word,'German words exist');
assert.equal(word.textContent,'Mein');
assert.equal(word.getAttribute('role'),'button');
assert.equal(word.tabIndex,0);
assert(w.WortWegWordExplorer.dictionarySize()>1000,'Existing German dictionary is indexed');
const me=new w.MouseEvent('pointerover',{bubbles:true});
word.dispatchEvent(me);
const tip=w.document.querySelector('.wwx-tip');
assert(tip&&!tip.hidden,'Hover tooltip shown immediately');
assert.match(tip.textContent,/my/i,'English meaning in tooltip');
assert.match(tip.textContent,/ကျွန်တော်/,'Myanmar meaning in tooltip');
word.click();
const detail=w.document.querySelector('.wwx-card');
assert(detail&&!detail.hidden,'Click opens full word detail');
assert.match(detail.textContent,/German example from this passage/);
assert.match(detail.textContent,/English meaning/);
assert.match(detail.textContent,/မြန်မာ/);
assert.match(detail.textContent,/Article \/ word form|Grammar and usage|English paragraph context/);
const player=w.document.querySelector('.wwr-play');
assert.match(player.textContent,/Play German/,'Click on a word does not trigger sentence narration');
detail.querySelector('.wwx-listen').click();
assert.equal(utterances.length,1,'Word audio fires once');
assert.equal(utterances[0].lang,'de-DE','German only, not English or Myanmar');
detail.querySelector('button[aria-label="Close word detail"]').click();
assert(detail.hidden,'Close button hides word card');
assert.equal(w.WortWegWordExplorer.lookup('und').en,'and');
assert.equal(w.WortWegWordExplorer.lookup('der Name').article,'der');
const missing=w.WortWegWordExplorer.lookup('xyznotaword');
assert.equal(missing.confidence,'missing','Unknown words never get made-up definitions');
const other=w.document.querySelectorAll('.wwr-de .wwr-word')[1];
other.focus();other.dispatchEvent(new w.KeyboardEvent('keydown',{bubbles:true,key:'Enter'}));
assert.equal(detail.hidden,false,'Keyboard Enter opens word detail');
w.document.querySelector('.wwd-not-real');
detail.querySelector('button[aria-label="Close word detail"]').click();
w.WortWegReadingStudio.close();
assert.equal(w.document.querySelector('.wwx-tip'),null,'Tooltip cleaned after closing');
assert.equal(w.document.querySelector('.wwx-card'),null,'Detail card cleaned after closing');
dom.window.close();
console.log('PASS: dictionary indexing, instant English/Myanmar tooltip, full example/grammar card, German-only audio and keyboard/touch-compatible click.');
