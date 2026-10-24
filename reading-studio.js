/* WortWeg 370 — Extended trilingual passage window and German TTS.
Seek is aligned to sentences, not MP3 millisecond timestamps. */
(()=>{
'use strict';
if(window.WortWegReadingStudio)return;
const st=document.createElement('style');st.textContent="\n.wwr-overlay{position:fixed;inset:0;background:#101a2dd9;z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px}\n.wwr-window{background:#fff;color:#1a2c46;width:min(1220px,100%);height:min(94dvh,940px);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 100px #0008;font-family:system-ui,sans-serif}\n.wwr-header{display:flex;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid #dde5f0;align-items:center}\n.wwr-header h2{font-size:clamp(18px,2.2vw,26px);margin:4px 0 0;color:#182a44;line-height:1.3}\n.wwr-eyebrow,.wwr-label{font-size:11px;font-weight:800;letter-spacing:.11em;color:#54718d;text-transform:uppercase}\n.wwr-actions,.wwr-transport{display:flex;flex-wrap:wrap;gap:7px;align-items:center}\n.wwr-window button{border:1px solid #c6d3e2;border-radius:9px;background:white;color:#213b5e;padding:8px 12px;cursor:pointer;font-size:13px;font-weight:650}\n.wwr-window button:disabled{opacity:.4;cursor:not-allowed}\n.wwr-window button.wwr-primary,.wwr-window button[aria-pressed=true]{background:#194d93;color:white;border-color:#194d93}\n.wwr-window button:focus-visible,.wwr-window input:focus-visible{outline:3px solid #5792f8;outline-offset:2px}\n.wwr-player{background:#f3f7fc;border-bottom:1px solid #dce5f0;padding:12px 24px}\n.wwr-timeline{display:flex;align-items:center;gap:12px;margin-top:12px;font-size:12px;color:#526984}\n.wwr-timeline input{flex:1;min-width:0;accent-color:#235ca9;cursor:pointer}\n.wwr-hint{font-size:11px;color:#617891;margin:7px 0 0}\n.wwr-labels{display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:12px 25px;border-bottom:1px solid #dbe4ee;background:#f8fafc}\n.wwr-pages{overflow:auto;flex:1;overscroll-behavior:contain}\n.wwr-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;padding:18px 25px;border-bottom:1px solid #e4ebf4;scroll-margin-top:12px}\n.wwr-row.wwr-current{background:#fff8e8;box-shadow:inset 4px 0 #ebb34b}\n.wwr-de,.wwr-en,.wwr-mm{font-size:clamp(15px,1.3vw,18px);line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}\n.wwr-de{font-weight:520;color:#172943}\n.wwr-en{color:#586b81}\n.wwr-mm{grid-column:1/-1;background:#edf5ff;padding:12px 16px;border-radius:9px;border-left:3px solid #2b68b9;font-size:15px;color:#354e6e}\n.wwr-sentence{cursor:pointer;border-radius:4px}\n.wwr-sentence.wwr-active{background:#ffdf87}\n.wwr-word.wwr-active{background:#efb72b;color:#18283e;border-radius:3px}\n.wwr-footer{padding:10px 24px;border-top:1px solid #dde5ef;color:#667b94;font-size:11px}\n.wwr-speed{padding:7px;border:1px solid #ccd9e5;border-radius:8px;color:#213b5e;background:white}\n@media(max-width:720px){.wwr-overlay{padding:0}.wwr-window{height:100dvh;border-radius:0}.wwr-header{padding:12px 14px}.wwr-player{padding:10px 14px}.wwr-labels{grid-template-columns:1fr;padding:10px 14px}.wwr-labels span:last-child{display:none}.wwr-row{grid-template-columns:1fr;gap:10px;padding:15px 14px}.wwr-en{border-top:1px dashed #ced9e8;padding-top:8px;font-size:15px}.wwr-mm{grid-column:1}.wwr-footer{padding:9px 14px}}\n@media(prefers-reduced-motion:reduce){.wwr-pages{scroll-behavior:auto}}\n";document.head.append(st);
const chapters=()=>window.WortWegLongReadings||{};
const synth=window.speechSynthesis;
const supported=()=>!!synth&&typeof window.SpeechSynthesisUtterance==='function';
let overlay=null,active=null,items=[],idx=0,play=false,paused=false,serial=0,rate=1,oldOverflow='';
const q=s=>overlay?.querySelector(s);
function node(tag,cl,parent,text){
 const e=document.createElement(tag);if(cl)e.className=cl;
 if(text!==undefined)e.textContent=String(text);
 parent?.append(e);return e;
}
function sentences(s){return s.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)?.map(x=>x.trim()).filter(Boolean)||[s];}
function highlight(i){
 if(!overlay)return;
 overlay.querySelectorAll('.wwr-current').forEach(el=>el.classList.remove('wwr-current'));
 overlay.querySelectorAll('.wwr-sentence.wwr-active').forEach(el=>el.classList.remove('wwr-active'));
 overlay.querySelectorAll('.wwr-word.wwr-active').forEach(el=>el.classList.remove('wwr-active'));
 const entry=items[i];if(!entry)return;
 entry.row.classList.add('wwr-current');entry.span.classList.add('wwr-active');
 entry.row.scrollIntoView?.({block:'nearest',behavior:'smooth'});
}
function sync(){
 if(!overlay)return;
 q('.wwr-play').textContent=play?(paused?'▶ Resume':'⏸ Pause'):'▶ Play German';
 const slider=q('.wwr-seek');slider.max=String(Math.max(0,items.length-1));slider.value=String(Math.min(idx,items.length-1));
 q('.wwr-position').textContent=items.length?(idx+1)+' / '+items.length:'0 / 0';
 q('.wwr-back').disabled=idx<1;q('.wwr-next').disabled=idx>=items.length-1;
}
function stop(reset=false){
 serial++;play=false;paused=false;
 if(supported())try{synth.cancel();}catch{}
 if(reset)idx=0;sync();highlight(-1);
}
function start(n){
 if(!items.length)return;
 if(!supported()){q('.wwr-hint').textContent='German speech is not supported by this browser. Text and translations remain available.';return;}
 serial++;const own=serial;
 try{synth.cancel();}catch{}
 idx=Math.max(0,Math.min(n,items.length-1));play=true;paused=false;sync();
 const next=()=>{
  if(!overlay||own!==serial||!play)return;
  const item=items[idx];if(!item){stop();return;}
  highlight(idx);
  const u=new SpeechSynthesisUtterance(item.text);u.lang='de-DE';u.rate=rate;
  const voices=synth.getVoices?.()||[];
  const voice=voices.find(v=>v.lang.toLowerCase()==='de-de'&&v.localService)||voices.find(v=>/^de/i.test(v.lang));
  if(voice)u.voice=voice;
  u.onboundary=e=>{
   if(own!==serial||typeof e.charIndex!=='number')return;
   item.span.querySelectorAll('.wwr-word.wwr-active').forEach(el=>el.classList.remove('wwr-active'));
   const words=[...item.span.querySelectorAll('.wwr-word')];
   const current=words.find(el=>Number(el.dataset.end)>e.charIndex)||words[words.length-1];
   current?.classList.add('wwr-active');
  };
  u.onend=()=>{
   if(own!==serial)return;
   if(idx<items.length-1){idx++;sync();next();}
   else{play=false;paused=false;sync();highlight(-1);}
  };
  u.onerror=e=>{
   if(own!==serial||['canceled','interrupted'].includes(e.error))return;
   stop();if(overlay)q('.wwr-hint').textContent='Speech stopped: the German voice may be unavailable on this device.';
  };
  try{synth.speak(u);}catch{stop();}
 };
 next();
}
function toggle(){
 if(!play){start(idx);return;}
 if(!supported())return;
 try{if(paused){synth.resume();paused=false;}else{synth.pause();paused=true;}}catch{stop();}
 sync();
}
function seek(to){stop();idx=Math.min(items.length-1,Math.max(0,to));sync();start(idx);}
function close(){
 stop();
 if(overlay){overlay.remove();overlay=null;}
 document.body.style.overflow=oldOverflow;
 document.removeEventListener('keydown',keyboard);
 items=[];active=null;
}
function keyboard(e){
 if(e.key==='Escape'&&overlay){e.preventDefault();close();}
}
function draw(chapter){
 items=[];const host=q('.wwr-pages');host.replaceChildren();
 for(const paragraph of chapter.rows){
  const row=node('article','wwr-row',host);
  const de=node('div','wwr-de',row);de.lang='de';
  const en=node('div','wwr-en',row,paragraph[1]);en.lang='en';
  const mm=node('div','wwr-mm',row,paragraph[2]);mm.lang='my';mm.hidden=true;
  sentences(paragraph[0]).forEach(s=>{
   const span=node('span','wwr-sentence',de);
   let offset=0;
   for(const match of s.matchAll(/\S+|\s+/gu)){
    const token=match[0];
    if(!token.trim()){span.append(document.createTextNode(token));offset+=token.length;continue;}
    const word=node('span','wwr-word',span,token);
    offset+=token.length;word.dataset.end=String(offset);
   }
   de.append(document.createTextNode(' '));
   const at=items.push({text:s,row,span})-1;
   span.title='Play this German sentence';
   span.addEventListener('click',()=>seek(at));
  });
 }
 sync();
}
function open(id){
 const chapter=chapters()[Number(id)];if(!chapter)return false;
 close();active=chapter;oldOverflow=document.body.style.overflow;
 overlay=node('div','wwr-overlay',document.body);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 const panel=node('section','wwr-window',overlay);
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','German reading passage');
 const header=node('header','wwr-header',panel);
 const names=node('div','',header);
 node('div','wwr-eyebrow',names,'WORTWEG 370 · LONG READING · TOPIC '+id);
 node('h2','',names,chapter.title+' — '+chapter.en);
 const headButtons=node('div','wwr-actions',header);
 const mmButton=node('button','',headButtons,'မြန်မာဘာသာ');mmButton.type='button';mmButton.setAttribute('aria-pressed','false');
 mmButton.addEventListener('click',()=>{
  const show=mmButton.getAttribute('aria-pressed')!=='true';
  mmButton.setAttribute('aria-pressed',String(show));
  overlay.querySelectorAll('.wwr-mm').forEach(el=>el.hidden=!show);
 });
 const vocabulary=node('button','',headButtons,'Vocabulary');
 vocabulary.type='button';vocabulary.addEventListener('click',()=>{close();window.WortWegTopics?.open(Number(id));});
 const exit=node('button','',headButtons,'✕ Close');exit.type='button';exit.addEventListener('click',close);
 const player=node('div','wwr-player',panel);
 const transport=node('div','wwr-transport',player);
 const playButton=node('button','wwr-play wwr-primary',transport,'▶ Play German');playButton.type='button';playButton.addEventListener('click',toggle);
 const prev=node('button','wwr-back',transport,'⏮ Previous');prev.type='button';prev.addEventListener('click',()=>seek(idx-1));
 const next=node('button','wwr-next',transport,'Next ⏭');next.type='button';next.addEventListener('click',()=>seek(idx+1));
 const halt=node('button','',transport,'⏹ Stop');halt.type='button';halt.addEventListener('click',()=>stop(true));
 const speed=node('select','wwr-speed',transport);speed.setAttribute('aria-label','German speech speed');
 for(const [v,label] of [['0.75','0.75× Slow'],['1','1× Normal'],['1.25','1.25× Fast']]){
  const option=node('option','',speed,label);option.value=v;if(v==='1')option.selected=true;
 }
 rate=1;speed.addEventListener('change',()=>{rate=Number(speed.value);if(play)start(idx);});
 const timeline=node('div','wwr-timeline',player);
 node('span','',timeline,'Sentence');
 const slider=node('input','wwr-seek',timeline);slider.type='range';slider.min='0';slider.step='1';slider.setAttribute('aria-label','German narration sentence position');
 slider.addEventListener('change',()=>seek(Number(slider.value)));
 node('span','wwr-position',timeline,'0 / 0');
 node('p','wwr-hint',player,'German voice only. Tap a sentence or drag the bar to restart there. Word-level highlighting depends on browser voice support. Not millisecond-accurate MP3 seeking.');
 const headings=node('div','wwr-labels',panel);
 node('span','wwr-label',headings,'Deutsch · German audio');
 node('span','wwr-label',headings,'English · Always visible (silent)');
 node('div','wwr-pages',panel);
 node('footer','wwr-footer',panel,'German + English parallel reading · Myanmar on demand · Esc to close.');
 document.body.style.overflow='hidden';document.addEventListener('keydown',keyboard);
 draw(chapter);exit.focus();return true;
}
function integrate(){
 const list=document.getElementById('topicList');
 if(list&&!list.dataset.wwrAttached){
  list.dataset.wwrAttached='1';
  window.addEventListener('click',e=>{
   const b=e.target.closest('#topicList button.topic');if(!b)return;
   const id=Number(b.querySelector('strong')?.textContent?.match(/\d+/)?.[0]);
   if(!chapters()[id])return;
   e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();open(id);
  },true);
 }
 const actions=document.querySelector('.ww-topic-actions');
 if(actions&&!actions.querySelector('.wwr-detail-button')){
  const b=node('button','btn secondary wwr-detail-button',actions,'Long passage window');
  b.type='button';b.addEventListener('click',()=>{
   const id=Number(document.getElementById('ww-topic-id')?.textContent?.match(/\d+/)?.[0]);
   if(chapters()[id])open(id);
  });
 }
}
window.WortWegReadingStudio={open,close,getCount:()=>Object.keys(chapters()).length};
integrate();
window.addEventListener('pagehide',stop);
})();
