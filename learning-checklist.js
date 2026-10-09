/* In-app German curriculum checklist. Device-local, separate from quiz progress. */
(()=>{'use strict';
const dashboard=document.getElementById('dashboard'), main=document.querySelector('main');
if(!dashboard||!main||document.getElementById('ww-curriculum'))return;
const grammar={"A1":"Alphabet & spelling|Nouns and gender|Definite articles|Indefinite articles|Personal pronouns|Present tense regular verbs|Present tense irregular verbs|Sein and haben|Verb conjugation|Verb second position|Yes/no questions|W-questions|Negation nicht|Negation kein|Nominative|Accusative|Accusative articles|Possessive determiners|Plural nouns|Modal verbs können|Modal verbs müssen|Modal verbs wollen|Separable verbs|Imperative|Word order statements|Time expressions|Numbers and dates|Prepositions of place|Dative introduction|Coordinating conjunctions|Es gibt|Adjectives predicative|Formal Sie|Simple comparisons|Compound nouns|Object pronouns|Prepositions of time|Reflexive basics|Perfekt introduction|Simple sentence connectors","A2":"Perfect tense haben or sein|Past participles regular|Past participles irregular|Präteritum sein/haben|Präteritum modal verbs|Dative articles|Dative pronouns|Two-way prepositions|Movement vs location|Dative verbs|Accusative vs dative|Adjective endings after definite articles|Adjective endings after indefinite articles|Adjective endings without article|Comparative adjectives|Superlative adjectives|Subordinate clauses weil|Subordinate clauses dass|Subordinate clauses wenn|Ob clauses|Indirect questions|Reflexive verbs|Reflexive pronouns|Relative clauses basics|Infinitive with zu|Future werden|Temporal prepositions|Genitive introduction|Genitive with names|Prepositional verbs|Pronominal adverbs|Connectors deshalb trotzdem|Position of nicht|Time manner place|Verbs with two objects|Imperative revision|Conjunction obwohl|Prepositions with genitive|Passive introduction|Konjunktiv II polite requests","B1":"Relative clauses nominative|Relative clauses accusative|Relative clauses dative|Relative clauses with prepositions|Passive present|Passive past|Passive perfect|Passive with modal verbs|Konjunktiv II wäre/hätte|Konjunktiv II würde|Irrealis conditionals|Past unreal conditions|Purpose clauses um zu|Purpose clauses damit|Infinitive clauses ohne zu|Infinitive clauses statt zu|Temporal clauses bevor|Temporal clauses nachdem|Temporal clauses während|Als vs wenn|Since clauses seitdem|Until clauses bis|Causality da|Concession obwohl|Consequence sodass|Double connectors entweder oder|Double connectors weder noch|Double connectors sowohl als auch|N-declension|Adjective declension review|Genitive pronouns|Nominalization basics|Participle adjectives|Verbs with fixed prepositions|Prepositional questions|Indirect speech introduction|Plusquamperfekt|Sequence of tenses|Word order complex clauses|Connectors dennoch hingegen","B2":"Advanced subordinate clause order|Modal particles|Subjective modal verbs|Perfect infinitive|Double infinitive|Passive alternatives lassen|Passive alternatives sein zu|State passive vs process passive|Passive in past tenses|Nominalisation verbs|Nominal style formal writing|Verbal style conversion|Participles as adjectives|Extended participial attributes|Participle I vs II|Relative adverbs|Relative clauses with was|Advanced genitive constructions|Concessive obwohl wenngleich|Conditional falls sofern|Consecutive clauses|Adversative während wohingegen|Final clauses|Proportional je desto|Correlative connectors|Adverbial clauses of manner|Infinitive clause expansions|Prepositional noun phrases|Funktionsverbgefüge|Reported statements|Subjective meaning of sollen|Subjective meaning of wollen|Konjunktiv II past|Passive with modal verbs perfect|Negation scope|Advanced adjective government|Verbal prefixes meaning|Sentence brackets|Discourse markers|Coherence in argumentation","C1":"Konjunktiv I reported speech|Konjunktiv I replacement forms|Indirect commands and questions|Complex nominalization|Deverbal nouns|Complex genitive chains|Advanced participial phrases|Participial replacement clauses|Ellipsis in formal prose|Apposition structures|Information structure emphasis|Fronting and topicalization|Right dislocation|Sentence field model|Verb bracket advanced|Subjunctive distancing|Modal verb epistemic meaning|Modal nuances dürfen mögen|Counterfactual nuanced structures|Concessive inversion|Conditional inversion|Advanced passive variants|Agentless construction|Complex verbal-nominal reformulation|Academic connective structures|Text cohesion reference|Substitution and nominal anaphora|Restrictive vs nonrestrictive relatives|Embedded relative clauses|Correlative complex constructions|Complex infinitive constructions|Prepositional idiomaticity|Government and valency|Nominal phrase density|Stylistic register shifts|Hedging and qualification|Argumentative syntax|Precision of tense and aspect|Punctuation in complex clauses|Editing formal academic German"};
const levels=['A1','A2','B1','B2','C1','C2'];
let topics=[];
try{topics=JSON.parse(document.getElementById('data').textContent).topics||[]}catch{}
const items=[...topics.map((t,i)=>({id:'topic-'+t.id,kind:'Vocabulary',level:'Topics',title:t.en||t.de,subtitle:t.de})),...Object.entries(grammar).flatMap(([level,str])=>str.split('|').filter(Boolean).map((title,i)=>({id:'grammar-'+level+'-'+i,kind:'Grammar',level,title,subtitle:'Grammar lesson'})))];
const root=document.createElement('section');root.id='ww-curriculum';root.hidden=true;root.setAttribute('aria-label','German learning checklist');
root.innerHTML='<div class="ww-cl-head"><button type="button" id="ww-cl-back">← Back to Home</button><div><span class="ww-cl-kicker">YOUR GERMAN MASTER PLAN</span><h2>Learning checklist</h2><p>Track vocabulary topics and grammar from A1 to C2. Mark what you know, what you are learning, and what is left.</p></div></div><div id="ww-cl-summary"></div><div class="ww-cl-filters"><label>Level <select id="ww-cl-level"><option value="All">All levels</option>'+[...levels,'Topics'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><label>Content <select id="ww-cl-kind"><option>All</option><option>Vocabulary</option><option>Grammar</option></select></label><label>Status <select id="ww-cl-status"><option>All</option><option>Not started</option><option>Learning</option><option>Know it</option></select></label><label>Find a lesson <input id="ww-cl-query" type="search" placeholder="Search topics or grammar…"></label></div><div id="ww-cl-count"></div><div class="ww-cl-table-wrap"><table class="ww-cl-table"><thead><tr><th>#</th><th>Lesson / Topic</th><th>Type</th><th>Level</th><th>Status</th><th>Notes</th><th>Action</th></tr></thead><tbody id="ww-cl-list"></tbody></table></div>';
const css=document.createElement('style');css.textContent=`
#ww-curriculum{max-width:1050px;margin:0 auto;padding:18px 14px 90px;color:var(--txt)}
#ww-curriculum[hidden],#dashboard[hidden]{display:none!important}
#ww-curriculum .ww-cl-head{display:grid;gap:16px;margin-bottom:18px}
#ww-curriculum .ww-cl-kicker{font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--accent)}
#ww-curriculum h2{font-size:clamp(26px,4vw,38px);letter-spacing:-.04em;margin:4px 0}
#ww-curriculum p{color:var(--muted);line-height:1.55;margin:3px 0}
#ww-cl-back{justify-self:start;background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:12px;padding:11px 15px;cursor:pointer}
#ww-cl-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0}
.ww-cl-metric{background:var(--panel);border:1px solid var(--line);padding:16px;border-radius:16px;display:grid;gap:5px}
.ww-cl-metric strong{font-size:clamp(20px,3vw,30px)}.ww-cl-metric span{font-size:12px;color:var(--muted)}
.ww-cl-progress{height:9px;border-radius:20px;background:var(--panel2);overflow:hidden;grid-column:1/-1}.ww-cl-progress span{display:block;height:100%;background:var(--accent);transition:width .2s}
.ww-cl-filters{display:grid;grid-template-columns:1fr 1fr 1fr 2fr;gap:10px;margin:18px 0}
.ww-cl-filters label{font-size:12px;font-weight:700;color:var(--muted);display:grid;gap:6px}
.ww-cl-filters input,.ww-cl-filters select,.ww-cl-status-select,.ww-cl-note{width:100%;min-width:0;background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit}
#ww-cl-count{font-size:13px;color:var(--muted);margin:12px 0}
#ww-cl-list{display:table-row-group}
.ww-cl-row h3{font-size:15px;margin:3px 0;color:var(--txt)}.ww-cl-row small{color:var(--muted)}
.ww-cl-note{grid-column:1/-1;resize:vertical;font-size:13px;min-height:43px}
.ww-cl-status-select{font-size:13px}.ww-cl-meta{font-size:11px;font-weight:750;color:var(--accent)}
.ww-cl-row[data-state="Know it"]{border-inline-start:4px solid #15803d}
.ww-cl-row[data-state="Learning"]{border-inline-start:4px solid #d97706}
@media(max-width:650px){#ww-cl-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.ww-cl-filters{grid-template-columns:1fr 1fr}.ww-cl-filters label:last-child{grid-column:1/-1}.ww-cl-row{grid-template-columns:1fr}.ww-cl-note{grid-column:1}}

/* Compact overview table with sticky headers and sideways scrolling on phones. */
#ww-curriculum{max-width:1450px}
#ww-curriculum .ww-cl-table-wrap{overflow:auto;max-height:min(70vh,820px);border:1px solid var(--line);border-radius:15px;background:var(--panel)}
#ww-curriculum .ww-cl-table{border-collapse:separate;border-spacing:0;width:100%;min-width:920px;font-size:13px}
#ww-curriculum .ww-cl-table th{position:sticky;top:0;z-index:2;text-align:left;padding:13px 12px;background:var(--panel2);border-bottom:1px solid var(--line);white-space:nowrap;color:var(--txt)}
#ww-curriculum .ww-cl-table td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:middle;color:var(--txt)}
#ww-curriculum .ww-cl-table tr:last-child td{border-bottom:0}
#ww-curriculum .ww-cl-table tbody tr:hover{background:var(--panel2)}
#ww-curriculum .ww-cl-number{font-variant-numeric:tabular-nums;color:var(--muted)!important;width:40px}
#ww-curriculum .ww-cl-topic-name{min-width:230px}
#ww-curriculum .ww-cl-topic-name strong{display:block;font-weight:700}
#ww-curriculum .ww-cl-topic-name small{display:block;font-size:11px;color:var(--muted);margin-top:4px}
#ww-curriculum .ww-cl-status-select{min-width:125px;font-size:12px;padding:9px}
#ww-curriculum .ww-cl-note{min-width:160px;max-width:230px;font-size:12px;padding:9px}
#ww-curriculum .ww-cl-open{font:inherit;font-weight:700;color:var(--accent);border:1px solid var(--line);background:var(--panel);border-radius:9px;padding:9px 12px;white-space:nowrap;cursor:pointer}
#ww-curriculum .ww-cl-table-row[data-state="Know it"] .ww-cl-topic-name strong{color:#15803d}
#ww-curriculum .ww-cl-table-row[data-state="Learning"] .ww-cl-topic-name strong{color:#b9770e}
@media(max-width:650px){#ww-curriculum .ww-cl-table-wrap{max-height:65vh}}

/* Table layout repair: desktop columns fit without sideways scrolling. */
#ww-curriculum .ww-cl-table-wrap{width:100%;max-width:100%;max-height:none;overflow-x:auto;overflow-y:visible}
#ww-curriculum .ww-cl-table{width:100%;min-width:0;table-layout:fixed} #ww-curriculum .ww-cl-table tbody{display:table-row-group!important} #ww-curriculum .ww-cl-table tbody tr{display:table-row!important} #ww-curriculum .ww-cl-table tbody td{display:table-cell!important}
#ww-curriculum .ww-cl-table th,#ww-curriculum .ww-cl-table td{box-sizing:border-box;padding:10px 8px;overflow-wrap:anywhere}
#ww-curriculum .ww-cl-table th:nth-child(1){width:4%}
#ww-curriculum .ww-cl-table th:nth-child(2){width:29%}
#ww-curriculum .ww-cl-table th:nth-child(3){width:11%}
#ww-curriculum .ww-cl-table th:nth-child(4){width:9%}
#ww-curriculum .ww-cl-table th:nth-child(5){width:16%}
#ww-curriculum .ww-cl-table th:nth-child(6){width:21%}
#ww-curriculum .ww-cl-table th:nth-child(7){width:10%}
#ww-curriculum .ww-cl-topic-name{min-width:0}
#ww-curriculum .ww-cl-status-select,#ww-curriculum .ww-cl-note{min-width:0;width:100%;max-width:100%;box-sizing:border-box}
#ww-curriculum .ww-cl-open{padding:9px 6px;max-width:100%;font-size:12px}
@media(max-width:720px){
 #ww-curriculum .ww-cl-table-wrap{max-height:none;overflow-x:auto}
 #ww-curriculum .ww-cl-table{min-width:760px;table-layout:fixed}
 #ww-curriculum .ww-cl-table th:nth-child(1){width:40px}
 #ww-curriculum .ww-cl-table th:nth-child(2){width:220px}
 #ww-curriculum .ww-cl-table th:nth-child(3){width:85px}
 #ww-curriculum .ww-cl-table th:nth-child(4){width:70px}
 #ww-curriculum .ww-cl-table th:nth-child(5){width:135px}
 #ww-curriculum .ww-cl-table th:nth-child(6){width:140px}
 #ww-curriculum .ww-cl-table th:nth-child(7){width:70px}
 #ww-curriculum .ww-cl-table th:nth-child(2),#ww-curriculum .ww-cl-table td:nth-child(2){position:sticky;left:40px;z-index:1;background:var(--panel)}
 #ww-curriculum .ww-cl-table th:nth-child(1),#ww-curriculum .ww-cl-table td:nth-child(1){position:sticky;left:0;z-index:1;background:var(--panel)}
 #ww-curriculum .ww-cl-table th:nth-child(1),#ww-curriculum .ww-cl-table th:nth-child(2){z-index:3;background:var(--panel2)}
}
`;document.head.append(css);dashboard.before(root);
const $=id=>root.querySelector('#'+id);
const account=()=>String(window.WortWegAccountSnapshot?.uid||'guest');
const storageKey=()=> 'wortweg370-curriculum-v1:'+account();
let state={};
function load(){try{const data=JSON.parse(localStorage.getItem(storageKey())||'{}');state=data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{state={}}}
function save(){try{localStorage.setItem(storageKey(),JSON.stringify(state))}catch{}}
const status=id=>state[id]?.status||'Not started';
function render(){
 const total=items.length,done=items.filter(i=>status(i.id)==='Know it').length,learning=items.filter(i=>status(i.id)==='Learning').length;
 $('ww-cl-summary').innerHTML='';
 [['Total lessons',total],['Know it',done],['Learning',learning],['Left to learn',total-done]].forEach(([label,value])=>{const div=document.createElement('div');div.className='ww-cl-metric';const strong=document.createElement('strong');strong.textContent=value;const span=document.createElement('span');span.textContent=label;div.append(strong,span);$('ww-cl-summary').append(div)});
 const progress=document.createElement('div');progress.className='ww-cl-progress';const bar=document.createElement('span');bar.style.width=(total?Math.round(done/total*100):0)+'%';progress.append(bar);$('ww-cl-summary').append(progress);
 const level=$('ww-cl-level').value,kind=$('ww-cl-kind').value,filter=$('ww-cl-status').value,q=$('ww-cl-query').value.trim().toLocaleLowerCase();
 const filtered=items.filter(i=>(level==='All'||i.level===level)&&(kind==='All'||i.kind===kind)&&(filter==='All'||status(i.id)===filter)&&(!q||(i.title+' '+i.subtitle).toLocaleLowerCase().includes(q)));
 $('ww-cl-count').textContent=filtered.length+' lessons shown · Progress saved on this device for this account';
 const list=$('ww-cl-list');list.replaceChildren();
 const tableWrap=root.querySelector('.ww-cl-table-wrap');if(tableWrap)tableWrap.scrollLeft=0;
 const makeCell=(row,text,cls)=>{const td=document.createElement('td');if(cls)td.className=cls;if(text!==undefined)td.textContent=text;row.append(td);return td;};
 for(const i of filtered){
  const tr=document.createElement('tr');tr.className='ww-cl-table-row';tr.dataset.state=status(i.id);
  makeCell(tr,String(items.indexOf(i)+1),'ww-cl-number');
  const title=makeCell(tr,undefined,'ww-cl-topic-name');const strong=document.createElement('strong');strong.textContent=i.title;title.append(strong);
  if(i.subtitle&&i.subtitle!==i.title){const sub=document.createElement('small');sub.textContent=i.subtitle;title.append(sub);}
  makeCell(tr,i.kind);makeCell(tr,i.level);
  const statusCell=makeCell(tr,undefined);
  const select=document.createElement('select');select.className='ww-cl-status-select';select.setAttribute('aria-label','Progress for '+i.title);
  ['Not started','Learning','Know it'].forEach(st=>{const opt=document.createElement('option');opt.textContent=st;opt.value=st;select.append(opt)});select.value=status(i.id);
  select.addEventListener('change',()=>{state[i.id]={...(state[i.id]||{}),status:select.value};save();render()});
  statusCell.append(select);
  const noteCell=makeCell(tr,undefined);
  const note=document.createElement('input');note.className='ww-cl-note';note.type='text';note.placeholder='Add note…';note.setAttribute('aria-label','Note for '+i.title);note.value=state[i.id]?.note||'';
  note.addEventListener('input',()=>{state[i.id]={...(state[i.id]||{}),note:note.value};save()});
  noteCell.append(note);
  const actionCell=makeCell(tr,undefined);const action=document.createElement('button');action.type='button';action.className='ww-cl-open';action.textContent='Open ↗';action.setAttribute('aria-label','Open '+i.title);
  action.addEventListener('click',()=>{
   close();
   if(i.kind==='Grammar'){window.WortWegGrammar?.open?.();return;}
   const topicButtons=[...document.querySelectorAll('#topicList [data-topic-id],#topicList button,#topicList a')];
   const target=topicButtons.find(b=>String(b.dataset.topicId||'')===i.id.slice(6))||topicButtons.find(b=>b.textContent?.toLowerCase().includes(i.title.toLowerCase()));
   if(target){target.click();return;}
   const topicNav=document.querySelector('[data-nav="topics"]');if(topicNav)topicNav.click();
  });
  actionCell.append(action);list.append(tr);
 }
}
function open(){load();dashboard.hidden=true;root.hidden=false;render();window.scrollTo({top:0,behavior:'instant'})}
function close(){root.hidden=true;dashboard.hidden=false;window.scrollTo({top:0,behavior:'instant'})}
$('ww-cl-back').addEventListener('click',close);
['ww-cl-level','ww-cl-kind','ww-cl-status','ww-cl-query'].forEach(id=>$(id).addEventListener(id==='ww-cl-query'?'input':'change',render));
window.addEventListener('wortweg:account',()=>{if(!root.hidden){load();render()}});
window.WortWegChecklist={open,close};
const launch=document.createElement('button');
launch.type='button';
launch.className='ww-cl-home-launch';
launch.innerHTML='<span class="ww-cl-home-icon" aria-hidden="true">☑</span><span class="ww-cl-home-copy"><strong>German Learning Checklist</strong><small>A1–C2 roadmap · Topics, grammar & notes</small></span><span class="ww-cl-home-arrow" aria-hidden="true">›</span>';
launch.addEventListener('click',open);
// Place Checklist as a normal row in the existing Home menu, beside Grammar Academy.
launch.id='ww-cl-menu-launch';
// Remove any obsolete floating launcher left by an older Home script.
dashboard.querySelectorAll('#ww-home-focus > button.ww-home-focus-tile, #ww-home-focus > button.ww-cl-home-launch').forEach(node=>node.remove());
launch.className='ww-menu-option ww-grammar-menu-card ww-cl-menu-row';
launch.removeAttribute('style');
launch.innerHTML='<span class="ww-menu-icon" aria-hidden="true">☑</span><span class="ww-grammar-label"><strong>German Learning Checklist</strong><small>Topics, grammar, progress & notes</small></span><span class="ww-menu-arrow" aria-hidden="true">›</span>';
const rowStyle=document.createElement('style');
rowStyle.textContent=`
#dashboard .ww-menu-options .ww-cl-menu-row{display:flex;width:100%;align-items:center;gap:12px;text-align:left;cursor:pointer;color:var(--txt)}
#dashboard .ww-menu-options .ww-cl-menu-row .ww-grammar-label{flex:1;min-width:0;display:grid;gap:4px}
#dashboard .ww-menu-options .ww-cl-menu-row .ww-grammar-label small{color:var(--muted)}
`;document.head.append(rowStyle);
function installMenuRow(){
 const menu=dashboard.querySelector('.ww-menu-options');
 if(!menu)return;
 const grammar=menu.querySelector('#wg-grammar-launch');
 if(grammar){if(launch.parentElement!==menu||launch.previousElementSibling!==grammar)grammar.after(launch);}
 else if(launch.parentElement!==menu)menu.prepend(launch);
}
installMenuRow();
// Grammar Academy mounts asynchronously; re-position when available.
const menuObserver=new MutationObserver(()=>installMenuRow());
menuObserver.observe(dashboard,{childList:true,subtree:true});
})();