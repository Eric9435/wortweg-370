/* WortWeg Memorization Tables — lightweight, separate chart/study reference. */
(()=>{'use strict';
 const tables=Array.isArray(window.WWGMemoTables)?window.WWGMemoTables:[];
 const byId=new Map(tables.map(t=>[t.id,t]));
 const key='wortweg:lifetime-grammar:memorized:v1';
 let memory={};try{const j=JSON.parse(localStorage.getItem(key)||'{}');if(j&&typeof j==='object'&&!Array.isArray(j))memory=j;}catch{}
 let query='',group='All',hidden=false,uncovered=new Set();
 const h=(tag,klass,label)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(label!==undefined)e.textContent=label;return e};
 const push=(p,...cs)=>{cs.forEach(c=>c&&p.append(c));return p};
 const btn=(s,fn,klass='wl-action')=>{const e=h('button',klass,s);e.type='button';e.addEventListener('click',fn);return e};
 const count=()=>tables.filter(x=>memory[x.id]===true).length;
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(memory));}catch{}};
 const href=hash=>{location.hash=hash;};
 const back=(root,title,subtitle)=>push(root,push(h('div','wl-headrow'),btn('← Back',()=>href('memorize'),'wl-action'),push(h('div'),h('div','wl-kicker','Lifetime Grammar · Memorization'),h('h1','',title),h('p','wl-muted',subtitle))));
 function landing(root){
   root.replaceChildren();
   push(root,push(h('div','wl-hero'),h('div','wl-kicker','Learn by heart · အလွတ်ကျက်ရန်'),h('h1','','Memorization Tables'),h('p','wl-muted wl-intro','Case, Gender, Articles, Pronouns, Adjective Declension, Conjugation, Prepositions and Word Order — all together in one separate chart library.')));
   const stats=h('div','wl-stats');[['48','Reference charts'],[String(count()),'Marked memorized'],[String(tables.length-count()),'To review'],['Offline','Study mode']].forEach(([n,t])=>push(stats,push(h('div','wl-stat'),h('strong','',n),h('span','',t))));root.append(stats);
   const prog=h('div','wl-progress'),fill=h('span');fill.style.width=(count()/Math.max(1,tables.length)*100)+'%';prog.append(fill);root.append(prog);
   const toolbar=h('div','wl-toolbar'),search=h('input','wl-search');search.type='search';search.setAttribute('aria-label','Search memorization tables');search.placeholder='Search der/die/das, Dativ, Modals, Prepositions…';search.value=query;
   const select=h('select','wl-select');select.setAttribute('aria-label','Select memorization category');['All',...new Set(tables.map(t=>t.category))].forEach(c=>{const o=h('option','',c==='All'?'All categories':c);o.value=c;select.append(o)});select.value=group;
   const listing=h('div','wl-topic-list');const draw=()=>{listing.replaceChildren();const term=query.toLocaleLowerCase();const matches=tables.filter(x=>(group==='All'||group===x.category)&&[x.id,x.en,x.my,x.note,x.category,...x.rows.flat()].join(' ').toLocaleLowerCase().includes(term));
    matches.forEach(t=>{const b=btn('',()=>href(t.id),'wl-topic wl-memo-topic');b.replaceChildren(h('span','wl-id',t.id),push(h('span','wl-topic-copy'),h('strong','',t.en),h('em','',t.my)),h('span','wl-pill'+(memory[t.id]?' done':''),memory[t.id]?'Memorized':'Study'));listing.append(b)});
    if(!matches.length)listing.append(h('p','wl-empty','No matching tables. Try another search term.'));
   };
   search.addEventListener('input',()=>{query=search.value;draw()});select.addEventListener('change',()=>{group=select.value;draw()});
   push(toolbar,search,select);root.append(toolbar,listing);draw();
   push(root,h('p','wl-muted','Note: “Memorized” is your own review marker, not a CEFR qualification or graded exam result.'),btn('← Back to Lifetime Grammar',()=>href(''),'wl-action'));
 }
 function detail(root,table){
   hidden=false;uncovered=new Set();
   const redraw=()=>{
     root.replaceChildren();back(root,table.id+' · '+table.en,table.my+' · '+table.category);
     const sec=h('section','wl-panel');push(sec,h('div','wl-kicker','Memorize · '+table.id),h('h2','',table.my),h('p','wl-muted',table.note));
     const bar=h('div','wl-btnrow');
     const hideButton=btn(hidden?'Show all answers':'Hide answers · self-test',()=>{hidden=!hidden;uncovered.clear();redraw()},'wl-action wl-primary');
     bar.append(hideButton);
     const speech=btn('▶ Read table',()=>{
       if(!('speechSynthesis' in window))return;
       try{speechSynthesis.cancel();const utt=new SpeechSynthesisUtterance(table.rows.flat().filter(x=>x!=='—'&&!String(x).includes('→')).join('. '));utt.lang='de-DE';utt.rate=.8;speechSynthesis.speak(utt);}catch{}
     });bar.append(speech);
     sec.append(bar);
     const scroller=h('div','wl-table-scroll wl-memo-scroll'),grid=h('table','wl-table wl-memo-table'),header=h('thead'),hr=h('tr');
     table.columns.forEach(v=>hr.append(h('th','',v)));header.append(hr);grid.append(header);
     const body=h('tbody');
     table.rows.forEach((row,ri)=>{const tr=h('tr');
       row.forEach((value,ci)=>{const cell=h('td');if(ci===0||!hidden||uncovered.has(ri+':'+ci))cell.textContent=String(value);else{
        const b=btn('•••',()=>{uncovered.add(ri+':'+ci);b.textContent=String(value);b.setAttribute('aria-label',String(value));b.classList.add('wl-memo-revealed')},'wl-memo-reveal');b.setAttribute('aria-label','Reveal '+table.columns[ci]+' for row '+(ri+1));cell.append(b);
       }tr.append(cell)});body.append(tr)});grid.append(body);scroller.append(grid);sec.append(scroller);
     sec.append(h('p','wl-meta','Tip: Tap Hide answers, recall the forms, then tap an individual cell to reveal it. The first column stays visible as your cue.'));
     const footer=h('div','wl-btnrow');
     footer.append(btn(memory[table.id]?'✓ Memorized — undo':'Mark as memorized',()=>{memory[table.id]=!memory[table.id];save();redraw()},'wl-action wl-primary'));
     if(table.ref)footer.append(btn('Read full lesson '+table.ref,()=>href(table.ref),'wl-action'));
     const i=tables.indexOf(table);if(i<tables.length-1)footer.append(btn('Next table → '+tables[i+1].id,()=>href(tables[i+1].id)));
     sec.append(footer);root.append(sec);
     root.append(btn('← All Memorization Tables',()=>href('memorize')));
   };redraw();
 }
 function render(root,route){if(tables.length!==48||new Set(tables.map(x=>x.id)).size!==48){root.replaceChildren(h('p','wl-empty','Memorization tables could not be loaded. Refresh after the app update.'));return}
  if(byId.has(route))detail(root,byId.get(route));else landing(root);}
 window.WortWegMemorization={render,total:tables.length,getCount:count,getProgress:()=>({...memory})};
})();
