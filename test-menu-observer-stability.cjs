/* Regression: competing Home menu observers must not freeze the event loop. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const lifetimeSource=fs.readFileSync('ios-polish.js','utf8');
const checklistSource=fs.readFileSync('learning-checklist.js','utf8');
const marker='/* Lifetime Grammar lives in its own standalone workspace';
const lifetimeScript=lifetimeSource.slice(lifetimeSource.indexOf(marker));
assert(lifetimeScript.startsWith(marker),'Lifetime module missing');
const start=checklistSource.indexOf('function installMenuRow(){');
const end=checklistSource.indexOf('menuObserver.observe(dashboard,{childList:true,subtree:true});',start);
assert(start>0&&end>start,'Checklist insertion contract missing');
const checklistScript=checklistSource.slice(start,end)+'menuObserver.observe(dashboard,{childList:true,subtree:true});';
const pause=()=>new Promise(r=>setTimeout(r,0));
async function scenario(order){
 const dom=new JSDOM('<!doctype html><body><section id="dashboard"><div class="ww-menu-options"><button class="ww-menu-primary">Learn</button></div></section></body>',{url:'https://example.com/',runScripts:'outside-only'});
 const w=dom.window,d=w.document,menu=d.querySelector('.ww-menu-options');
 let mutations=0,limitHit=false;
 const guard=new w.MutationObserver(()=>{mutations++;if(mutations>50){limitHit=true;guard.disconnect();}});
 guard.observe(menu,{childList:true});
 const grammar=d.createElement('button');grammar.id='wg-grammar-launch';
 const addGrammar=()=>menu.querySelector('.ww-menu-primary').after(grammar);
 const addChecklist=()=>{
  const dashboard=d.getElementById('dashboard'),launch=d.createElement('button');launch.id='ww-cl-menu-launch';
  w.eval('(function(){const dashboard=document.getElementById("dashboard");const launch=document.createElement("button");launch.id="ww-cl-menu-launch";'+checklistScript+'})();');
 };
 if(order==='ready'){addGrammar();addChecklist();w.eval(lifetimeScript);}
 else if(order==='async'){w.eval(lifetimeScript);addGrammar();await pause();addChecklist();}
 else {addGrammar();w.eval(lifetimeScript);addChecklist();}
 await pause();await pause();
 const rowIds=[...menu.children].map(e=>e.id||'primary');
 assert.deepEqual(rowIds,['primary','wg-grammar-launch','ww-cl-menu-launch','ww-lifetime-grammar-launch'],'Stable menu order / no competing position '+order);
 assert(!limitHit,'Potential infinite observer reorder loop '+order);
 assert(mutations<15,'Too many menu reorder events ('+mutations+') in '+order);
 const before=mutations;
 menu.append(d.createElement('span'));
 await pause();await pause();
 assert(mutations-before<5,'Menu mutation triggered repeated unnecessary moves');
 guard.disconnect();dom.window.close();
 console.log('PASS '+order+': stable menu after '+mutations+' mutations; event loop responsive.');
}
(async()=>{for(const name of ['ready','async','mixed'])await scenario(name);})().catch(e=>{console.error(e);process.exitCode=1});
