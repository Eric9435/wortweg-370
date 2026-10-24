/* Reading Word Explorer: local bilingual dictionary, no remote translation calls */
(()=>{
'use strict';
if(window.WortWegWordExplorer)return;
const style=document.createElement('style');style.textContent=".wwr-de .wwr-word{cursor:help;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:3px;border-radius:3px}\n.wwr-de .wwr-word:hover,.wwr-de .wwr-word:focus-visible{background:#dbeaff!important;text-decoration-color:#2868b0;outline:2px solid #a1c8f5}\n.wwr-de .wwr-word.wwx-picked{background:#cde7ff!important}\n.wwx-tip{position:fixed!important;z-index:2147482100!important;max-width:min(310px,calc(100vw - 20px));min-width:190px;padding:12px 14px;border-radius:12px;background:#173452;color:white;box-shadow:0 13px 36px #13293f66;pointer-events:none;box-sizing:border-box;font-family:system-ui,sans-serif;font-size:13px;line-height:1.6}\n.wwx-tip[hidden],.wwx-card[hidden]{display:none!important}\n.wwx-tip strong{font-size:17px}.wwx-tip small{display:block;border-top:1px solid #496783;padding-top:6px;margin-top:8px;color:#bcd5ee}.wwx-tip .wwx-my{color:#dcecff}\n.wwx-card{position:fixed!important;z-index:2147482101!important;right:16px;top:60px;box-sizing:border-box;width:min(460px,calc(100vw - 32px));max-height:calc(100dvh - 84px);overflow:auto;overscroll-behavior:contain;border-radius:17px;background:#fff;border:1px solid #cad9eb;color:#1b3450;box-shadow:0 20px 70px #0d2b4b55;font-family:system-ui,sans-serif}\n.wwx-head{display:flex;gap:14px;justify-content:space-between;align-items:flex-start;position:sticky;top:0;background:#f3f8ff;border-bottom:1px solid #dfebf5;padding:16px 18px;z-index:1}\n.wwx-head h3{font-size:25px;margin:5px 0;line-height:1.2;color:#152e4c}.wwx-head small{font-size:11px;color:#657d99}.wwx-head button{font-size:18px!important;padding:5px 10px!important}\n.wwx-body{padding:15px 18px;display:flex;flex-direction:column;gap:13px}\n.wwx-section{border-bottom:1px solid #e4eaf3;padding-bottom:11px}.wwx-section:last-child{border:0;padding:0}\n.wwx-label{font-size:10px;font-weight:800;letter-spacing:.1em;color:#5b7491;text-transform:uppercase;margin-bottom:5px}\n.wwx-value{font-size:15px;line-height:1.78;overflow-wrap:anywhere;white-space:pre-wrap}\n.wwx-context .wwx-value{font-size:14px;background:#f3f7fc;padding:10px;border-radius:9px}\n.wwx-note .wwx-value{font-size:12px;color:#5c7087}.wwx-actions{display:flex;gap:8px;flex-wrap:wrap}\n.wwx-actions button{font-size:13px!important;padding:9px 12px!important}.wwx-actions .wwx-listen{background:#194c90!important;color:#fff!important;border-color:#194c90!important}\n@media(max-width:700px){.wwx-card{left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;max-height:72dvh;border-radius:19px 19px 0 0;padding-bottom:env(safe-area-inset-bottom)}}";document.head.append(style);
const CORE="ich|I|ကျွန်တော် / ကျွန်မ|Pronoun|Nominative\nmich|me|ကျွန်တော့်ကို / ကျွန်မကို|Pronoun|Accusative\nmir|to me|ကျွန်တော့်ကို / ကျွန်မကို|Pronoun|Dative\ndu|you (informal)|မင်း|Pronoun|Informal\ndich|you|မင်းကို|Pronoun|Accusative\ndir|to you|မင်းကို|Pronoun|Dative\ner|he|သူ (အမျိုးသား)|Pronoun|Masculine\nsie|she / they / formal you|သူမ / သူတို့ / သင်|Pronoun|Depends on context\nes|it|အဲဒါ|Pronoun|Neuter\nwir|we|ကျွန်ုပ်တို့|Pronoun|Plural\nuns|us|ကျွန်ုပ်တို့ကို|Pronoun|Accusative or dative\nihr|you (plural) / her|မင်းတို့ / သူမ၏|Pronoun|Context dependent\nihm|to him|သူ့ကို|Pronoun|Dative\nihnen|to them / formal you|သူတို့ကို / သင့်ကို|Pronoun|Dative\nmein|my|ကျွန်တော့် / ကျွန်မရဲ့|Possessive|Endings vary\nmeine|my|ကျွန်တော့် / ကျွန်မရဲ့|Possessive|Inflected mein\nmeinen|my|ကျွန်တော့် / ကျွန်မရဲ့|Possessive|Inflected mein\nmeinem|my|ကျွန်တော့် / ကျွန်မရဲ့|Possessive|Inflected mein\nmeines|my|ကျွန်တော့် / ကျွန်မရဲ့|Possessive|Inflected mein\nseine|his / its|သူ့ရဲ့|Possessive|Inflected sein\nihre|her / their / formal your|သူမရဲ့ / သူတို့ရဲ့ / သင့်ရဲ့|Possessive|Context dependent\nder|the|တိကျနာမ်ရှေ့ဆောင်း|Article|Masculine nominative / other cases\ndie|the|တိကျနာမ်ရှေ့ဆောင်း|Article|Feminine singular / plural\ndas|the|တိကျနာမ်ရှေ့ဆောင်း|Article|Neuter\nden|the|တိကျနာမ်ရှေ့ဆောင်း|Article|Accusative masculine / dative plural\ndem|the|တိကျနာမ်ရှေ့ဆောင်း|Article|Dative\ndes|the|တိကျနာမ်ရှေ့ဆောင်း|Article|Genitive\nein|a / an|တစ်ခု / တစ်ဦး|Article|Indefinite\neine|a / an|တစ်ခု / တစ်ဦး|Article|Feminine\neinen|a / an|တစ်ခု / တစ်ဦး|Article|Accusative masculine\neinem|a / an|တစ်ခု / တစ်ဦး|Article|Dative\neiner|a / an|တစ်ခု / တစ်ဦး|Article|Feminine dative/genitive\nund|and|နှင့် / ပြီးတော့|Conjunction|Coordinating\noder|or|ဒါမှမဟုတ်|Conjunction|Alternative\naber|but|ဒါပေမယ့်|Conjunction|Contrast\nsondern|but rather|အဲဒီအစား|Conjunction|After negation\nweil|because|ဘာကြောင့်လဲဆိုတော့|Conjunction|Subordinate verb-final\ndenn|because|ဘာကြောင့်လဲဆိုတော့|Conjunction|Main-clause word order\ndass|that|ဟု / ဆိုတာ|Conjunction|Content clause\nwenn|if / whenever|အကယ်၍ / အခါတိုင်း|Conjunction|Conditional\nals|when / than|အချိန်မှာ / ထက်|Conjunction|Context dependent\nobwohl|although|သော်လည်း|Conjunction|Contrast\nauch|also / too|လည်း|Adverb|Addition\nnicht|not|မ...ဘူး|Negation|Negation\nkein|no / not a|မရှိသော|Negation|Inflects like ein\nkeine|no / not any|မရှိသော|Negation|Inflected kein\nnur|only|ပဲ / သာ|Adverb|Limit\nsehr|very|အလွန်|Adverb|Degree\nviel|much / a lot|အများကြီး|Quantity|Amount\nviele|many|များစွာ|Quantity|Plural\nmehr|more|ပိုပြီး|Quantity|Comparative\netwas|something / a little|တစ်စုံတစ်ခု / အနည်းငယ်|Pronoun|Context dependent\nhier|here|ဒီမှာ|Adverb|Location\ndort|there|အဲဒီမှာ|Adverb|Location\nheute|today|ဒီနေ့|Adverb|Time\nmorgen|tomorrow / morning|မနက်ဖြန် / မနက်|Adverb / noun|Capitalization matters\ngestern|yesterday|မနေ့က|Adverb|Time\njetzt|now|အခု|Adverb|Time\ndann|then|အဲဒီနောက်|Adverb|Sequence\ndanach|afterwards|ပြီးနောက်|Adverb|Sequence\nimmer|always|အမြဲ|Adverb|Frequency\noft|often|မကြာခဏ|Adverb|Frequency\nmanchmal|sometimes|တစ်ခါတစ်ရံ|Adverb|Frequency\nwieder|again|ထပ်မံ|Adverb|Repetition\nschon|already|ပြီးသား|Adverb|Time\nzuerst|first|ပထမဆုံး|Adverb|Sequence\nin|in / into|အထဲမှာ / အထဲသို့|Preposition|Dative or accusative\nim|in the|အထဲမှာ|Preposition|in + dem\nam|at the|မှာ|Preposition|an + dem\nauf|on / onto|အပေါ်မှာ / အပေါ်သို့|Preposition|Dative or accusative\naus|from / out of|မှ / အထဲက|Preposition|Dative\nbei|at / near|မှာ / အနီး|Preposition|Dative\nbeim|at the / while|မှာ / လုပ်နေစဉ်|Preposition|bei + dem\nmit|with|နှင့် / အတူ|Preposition|Dative\nohne|without|မပါဘဲ|Preposition|Accusative\nfür|for|အတွက်|Preposition|Accusative\nzu|to / too|သို့ / လွန်းသော|Preposition / adverb|Context dependent\nzum|to the|သို့|Preposition|zu + dem\nzur|to the|သို့|Preposition|zu + der\nvon|from / of|မှ / ၏|Preposition|Dative\nnach|after / to|ပြီးနောက် / သို့|Preposition|Dative\nseit|since / for|ကတည်းက|Preposition|Dative\nüber|over / about|အပေါ် / အကြောင်း|Preposition|Dative or accusative\nunter|under / among|အောက် / အကြား|Preposition|Dative or accusative\nvor|before / in front|မတိုင်မီ / ရှေ့မှာ|Preposition|Dative or accusative\ndurch|through|ဖြတ်သန်း၍|Preposition|Accusative\nbis|until|အထိ|Preposition|Time\num|around / at|ပတ်လည် / အချိန်မှာ|Preposition|Context dependent\nwie|how / like|ဘယ်လို / ကဲ့သို့|Question word|Context dependent\nwas|what|ဘာ|Question word|Object\nwer|who|ဘယ်သူ|Question word|Subject\nwo|where|ဘယ်မှာ|Question word|Location\nwarum|why|ဘာကြောင့်|Question word|Reason\nist|is|ဖြစ်သည် / ရှိသည်|Verb|sein\nbin|am|ဖြစ်သည်|Verb|sein\nbist|are|ဖြစ်သည်|Verb|sein\nsind|are|ဖြစ်ကြသည်|Verb|sein\nwar|was|ဖြစ်ခဲ့သည်|Verb|sein past\nwaren|were|ဖြစ်ခဲ့ကြသည်|Verb|sein past\nhat|has|ရှိသည်|Verb|haben\nhabe|have|ရှိသည်|Verb|haben\nhatte|had|ရှိခဲ့သည်|Verb|haben past\nwird|becomes / will|ဖြစ်လာသည် / မည်|Verb|werden\nwurden|became / were|ဖြစ်လာခဲ့သည်|Verb|werden past\nkann|can|နိုင်သည်|Modal|können\nkonnte|could|နိုင်ခဲ့သည်|Modal|können\nmuss|must|လုပ်ရမယ်|Modal|müssen\nmusste|had to|လုပ်ရခဲ့သည်|Modal|müssen\nmöchte|would like|လိုချင်ပါတယ်|Modal|Polite wish\nmöchten|would like|လိုချင်သည်|Modal|Polite wish\nwill|want|လိုချင်သည်|Modal|wollen\nwollte|wanted|လိုချင်ခဲ့သည်|Modal|wollen\nsollte|should|သင့်တယ်|Modal|sollen\nhamburg|Hamburg city|ဟမ်းဘတ်မြို့|Proper noun|German city\nmyanmar|Myanmar|မြန်မာနိုင်ငံ|Proper noun|Country\ndeutschland|Germany|ဂျာမနီနိုင်ငံ|Proper noun|Country\nlina|Lina (first name)|လီနာ (နာမည်)|Proper noun|Name\nmin|Min (first name)|မင်း (နာမည်)|Proper noun|Name\nsara|Sara (first name)|ဆာရာ (နာမည်)|Proper noun|Name\nsofia|Sofia (first name)|ဆိုဖီယာ (နာမည်)|Proper noun|Name\nemma|Emma (first name)|အမ်မာ (နာမည်)|Proper noun|Name\nhelga|Helga (first name)|ဟယ်လ်ဂါ (နာမည်)|Proper noun|Name\njonas|Jonas (first name)|ဂျိုးနပ်စ် (နာမည်)|Proper noun|Name\ndaniel|Daniel (first name)|ဒန်နီယယ် (နာမည်)|Proper noun|Name\nanna|Anna (first name)|အန်နာ (နာမည်)|Proper noun|Name";
const clean=s=>String(s||'').normalize('NFC').toLocaleLowerCase('de').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
const words=new Map(),article=/^(der|die|das)\s+/i;
function add(w,en,my,pos='',source='Local',extra={}){
 const full=String(w||'').trim(),key=clean(full);if(!key||!String(en||'').trim())return;
 const match=key.match(article),base=match?key.replace(article,''):key;
 const entry={base:match?full.replace(article,''):full,en:String(en),my:String(my||''),pos,
  article:match?match[1]:'',source,notes:extra.notes||'',pron:extra.pron||'',plural:extra.plural||'',example:extra.example||''};
 if(!words.has(key))words.set(key,entry);if(!words.has(base))words.set(base,entry);
}
for(const line of CORE.split('\n')){const x=line.split('|');if(x.length===5)add(x[0],x[1],x[2],x[3],'Grammar essentials',{notes:x[4]});}
let bank=false,special=false;
function load(){
 if(!bank){
  try{
   const data=JSON.parse(document.getElementById('data')?.textContent||'null');
   if(Array.isArray(data?.bank)){
    for(const w of [...(data.curated||[]),...data.bank])add(w.de,w.en||w.english,w.my||w.mm,w.pos||w.type||'','WortWeg Word Bank',{notes:w.gram,pron:w.pron,plural:w.plural||w.pl,example:w.example});
    bank=true;
   }
  }catch{}
 }
 if(!special){
  const w=window.WortWegSpecialVocabulary?.getLookupWords?.();
  if(Array.isArray(w)){for(const x of w)add(x.de,x.en,x.my,x.category,'Special Vocabulary',{notes:x.gram});special=true;}
 }
}
const irregular={kommt:'kommen',kam:'kommen',gekommen:'kommen',ging:'gehen',geht:'gehen',gegangen:'gehen',sprach:'sprechen',spricht:'sprechen',gesprochen:'sprechen',sieht:'sehen',gesehen:'sehen',nahm:'nehmen',nimmt:'nehmen',genommen:'nehmen',hat:'haben',habe:'haben',hatte:'haben',ist:'sein',bin:'sein',bist:'sein',sind:'sein',war:'sein',waren:'sein',gewesen:'sein',wird:'werden',wurden:'werden',wurde:'werden',gibt:'geben',gab:'geben',möchte:'mögen',möchten:'mögen',kann:'können',konnte:'können',muss:'müssen',musste:'müssen',will:'wollen',wollte:'wollen',fand:'finden',gefunden:'finden',lernt:'lernen',lerne:'lernen',gelernt:'lernen',studiere:'studieren',studiert:'studieren',wohne:'wohnen',wohnt:'wohnen',sagte:'sagen',gedacht:'denken',dachte:'denken',schrieb:'schreiben'};
function lookup(surface){
 load();const term=clean(surface);if(!term)return null;
 let hit=words.get(term);if(hit)return {...hit,surface,confidence:'exact'};
 if(irregular[term]&&(hit=words.get(irregular[term])))return {...hit,surface,confidence:'inflected'};
 const candidates=[];
 for(const end of ['en','em','er','es','e','n','s'])if(term.length>5&&term.endsWith(end)){const stem=term.slice(0,-end.length);candidates.push(stem,stem+'e',stem+'en');}
 const stem=term.replace(/(test|tet|ten|te|st|t|e)$/,'');
 candidates.push(stem+'en',stem+'n');
 for(const guess of candidates)if(guess.length>=4&&(hit=words.get(guess)))return {...hit,surface,confidence:'possible'};
 return {base:surface,en:'Verified definition not yet available',my:'ဤစကားလုံး၏ အတည်ပြုထားသော အဓိပ္ပာယ် မရှိသေးပါ။',
 pos:'',article:'',source:'Missing dictionary entry',confidence:'missing',surface};
}
function dom(tag,cls,at,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);at?.append(node);return node;}
let root=null,view=null,tip=null,card=null,picked=null;
function hide(){if(tip)tip.hidden=true;}
function locate(el){
 const r=el.getBoundingClientRect(),w=tip.offsetWidth||260,h=tip.offsetHeight||120,VW=window.innerWidth||900,VH=window.innerHeight||700;
 tip.style.left=Math.max(8,Math.min(VW-w-8,r.left))+'px';
 tip.style.top=(r.top>h+20?r.top-h-9:Math.max(8,Math.min(VH-h-8,r.bottom+9)))+'px';
}
function showTip(word){
 if(!tip||card&&!card.hidden)return;
 const entry=lookup(word.textContent);tip.replaceChildren();
 dom('strong','',tip,entry.article?entry.article+' '+entry.base:word.textContent);
 dom('div','',tip,entry.en);
 dom('div','wwx-my',tip,entry.my||'မြန်မာဘာသာပြန်မရှိသေးပါ။');
 dom('small','',tip,'Click / tap: full explanation and German audio');
 tip.hidden=false;locate(word);
}
function block(at,label,value,cls=''){
 const sec=dom('section','wwx-section '+cls,at);
 dom('div','wwx-label',sec,label);dom('div','wwx-value',sec,value);return sec;
}
function closeCard(focus=false){
 hide();if(card)card.hidden=true;
 const old=picked;picked?.classList.remove('wwx-picked');picked=null;
 if(focus&&old?.isConnected)old.focus({preventScroll:true});
}
function speak(entry){
 window.WortWegReadingStudio?.stopNarration?.();
 try{
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
  const u=new SpeechSynthesisUtterance(entry.base||entry.surface);u.lang='de-DE';u.rate=.85;
  const v=window.speechSynthesis.getVoices?.()||[];
  const voice=v.find(x=>x.lang.toLowerCase()==='de-de')||v.find(x=>/^de/i.test(x.lang));if(voice)u.voice=voice;
  window.speechSynthesis.speak(u);
 }catch{}
}
function showCard(word){
 hide();picked?.classList.remove('wwx-picked');picked=word;word.classList.add('wwx-picked');
 const entry=lookup(word.textContent),row=word.closest('.wwr-row');
 card.replaceChildren();
 const head=dom('header','wwx-head',card),left=dom('div','',head);
 dom('small','',left,'WORTWEG · WORD DETAIL');
 dom('h3','',left,entry.article?entry.article+' '+entry.base:word.textContent);
 dom('small','',left,[entry.pos||'German vocabulary',entry.confidence==='possible'?'Possible lemma':entry.confidence==='inflected'?'Inflected form':''].filter(Boolean).join(' · '));
 const x=dom('button','',head,'×');x.type='button';x.setAttribute('aria-label','Close word detail');x.addEventListener('click',()=>closeCard(true));
 const body=dom('div','wwx-body',card);
 block(body,'English meaning',entry.en);block(body,'မြန်မာ အဓိပ္ပာယ်',entry.my||'မြန်မာဘာသာပြန်မရှိသေးပါ။');
 const grammar=[entry.article?'Article: '+entry.article:'',entry.confidence==='inflected'?'Dictionary form: '+entry.base:'',entry.confidence==='possible'?'Possible base form (verify): '+entry.base:'',entry.plural?'Plural: '+entry.plural:'',entry.pron?'Pronunciation: '+entry.pron:''].filter(Boolean);
 if(grammar.length)block(body,'Article / word form',grammar.join('\n'));
 if(entry.notes)block(body,'Grammar and usage',entry.notes);
 const sentence=word.closest('.wwr-sentence')?.textContent?.trim();
 if(sentence)block(body,'German example from this passage',sentence,'wwx-context');
 const en=row?.querySelector('.wwr-en')?.textContent||'',my=row?.querySelector('.wwr-mm')?.textContent||'';
 if(en)block(body,'English paragraph context (not exact word translation)',en,'wwx-context');
 if(my)block(body,'မြန်မာ စာပိုဒ်အဓိပ္ပာယ်',my,'wwx-context');
 if(entry.example)block(body,'Dictionary example',entry.example,'wwx-context');
 block(body,'Dictionary note',entry.confidence==='missing'?'No verified translation is stored for this form. We do not invent a meaning.':entry.confidence==='possible'?'This base form was inferred from an ending and might be inaccurate.':'Local WortWeg vocabulary. Meanings can vary with context.','wwx-note');
 const actions=dom('div','wwx-actions',body);
 const listen=dom('button','wwx-listen',actions,'▶ German pronunciation');listen.type='button';listen.addEventListener('click',()=>speak(entry));
 const copy=dom('button','',actions,'Copy word');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(word.textContent.trim());copy.textContent='Copied ✓';}catch{copy.textContent='Copy unavailable';}});
 card.hidden=false;x.focus({preventScroll:true});
}
function pointer(e){const w=e.target.closest?.('.wwr-de .wwr-word');if(w&&view?.contains(w))showTip(w);else hide();}
function pointerOut(e){const w=e.target.closest?.('.wwr-de .wwr-word');if(w&&!w.contains(e.relatedTarget))hide();}
function click(e){const w=e.target.closest?.('.wwr-de .wwr-word');if(w&&view?.contains(w)){e.preventDefault();e.stopPropagation();showCard(w);return;}if(card&&!card.hidden&&!e.target.closest('.wwx-card'))closeCard();}
function key(e){if(e.key==='Escape'&&card&&!card.hidden){e.preventDefault();e.stopPropagation();closeCard(true);return;}if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('.wwr-de .wwr-word')){e.preventDefault();e.stopPropagation();showCard(e.target);}}
function detach(){
 if(view){view.removeEventListener('pointerover',pointer);view.removeEventListener('pointerout',pointerOut);view.removeEventListener('click',click,true);view.removeEventListener('scroll',hide);view.removeEventListener('keydown',key);}
 if(root){root.removeEventListener('click',click);root.removeEventListener('keydown',key,true);}
 tip?.remove();card?.remove();root=view=tip=card=picked=null;
}
function attach(parent){
 detach();root=parent;view=root?.querySelector('.wwr-pages');if(!view)return;
 for(const w of view.querySelectorAll('.wwr-de .wwr-word'))if(clean(w.textContent)){w.tabIndex=0;w.setAttribute('role','button');w.setAttribute('aria-label','Explain German word '+w.textContent);}
 tip=dom('aside','wwx-tip',root);tip.hidden=true;tip.setAttribute('role','status');
 card=dom('aside','wwx-card',root);card.hidden=true;card.setAttribute('role','dialog');card.setAttribute('aria-label','German word explanation');
 load();
 view.addEventListener('pointerover',pointer);view.addEventListener('pointerout',pointerOut);
 view.addEventListener('click',click,true);view.addEventListener('scroll',hide,{passive:true});view.addEventListener('keydown',key);
 root.addEventListener('click',click);root.addEventListener('keydown',key,true);
}
window.WortWegWordExplorer={attach,detach,lookup,dictionarySize:()=>{load();return words.size}};
})();
