/* WortWeg 370 · vocabulary handwriting/typing repetition workspace. Local, profile-isolated data. */
(()=>{'use strict';
const node=document.getElementById('data');if(!node)return;
let json;try{json=JSON.parse(node.textContent)}catch{return}
const catalog=[...(json.bank||[]).map(w=>({id:'b:'+w.id,...w})),...(json.curated||[]).map(w=>({id:'c:'+w.de.toLocaleLowerCase(),...w}))];
const seen=new Set(catalog.map(x=>x.id));
function allWords(){const list=catalog.slice();const pack=window.WortWegLive?.getPack?.();for(const lesson of pack?.lessons||[])for(const w of lesson.words||[]){const id='l:'+w.id;if(!seen.has(id)){list.push({id,...w,level:lesson.level});}}return list.filter(w=>typeof w.de==='string'&&w.de.trim());}
const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='./vocab-writing.css';document.head.append(stylesheet);
const root=document.createElement('section');root.className='ww-write-screen';root.hidden=true;root.setAttribute('aria-label','Vocabulary writing practice');document.body.append(root);
let words=[],position=0,sessionCorrect=0,sessionAttempts=0,sessionKey='',query='',countWanted=5;
const statusTypes=[['learning','Still learning'],['review','Need more review'],['average','Average'],['remembered','Fully remembered']];
function profile(){const uid=window.WortWegAccountSnapshot?.uid;return uid&&/^[\w-]{1,128}$/.test(uid)?uid:'guest';}
function key(){return 'wortweg370-writing-v1-'+profile();}
function load(){try{const v=JSON.parse(localStorage.getItem(key())||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {};}}
let records=load();
function persist(){try{localStorage.setItem(key(),JSON.stringify(records));}catch{}}
function rowFor(w){return records[w.id]||{repetitions:0,correct:0,status:'learning',history:[]};}
function safeText(tag,content,cls){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e}
function button(text,cb,cls){const b=safeText('button',text,cls||'');b.type='button';b.addEventListener('click',cb);return b;}
function add(parent,...els){parent.append(...els);return parent;}
function pronounce(word){if(window.WortWegAudio?.speak){window.WortWegAudio.speak(word);return;}if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(word);u.lang='de-DE';speechSynthesis.speak(u);}}
function normalize(s){return String(s).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE');}
function shell(){root.replaceChildren();const header=add(safeText('header',undefined,'ww-write-header'),safeText('h1','Vocabulary Writing'),button('✕ Close',close,'ww-write-close'));root.append(header);}
function open(){if(!root.hidden)return;root.hidden=false;document.body.classList.add('ww-writing-open');renderSetup();window.location.hash='writing';}
function close(){root.hidden=true;document.body.classList.remove('ww-writing-open');if(location.hash==='#writing')history.replaceState(null,'',location.pathname+location.search);}
function launch(){if(document.getElementById('ww-writing-launch'))return;const home=document.querySelector('.ww-menu-options')||document.querySelector('#dashboard')||document.querySelector('main');if(!home)return;const b=button('✍️ Vocabulary Writing',open,'ww-writing-launch');b.id='ww-writing-launch';home.prepend(b);}
function renderSetup(){sessionKey='';shell();const info=add(safeText('div',undefined,'ww-write-panel'),safeText('h2','Choose words to memorize'),safeText('p','Minimum 5 words per writing session. No maximum repetition count. Each correctly typed German word increases its repetition record.'));root.append(info);
const controls=safeText('div',undefined,'ww-write-controls');const search=safeText('input');search.type='search';search.placeholder='Search German, English or Myanmar words';search.value=query;search.setAttribute('aria-label','Search vocabulary');search.addEventListener('input',()=>{query=search.value;listRender();});controls.append(search);
const numeric=safeText('input');numeric.type='number';numeric.min='5';numeric.step='1';numeric.value=countWanted;numeric.setAttribute('aria-label','Number of words in session');numeric.addEventListener('change',()=>{countWanted=Math.max(5,Math.floor(Number(numeric.value)||5));numeric.value=countWanted;listRender();});controls.append(safeText('label','Words per session (minimum 5)'),numeric);info.append(controls);
const stats=safeText('div',undefined,'ww-write-stats');info.append(stats);
const list=safeText('div',undefined,'ww-write-list');info.append(list);
function listRender(){const matching=allWords().filter(w=>[w.de,w.en,w.my,w.mm].some(t=>String(t||'').toLocaleLowerCase().includes(query.toLocaleLowerCase())));const pool=matching.slice(0,Math.max(5,countWanted));stats.textContent=Object.keys(records).length+' words tracked · '+Object.values(records).reduce((a,b)=>a+(Number(b.repetitions)||0),0)+' repetitions saved · '+matching.length+' matching words';list.replaceChildren();for(const w of pool.slice(0,30)){const r=rowFor(w);const el=safeText('div',undefined,'ww-write-item');add(el,safeText('strong',w.de),safeText('small',(w.en||'')+' · '+r.repetitions+' correct repetitions · '+(statusTypes.find(x=>x[0]===r.status)?.[1]||'Still learning')));list.append(el);}const old=document.getElementById('ww-write-start');if(old)old.remove();const start=button('Start '+Math.min(pool.length,countWanted)+' words',()=>{if(pool.length<5)return;words=pool.slice(0,countWanted);position=0;sessionCorrect=0;sessionAttempts=0;sessionKey=profile();renderWord();},'ww-write-primary');start.id='ww-write-start';start.disabled=pool.length<5;info.append(start);if(pool.length<5)info.append(safeText('p','At least five matching vocabulary words are required.','ww-write-warning'));}
listRender();}
function renderWord(){if(profile()!==sessionKey){words=[];return renderSetup();}shell();if(position>=words.length){const done=add(safeText('div',undefined,'ww-write-panel'),safeText('h2','Writing session finished'),safeText('p',sessionCorrect+' correct repetitions out of '+sessionAttempts+' attempts across '+words.length+' words.'));done.append(button('Start another session',renderSetup,'ww-write-primary'));root.append(done);return;}
const w=words[position],record=rowFor(w);
const p=add(safeText('article',undefined,'ww-write-panel'),safeText('p','Word '+(position+1)+' / '+words.length),safeText('h2',(w.en||'Translation')+' · '+(w.my||w.mm||'')),safeText('p','Type the German word from memory, then check it. Repeat as often as you like.'));root.append(p);
p.append(button('🔊 Hear German word',()=>pronounce(w.de)));
const field=safeText('input');field.type='text';field.autocomplete='off';field.autocapitalize='off';field.spellcheck=false;field.placeholder='Write the German word from memory';field.setAttribute('aria-label','Write the German vocabulary word');p.append(field);
const result=safeText('p',undefined,'ww-write-result');p.append(result);
const counter=safeText('p','Correct repetitions: '+record.repetitions+' · Attempts: '+(record.attempts||0));p.append(counter);
const select=safeText('select');select.setAttribute('aria-label','How well do you remember this word?');for(const [id,label] of statusTypes){const opt=safeText('option',label);opt.value=id;select.append(opt);}select.value=record.status;select.addEventListener('change',()=>{const r=rowFor(w);r.status=select.value;records[w.id]=r;persist();});p.append(add(safeText('label',undefined,'ww-write-memory'),safeText('span','Memory confidence'),select));
const answer=safeText('p',undefined,'ww-write-reveal');p.append(answer);
let checked=false;
p.append(button('Check writing',()=>{const typed=field.value.trim();if(!typed)return;sessionAttempts++;const accurate=normalize(typed)===normalize(w.de);const r=rowFor(w);r.attempts=(r.attempts||0)+1;if(accurate){r.correct=(r.correct||0)+1;r.repetitions=(r.repetitions||0)+1;sessionCorrect++;}else{r.incorrect=(r.incorrect||0)+1;}r.lastPracticed=new Date().toISOString();r.status=select.value;r.history=(r.history||[]).slice(-99);r.history.push({correct:accurate,at:r.lastPracticed});records[w.id]=r;persist();result.textContent=accurate?'✓ Correct! Writing repetition saved.':'✕ Not quite. Try again, or reveal the answer.';counter.textContent='Correct repetitions: '+r.repetitions+' · Attempts: '+r.attempts;field.value='';field.focus();checked=true;},'ww-write-primary'));
p.append(button('Show spelling',()=>{answer.textContent=w.de;},'ww-write-secondary'));
p.append(button('Next word →',()=>{position++;renderWord();},'ww-write-secondary'));
p.append(button('↻ Repeat this word',()=>{field.focus();},'ww-write-secondary'));
p.append(button('Back to word selection',renderSetup,'ww-write-secondary'));
field.focus();}
new MutationObserver(launch).observe(document.body,{childList:true,subtree:true});launch();
window.addEventListener('wortweg:account',()=>{records=load();words=[];if(!root.hidden)renderSetup();});
window.addEventListener('hashchange',()=>{if(location.hash==='#writing'&&root.hidden)open();else if(location.hash!=='#writing'&&!root.hidden)close();});
if(location.hash==='#writing')open();
window.WortWegWriting={open,getSummary:()=>({wordCount:Object.keys(records).length,correctRepetitions:Object.values(records).reduce((n,r)=>n+(r.repetitions||0),0)})};
})();