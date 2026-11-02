/* WortWeg Lifetime V1/V2/V3 · source-labelled dictionary browser.
 * The expanded data is a Wiktionary-derived snapshot, not a claim that every German verb is present.
 * Word Bank verbs are identified by explicit type tags, never by an -en suffix alone. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const el=(tag,cls,label)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(label!==undefined)node.textContent=label;return node;};
const model=window.WortWegVerbFormsData;
const state={verbs:new Map(),bank:new Map(),dictionary:false,wordBank:false,page:1,filtered:[],size:75};
const manual=[
['sein','war','gewesen','sein'],['zugrunde legen','legte zugrunde','zugrunde gelegt','haben'],['abschätzen','schätzte ab','abgeschätzt','haben'],
['extrapolieren','extrapolierte','extrapoliert','haben'],['generalisieren','generalisierte','generalisiert','haben'],
['attribuieren','attribuierte','attribuiert','haben'],['dekonstruieren','dekonstruierte','dekonstruiert','haben'],
['dissimulieren','dissimulierte','dissimuliert','haben'],['fragmentieren','fragmentierte','fragmentiert','haben'],
['kanonisieren','kanonisierte','kanonisiert','haben'],['kontextualisieren','kontextualisierte','kontextualisiert','haben'],
['rekontextualisieren','rekontextualisierte','rekontextualisiert','haben'],
['vergegenwärtigen','vergegenwärtigte','vergegenwärtigt','haben'],
['verobjektivieren','verobjektivierte','verobjektiviert','haben'],
['verschränken','verschränkte','verschränkt','haben'],
['zuspitzen','spitzte zu','zugespitzt','haben']];
const fixedReflexive={erinnern:['erinnerte sich','erinnert'],freuen:['freute sich','gefreut'],interessieren:['interessierte sich','interessiert'],treffen:['traf sich','getroffen'],ärgern:['ärgerte sich','geärgert'],kümmern:['kümmerte sich','gekümmert']};
const key=s=>String(s||'').trim().toLocaleLowerCase('de').normalize('NFC');
const clean=s=>String(s||'').trim();
function normHeadword(s){let v=key(s);
 if(v.startsWith('sich '))v=v.slice(5);
 if(v.endsWith(' von'))v=v.slice(0,-4);
 return v;}
function priority(source){return source==='Wiktionary'?3:source==='Manual'?2:1;}
function put(row){const v=key(row.v1);if(!v)return;
 const before=state.verbs.get(v);
 if(!before||priority(row.source)>priority(before.source))state.verbs.set(v,{...before,...row,v1:v});
}
for(const [v1,v2,v3,aux] of manual)put({v1,v2,v3,aux,source:'Manual'});
function enrich(){for(const word of state.bank.values()){
 let core=state.verbs.get(word.core);
 if(!core){core={v1:word.core,v2:'—',v3:'—',aux:'—',source:'Review needed'};state.verbs.set(word.core,core);}
 core.isWortWeg=true;
 if(!core.english&&word.english)core.english=word.english;
 if(!core.myanmar&&word.myanmar)core.myanmar=word.myanmar;
 core.levels=[...new Set([...(core.levels||[]),...word.levels])].sort();
 if(word.reflexive){
  const f=fixedReflexive[word.core];
  if(f){core.reflexive={v1:'sich '+word.core,v2:f[0],v3:f[1]};}
 }
 if(word.preposition)core.preposition=word.preposition;
}}
function stats(){const list=[...state.verbs.values()],word=[...state.bank.values()];
 $('total').textContent=list.length.toLocaleString('en-US');
 $('reviewed').textContent=word.length.toLocaleString('en-US');
 $('pattern').textContent=list.filter(w=>!w.isWortWeg).length.toLocaleString('en-US');
 $('unknown').textContent=list.filter(w=>w.source==='Review needed'||w.v2==='—'||w.v3==='—').length.toLocaleString('en-US');
}
const filters={query:$('query'),level:$('level'),status:$('status'),collection:$('collection')};
function output(){
 const search=key(filters.query.value),level=filters.level.value,status=filters.status.value,collection=filters.collection.value;
 // Keep source headwords distinct: treffen / sich treffen, abstrahieren / abstrahieren von.
 const candidates=collection==='wortweg'
  ? [...state.bank.values()].map(w=>{
     const base=state.verbs.get(w.core)||{v1:w.core,v2:'—',v3:'—',aux:'—',source:'Review needed'};
     const reflex=w.original.startsWith('sich ') ? fixedReflexive[w.core] : null;
     return {...base,v1:w.original,v2:reflex?reflex[0]:base.v2,v3:reflex?reflex[1]:base.v3,
       english:w.english,myanmar:w.myanmar,levels:[...w.levels].sort(),isWortWeg:true};
    })
  : [...state.verbs.values()];
 state.filtered=candidates.filter(v=>{
 if(collection==='additional'&&v.isWortWeg)return false;
 if(level!=='All'&&!(v.levels||[]).includes(level))return false;
 if(status!=='all'&&v.source!==status)return false;
 if(search&&!([v.v1,v.v2,v.v3,v.english||'',v.myanmar||'',v.aux||'',...(v.levels||[]),v.preposition||'',v.reflexive?.v1||''].some(x=>key(x).includes(search))))return false;
 return true;
 }).sort((a,b)=>a.v1.localeCompare(b.v1,'de'));
 const pages=Math.max(1,Math.ceil(state.filtered.length/state.size));state.page=Math.max(1,Math.min(state.page,pages));
 const tbody=$('rows');const frag=document.createDocumentFragment();
 for(const item of state.filtered.slice((state.page-1)*state.size,state.page*state.size)){
  const tr=el('tr');
  const values=[item.v1,item.v2,item.v3,item.english||'—',item.myanmar||'—',(item.levels||[]).join(', ')||'—',item.aux||'—'];
  for(const val of values){const td=el('td','',val);tr.append(td);}
  const td=el('td');const tag=el('span','flag '+(item.source==='Wiktionary'?'reviewed':item.source==='Manual'?'derived':'unverified'),
   item.source==='Wiktionary'?'Dictionary':item.source==='Manual'?'Curated':'Check form');td.append(tag);tr.append(td);frag.append(tr);
 }
 if(!frag.childNodes.length){
   const tr=el('tr'),td=el('td','','No verbs match these filters. Try All levels and All forms.');
   td.colSpan=8;td.className='empty-results';tr.append(td);frag.append(tr);
 }
 tbody.replaceChildren(frag);
 $('page').textContent='Page '+state.page+' / '+pages;
 $('previous').disabled=state.page===1;$('next').disabled=state.page===pages;
 $('result').textContent=state.filtered.length.toLocaleString('en-US')+' matching entries · '+(state.dictionary?'dictionary ready':'loading dictionary')+' · '+(state.wordBank?'WortWeg matched':'matching WortWeg words');
 stats();
}
function ingestWortWeg(raw){if(!Array.isArray(raw.bank))throw Error('Word Bank format missing');
 const rows=[...raw.bank,...(Array.isArray(raw.curated)?raw.curated:[])];
 for(const w of rows){
  if(!['verb','modal verb'].includes(w.type))continue;
  const original=key(w.de),core=normHeadword(original);
  if(!core||(core.includes(' ')&&core!=='zugrunde legen')||(!(/^(?:[a-zäöüß][a-zäöüß-]{1,80})$/u.test(core))&&core!=='zugrunde legen'))continue;
  let entry=state.bank.get(original);
  if(!entry){entry={original,core,levels:new Set(),english:'',myanmar:'',reflexive:false,preposition:''};state.bank.set(original,entry);}
  if(w.level)entry.levels.add(w.level);
  if(!entry.english&&w.en)entry.english=clean(w.en);
  if(!entry.myanmar&&(w.mm||w.my))entry.myanmar=clean(w.mm||w.my);
  if(original.startsWith('sich '))entry.reflexive=true;
  if(original.endsWith(' von'))entry.preposition='von';
 }
 enrich();state.wordBank=true;output();
}
async function loadDict(){try{const res=await fetch('./assets/german-verbs-lifetime.json');if(!res.ok)throw Error('HTTP '+res.status);const data=await res.json();
 if(data.version!==1||!Array.isArray(data.rows)||data.rows.length<7500)throw Error('Dictionary invalid');
 for(const [v1,v2,v3,aux] of data.rows)if(v1&&v2&&v3)put({v1,v2,v3,aux:aux||'—',source:'Wiktionary'});
 state.dictionary=true;$('source-status').textContent='';enrich();output();
 }catch(e){$('source-status').textContent='Expanded dictionary unavailable offline. Please reconnect to download the verb data.';output();}}
async function loadBank(){try{
 // Storage may be blocked in private browsing or Android WebView.
 let handoff=null;
 try{handoff=sessionStorage.getItem('wortweg:verb-forms:source:v3');}catch{}
 if(handoff){
  try{
   const rows=JSON.parse(handoff);
   if(Array.isArray(rows)&&rows.length>=10){ingestWortWeg({bank:rows,curated:[]});$('wordbank-status').textContent='';return;}
  }catch(e){console.warn('Verb handoff unavailable; using original Word Bank',e);}
 }
 const res=await fetch('./index.html');if(!res.ok)throw Error('HTTP '+res.status);
 const doc=new DOMParser().parseFromString(await res.text(),'text/html');const node=doc.getElementById('data');
 if(!node)throw Error('Word Bank missing');const data=JSON.parse(node.textContent);
 ingestWortWeg(data);$('wordbank-status').textContent='';
 }catch(e){$('wordbank-status').textContent='WortWeg matching unavailable; the standalone dictionary is still usable.';output();}}
function csv(){const rows=[['V1','V2','V3','English (WortWeg)','Myanmar (WortWeg)','CEFR (WortWeg)','Auxiliary','Source'],...state.filtered.map(v=>[v.v1,v.v2,v.v3,v.english||'',v.myanmar||'',(v.levels||[]).join(';'),v.aux||'',v.source])];
 const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const blob=new Blob(['\ufeff',rows.map(row=>row.map(esc).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='WortWeg_Lifetime_V1_V2_V3.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
for(const control of Object.values(filters))control.addEventListener(control.tagName==='INPUT'?'input':'change',()=>{
 if(control===filters.collection){
  // The external lexicon has no honest CEFR classification; do not infer a level.
  const external=filters.collection.value==='additional';
  if(external)filters.level.value='All';
  filters.level.disabled=external;
  $('level-note').textContent=external?'CEFR levels are available only for WortWeg course verbs.':'CEFR labels come from WortWeg only; external dictionary words are not level-rated.';
 }
 state.page=1;output();
});
$('previous').addEventListener('click',()=>{state.page--;output();document.querySelector('.scroll').scrollTop=0;});
$('next').addEventListener('click',()=>{state.page++;output();document.querySelector('.scroll').scrollTop=0;});
$('csv').addEventListener('click',csv);
$('reset').addEventListener('click',()=>{
 filters.query.value='';filters.level.value='All';filters.level.disabled=false;filters.status.value='all';filters.collection.value='all';$('level-note').textContent='CEFR labels come from WortWeg only; external dictionary words are not level-rated.';
 state.page=1;output();filters.query.focus();
});
$('retry').addEventListener('click',()=>{loadDict();loadBank();});
window.WortWegLifetimeVerbs={get total(){return state.verbs.size},get wortweg(){return state.bank.size}};
output();loadDict();loadBank();
})();