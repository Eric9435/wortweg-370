
(()=>{'use strict';
const DATA=window.WortWegGoetheData;
const app=document.getElementById('app');
if(!DATA||!app)return;
const LEVELS=['A1','A2','B1','B2','C1','C2'];
const tabs=[['overview','Overview'],['topics','Topics'],['grammar','Grammar'],['skills','Exam Skills'],['practice','Practice'],['official','Official Materials'],['checklist','Checklist']];
const skillNames=['Hören · Listening','Lesen · Reading','Schreiben · Writing','Sprechen · Speaking'];
const topicFlags=[['vocab','Vocabulary'],['grammar','Grammar'],['reading','Reading'],['listening','Listening'],['writing','Writing'],['speaking','Speaking']];
const goals=[
['words','Study theme vocabulary and examples','Topic vocabulary + articles and collocations'],
['grammar','Review grammar structures','Level grammar rules and own sentences'],
['reading','Practice reading with timed texts','Answer main-idea and detail questions'],
['listening','Listen to German and check meaning','Use official audio; local TTS is supplementary'],
['writing','Write and revise a complete response','Check purpose, grammar and register'],
['speaking','Practise speaking aloud','Answer, ask, discuss and self-assess'],
['official','Use an official Goethe model paper','Open the official PDF, audio and solutions'],
['mock','Simulate the four exam sections','Use Goethe timing and review errors']
];
const key='wortweg370-goethe-prep-local-v1';
let saved={topics:{},flags:{},goals:{},drafts:{},answers:{},grades:{},transcripts:{}};
try{const prior=JSON.parse(localStorage.getItem(key)||'null');if(prior&&typeof prior==='object')saved={...saved,...prior}}catch{}
for(const x of ['topics','flags','goals','drafts','answers','grades','transcripts']){if(!saved[x]||typeof saved[x]!=='object')saved[x]={}}
let state={level:null,tab:'overview',topic:null};
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{localStorage.setItem(key,JSON.stringify(saved))}catch{}};
const countReady=lv=>DATA.levels[lv].topics.filter((t,i)=>!!saved.topics[lv+':'+i]).length;
const percent=lv=>Math.round(100*countReady(lv)/DATA.levels[lv].topics.length);
const call=(action,attrs={},body='')=>'<button type="button" data-act="'+E(action)+'" '+Object.entries(attrs).map(([k,v])=>'data-'+E(k)+'="'+E(v)+'"').join(' ')+'>'+body+'</button>';
const openLink=(url,label)=>'<a class="btn secondary" href="'+E(url)+'" target="_blank" rel="noopener noreferrer">'+E(label)+' ↗</a>';
const list=(rows)=>'<ul>'+rows.map(t=>'<li>'+E(t)+'</li>').join('')+'</ul>';
const crumb=()=>'<nav class="crumb" aria-label="Breadcrumb">'+call('home',{},'⌂ All levels')+(state.level?' <span>›</span> '+call('level',{level:state.level},E(state.level)):'')+(state.topic!==null?' <span>›</span> <span>'+E(DATA.levels[state.level].topics[state.topic].de)+'</span>':'')+'</nav>';
const infoNote='<div class="hintbar"><strong>Source distinction:</strong> Goethe official exam format and model papers are linked directly. WortWeg topic lists and exercises are original preparation material, not an official or exhaustive Goethe question bank. Progress is saved only in this browser.</div>';
function head(){const b=document.getElementById('back');b.classList.toggle('hidden',!state.level);b.textContent=state.topic!==null?'‹ Topics':'‹ Levels';}
function renderHome(){
 const top='<div class="hero"><div class="eyebrow">WORTWEG 370 · EXAM ACADEMY</div><h1>Goethe Exam Preparation</h1><p>A1–C2 learning topics, grammar, four exam skills, original mini-practice, progress checklists and links to authentic Goethe materials. German · English · Myanmar.</p><div class="submeta">100 learning topics · 6 CEFR levels · 4 skills per exam</div></div>';
 app.innerHTML=top+infoNote+'<h2 class="sectiontitle">Choose your level</h2><div class="levels">'+LEVELS.map(lv=>{
 const v=DATA.levels[lv];
 return call('level',{level:lv},'<span class="big">'+lv+'</span><strong>'+E(v.name)+'</strong><small>'+v.topics.length+' topics · '+countReady(lv)+' reviewed</small><span class="meter"><span style="width:'+percent(lv)+'%"></span></span><small>'+percent(lv)+'% topic review progress</small>').replace('<button ','<button class="levelcard" ');
 }).join('')+'</div><p class="footer">Study bank aligned with Goethe A1 vocabulary areas, Goethe exam descriptions and supplementary DW/Klett curricula. The topics are recommendations rather than guaranteed exam questions.</p>';
 head();
}
function durationTable(lv){const e=DATA.levels[lv].exam;return '<div class="table-wrap"><table><thead><tr><th>Module</th><th>Time</th><th>What you must do</th></tr></thead><tbody>'+skillNames.map((name,i)=>'<tr><td><strong>'+E(name)+'</strong></td><td>'+e.minutes[i]+' min</td><td>'+E(e.parts[i])+'</td></tr>').join('')+'</tbody></table></div>';}
function levelHeader(lv){const data=DATA.levels[lv];return crumb()+'<section class="panel"><div class="panelhead"><div class="eyebrow" style="color:var(--blue)">GOETHE PREPARATION · '+lv+'</div><h2>'+E(data.exam.title)+'</h2><p>'+E(data.name)+' · '+data.topics.length+' themes · '+countReady(lv)+' topic reviews completed</p></div><div class="tabs" role="tablist" aria-label="'+lv+' exam preparation sections">'+tabs.map(([id,label])=>call('tab',{tab:id},E(label)).replace('<button ','<button class="tab" role="tab" aria-selected="'+(state.tab===id)+'" ')).join('')+'</div><div class="body" id="tabbody">';
}
function overview(lv){const v=DATA.levels[lv];const listItems=lv==='A1'?['Personal introduction and everyday conversations','Forms, signs and short messages','Ask simple questions and request help']:lv==='A2'?['Describe routines and past events','Arrange appointments and solve everyday problems','Write everyday emails and messages']:lv==='B1'?['Explain experiences and opinions','Write structured emails and contributions','Plan with a partner and give short presentations']:lv==='B2'?['Argue and compare viewpoints','Write a forum contribution and professional message','Present and debate with clear structure']:lv==='C1'?['Use academic and professional language','Handle nuanced social issues and formal writing','Summarise points and respond to counterarguments']:['Interpret implicit meaning and complex arguments','Control register and rewrite text precisely','Sustain sophisticated presentations and debate'];
 return '<div class="info-grid"><section class="card"><div class="skilltag">YOUR LEARNING TARGET</div><h3>'+lv+' outcomes</h3>'+list(listItems)+'</section><section class="card"><div class="skilltag">HOW TO PREPARE</div><h3>Daily learning routine</h3>'+list(['15 min vocabulary + example phrases','15 min grammar with own sentences','20 min Lesen/Hören practice','20 min Schreiben/Sprechen practice','Review mistakes and use the Goethe model test'])+'</section></div><h3 class="sectiontitle">Official exam structure</h3>'+durationTable(lv)+'<div class="actions">'+call('tab',{tab:'topics'},'Explore '+v.topics.length+' topics →').replace('<button ','<button class="btn" ')+call('tab',{tab:'practice'},'Start practice').replace('<button ','<button class="btn secondary" ')+openLink(v.practiceUrl,'Goethe official exam training')+'</div><div class="notice">အောက်က Topic Bank က Goethe စာမေးပွဲမှာ ဒီအတိုင်းပဲ မေးမယ်ဆိုတဲ့ fixed list မဟုတ်ပါ။ A1 topics are anchored to the Goethe Wortliste; A2/B1 are informed by DW; B2/C1 by higher-level coursebooks.</div>';
}
function topics(lv){const v=DATA.levels[lv];return '<label for="topicSearch"><strong>Study topics · '+v.topics.length+'</strong> (German / Myanmar)</label><input class="search" id="topicSearch" type="search" placeholder="Search German or Myanmar topic…"><div class="topicgrid" id="topicList">'+v.topics.map((t,i)=>topicTile(lv,t,i)).join('')+'</div>';}
function topicTile(lv,t,i){return call('topic',{idx:i},'<span class="index">TOPIC '+String(i+1).padStart(2,'0')+'</span><strong>'+E(t.de)+'</strong><small>'+E(t.my)+'</small><span class="status">'+(saved.topics[lv+':'+i]?'✓ Reviewed':'Study →')+'</span>').replace('<button ','<button class="topiccard" data-search="'+E((t.de+' '+t.my).toLowerCase())+'" ');}
function grammar(lv){return '<p>ဒီအဆင့်မှာ အသုံးများတဲ့ grammar structures တွေကို ဥပမာနဲ့ လေ့ကျင့်ပါ။ ဒါက Goethe က ထုတ်ထားတဲ့ fixed grammar inventory မဟုတ်ဘူး။</p><div class="table-wrap"><table><thead><tr><th>Grammar</th><th>German Example</th><th>Explanation</th></tr></thead><tbody>'+DATA.levels[lv].grammar.map(r=>'<tr><td><strong>'+E(r[0])+'</strong></td><td>'+E(r[1])+'</td><td>'+E(r[2])+'</td></tr>').join('')+'</tbody></table></div><div class="actions">'+openLink('./gender-lifetime.html','WortWeg Gender Reference')+openLink('./lifetime-grammar.html','WortWeg Lifetime Grammar')+'</div>';}
function skills(lv){const d=DATA.levels[lv].exam;const tips=[
'Listen first for global meaning. Then target numbers, dates, opinions and speaker intention. Use Goethe official audio for exam-like listening.',
'Scan the task first. Look for purpose, explicit information, contrast and inferred meaning. Practise under the published time limit.',
'Understand task points. Plan structure, write, and check verbs, articles, case and register. No automatic exam-grade scoring is provided.',
'Practise aloud. Use a partner when possible. For B1+ include clear structure, examples, questions and responses to disagreement.'
];return '<h3 class="sectiontitle">Four exam modules</h3><div class="info-grid">'+skillNames.map((name,i)=>'<section class="card"><div class="skillhead"><h3>'+E(name)+'</h3><span class="chip">'+d.minutes[i]+' min</span></div><p>'+E(d.parts[i])+'</p><div class="line"></div><strong>Preparation strategy</strong><p>'+E(tips[i])+'</p></section>').join('')+'</div><div class="actions">'+call('tab',{tab:'practice'},'Open local skills practice').replace('<button ','<button class="btn" ')+openLink(DATA.levels[lv].practiceUrl,'Authentic Goethe audio and PDF')+'</div>';}
function question(lv,id,item){const answer=(saved.answers[lv]||{})[id];const result=(saved.grades[lv]||{})[id];return '<section class="task"><h3>'+(id==='reading'?'Lesen · Original WortWeg mini-task':'Hören · Original WortWeg synthetic audio')+'</h3>'+
 (id==='reading'?'<p class="german" lang="de">'+E(item.text)+'</p>':'<p>Audio generated from original WortWeg text using your device’s German speech voice. This is <strong>not</strong> authentic Goethe audio.</p>'+call('play',{},'▶ Play German audio').replace('<button ','<button class="btn secondary" ')+' <span id="audioStatus" class="timing" aria-live="polite"></span> '+call('transcript',{},(saved.transcripts[lv]?'Hide':'Reveal')+' transcript').replace('<button ','<button class="btn small secondary" ')+(saved.transcripts[lv]?'<p class="german" lang="de">'+E(item.text)+'</p>':''))+
 '<p><strong>'+E(item.question)+'</strong></p>'+item.choices.map((choice,i)=>'<label class="radio"><input type="radio" name="'+id+'" value="'+i+'" '+(String(answer)===String(i)?'checked':'')+' '+(result!==undefined?'disabled':'')+'> '+E(choice)+'</label>').join('')+
 (result===undefined?call('grade',{skill:id},'Check answer').replace('<button ','<button class="btn" '+(answer===undefined?'disabled ':'') ):'<div class="answer '+(!result?'wrong':'')+'">'+(result?'✓ Correct':'✗ Not quite')+' · '+E(item.why)+'</div>')+
 '</section>';}
function practice(lv){const v=DATA.levels[lv],ex=v.exam,draft=saved.drafts[lv+':practice']||'';const graded=saved.grades[lv]||{};const done=['reading','listen'].filter(k=>graded[k]!==undefined).length;const score=['reading','listen'].filter(k=>graded[k]===true).length;
 return '<div class="notice">These two auto-checked questions are <strong>short original practice</strong>, not a Goethe-format full mock exam. The official examination is longer; use the Goethe PDF and audio for a genuine simulation.</div>'+
 (done?'<p><strong>Mini-check: '+score+'/'+done+' correct</strong> · local result only, not a certificate score.</p>':'')+
 question(lv,'reading',ex.reading)+question(lv,'listen',ex.listen)+
 '<section class="task"><h3>Schreiben · Writing task</h3><p class="german" lang="de">'+E(ex.writing)+'</p><p>ကိုယ်တိုင်ရေးပြီး task points, grammar, vocabulary နဲ့ formality ကို ပြန်စစ်ပါ။ Auto grading မဟုတ်ပါ။</p><textarea class="draft" data-draft="practice" aria-label="Writing answer in German" placeholder="Schreiben Sie hier Ihre Antwort …">'+E(draft)+'</textarea><small id="draftStatus" class="timing">Draft stored on this device · '+draft.trim().split(/\s+/).filter(Boolean).length+' words</small></section>'+
 '<section class="task"><h3>Sprechen · Speaking practice</h3><p class="german" lang="de">'+E(ex.speaking)+'</p><p>အသံထွက်ပြောကြည့်ပါ။ ကိုယ့်အဖြေကို introduction → point → example → conclusion အလိုက် လေ့ကျင့်ပြီး real Goethe sample speaking video ကို ဆက်လေ့လာပါ။</p>'+openLink(v.practiceUrl,'Official speaking demo / exam training')+'</section>'+
 '<div class="actions">'+call('reset-mini',{},'Retry the 2 mini questions').replace('<button ','<button class="btn secondary" ')+'</div>';
}
function official(lv){const v=DATA.levels[lv];return '<h3 class="sectiontitle">Official Goethe-Institut materials</h3><p>Goethe official page ကို သွားပြီး exam training PDF, listening audio, solution key, speaking demo (if available), digital exercises ကို လေ့ကျင့်ပါ။</p><div class="actions">'+openLink(v.practiceUrl,'Open Goethe '+lv+' model exams')+openLink(DATA.official.base,'Goethe A1–C2 exam hub')+(v.vocabUrl?openLink(v.vocabUrl,'Official '+lv+' Wortliste (PDF)'):'')+'</div><div class="line"></div><h3 class="sectiontitle">Supplementary curriculum (not Goethe-issued)</h3><p>အပိုလေ့လာဖို့ Deutsche Welle / Klett textbooks ကို ရည်ညွှန်းထားတယ်။</p><div class="actions">'+DATA.official.extra.map(e=>openLink(e.url,e.title)).join('')+'</div><div class="notice">Goethe exam topic choices are not guaranteed by this bank. A1 official Wortliste lists thematic areas; A2/B1 official vocabulary lists are available. B2–C2 focus on broad CEFR communication skills rather than a finite approved topic list.</div>';}
function checklist(lv){const g=saved.goals[lv]||{};const total=goals.filter(([id])=>g[id]).length;return '<h3 class="sectiontitle">Exam-ready self-assessment · '+total+'/8</h3><p>ကိုယ့်လုပ်ပြီးတဲ့အပိုင်းတွေကို ချက်ပါ။ ဒီ checklist က real exam grade မဟုတ်ပါ။</p>'+goals.map(([id,label,desc])=>'<label class="check"><input type="checkbox" data-goal="'+E(id)+'" '+(g[id]?'checked':'')+'><span><strong>'+E(label)+'</strong><small>'+E(desc)+'</small></span></label>').join('')+'<div class="actions">'+openLink(DATA.levels[lv].practiceUrl,'Open official timed model test')+'</div>';}
function renderLevel(){
 const lv=state.level;
 if(!lv){renderHome();return;}
 let content='';
 switch(state.tab){case 'topics':content=topics(lv);break;case 'grammar':content=grammar(lv);break;case 'skills':content=skills(lv);break;case 'practice':content=practice(lv);break;case 'official':content=official(lv);break;case 'checklist':content=checklist(lv);break;default:content=overview(lv);}
 app.innerHTML=levelHeader(lv)+content+'</div></section><p class="footer">Independent WortWeg study collection · Local progress only · Unofficial prep tasks clearly separated from Goethe sources.</p>';
 head();
}
function topicView(){
 const lv=state.level,i=state.topic;const t=DATA.levels[lv].topics[i],k=lv+':'+i;
 const flags=saved.flags[k]||{},completed=topicFlags.filter(([f])=>flags[f]).length;
 const draft=saved.drafts[k]||'';
 app.innerHTML=crumb()+'<section class="panel"><div class="panelhead"><div class="eyebrow" style="color:var(--blue)">'+lv+' · TOPIC '+(i+1)+' / '+DATA.levels[lv].topics.length+'</div><h2>'+E(t.de)+'</h2><p>'+E(t.my)+' · '+completed+'/6 self-study activities</p></div><div class="body"><h3>1 · Vocabulary to learn</h3><div class="vocab">'+t.vocab.map(w=>'<span lang="de">'+E(w)+'</span>').join('')+'</div><p class="timing">စကားလုံးတစ်လုံးချင်းစီကို meaning, article/verb form, plural နဲ့ example sentence တွဲမှတ်ပါ။ WortWeg vocabulary bank နဲ့ အသေးစိတ်ထပ်လေ့လာနိုင်တယ်။</p><div class="line"></div><h3>2 · Speaking · ကိုယ်တိုင်ဖြေပါ</h3><div class="task"><p class="german" lang="de">'+E(t.speaking)+'</p><p>အဖြေကို အသံထွက် 3–6 ကြောင်းအနည်းဆုံး ပြောကြည့်ပါ။ B1–C2 မှာ supporting arguments နဲ့ examples ထည့်ပါ။</p></div><h3>3 · Writing · စာရေးလေ့ကျင့်ပါ</h3><div class="task"><p class="german" lang="de">'+E(t.writing)+'</p><textarea class="draft" data-draft="topic" aria-label="Writing response" placeholder="Deine Antwort auf Deutsch …">'+E(draft)+'</textarea><small class="timing" id="draftStatus">Saved locally · '+draft.trim().split(/\s+/).filter(Boolean).length+' words</small></div><h3>4 · Study workflow</h3>'+topicFlags.map(([id,name])=>'<label class="check"><input type="checkbox" data-topic-flag="'+E(id)+'" '+(flags[id]?'checked':'')+'><span><strong>'+E(name)+'</strong><small>'+E(topicFlagNote(id))+'</small></span></label>').join('')+'<div class="actions">'+call('review',{idx:i},(saved.topics[k]?'✓ Reviewed · tap to undo':'Mark topic reviewed')).replace('<button ','<button class="btn" ')+call('tab',{tab:'practice'},'Level practice tasks').replace('<button ','<button class="btn secondary" ')+call('tab',{tab:'topics'},'All '+lv+' topics').replace('<button ','<button class="btn secondary" ')+'</div></div></section>';
 head();
}
function topicFlagNote(id){return ({vocab:'Learn the key vocabulary, meanings and article forms.',grammar:'Review a level grammar structure and write two new sentences.',reading:'Read a related text and find the main idea.',listening:'Listen to German audio and capture two details.',writing:'Answer the writing prompt and revise it.',speaking:'Answer the speaking prompt aloud without reading.'})[id]}
function render(){document.title=(state.level?state.level+' | ':'')+'Goethe Exam Preparation | WortWeg';state.topic!==null?topicView():state.level?renderLevel():renderHome()}
function goto(lv,tab='overview',topic=null){state={level:lv,tab,topic};render();window.scrollTo(0,0)}
app.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el)return;
 const type=el.dataset.act,lv=state.level;
 if(type==='home'){goto(null);return}
 if(type==='level'){goto(el.dataset.level);return}
 if(type==='tab'){goto(lv,el.dataset.tab);return}
 if(type==='topic'){goto(lv,'topics',Number(el.dataset.idx));return}
 if(!lv)return;
 if(type==='review'){const k=lv+':'+el.dataset.idx;saved.topics[k]=!saved.topics[k];save();topicView();return}
 if(type==='transcript'){saved.transcripts[lv]=!saved.transcripts[lv];save();renderLevel();return}
 if(type==='play'){
    const text=DATA.levels[lv].exam.listen.text;
    const status=document.getElementById('audioStatus');
    if(!('speechSynthesis' in window)){if(status)status.textContent='No speech voice available; reveal the transcript.';return}
    try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=lv==='A1'?.83:lv==='A2'?.9:lv==='B1'?.94:1;u.onstart=()=>{if(status)status.textContent='Playing German voice…'};u.onend=()=>{if(status)status.textContent='Finished listening.'};u.onerror=()=>{if(status)status.textContent='Speech unavailable; reveal transcript.'};window.speechSynthesis.speak(u)}catch{if(status)status.textContent='Speech unavailable; reveal transcript.'}return;
 }
 if(type==='grade'){const skill=el.dataset.skill,answers=saved.answers[lv]||{};if(answers[skill]===undefined)return;const ex=DATA.levels[lv].exam[skill==='reading'?'reading':'listen'];if(!saved.grades[lv])saved.grades[lv]={};saved.grades[lv][skill]=Number(answers[skill])===ex.answer;save();renderLevel();return}
 if(type==='reset-mini'){saved.grades[lv]={};saved.answers[lv]={};save();renderLevel();return}
});
app.addEventListener('input',e=>{
 const el=e.target;
 if(el.id==='topicSearch'){const term=el.value.trim().toLocaleLowerCase();app.querySelectorAll('.topiccard[data-search]').forEach(b=>b.classList.toggle('hidden',!b.dataset.search.toLocaleLowerCase().includes(term)));return}
 if(el.dataset.draft){const k=el.dataset.draft==='topic'?state.level+':'+state.topic:state.level+':practice';saved.drafts[k]=el.value;save();const status=document.getElementById('draftStatus');if(status)status.textContent='Saved on this device · '+el.value.trim().split(/\s+/).filter(Boolean).length+' words';}
});
app.addEventListener('change',e=>{
 const el=e.target,lv=state.level;if(!lv)return;const y=window.scrollY;
 if(el.matches('input[type=radio]')&&(el.name==='reading'||el.name==='listen')){saved.answers[lv]=saved.answers[lv]||{};saved.answers[lv][el.name]=el.value;save();renderLevel();window.scrollTo(0,y);return}
 if(el.dataset.goal){saved.goals[lv]=saved.goals[lv]||{};saved.goals[lv][el.dataset.goal]=el.checked;save();renderLevel();window.scrollTo(0,y);return}
 if(el.dataset.topicFlag&&state.topic!==null){const k=lv+':'+state.topic;saved.flags[k]=saved.flags[k]||{};saved.flags[k][el.dataset.topicFlag]=el.checked;save();topicView();window.scrollTo(0,y);return}
});
document.getElementById('back').addEventListener('click',()=>{if(state.topic!==null)goto(state.level,'topics');else goto(null)});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.level){if(state.topic!==null)goto(state.level,'topics');else goto(null)}});
render();
})();