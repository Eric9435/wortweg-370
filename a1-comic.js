/* WortWeg · Animated A1 Comic Studio · original, interactive A1 learning story.
 * Coverage: all 642 original WortWeg A1 records, exactly once (by ID).
 * Narrative dialogues are authored scene scripts; spotlight cards expose the
 * bank's words even when a term cannot naturally fit the dialogue.
 * Device-local progress is independent of main vocabulary/CEFR progress.
 */
(()=>{'use strict';
const SOURCE=window.WortWegA1ComicData,app=document.getElementById('comicMain');
if(!SOURCE||!app){if(app)app.textContent='The A1 comic data could not be loaded. Please reload online.';return;}
const eps=SOURCE.episodes,PAGE=6,KEY='wortweg370-a1-comic-v1';
const words=eps.flatMap(e=>e.words),byId=new Map(words.map(w=>[w.id,w]));
if(words.length!==642||byId.size!==642||new Set(words.map(w=>w.id)).size!==642)throw Error('A1 comic source coverage not equal to 642 unique record IDs');
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const cssId=x=>String(x).replace(/[^a-zA-Z0-9-]/g,'');
const load=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
let stored=load();
if(!stored.known||typeof stored.known!=='object')stored.known={};
if(!stored.quiz||typeof stored.quiz!=='object')stored.quiz={};
let st={chapter:null,panel:0,selected:0,meanings:false,playing:false,narrate:false,quiz:false,question:0,chosen:null,submitted:false,filter:''},auto=null;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(stored))}catch{}};
const known=id=>!!stored.known[id];
const studied=()=>words.filter(w=>known(w.id)).length;
const epiDone=e=>e.words.filter(w=>known(w.id)).length;
const panels=e=>Math.ceil(e.words.length/PAGE);
const current=e=>e.words.slice(st.panel*PAGE,(st.panel+1)*PAGE);
const progress=(done,total)=>Math.round(100*done/Math.max(1,total));
const say=(text)=>{
 if(!('speechSynthesis' in window)||typeof window.SpeechSynthesisUtterance!=='function'){message('German voice is unavailable in this browser.');return}
 try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=.86;u.pitch=1;window.speechSynthesis.speak(u)}catch{message('German voice is unavailable in this browser.')}
};
const message=s=>{const node=document.getElementById('comicStatus');if(node)node.textContent=s};
const button=(act,label,classes='',extra='')=>'<button type="button" data-action="'+E(act)+'" class="comic-btn '+classes+'" '+extra+'>'+label+'</button>';
const h=(tag,attrs,content)=>'<'+tag+' '+attrs+'>'+content+'</'+tag+'>';
const art={
city:{gradient:['#67bbdf','#f8cfb4'],symbol:'🏙️',accent:'#3c83a6'},
home:{gradient:['#c8e7eb','#fbdcb9'],symbol:'🏡',accent:'#668a9b'},
kitchen:{gradient:['#ffe9b4','#f8cba7'],symbol:'🥣',accent:'#c88a51'},
station:{gradient:['#79c7e5','#e6d7c3'],symbol:'🚊',accent:'#3e88a9'},
classroom:{gradient:['#a5d5ca','#f6dbab'],symbol:'📚',accent:'#57928f'},
market:{gradient:['#a5d2e4','#f4d6b5'],symbol:'🛍️',accent:'#d18265'},
cafe:{gradient:['#f8d5ab','#f5b8a2'],symbol:'☕',accent:'#bb8865'},
park:{gradient:['#73c8c4','#c8e9aa'],symbol:'🌳',accent:'#53a47f'},
weather:{gradient:['#84b9dc','#d7e6f0'],symbol:'🌦️',accent:'#6c9dc1'},
clinic:{gradient:['#a9d8e8','#eaf5ef'],symbol:'🩺',accent:'#61a4a0'},
office:{gradient:['#9dcce3','#f5e4c5'],symbol:'💻',accent:'#588baf'},
music:{gradient:['#a99dcd','#f6d2d2'],symbol:'🎹',accent:'#7661a5'},
travel:{gradient:['#97c9ec','#f9ddb8'],symbol:'🧳',accent:'#5d90ad'},
party:{gradient:['#f6c0cb','#e8d6ef'],symbol:'🎈',accent:'#b777b0'}
};
function svgBackdrop(e,id){
 const location=e.location,t=art[location]||art.city,grad='comicGradient'+cssId(id),sky=t.gradient[0],light=t.gradient[1];
 const clouds='<g class="comic-cloud" fill="#fff" opacity=".8"><ellipse cx="105" cy="80" rx="75" ry="22"/><circle cx="102" cy="68" r="33"/><circle cx="151" cy="74" r="24"/></g><g class="comic-cloud b" fill="#fff" opacity=".58"><ellipse cx="770" cy="114" rx="86" ry="25"/><circle cx="739" cy="99" r="31"/><circle cx="801" cy="105" r="32"/></g>';
 const windows=(x,y,n)=>Array.from({length:n},(_,i)=>'<rect x="'+(x+(i%4)*48)+'" y="'+(y+Math.floor(i/4)*46)+'" width="28" height="28" rx="5" fill="'+(i%3===0?'#eaf8fa':'#b2d8e9')+'" stroke="#316988" stroke-width="2"/>').join('');
 const buildings='<g stroke="#284f70" stroke-width="4"><rect x="25" y="176" width="240" height="310" rx="5" fill="#92bad1"/>'+windows(53,209,16)+'<rect x="730" y="204" width="210" height="290" rx="6" fill="#f6cda9"/>'+windows(753,242,16)+'</g><path d="M0 475H960V540H0Z" fill="#628ca8"/><path d="M0 481H960" stroke="#fff5" stroke-width="8" stroke-dasharray="65 33"/>';
 const tree=(x,y,size=1)=>'<g transform="translate('+x+' '+y+') scale('+size+')"><path d="M-8 0v-130h17V0" fill="#795439"/><circle cx="0" cy="-170" r="57" fill="#39967d" stroke="#155c55" stroke-width="5"/><circle cx="-38" cy="-160" r="34" fill="#56b18b"/><circle cx="35" cy="-175" r="32" fill="#79c4a0"/></g>';
 const indoor='<path d="M0 0H960V540H0" fill="#f8ecd8"/><path d="M0 409H960V540H0" fill="#c99a76"/><path d="M0 420H960" stroke="#a67755" stroke-width="6"/><rect x="30" y="72" width="263" height="222" rx="10" fill="#4e839c" stroke="#f7ffff" stroke-width="16"/><path d="M160 68V303M23 178H300" stroke="#f9ffff" stroke-width="12"/><circle cx="232" cy="102" r="27" fill="#fff4bf"/><path d="M690 420H945V357Q936 341 913 340H714Q692 350 690 372Z" fill="#d9948d" stroke="#855f6f" stroke-width="6"/><rect x="698" y="359" width="231" height="34" rx="12" fill="#efb0a0"/>';
 const kitchen=indoor+'<rect x="630" y="260" width="300" height="175" rx="9" fill="#9eb7bd" stroke="#527587" stroke-width="5"/><rect x="662" y="290" width="230" height="13" rx="5" fill="#556f81"/><circle cx="730" cy="355" r="42" fill="#dce8e6" stroke="#678a94" stroke-width="7"/><path d="M691 320H770" stroke="#678a94" stroke-width="6"/><path d="M716 262q-14-28 0-43m25 43q14-28 0-43" fill="none" stroke="#fff" stroke-width="5" class="comic-spark"/>';
 const classroom='<path d="M0 0H960V540H0" fill="#f7e2bc"/><rect x="55" y="92" width="844" height="325" rx="18" fill="#2d756d" stroke="#9f714f" stroke-width="21"/><path d="M142 183h200m-150 53h280m-220 50h145" stroke="#eaf9e0" stroke-width="9" opacity=".6" stroke-linecap="round"/><rect x="80" y="420" width="790" height="24" rx="10" fill="#aa7c50"/><rect x="110" y="442" width="18" height="100" fill="#876344"/><rect x="838" y="442" width="18" height="100" fill="#876344"/>';
 const market=buildings+'<g><rect x="26" y="286" width="280" height="145" fill="#fae8c6" stroke="#965b54" stroke-width="5"/><path d="M18 291l40-80h219l39 80" fill="#ed6a6d"/><path d="M58 212l-5 78m55-78l-7 78m54-78l-5 78m51-78l8 78" stroke="#fff6" stroke-width="15"/><rect x="45" y="355" width="250" height="36" fill="#ad6f52"/><circle cx="80" cy="341" r="19" fill="#e64740"/><circle cx="121" cy="341" r="18" fill="#f6c441"/><circle cx="165" cy="342" r="19" fill="#82b15a"/></g>';
 const cafe=buildings+'<rect x="26" y="267" width="273" height="171" rx="9" fill="#c27b60" stroke="#704d49" stroke-width="5"/><path d="M30 267h265l-20-58H50Z" fill="#fae2ca"/><text x="86" y="248" font-size="29" font-weight="900" fill="#654337">CAFÉ</text><ellipse cx="520" cy="453" rx="127" ry="21" fill="#0b385069"/><rect x="508" y="391" width="20" height="99" fill="#9b624c"/><ellipse cx="519" cy="393" rx="127" ry="18" fill="#efc58f"/>';
 const station=buildings+'<path d="M120 360Q130 285 199 284h467q70 0 84 70v115H106Z" fill="#f1ca5e" stroke="#356d8d" stroke-width="10"/><rect x="190" y="312" width="110" height="66" rx="6" fill="#c5eaf7"/><rect x="321" y="312" width="125" height="66" rx="6" fill="#c5eaf7"/><rect x="467" y="312" width="118" height="66" rx="6" fill="#c5eaf7"/><circle cx="238" cy="473" r="33" fill="#253e55" stroke="#eef7ff" stroke-width="8"/><circle cx="630" cy="473" r="33" fill="#253e55" stroke="#eef7ff" stroke-width="8"/>';
 const park='<path d="M0 350Q180 285 370 347T960 328V540H0Z" fill="#a6d797"/><path d="M0 434Q250 362 505 444T960 440V540H0Z" fill="#74b786"/><path d="M315 540Q427 431 568 356h144Q543 444 535 540" fill="#e4c9a4"/>'+tree(138,428,1)+tree(806,418,.92)+'<g fill="#f9c66d" class="comic-spark"><circle cx="76" cy="462" r="9"/><circle cx="840" cy="468" r="10"/><circle cx="881" cy="453" r="9"/></g>';
 const weather=park+'<g class="comic-cloud b"><ellipse cx="490" cy="117" rx="173" ry="40" fill="#8ba9c3"/><circle cx="433" cy="100" r="58" fill="#93b0c8"/><circle cx="560" cy="111" r="54" fill="#93b0c8"/></g>'+Array.from({length:15},(_,i)=>'<path d="M'+(315+i*24)+' '+(170+(i%3)*7)+'l-10 31" stroke="#377fb4" stroke-width="5" stroke-linecap="round" class="comic-spark"/>').join('');
 const clinic=indoor+'<rect x="700" y="92" width="170" height="159" rx="14" fill="#e9f7f2" stroke="#74aeb0" stroke-width="10"/><path d="M774 111v120m-60-60h120" stroke="#da6370" stroke-width="28"/><path d="M738 432h126" stroke="#879fa7" stroke-width="9"/>';
 const office=indoor+'<rect x="694" y="266" width="213" height="128" rx="9" fill="#203f5b" stroke="#668da0" stroke-width="10"/><path d="M720 310h155m-142 23h135m-125 23h97" stroke="#8ce2dd" stroke-width="7"/><path d="M793 391v41m-67 3h140" stroke="#48738a" stroke-width="10"/>';
 const music=indoor+'<path d="M610 375Q630 301 700 313h202v120H611Z" fill="#25364f" stroke="#122438" stroke-width="7"/><rect x="608" y="366" width="275" height="41" rx="5" fill="#f7fcff"/>'+Array.from({length:12},(_,i)=>'<path d="M'+(613+i*22)+' 369v37" stroke="#27354b" stroke-width="3"/>').join('')+Array.from({length:8},(_,i)=>'<rect x="'+(625+i*32)+'" y="368" width="13" height="25" rx="2" fill="#1c2941"/>').join('')+'<text x="792" y="189" fill="#fff" font-size="66" class="comic-spark">♫</text>';
 const travel=station+'<rect x="760" y="357" width="86" height="125" rx="13" fill="#e47b6b" stroke="#9c4d56" stroke-width="7"/><path d="M791 355v-22h24v22" fill="none" stroke="#9c4d56" stroke-width="8"/><circle cx="780" cy="483" r="11" fill="#253f5a"/><circle cx="824" cy="483" r="11" fill="#253f5a"/>';
 const party=indoor+Array.from({length:9},(_,i)=>'<g><ellipse cx="'+(110+i*96)+'" cy="'+(105+(i%3)*40)+'" rx="22" ry="32" fill="'+['#fa7782','#6cd5bc','#f5c868','#73b9ea'][i%4]+'" stroke="#fff8" stroke-width="3"/><path d="M'+(110+i*96)+' '+(137+(i%3)*40)+'q-20 30 0 60" fill="none" stroke="#fff9" stroke-width="2"/></g>').join('');
 const scenes={city:buildings,home:indoor,kitchen,classroom,market,cafe,station,park,weather,clinic,office,music,travel,party};
 const environment=scenes[location]||buildings;
 // Original vector figures, intentionally not portraits of any real person.
 const actor=(x,cls,hair,shirt,skin)=>'<g class="'+cls+'" transform="translate('+x+',0)"><ellipse cx="0" cy="494" rx="78" ry="16" fill="#15364a56"/><path d="M-35 404l-16 92h33l19-89m12-3l15 92h35l-22-94" stroke="#1e4965" stroke-width="13" stroke-linejoin="round" fill="#3a5f7d"/><path d="M-58 352q0-33 58-43 62 10 60 43l17 87h-148Z" fill="'+shirt+'" stroke="#21485f" stroke-width="5"/><path d="M-56 366l-38 44m146-47l45 39" stroke="'+skin+'" stroke-width="18" stroke-linecap="round"/><rect x="-13" y="297" width="26" height="37" fill="'+skin+'"/><ellipse cx="0" cy="250" rx="58" ry="69" fill="'+skin+'" stroke="#af775d" stroke-width="3"/><path d="M-60 249q-12-86 61-85 78 7 58 85-18-45-46-46-30 27-73 23Z" fill="'+hair+'"/><ellipse class="comic-eye" cx="-21" cy="255" rx="5" ry="7" fill="#1c2f42"/><ellipse class="comic-eye" cx="22" cy="255" rx="5" ry="7" fill="#1c2f42"/><path d="M-9 281q10 10 20 0" fill="none" stroke="#ac504b" stroke-width="4" stroke-linecap="round"/><ellipse cx="-48" cy="272" rx="11" ry="7" fill="#e69081" opacity=".7"/><ellipse cx="48" cy="272" rx="11" ry="7" fill="#e69081" opacity=".7"/></g>';
 const people=actor(280,'comic-actor-1','#473651','#e56a82','#eabb94')+actor(680,'comic-actor-2','#3c3d4d','#54a9c1','#f4c6a3');
 const screen='<svg role="img" aria-label="Animated original '+E(location)+' setting with two friendly illustrated people" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="'+grad+'" x2="0" y2="1"><stop offset="0" stop-color="'+sky+'"/><stop offset="1" stop-color="'+light+'"/></linearGradient></defs><rect width="960" height="540" fill="url(#'+grad+')"/>'+clouds+'<circle class="comic-spark" cx="838" cy="87" r="37" fill="#fce7a6" opacity=".9"/>'+environment+people+'</svg>';
 return screen;
}
const chapterCounts=()=>eps.map((e,i)=>({i,total:e.words.length,done:epiDone(e)}));
function halt(){if(auto){clearInterval(auto);auto=null}st.playing=false}
function record(){return st.chapter!==null?eps[st.chapter]:null}
function goHome(){
 halt();st.chapter=null;st.panel=0;st.quiz=false;
 renderHome();window.scrollTo(0,0);
}
function searchMatches(q){const term=q.toLocaleLowerCase().trim();if(!term)return [];
 const results=[];
 for(let i=0;i<eps.length;i++)for(let j=0;j<eps[i].words.length;j++){
   const w=eps[i].words[j];
   if((w.de+' '+w.en+' '+w.my).toLocaleLowerCase().includes(term))results.push({i,j,w});
 }
 return results;
}
function renderHome(){
 document.title='Animated A1 Comic | WortWeg 370';
 const count=studied(),chapterData=chapterCounts();
 app.innerHTML='<section class="comic-hero"><div class="comic-hero-copy"><div class="comic-eyebrow">WORTWEG ORIGINALS · 18 STORY EPISODES</div><h1>Deutsch wird<br>zum Abenteuer.</h1><p>Join Mia and Leo in animated German comic scenes. Discover every one of the 642 real A1 Word Bank entries with voice, meaning reveal, and your own learning progress.</p>'+button('continue','▶ Continue your comic','', 'data-index="'+(st.chapter||0)+'"')+'</div><div class="comic-hero-graphic" aria-hidden="true"><span>📖</span></div></section>'+
 '<div class="comic-stats"><div class="comic-stat"><span>A1 words available</span><strong>642 / 642</strong><div class="meter"><i style="width:100%"></i></div></div>'+
 '<div class="comic-stat"><span>Stories</span><strong>18</strong><div class="meter"><i style="width:100%"></i></div></div>'+
 '<div class="comic-stat"><span>Your learned words</span><strong>'+count+'</strong><div class="meter"><i style="width:'+progress(count,642)+'%"></i></div></div>'+
 '<div class="comic-stat"><span>Coverage progress</span><strong>'+progress(count,642)+'%</strong><div class="meter"><i style="width:'+progress(count,642)+'%"></i></div></div></div>'+
 '<div class="comic-toolbar"><h2>Choose a story episode</h2><input id="comicSearch" class="comic-input comic-search-field" placeholder="Search all 642 German words…" aria-label="Find any A1 word or phrase" type="search" value="'+E(st.filter)+'"></div>'+
 '<div class="comic-search-results" id="comicSearchResults" aria-live="polite"></div>'+
 '<div class="comic-chapters">'+eps.map((e,i)=>{
  const d=chapterData[i],t=art[e.location]||art.city;
  return '<button type="button" class="comic-chapter" data-action="chapter" data-index="'+i+'"><div class="comic-chapter-scene" style="--accent:'+t.accent+'"><span class="chapter-num">EPISODE '+String(i+1).padStart(2,'0')+'</span><span class="emoji" aria-hidden="true">'+t.symbol+'</span></div><div class="comic-chapter-body"><h3>'+E(e.title)+'</h3><p>'+E(e.sub)+' · '+E(e.my)+'</p><div class="comic-chapter-meta"><span>'+d.total+' A1 entries</span><span>'+d.done+' learned</span></div><div class="comic-chapter-progress"><b style="width:'+progress(d.done,d.total)+'%"></b></div></div></button>'
 }).join('')+'</div><p class="comic-notice">Complete A1 coverage means all 642 source entries appear as learnable word spotlights. The conversations are original A1-style story scripts, not a claim that all 642 words occur naturally in the dialogue. Includes duplicate forms and phrases as separate original records.</p>';
 renderSearch();
}
function renderSearch(){
 const node=document.getElementById('comicSearchResults');if(!node)return;
 const res=searchMatches(st.filter),term=st.filter.trim();
 node.innerHTML=!term?'':res.length?res.slice(0,40).map(x=>'<button type="button" data-action="jump" data-index="'+x.i+'" data-word="'+x.w.id+'"><strong>'+E(x.w.de)+'</strong><small>'+E(eps[x.i].title)+' · #'+x.w.id+'</small></button>').join('')+(res.length>40?'<p class="comic-empty">Showing first 40 of '+res.length+' matching entries. Narrow your search.</p>':''):'<p class="comic-empty">No matching A1 words. Try another search.</p>';
}
function enterChapter(i,panel=0,chosen=0){
 halt();
 if(!Number.isInteger(i)||i<0||i>=eps.length)return;
 st.chapter=i;st.panel=Math.max(0,Math.min(panels(eps[i])-1,panel));st.selected=chosen;st.quiz=false;st.submitted=false;
 renderPanel();window.scrollTo(0,0);
}
function panelProgress(e){
 let out='';for(let p=0;p<panels(e);p++)out+='<span class="'+(p===st.panel?'current':p<st.panel?'done':'')+'" title="Panel '+(p+1)+'"></span>';
 return out;
}
function renderPanel(){
 const e=record();if(!e)return renderHome();
 if(st.quiz)return renderQuiz();
 const panelWords=current(e);if(!panelWords.length){st.panel=0;return renderPanel()}
 st.selected=Math.min(st.selected,panelWords.length-1);
 const dialogues=e.beats[st.panel%e.beats.length],t=art[e.location]||art.city,active=panelWords[st.selected];
 const panelNumber=st.panel+1;
 document.title=e.title+' · Panel '+panelNumber+' | WortWeg';
 app.innerHTML='<nav class="comic-crumb">'+button('home','‹ All episodes','secondary')+'<span> / '+E(e.title)+' / Panel '+panelNumber+'</span></nav>'+
 '<article class="comic-reader"><div class="comic-reader-top"><div class="comic-reader-titles"><small>EPISODE '+String(st.chapter+1).padStart(2,'0')+' / '+eps.length+'</small><h1>'+E(e.title)+'</h1><p>'+E(e.my)+' · '+epiDone(e)+' / '+e.words.length+' learned</p></div><div class="tools">'+button('meanings',st.meanings?'Hide meanings':'Show meanings','secondary','aria-pressed="'+st.meanings+'"')+button('play',st.playing?'Ⅱ Pause auto':'▶ Auto play','secondary','aria-pressed="'+st.playing+'"')+button('narration',st.narrate?'🔈 Voice on':'🔇 Voice off','secondary','aria-pressed="'+st.narrate+'"')+button('quiz','Quick quiz','secondary')+'</div></div>'+
 '<div class="comic-screen comic-animate">'+svgBackdrop(e,st.chapter+'-'+st.panel)+
 '<div class="comic-bubble one"><div class="speaker">'+E(dialogues[0])+'</div><div class="line" lang="de">'+E(dialogues[1])+'</div><button type="button" data-action="speak-dialog" data-voice="first" aria-label="Hear the first speaker">🔊 Listen</button></div>'+
 '<div class="comic-bubble two"><div class="speaker">'+E(dialogues[2])+'</div><div class="line" lang="de">'+E(dialogues[3])+'</div><button type="button" data-action="speak-dialog" data-voice="second" aria-label="Hear the second speaker">🔊 Listen</button></div>'+
 '<div class="comic-spotlight" aria-live="polite"><small>VOCABULARY SPOTLIGHT</small><strong id="comicSpotlightWord" lang="de">'+E(active.de)+'</strong></div><div class="comic-scene-label">'+E(e.sub)+'</div><div class="comic-scene-label comic-scene-right">PANEL '+panelNumber+' / '+panels(e)+'</div></div>'+
 '<div class="comic-reader-content"><div class="comic-progress-head"><span>Comic panel '+panelNumber+' / '+panels(e)+'</span><span>'+E(e.words.length)+' source words · '+epiDone(e)+' learned</span></div><div class="comic-panel-progress">'+panelProgress(e)+'</div>'+
 '<div class="comic-words-head"><div><h2>Words in this panel</h2><p>Tap a German word to hear it, reveal its meaning or mark it learned.</p></div><span class="comic-chapter-meta">'+panelWords.length+' / '+PAGE+' spotlight entries</span></div>'+
 '<div id="comicWords" class="comic-words">'+panelWords.map((w,k)=>'<button type="button" class="comic-word" data-action="word" data-index="'+k+'" aria-pressed="'+(k===st.selected)+'"><strong lang="de">'+E(w.de)+'</strong><small>#'+w.id+' · '+E(w.type)+'</small>'+(known(w.id)?'<span class="tick" aria-label="Learned">✓</span>':'')+'</button>').join('')+'</div>'+
 '<div id="comicWordDetails">'+renderDetails(active)+'</div>'+
 '<p class="comic-lesson-note">Source word spotlight and narrated dialogue are complementary: the original WortWeg entries remain unchanged. German voice uses your device speech engine.</p><div id="comicStatus" aria-live="polite"></div></div>'+
 '<div class="comic-reader-footer">'+button('previous','‹ Previous','secondary','id="prevPanel" '+(st.panel===0?'disabled':''))+'<div class="center"><span>'+progress(epiDone(e),e.words.length)+'% vocabulary reviewed</span></div>'+button('next',st.panel===panels(e)-1?'Finish episode →':'Next panel →','','id="nextPanel"')+'</div></article>';
}
function renderDetails(w){
 if(!w)return'';
 return '<div class="comic-word-detail"><div><span class="meta">'+E(w.type).toUpperCase()+' · SOURCE WORD #'+w.id+'</span><strong lang="de">'+E(w.de)+'</strong>'+(st.meanings?'<div class="comic-translation">'+E(w.en)+(w.my?' · '+E(w.my):'')+'</div>':'<div class="comic-translation">Meaning hidden · use “Show meanings” above.</div>')+'</div><div class="actions">'+button('speak-word','🔊 Hear','secondary')+button('learn-word',known(w.id)?'✓ Learned':'Mark learned',known(w.id)?'secondary':'','aria-pressed="'+known(w.id)+'"')+'</div></div>';
}
function refreshSelection(){
 const e=record();if(!e)return;
 const panel=current(e);
 st.selected=Math.min(Math.max(0,st.selected),panel.length-1);
 app.querySelectorAll('.comic-word').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===st.selected));const word=panel[i];b.querySelector('.tick')?.remove();if(known(word.id)){const span=document.createElement('span');span.className='tick';span.setAttribute('aria-label','Learned');span.textContent='✓';b.append(span)}});
 const details=document.getElementById('comicWordDetails');if(details)details.innerHTML=renderDetails(panel[st.selected]);
 const stageWord=document.getElementById('comicSpotlightWord');if(stageWord){stageWord.textContent=panel[st.selected].de;const card=stageWord.parentElement;card.classList.remove('comic-shimmer');void card.offsetWidth;card.classList.add('comic-shimmer')}
 const metrics=document.querySelector('.comic-reader-titles p');if(metrics)metrics.textContent=e.my+' · '+epiDone(e)+' / '+e.words.length+' learned';
 const top=document.querySelector('.comic-progress-head span:last-child');if(top)top.textContent=e.words.length+' source words · '+epiDone(e)+' learned';
 const percentage=document.querySelector('.comic-reader-footer .center span');if(percentage)percentage.textContent=progress(epiDone(e),e.words.length)+'% vocabulary reviewed';
 const meanings=app.querySelector('[data-action="meanings"]');if(meanings){meanings.textContent=st.meanings?'Hide meanings':'Show meanings';meanings.setAttribute('aria-pressed',String(st.meanings))}
}
function move(delta){
 const e=record();if(!e)return;
 const nxt=st.panel+delta;
 if(nxt>=panels(e)){halt();st.quiz=true;st.submitted=false;st.question=0;st.chosen=null;renderQuiz();return}
 if(nxt<0)return;
 st.panel=nxt;st.selected=0;st.quiz=false;renderPanel();
 window.scrollTo({top:0,behavior:'instant'});
}
function autoPlay(){
 if(st.playing){halt();const b=app.querySelector('[data-action="play"]');if(b){b.textContent='▶ Auto play';b.setAttribute('aria-pressed','false')}return}
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){message('Auto-play is disabled when reduced motion is requested. Use Next panel instead.');return}
 st.playing=true;
 const b=app.querySelector('[data-action="play"]');if(b){b.textContent='Ⅱ Pause auto';b.setAttribute('aria-pressed','true')}
 if(st.narrate){const w=current(record())[st.selected];if(w)say(w.de)}
 auto=setInterval(()=>{if(document.hidden||st.chapter===null||st.quiz)return;const list=current(record());if(st.selected<list.length-1){st.selected++;refreshSelection()}else{move(1)}if(st.narrate&&!st.quiz){const w=current(record())[st.selected];if(w)say(w.de)}},2900);
}
function quizQuestions(e){
 const terms=e.words.filter(w=>w.en.trim()).slice();
 // Deterministic spaced questions, source pairs are the answer key.
 const step=Math.max(1,Math.floor(terms.length/5));
 return Array.from({length:Math.min(5,terms.length)},(_,i)=>{
   const w=terms[Math.min(terms.length-1,i*step)];
   const alternatives=terms.filter(y=>y.id!==w.id&&y.en.toLowerCase()!==w.en.toLowerCase());
   const choices=[w,...alternatives.slice((i*11)%Math.max(1,alternatives.length)).concat(alternatives.slice(0,(i*11)%Math.max(1,alternatives.length))).slice(0,3)];
   return {w,choices:choices.sort((a,b)=>(a.id*17+i*13)%97-(b.id*17+i*13)%97)};
 });
}
function renderQuiz(){
 const e=record();if(!e)return;
 const qs=quizQuestions(e),q=qs[Math.min(st.question,qs.length-1)];
 const done=Number(stored.quiz[st.chapter]||0);
 document.title='Quick Quiz · '+e.title+' | WortWeg';
 app.innerHTML='<nav class="comic-crumb">'+button('home','‹ All episodes','secondary')+'<span>/ '+E(e.title)+' / Mini Quiz</span></nav><section class="comic-reader"><div class="comic-reader-top"><div class="comic-reader-titles"><small>A1 COMIC · EPISODE '+(st.chapter+1)+'</small><h1>Episode checkpoint</h1><p>'+E(e.title)+'</p></div>'+button('close-quiz','Back to comic','secondary')+'</div>'+
 '<div class="comic-reader-content"><div class="comic-quiz"><div class="comic-progress-head"><span>Question '+(st.question+1)+' / '+qs.length+'</span><span>Best score: '+done+' / '+qs.length+'</span></div><h3>What does this German expression mean?</h3><p lang="de" style="font-size:clamp(22px,3vw,31px);font-weight:850">'+E(q.w.de)+'</p><div class="comic-quiz-options">'+q.choices.map(x=>'<button type="button" data-action="pick" data-index="'+x.id+'" aria-pressed="'+(st.chosen===x.id)+'">'+E(x.en)+'</button>').join('')+'</div>'+
 (st.submitted?'<div class="comic-quiz-feedback '+(st.chosen===q.w.id?'':'bad')+'" aria-live="polite">'+(st.chosen===q.w.id?'✓ Correct!':'✗ Correct answer: '+E(q.w.en))+'</div>':'')+
 '<div class="comic-toolbar">'+button('submit-quiz',st.submitted?'Next question →':'Check answer',st.chosen===null?'secondary':'',''+(st.chosen===null?'disabled':''))+'</div></div><p class="comic-lesson-note">This is a five-question original vocabulary checkpoint, not an official Goethe exam.</p></div></section>';
}
function handleAction(el){
 const action=el.dataset.action, idx=Number(el.dataset.index);
 if(action==='home')return goHome();
 if(action==='continue'){const first=eps.findIndex(e=>epiDone(e)<e.words.length);return enterChapter(first>=0?first:0)}
 if(action==='chapter')return enterChapter(idx);
 if(action==='jump'){const episode=eps[idx],id=Number(el.dataset.word),pos=episode.words.findIndex(w=>w.id===id);return enterChapter(idx,Math.floor(pos/PAGE),pos%PAGE)}
 if(action==='word'){st.selected=idx;return refreshSelection()}
 if(action==='previous')return move(-1);
 if(action==='next')return move(1);
 if(action==='meanings'){st.meanings=!st.meanings;return refreshSelection()}
 if(action==='play')return autoPlay();
 if(action==='narration'){st.narrate=!st.narrate;el.textContent=st.narrate?'🔈 Voice on':'🔇 Voice off';el.setAttribute('aria-pressed',String(st.narrate));if(st.narrate){const w=current(record())[st.selected];if(w)say(w.de)}else window.speechSynthesis?.cancel?.();return}
 if(action==='speak-word'){const w=current(record())[st.selected];if(w)say(w.de);return}
 if(action==='learn-word'){const w=current(record())[st.selected];if(!w)return;stored.known[w.id]=!known(w.id);save();return refreshSelection()}
 if(action==='speak-dialog'){const e=record();if(!e)return;const d=e.beats[st.panel%e.beats.length];say(d[el.dataset.voice==='first'?1:3]);return}
 if(action==='quiz'){halt();st.quiz=true;st.question=0;st.chosen=null;st.submitted=false;st._score=0;return renderQuiz()}
 if(action==='close-quiz'){st.quiz=false;return renderPanel()}
 if(action==='pick'){if(st.submitted)return;st.chosen=idx;return renderQuiz()}
 if(action==='submit-quiz'){
   if(st.chosen===null)return;
   const e=record(),qs=quizQuestions(e),q=qs[Math.min(st.question,qs.length-1)];
   if(!st.submitted){st.submitted=true;st._score=(st._score||0)+(st.chosen===q.w.id?1:0);return renderQuiz()}
   if(st.question<qs.length-1){st.question++;st.chosen=null;st.submitted=false;return renderQuiz()}
   stored.quiz[st.chapter]=Math.max(Number(stored.quiz[st.chapter]||0),st._score||0);save();
   st._score=0;st.submitted=false;st.quiz=false;
   const next=st.chapter+1<eps.length?st.chapter+1:0;return enterChapter(next);
 }
}
app.addEventListener('click',ev=>{const el=ev.target.closest('[data-action]');if(!el)return;handleAction(el)});
app.addEventListener('input',ev=>{
 if(ev.target.id==='comicSearch'){st.filter=ev.target.value;renderSearch()}
});
document.addEventListener('keydown',ev=>{
 const tag=ev.target?.tagName||'';
 if(/^(INPUT|TEXTAREA|SELECT)$/.test(tag)||ev.ctrlKey||ev.metaKey||ev.altKey)return;
 if(st.chapter===null)return;
 if(ev.key==='ArrowRight'&&!st.quiz){ev.preventDefault();move(1)}
 if(ev.key==='ArrowLeft'&&!st.quiz){ev.preventDefault();move(-1)}
 if(ev.key==='Escape'){ev.preventDefault();goHome()}
 if(ev.key===' '&&!st.quiz){ev.preventDefault();const w=current(record())[st.selected];if(w)say(w.de)}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&window.speechSynthesis)window.speechSynthesis.cancel()});
window.addEventListener('pagehide',()=>{halt();window.speechSynthesis?.cancel?.()});
window.WortWegA1Comic={getCoverage:()=>({sourceWords:words.length,uniqueIds:byId.size,episodes:eps.length,panels:eps.reduce((n,e)=>n+panels(e),0),learned:studied()}),openChapter:enterChapter,home:goHome};
renderHome();
})();