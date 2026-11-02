#!/usr/bin/env node
/* WortWeg A1-C2 complete Grammar Atlas, derived from the original authored Lifetime Grammar.
   Verified case/conjugation matrices are distinguished from topic reference tables. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const argValue=(name,fallback)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback;};
const output=path.resolve(root,argValue('--output','assets/german-grammar-a1-c2-complete.svg'));
const indexOutput=path.resolve(root,argValue('--index','assets/german-grammar-a1-c2-index.json'));
const context={window:{}};vm.createContext(context);
const files=['lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js',
 'lifetime-grammar-exact-1.js','lifetime-grammar-exact-2.js','lifetime-grammar-exact-3.js','lifetime-grammar-exact-4.js',
 'lifetime-grammar-myanmar-1.js','lifetime-grammar-myanmar-2.js','lifetime-grammar-verified-matrices.js'];
for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file,timeout:4000});
const life=fs.readFileSync(path.join(root,'lifetime-grammar.js'),'utf8');
const match=life.match(/const CORE=(\{[\s\S]*?\});\s*function el\(/);
if(!match)throw Error('Unable to extract the existing Lifetime Grammar core paradigms');
const core=vm.runInContext('('+match[1]+')',context,{timeout:4000});
const data=context.window;
const chapters=data.WWGLifeIndex||[],rules=data.WWGLifeRules||[],exact=data.WWGLifeExact||[],my=data.WWGLifeMyanmar||[];
const verified=data.WWGLifeVerifiedMatrices||{},matrix={...core,...verified};
const topics=chapters.flatMap(ch=>ch.topics.map(t=>({...t,chapter:ch.chapter,chapterEN:ch.en,chapterMY:ch.my,level:ch.level})));
if(chapters.length!==36||topics.length!==288||rules.length!==288||exact.length!==288||my.length!==288)throw Error('Incomplete source data');
if(new Set(topics.map(t=>t.id)).size!==288)throw Error('Duplicate topic IDs');
const exactById=new Map(exact.map(x=>[x.id,x])),myById=new Map(my.map(x=>[x.id,x.my]));
const count=topics.filter(t=>matrix[t.id]&&matrix[t.id].rows&&matrix[t.id].rows.length).length;
const reviewed=topics.filter(t=>verified[t.id]&&verified[t.id].rows&&verified[t.id].rows.length).length;
if(count!==77||reviewed!==48)throw Error('Expected 77 form matrices (48 reviewed), got '+count+' ('+reviewed+' reviewed)');
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const W=5440,X=42,CARD=652,GAP=16,COL=8;
if(X*2+COL*CARD+(COL-1)*GAP>W)throw Error('SVG width too small');
const shades={A1:'#206a92',A2:'#287b84',B1:'#486ab1',B2:'#6959a7',C1:'#864f7c',C2:'#995b3b'};
const css="<style>text{font-family:Arial,'Noto Sans Myanmar','Myanmar Text',sans-serif}.head{font-weight:700}.chapter{font-size:33px;font-weight:750;fill:#fff}.card-title{font-size:21px;font-weight:750;fill:#162a40}.label{font-size:15px;font-weight:700;fill:#4f6c82}.cell{font-size:14.5px;fill:#24394e}.caption{font-size:14px;fill:#60748a}.my{font-family:'Noto Sans Myanmar','Myanmar Text',Arial,sans-serif}</style>";
const textSvg=(x,y,t,size=14,fill='#26374d',weight=400,cls='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+fill+'" font-weight="'+weight+'" class="'+cls+'">'+esc(t)+'</text>';
function weight(s){return [...String(s)].reduce((n,c)=>n+(/[^\u0000-\u00ff]/u.test(c)?1.45:/[MW@]/.test(c)?1.4:1),0);}
function wrap(value,max){
 const src=String(value||'—').replace(/\s+/g,' ').trim(),out=[];
 if(!src)return ['—'];
 let words=src.split(' '),line='';
 function append(text){if(line){out.push(line);line='';}const units=[...text];let buf='';for(const ch of units){if(weight(buf+ch)>max){if(buf)out.push(buf);buf=ch;}else buf+=ch;}line=buf;}
 for(const word of words){const next=line?line+' '+word:word;if(weight(next)<=max){line=next;continue;}if(line)out.push(line);line='';if(weight(word)>max)append(word);else line=word;}
 if(line)out.push(line);return out.length?out:['—'];
}
function lines(x,y,items,size=14,h=19,fill='#24394e',cls=''){
 return items.map((v,i)=>textSvg(x,y+i*h,v,size,fill,400,cls)).join('');
}
function drawCard(t){
 const topicN=Number(t.id.slice(1)),ex=exactById.get(t.id),meaning=myById.get(t.id),rule=rules[topicN-1],m=matrix[t.id];
 if(!ex||!meaning||!rule)throw Error('Missing topic details '+t.id);
 const chunks=[];
 const titleLines=wrap(t.en,55),titleH=titleLines.length*26;
 let cursor=28+22+titleH+20;
 const hasMatrix=!!(m&&m.rows&&m.rows.length);
 const rows=[];
 if(hasMatrix){
  const headers=m.cols||[];
  if(!headers.length||m.rows.some(row=>row.length!==headers.length))throw Error('Invalid matrix '+t.id);
  const colCount=headers.length,inside=CARD-36,cw=inside/colCount;
  const max=Math.max(9,Math.floor((cw-14)/8.1));
  const tableEntries=[headers,...m.rows].map(row=>row.map(v=>wrap(v,max)));
  let yy=cursor;
  for(let i=0;i<tableEntries.length;i++){
   const cellLines=tableEntries[i],h=Math.max(i===0?30:26,12+Math.max(...cellLines.map(x=>x.length))*17);
   rows.push('<rect x="18" y="'+yy+'" width="'+inside+'" height="'+h+'" fill="'+(i===0?'#e5eff8':i%2?'#ffffff':'#f5f8fb')+'"/>');
   for(let j=0;j<colCount;j++){
    const x=22+j*cw;
    rows.push(lines(x,yy+17,cellLines[j],i===0?13:13.5,17,i===0?'#1e4868':'#26384a'));
    if(j)rows.push('<line x1="'+(18+j*cw)+'" x2="'+(18+j*cw)+'" y1="'+yy+'" y2="'+(yy+h)+'" stroke="#e4ebf2"/>');
   }
   yy+=h;
  }
  rows.push('<rect x="18" y="'+cursor+'" width="'+inside+'" height="'+(yy-cursor)+'" rx="4" fill="none" stroke="#c9d8e4"/>');
  cursor=yy+12;
 }
 const entries=hasMatrix?
  [['RULE',m.rule||rule],['BEISPIEL',ex.de],['MEANING',ex.en],['မြန်မာ',meaning]]:
  [['RULE',rule],['BEISPIEL',ex.de],['MEANING',ex.en],['မြန်မာ',meaning]];
 for(const [key,value] of entries){
  const isMy=key==='မြန်မာ',size=isMy?13:14;
  const w=wrap(value,isMy?66:70);
  const h=Math.max(31,11+w.length*(isMy?21:19));
  rows.push('<rect x="18" y="'+cursor+'" width="'+(CARD-36)+'" height="'+h+'" fill="'+(Math.floor(cursor)%2?'#f6f9fc':'#fff')+'"/>');
  rows.push(textSvg(26,cursor+18,key,12.5,'#557186',700,'label'));
  rows.push(lines(122,cursor+18,w,size,isMy?21:19,isMy?'#2f4a61':'#26394c',isMy?'my':''));
  cursor+=h+2;
 }
 const H=cursor+19;
 const rendered=[
  '<rect x="0.5" y="0.5" width="'+(CARD-1)+'" height="'+(H-1)+'" rx="13" fill="#ffffff" stroke="#cfdbe7"/>',
  '<rect x="1" y="1" width="'+(CARD-2)+'" height="9" rx="5" fill="'+shades[t.level.split('–')[0]]+'"/>',
  '<rect x="18" y="24" width="53" height="25" rx="6" fill="#e8f1f8"/>',
  textSvg(28,41,t.id,13,'#1b638e',700),
  textSvg(84,41,t.level,13,'#526c81',700),
  textSvg(CARD-18- (hasMatrix?170:182),41,hasMatrix?(verified[t.id]?'REVIEWED MATRIX':'FORM MATRIX'):'TOPIC REFERENCE',12,hasMatrix?'#166b69':'#6c7584',700),
  lines(18,80,titleLines,21,26,'#152c43','card-title'),
  ...rows
 ];
 return {height:H,svg:rendered.join(''),hasMatrix};
}
const cards=new Map(topics.map(t=>[t.id,drawCard(t)]));
let y=202,index=[],parts=['<rect width="'+W+'" height="100%" fill="#f0f5fa"/>'];
parts.push(textSvg(44,62,'WORTWEG 370   /   COMPLETE GRAMMAR ATLAS',37,'#133550',750));
parts.push(textSvg(46,96,'A1–C2   ·   36 chapters   ·   288 topics   ·   77 form matrices (48 reviewed)   ·   211 topic references',19,'#46667f'));
parts.push(textSvg(46,128,'Existing form tables are distinguished from rule-and-example references. Read the full lesson in Lifetime Grammar.',16,'#55718a'));
for(const chapter of chapters){
 const members=topics.filter(t=>t.chapter===chapter.chapter);
 if(members.length!==8)throw Error('Expected eight topics per chapter');
 const rowHeight=Math.max(...members.map(t=>cards.get(t.id).height));
 const color=shades[chapter.level.split('–')[0]]||'#275d82';
 parts.push('<rect x="42" y="'+y+'" width="'+(W-84)+'" height="62" rx="10" fill="'+color+'"/>');
 parts.push(textSvg(64,y+41,chapter.chapter.toString().padStart(2,'0')+'   '+chapter.en,28,'#fff',750,'chapter'));
 parts.push(textSvg(W-330,y+40,chapter.level,19,'#fff',700));
 const top=y+77;
 for(let i=0;i<8;i++){
  const t=members[i],x=X+i*(CARD+GAP),card=cards.get(t.id);
  parts.push('<g transform="translate('+x+' '+top+')">'+card.svg+'</g>');
  index.push({id:t.id,title:t.en,level:t.level,chapter:chapter.chapter,chapterTitle:chapter.en,
   x,y:top,width:CARD,height:card.height,hasMatrix:card.hasMatrix,reviewed:!!verified[t.id]});
 }
 y=top+rowHeight+21;
}
parts.push(textSvg(46,y+34,'WORTWEG 370 · Structured grammar reference atlas · See individual Lifetime Grammar lessons for additional detail.',16,'#496984'));
y+=62;
const svg='<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+y+
 '" viewBox="0 0 '+W+' '+y+'" role="img" aria-label="WortWeg German Grammar Atlas A1 to C2, 288 topics">'+
 '<title>WortWeg Complete German Grammar Atlas A1–C2</title><desc>36 chapters; 288 topics; 77 form tables (48 reviewed), and 211 topic-specific rule and example reference tables.</desc>'+css+
 parts.join('')+'</svg>\n';
const summary={version:1,width:W,height:y,chapters:36,topics:288,formMatrices:count,reviewedMatrices:reviewed,topicReferences:288-count,items:index};
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,svg,'utf8');
fs.writeFileSync(indexOutput,JSON.stringify(summary,null,0)+'\n','utf8');
console.log(JSON.stringify({file:path.relative(root,output),bytes:Buffer.byteLength(svg),index:path.relative(root,indexOutput),
 width:W,height:y,topics:summary.topics,formMatrices:count,reviewedMatrices:reviewed,references:288-count}));
