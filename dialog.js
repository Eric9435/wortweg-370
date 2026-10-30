/* WortWeg 370 — independent A1/A2 Dialog Studio.
   Original WortWeg word-bank levels are the only source of study headwords.
   Keep existing A1 completion IDs/storage unchanged; isolate A2 completions. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const storageKey=level=>'ww-'+level.toLowerCase()+'-dialog-progress-v1';
const loadDone=level=>{try{const done=JSON.parse(localStorage.getItem(storageKey(level))||'{}');return done&&typeof done==='object'&&!Array.isArray(done)?done:{};}catch{return {};}};
const state={level:'A1',mode:'situations',collections:{},scenes:[],words:[],entries:[],filtered:[],selected:null,limit:120,done:loadDone('A1'),playing:false};
const save=()=>{try{localStorage.setItem(storageKey(state.level),JSON.stringify(state.done));}catch{}};
const make=(tag,cl,text)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=text;return e;};
const norm=v=>String(v||'').trim().toLocaleLowerCase('de');
const escaped=v=>[...String(v)].map(c=>'\\^$.*+?()[]{}|'.includes(c)?'\\'+c:c).join('');
const wordForm=de=>String(de||'').replace(/^(der|die|das|ein|eine)\s+/i,'').trim();
const hasPhrase=(text,term)=>{if(term.length<3)return false;try{return new RegExp('(^|[^\\p{L}\\p{N}])'+escaped(term)+'(?=$|[^\\p{L}\\p{N}])','iu').test(text);}catch{return false;}};
function stopSpeech(){state.playing=false;if('speechSynthesis' in window)window.speechSynthesis.cancel();}
function speak(line,onDone){if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){state.playing=false;return;}
 const u=new SpeechSynthesisUtterance(line);u.lang='de-DE';u.rate=$('dialogSlow').checked?0.78:1;u.pitch=1;
 u.onend=()=>{if(state.playing&&onDone)onDone();};
 u.onerror=()=>{state.playing=false;};
 window.speechSynthesis.speak(u);
}
function playAll(){const current=state.selected;if(!current)return;stopSpeech();state.playing=true;let i=0;
 const next=()=>{if(!state.playing||state.selected!==current)return;if(i>=current.turns.length){state.playing=false;return;}speak(current.turns[i++][0],next);};next();
}
function wordScene(entry){const term=String(entry.de||'').trim(),meaning=String(entry.en||'').trim();
 return {id:'word:'+entry.key,title:term,desc:meaning||'Vocabulary practice',speakers:['Person A','Person B'],entry,
 turns:[['Entschuldigung, was bedeutet „'+term+'“?','Excuse me, what does “'+term+'” mean?'],
 ['„'+term+'“ steht in unserer Wortliste.','“'+term+'” is in our word list.'],
 ['Kannst du das Wort bitte wiederholen?','Could you please repeat the word?'],
 ['Ja, natürlich: „'+term+'“.','Yes, of course: “'+term+'”.']]};
}
function findInScene(scene){const text=scene.turns.map(t=>t[0]).join(' ');
 return state.words.filter(w=>hasPhrase(text,wordForm(w.de))).slice(0,70);
}
function highlight(node,text,words){const terms=[...new Set(words.map(w=>wordForm(w.de)).filter(v=>v.length>=3))].sort((a,b)=>b.length-a.length).slice(0,55);
 if(!terms.length){node.textContent=text;return;}
 let regex;try{regex=new RegExp('(^|[^\\p{L}\\p{N}])('+terms.map(escaped).join('|')+')(?=$|[^\\p{L}\\p{N}])','giu');}catch{node.textContent=text;return;}
 let pos=0;for(const match of text.matchAll(regex)){const start=match.index+match[1].length;if(start<pos)continue;node.append(document.createTextNode(text.slice(pos,start)));node.append(make('mark','',text.slice(start,start+match[2].length)));pos=start+match[2].length;}node.append(document.createTextNode(text.slice(pos)));
}
function getCurrentList(){return state.mode==='situations'?state.scenes:state.entries;}
function refreshCount(){$('dialogCompleted').textContent=Object.keys(state.done).filter(k=>state.done[k]).length.toLocaleString('en-US');}
function filter(){const q=norm($('dialogSearch').value),only=$('dialogIncomplete').checked;
 state.filtered=getCurrentList().filter(s=>(!only||!state.done[s.id])&&(!q||[s.title,s.desc,...s.turns.flat(),...(s.words||[]).map(w=>w.en||'')].some(x=>norm(x).includes(q))));
 state.limit=120;if(!state.filtered.some(s=>s.id===state.selected?.id))state.selected=state.filtered[0]||null;
 renderList();renderReader();
}
function renderList(){const root=$('dialogList');root.replaceChildren();$('dialogListTitle').textContent=state.mode==='situations'?'Everyday dialogues':state.level+' word dialogues';
 $('dialogListCount').textContent=state.filtered.length.toLocaleString('en-US')+' available';
 if(!state.filtered.length){root.append(make('p','dialog-noresults','No matching dialogues. Change the search or filter.'));return;}
 const fragment=document.createDocumentFragment();
 state.filtered.slice(0,state.limit).forEach((s,index)=>{const btn=make('button','dialog-item');btn.type='button';btn.setAttribute('role','listitem');btn.setAttribute('aria-current',String(state.selected?.id===s.id));
 btn.append(make('span','dialog-item-number',String(index+1).padStart(2,'0')));
 const copy=make('span','dialog-item-copy');copy.append(make('strong','',s.title),make('small','',s.desc));btn.append(copy);
 if(state.done[s.id])btn.append(make('span','dialog-done','✓'));
 btn.addEventListener('click',()=>{stopSpeech();state.selected=s;renderList();renderReader();});fragment.append(btn);});
 root.append(fragment);
 if(state.filtered.length>state.limit){const more=make('button','dialog-item','Show more ('+(state.filtered.length-state.limit)+' remaining)');more.type='button';more.addEventListener('click',()=>{state.limit+=120;renderList();});root.append(more);}
}
function renderReader(){const scene=state.selected,content=$('dialogContent'),empty=$('dialogEmpty');
 if(!scene){content.hidden=true;empty.hidden=false;empty.textContent='No dialogue selected. Try another search.';return;}
 content.hidden=false;empty.hidden=true;$('dialogTitle').textContent=scene.title;$('dialogDescription').textContent=scene.desc;
 $('dialogLabel').textContent=state.level+(state.mode==='situations'?' · Everyday conversation':' · Source word dialogue');
 const matched=scene.entry?[scene.entry]:scene.words||[];
 const turns=$('dialogTurns');turns.replaceChildren();
 scene.turns.forEach((t,i)=>{const row=make('article','turn'),avatar=make('span','turn-avatar',i%2?'B':'A'),main=make('div','turn-main');
 main.append(make('span','turn-speaker',scene.speakers[i%2]));const de=make('div','turn-de');de.lang='de';
 const concealed=$('dialogRoleplay').checked&&i%2===1;
 if(concealed)de.textContent='Your turn — say the German response aloud';else highlight(de,t[0],matched);
 main.append(de);
 if($('dialogShowEnglish').checked&&!concealed){const en=make('div','turn-en',t[1]);en.lang='en';main.append(en);}
 if(concealed){const reveal=make('button','secondary-btn roleplay-reveal','Reveal response');reveal.type='button';reveal.setAttribute('aria-label','Reveal the German response');
 reveal.addEventListener('click',()=>{de.replaceChildren();highlight(de,t[0],matched);if($('dialogShowEnglish').checked){const en=make('div','turn-en',t[1]);en.lang='en';main.insertBefore(en,reveal);}reveal.remove();});main.append(reveal);}
 const audio=make('button','turn-audio','▶');audio.type='button';audio.title='Speak this German line';audio.setAttribute('aria-label','Speak: '+t[0]);
 audio.addEventListener('click',()=>{stopSpeech();speak(t[0]);});row.append(avatar,main,audio);turns.append(row);});
 const vocab=$('dialogVocab');vocab.replaceChildren();const dedup=new Set();let shown=0;
 for(const w of matched){const k=w.key||w.de;if(dedup.has(k))continue;dedup.add(k);const chip=make('div','vocab-chip');
 chip.append(make('strong','',w.de||''),make('small','',w.en||''));if($('dialogShowMyanmar').checked&&w.mm)chip.append(make('span','mm',w.mm));
 vocab.append(chip);shown++;if(shown===60)break;}
 $('dialogMatchedCount').textContent=scene.entry?'Exact '+state.level+' source record':shown+' matched '+state.level+' source words'+(matched.length>shown?' (first '+shown+')':'');
 if(!shown)vocab.append(make('span','dialog-noresults','No exact source words matched this scene. The conversation is available for speaking practice.'));
 const index=state.filtered.findIndex(s=>s.id===scene.id);$('dialogPrevious').disabled=index<=0;$('dialogNext').disabled=index<0||index>=state.filtered.length-1;
 $('dialogMark').textContent=state.done[scene.id]?'Completed ✓ — Undo':'Mark dialogue complete';$('dialogMark').setAttribute('aria-pressed',String(!!state.done[scene.id]));
}
function step(dir){const i=state.filtered.findIndex(s=>s.id===state.selected?.id);const next=state.filtered[i+dir];if(!next)return;
 stopSpeech();state.selected=next;if(i+dir>=state.limit)state.limit=i+dir+1;renderList();renderReader();}
function setLevel(level){
 if(!state.collections[level])return;
 stopSpeech();
 state.level=level;state.mode='situations';state.selected=null;state.done=loadDone(level);
 const c=state.collections[level];state.words=c.words;state.scenes=c.scenes;state.entries=c.entries;
 $('dialogCurrentLevel').textContent=level;
 $('dialogSubtitle').textContent='German conversations and practice from your actual '+level+' word list.';
 $('dialogSourceLevel').textContent=level;
 $('dialogWordCount').textContent=c.bankCount+' + '+c.nounCount+' source records';
 $('dialogSituationCount').textContent=String(c.scenes.length);
 $('dialogCoverage').textContent=String(c.entries.length);
 $('dialogWordsTab').textContent='All '+level+' Words';
 $('dialogVocabTitle').textContent='Words from your '+level+' list';
 $('dialogCompletedLabel').textContent=level+' dialogues completed';
 $('dialogSearch').value='';$('dialogIncomplete').checked=false;
 $('dialogEmpty').textContent='Select a '+level+' dialogue to begin speaking.';
 document.querySelectorAll('.dialog-levels button').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.level===level)));
 document.querySelectorAll('.dialog-tabs button').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.mode==='situations')));
 refreshCount();filter();
}
async function init(){const empty=$('dialogEmpty');try{
 const response=await fetch('./index.html',{cache:'default'});if(!response.ok)throw Error('Word Bank HTTP '+response.status);
 const html=await response.text(),doc=new DOMParser().parseFromString(html,'text/html'),node=doc.getElementById('data');
 if(!node)throw Error('Your embedded Word Bank could not be found');
 const original=JSON.parse(node.textContent);
 const originalBank=Array.isArray(original.bank)?original.bank:[];
 const expanded=Array.isArray(window.WortWegNounExpansion?.entries)?window.WortWegNounExpansion.entries:[];
 for(const level of ['A1','A2']){
  const bank=originalBank.filter(w=>w.level===level);
  const nouns=expanded.filter(w=>w.level===level);
  state.words=[...bank.map((w,i)=>({...w,key:'b:'+String(w.id??i),source:'Word Bank'})),...nouns.map((w,i)=>({...w,key:'n:'+String(w.id??i),source:'Noun Expansion'}))];
  const source=level==='A1'?window.WortWegA1Situations:window.WortWegA2Situations;
  if(!Array.isArray(source)||!source.length)throw Error(level+' authored dialogues could not load');
  const scenes=source.map(row=>{const scene={id:'scene:'+row[0],title:row[1],desc:row[2],speakers:row[3],turns:row[4]};scene.words=findInScene(scene);return scene;});
  state.collections[level]={words:state.words,scenes,entries:state.words.map(wordScene),bankCount:bank.length,nounCount:nouns.length};
 }
 const requestLevel=new URL(window.location.href).searchParams.get('level');
 setLevel(requestLevel==='A2'?'A2':'A1');
 }catch(err){empty.textContent='Could not load your WortWeg Word Bank: '+err.message+'. Please open WortWeg Home online once, then reopen Dialog.';}}
document.querySelectorAll('.dialog-levels button').forEach(btn=>btn.addEventListener('click',()=>{
 setLevel(btn.dataset.level);
 try{const url=new URL(window.location.href);url.searchParams.set('level',btn.dataset.level);history.replaceState(null,'',url.pathname+url.search);}catch{}
}));
document.querySelectorAll('.dialog-tabs button').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.mode===state.mode)return;stopSpeech();state.mode=btn.dataset.mode;state.selected=null;
 document.querySelectorAll('.dialog-tabs button').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===btn)));
 $('dialogSearch').value='';filter();}));
$('dialogSearch').addEventListener('input',filter);$('dialogIncomplete').addEventListener('change',filter);
$('dialogShowEnglish').addEventListener('change',renderReader);$('dialogShowMyanmar').addEventListener('change',renderReader);
$('dialogRoleplay').addEventListener('change',renderReader);
$('dialogSpeakAll').addEventListener('click',playAll);$('dialogStop').addEventListener('click',stopSpeech);
$('dialogMark').addEventListener('click',()=>{if(!state.selected)return;const id=state.selected.id;
 if(state.done[id])delete state.done[id];else state.done[id]=true;save();refreshCount();
 if($('dialogIncomplete').checked)filter();else{renderList();renderReader();}});
$('dialogPrevious').addEventListener('click',()=>step(-1));$('dialogNext').addEventListener('click',()=>step(1));
window.addEventListener('pagehide',stopSpeech);
window.WortWegDialog={getState:()=>({level:state.level,mode:state.mode,wordCount:state.words.length,situationCount:state.scenes.length,wordDialogCount:state.entries.length,completed:Object.keys(state.done).filter(k=>state.done[k]).length}),setLevel};
init();
})();