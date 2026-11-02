/* WortWeg 370 · Sentence Builder. Touch pointer drag & drop + tap fallback. */
(()=>{'use strict';
const source=window.WortWegSentenceData;
if(!source || !Array.isArray(source.lessons)) return;
const lessons=source.lessons;
const byId=id=>document.getElementById(id);
const els={};
for(const id of ['topicView','practiceView','lessonGrid','totalRing','totalSolved','overallPercent','resumeButton','allTopics','lessonCounter','lessonScore','linearFill','topicBadge','currentLevel','practiceTitle','englishPrompt','answerZone','wordBank','undoButton','resetButton','checkButton','showAnswerButton','feedback','previousButton','nextButton','verbOne','verbTwo','verbThree','verbEnglish','grammarSubtitle','grammarExplanation','grammarFormula','hintButton','hintText','themeToggle'])els[id]=byId(id);
const KEY='wortweg370:sentence-builder:progress:v1';
const THEME_KEY='wortweg370:sentence-builder:theme:v1';
const read=(key)=>{try{return localStorage.getItem(key);}catch{return null;}};
const save=(key,value)=>{try{localStorage.setItem(key,value);}catch{ /* Private browsing still works for this session. */ }};
let storage={completed:{},last:null};
try{const data=JSON.parse(read(KEY)||'{}');if(data&&typeof data==='object'){storage.completed=data.completed&&typeof data.completed==='object'?data.completed:{};storage.last=data.last||null;}}catch{}
const persist=()=>save(KEY,JSON.stringify(storage));
const completed=lesson=>{
 const values=storage.completed[lesson.id];
 return Array.isArray(values)?new Set(values.filter(n=>Number.isInteger(n)&&n>=0&&n<10)).size:0;
};
const marked=(lesson,n)=>Array.isArray(storage.completed[lesson.id])&&storage.completed[lesson.id].includes(n);
const sumMastered=()=>lessons.reduce((sum,lesson)=>sum+completed(lesson),0);
function applyTheme(mode){document.documentElement.dataset.theme=mode;els.themeToggle.setAttribute('aria-label',mode==='dark'?'Switch to light mode':'Switch to dark mode');}
const savedTheme=read(THEME_KEY);applyTheme(savedTheme==='light'||savedTheme==='dark'?savedTheme:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
els.themeToggle.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(next);save(THEME_KEY,next);});
const add=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node;};
function updateOverview(){
 const count=sumMastered(),percent=Math.round(count/120*100);
 els.totalSolved.textContent=count;
 els.overallPercent.textContent=percent+'%';
 els.totalRing.style.setProperty('--percent',percent+'%');
}
function renderTopics(){
 updateOverview();els.lessonGrid.replaceChildren();
 lessons.forEach((lesson,index)=>{
  const done=completed(lesson),card=add('button','lesson');card.type='button';
  card.setAttribute('aria-label',lesson.title+', '+done+' of 10 mastered');
  const top=add('div','lesson-top');top.append(add('span','lesson-index','TOPIC '+String(index+1).padStart(2,'0')),add('span','lesson-count',done+'/10 mastered'));
  const name=add('div','lesson-title',lesson.title.replace(/^[0-9]+ · /,''));
  const subtitle=add('div','lesson-subtitle',lesson.subtitle);
  const track=add('div','mini-track');const fill=add('span');fill.style.width=done*10+'%';track.append(fill);
  const bottom=add('div','lesson-bottom',undefined);bottom.append(add('span','lesson-start',done===10?'Review topic ↗':done?'Continue learning ↗':'Start 10 exercises ↗'),add('span','lesson-count','10 questions'));
  card.append(top,name,subtitle,track,bottom);
  card.addEventListener('click',()=>openLesson(lesson.id,firstUnmastered(lesson)));
  els.lessonGrid.append(card);
 });
}
function firstUnmastered(lesson){for(let i=0;i<10;i++)if(!marked(lesson,i))return i;return 0;}
let lesson=null,index=0,tokens=[],bankOrder=[],answer=[],attempts=0,revealed=false,drag=null,suppressClick=false;
function shuffle(values){
 const result=values.slice();
 for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 if(result.length>1&&result.every((value,i)=>value===i)){const first=result.shift();result.push(first);}
 return result;
}
function chooseExercise(n){
 if(!lesson)return;
 index=Math.max(0,Math.min(lesson.items.length-1,n));
 const entry=lesson.items[index];
 tokens=entry.de.trim().split(/\s+/);
 bankOrder=shuffle(tokens.map((_,i)=>i));answer=[];attempts=0;revealed=false;
 const verb=source.verbs[entry.verb];
 els.lessonCounter.textContent='Exercise '+(index+1)+' of 10';
 els.lessonScore.textContent=completed(lesson)+' / 10 mastered';
 els.linearFill.style.width=(index+1)*10+'%';
 els.topicBadge.textContent=lesson.subtitle;
 els.currentLevel.textContent=(index+1)+' / 10';
 els.practiceTitle.textContent=lesson.title.replace(/^[0-9]+ · /,'');
 els.englishPrompt.textContent=entry.en;
 els.verbOne.textContent=verb[1];els.verbTwo.textContent=verb[2];els.verbThree.textContent=verb[3];
 els.verbEnglish.textContent='English: '+verb[0];
 els.grammarSubtitle.textContent=lesson.subtitle;
 els.grammarExplanation.textContent=lesson.explanation;
 els.grammarFormula.textContent=lesson.formula;
 els.hintText.textContent=lesson.formula+' — German main clauses: finite verb in position 2. Subordinate clauses: the conjugated verb normally goes to the end.';
 els.hintText.hidden=true;els.hintButton.textContent='Show word-order hint';
 els.showAnswerButton.disabled=true;
 els.previousButton.disabled=index===0;
 els.nextButton.textContent=index===9?'Finish topic ✓':'Next exercise ›';
 clearFeedback();renderTiles();
 storage.last={id:lesson.id,index};persist();
 try{history.replaceState(null,'',location.pathname+'?topic='+encodeURIComponent(lesson.id)+'&item='+(index+1));}catch{}
 window.scrollTo({top:0,behavior:'instant'});
}
function openLesson(id,start){
 const target=lessons.find(item=>item.id===id);if(!target)return;
 lesson=target;
 els.topicView.hidden=true;els.practiceView.hidden=false;
 chooseExercise(Number.isInteger(start)?start:0);
}
function showTopics(){
 cancelDrag();lesson=null;els.practiceView.hidden=true;els.topicView.hidden=false;
 try{history.replaceState(null,'',location.pathname);}catch{}
 renderTopics();window.scrollTo({top:0,behavior:'instant'});
}
function clearFeedback(){els.feedback.hidden=true;els.feedback.className='feedback';els.feedback.replaceChildren();}
function feedback(kind,heading,detail,reference){
 els.feedback.className='feedback'+(kind==='success'?' success':'');els.feedback.replaceChildren();
 els.feedback.append(add('strong','',heading),add('p','',detail));
 if(reference)els.feedback.append(add('span','reference',reference));
 els.feedback.hidden=false;
}
function renderTiles(){
 els.answerZone.replaceChildren();els.wordBank.replaceChildren();
 els.answerZone.dataset.empty='Drop cards here or tap words from the bank';
 els.wordBank.dataset.empty='All words placed — check your sentence';
 for(const i of answer)els.answerZone.append(tile(i,'answer'));
 for(const i of bankOrder)if(!answer.includes(i))els.wordBank.append(tile(i,'bank'));
 els.undoButton.disabled=answer.length===0;
 els.resetButton.disabled=answer.length===0;
 els.checkButton.disabled=answer.length!==tokens.length;
}
function tile(i,from){
 const b=add('button','word-tile',tokens[i]);b.type='button';
 b.dataset.wordIndex=String(i);b.dataset.from=from;
 b.setAttribute('aria-label',tokens[i]+(from==='bank'?' — add to sentence':' — return to word bank'));
 b.addEventListener('click',()=>{
  if(suppressClick)return;
  if(from==='bank')moveWord(i,'answer');else moveWord(i,'bank');
 });
 b.addEventListener('pointerdown',startDrag);
 return b;
}
function moveWord(id,destination,position){
 const current=answer.indexOf(id);if(current!==-1)answer.splice(current,1);
 if(destination==='answer'){
  if(position===undefined)answer.push(id);
  else answer.splice(Math.max(0,Math.min(position,answer.length)),0,id);
 }
 clearFeedback();renderTiles();
}
function startDrag(e){
 if(e.button!==undefined&&e.button!==0)return;
 const node=e.currentTarget;
 drag={id:Number(node.dataset.wordIndex),x:e.clientX,y:e.clientY,pointerId:e.pointerId,moved:false,ghost:null};
}
function dropTargetsOff(){els.answerZone.classList.remove('drag-over');els.wordBank.classList.remove('drag-over');}
function cancelDrag(){
 if(drag&&drag.ghost)drag.ghost.remove();
 drag=null;dropTargetsOff();
}
document.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.pointerId)return;
 const dist=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
 if(!drag.moved&&dist<7)return;
 if(!drag.moved){
  drag.moved=true;
  drag.ghost=add('div','word-tile drag-ghost',tokens[drag.id]);
  document.body.append(drag.ghost);
 }
 e.preventDefault();
 drag.ghost.style.left=(e.clientX+11)+'px';drag.ghost.style.top=(e.clientY+11)+'px';
 const target=document.elementFromPoint(e.clientX,e.clientY);
 const zone=target&&target.closest('[data-dropzone]');
 els.answerZone.classList.toggle('drag-over',zone===els.answerZone);
 els.wordBank.classList.toggle('drag-over',zone===els.wordBank);
},{passive:false});
document.addEventListener('pointerup',e=>{
 if(!drag||e.pointerId!==drag.pointerId)return;
 const wasMoved=drag.moved,id=drag.id;
 const target=wasMoved?document.elementFromPoint(e.clientX,e.clientY):null;
 const zone=target&&target.closest('[data-dropzone]');
 let position;
 if(zone===els.answerZone){
  const nearby=target.closest('.word-tile');
  if(nearby){
   const other=Number(nearby.dataset.wordIndex);
   const reordered=answer.filter(x=>x!==id);
   const found=reordered.indexOf(other);
   if(found>=0)position=found+(e.clientX>nearby.getBoundingClientRect().left+nearby.getBoundingClientRect().width/2?1:0);
  }
 }
 cancelDrag();
 if(wasMoved){
  suppressClick=true;
  setTimeout(()=>{suppressClick=false;},0);
  if(zone===els.answerZone)moveWord(id,'answer',position);
  else if(zone===els.wordBank)moveWord(id,'bank');
 }
});
document.addEventListener('pointercancel',cancelDrag);
els.undoButton.addEventListener('click',()=>{if(answer.length)moveWord(answer[answer.length-1],'bank');});
els.resetButton.addEventListener('click',()=>{answer=[];clearFeedback();renderTiles();});
function isTargetSentence(){
 return answer.map(i=>tokens[i]).join(' ')===lesson.items[index].de.trim();
}
els.checkButton.addEventListener('click',()=>{
 if(answer.length!==tokens.length){feedback('warning','Sentence incomplete','Use every word card before checking.');return;}
 const entry=lesson.items[index],match=isTargetSentence();
 if(match){
  if(!revealed){
   if(!marked(lesson,index)){
    const already=Array.isArray(storage.completed[lesson.id])?storage.completed[lesson.id]:[];
    storage.completed[lesson.id]=already.concat(index);persist();
   }
   feedback('success','Correct! Exercise mastered ✓','Great work. Your word order matches the reference sentence. '+lesson.explanation,entry.de);
  }else feedback('warning','Reference reconstructed','Your sentence matches the revealed answer. Repeat this exercise without revealing it to earn mastery credit.',entry.de);
  els.lessonScore.textContent=completed(lesson)+' / 10 mastered';
  return;
 }
 attempts++;
 els.showAnswerButton.disabled=false;
 feedback('warning','Try again · Word order','This does not match the reference word order. Reorder the cards and check again. Other natural German word orders may also be valid; the exercise checks the taught reference sentence.');
});
els.showAnswerButton.addEventListener('click',()=>{
 if(attempts===0)return;
 revealed=true;
 feedback('warning','Reference answer · Study mode','Compare the reference sentence with your cards. Revealing the answer does not earn mastery credit.',lesson.items[index].de);
});
els.previousButton.addEventListener('click',()=>chooseExercise(index-1));
els.nextButton.addEventListener('click',()=>{if(index===9)showTopics();else chooseExercise(index+1);});
els.allTopics.addEventListener('click',showTopics);
els.hintButton.addEventListener('click',()=>{const hidden=!els.hintText.hidden;els.hintText.hidden=hidden;els.hintButton.textContent=hidden?'Show word-order hint':'Hide word-order hint';});
els.resumeButton.addEventListener('click',()=>{
 const last=storage.last;
 const target=lessons.find(item=>item.id===last?.id);
 if(target)openLesson(target.id,Math.max(0,Math.min(9,last.index||0)));
 else openLesson(lessons[0].id,0);
});
renderTopics();
try{
 const params=new URLSearchParams(location.search);
 const id=params.get('topic'),item=Number(params.get('item')||'1');
 if(id&&lessons.some(x=>x.id===id))openLesson(id,Math.max(0,Math.min(9,Math.floor(item)-1||0)));
}catch{}
})();