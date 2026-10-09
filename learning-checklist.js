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
root.innerHTML='<div class="ww-cl-head"><button type="button" id="ww-cl-back">← Back to Home</button><div><span class="ww-cl-kicker">YOUR GERMAN MASTER PLAN</span><h2>Learning checklist</h2><p>Track vocabulary topics and grammar from A1 to C2. Mark what you know, what you are learning, and what is left.</p></div></div><div id="ww-cl-summary"></div><div class="ww-cl-filters"><label>Level <select id="ww-cl-level"><option value="All">All levels</option>'+[...levels,'Topics'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><label>Content <select id="ww-cl-kind"><option>All</option><option>Vocabulary</option><option>Grammar</option></select></label><label>Status <select id="ww-cl-status"><option>All</option><option>Not started</option><option>Learning</option><option>Know it</option></select></label><label>Find a lesson <input id="ww-cl-query" type="search" placeholder="Search topics or grammar…"></label></div><div id="ww-cl-count"></div><div id="ww-cl-list"></div>';
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
#ww-cl-list{display:grid;gap:9px}.ww-cl-row{border:1px solid var(--line);background:var(--panel);border-radius:15px;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) 160px;gap:12px;align-items:start}
.ww-cl-row h3{font-size:15px;margin:3px 0;color:var(--txt)}.ww-cl-row small{color:var(--muted)}
.ww-cl-note{grid-column:1/-1;resize:vertical;font-size:13px;min-height:43px}
.ww-cl-status-select{font-size:13px}.ww-cl-meta{font-size:11px;font-weight:750;color:var(--accent)}
.ww-cl-row[data-state="Know it"]{border-inline-start:4px solid #15803d}
.ww-cl-row[data-state="Learning"]{border-inline-start:4px solid #d97706}
@media(max-width:650px){#ww-cl-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.ww-cl-filters{grid-template-columns:1fr 1fr}.ww-cl-filters label:last-child{grid-column:1/-1}.ww-cl-row{grid-template-columns:1fr}.ww-cl-note{grid-column:1}}
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
 for(const i of filtered){
  const row=document.createElement('article');row.className='ww-cl-row';row.dataset.state=status(i.id);
  const info=document.createElement('div');const meta=document.createElement('div');meta.className='ww-cl-meta';meta.textContent=i.kind+' · '+i.level;const h=document.createElement('h3');h.textContent=i.title;const sub=document.createElement('small');sub.textContent=i.subtitle||'';info.append(meta,h,sub);
  const select=document.createElement('select');select.className='ww-cl-status-select';select.setAttribute('aria-label','Progress for '+i.title);
  ['Not started','Learning','Know it'].forEach(st=>{const opt=document.createElement('option');opt.textContent=st;opt.value=st;select.append(opt)});select.value=status(i.id);
  select.addEventListener('change',()=>{state[i.id]={...(state[i.id]||{}),status:select.value};save();render()});
  const note=document.createElement('textarea');note.className='ww-cl-note';note.rows=1;note.placeholder='Your note (optional)…';note.setAttribute('aria-label','Note for '+i.title);note.value=state[i.id]?.note||'';
  note.addEventListener('change',()=>{state[i.id]={...(state[i.id]||{}),note:note.value};save()});
  row.append(info,select,note);list.append(row);
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