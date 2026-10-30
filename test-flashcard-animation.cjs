'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const cards={bank:[
 {id:1,de:'Hallo',en:'Hello',mm:'မင်္ဂလာပါ',level:'A1'},
 {id:2,de:'Danke',en:'Thanks',mm:'ကျေးဇူးပါ',level:'A1'},
 {id:3,de:'Bitte',en:'Please',mm:'ကျေးဇူးပြု၍',level:'A1'}
],curated:[]};
const html='<!doctype html><html><body><main><section id="dashboard">'+
 '<div class="ww-main-menu"><div class="ww-menu-options"><button data-nav="review">Review</button></div></div>'+
 '</section></main><script id="data" type="application/json">'+JSON.stringify(cards)+'</script></body></html>';
const dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'});
const w=dom.window;
w.WortWegAccountSnapshot={uid:'animationUser'};
w.WortWeg={getProgress:()=>({answered:9})};
let reduce=false,animations=[];
w.matchMedia=()=>({matches:reduce});
w.Element.prototype.animate=function(frames,options){
 let resolve;
 const finished=new Promise(done=>{resolve=done;});
 animations.push({frames,options,resolve,element:this});
 return {finished};
};
w.eval(fs.readFileSync('flashcards.js','utf8'));
const $=selector=>w.document.querySelector(selector);
const count=()=>$('.ww-flash-study-top').textContent;
const finish=async()=>{
 assert.ok(animations.length,'Expected active page-turn animation');
 const animation=animations.shift();
 animation.resolve();
 await new Promise(resolve=>setImmediate(resolve));
 return animation;
};
function gesture(dx,dy=0,cancel=false){
 const card=$('.ww-flash-card');
 for(const [type,x,y] of [
  ['pointerdown',200,200],
  ['pointermove',200+dx,200+dy],
  [cancel?'pointercancel':'pointerup',200+dx,200+dy]
 ]){
  const event=new w.Event(type,{bubbles:true,cancelable:true});
  Object.defineProperties(event,{pointerId:{value:1},pointerType:{value:'touch'},
   isPrimary:{value:true},clientX:{value:x},clientY:{value:y}});
  card.dispatchEvent(event);
 }
}
(async()=>{
 $('#ww-flashcards-launch').click();
 $('#ww-flashcards .ww-flash-primary').click();
 assert.match(count(),/1 \/ 3/);
 const css=fs.readFileSync('flashcards.css','utf8');
 assert.match(css,/perspective:1400px/,'3D perspective is enabled');
 assert.match(css,/prefers-reduced-motion:reduce/,'Accessibility preference is honored');
 assert.match(css,/touch-action:pan-y/,'Vertical scroll is preserved');
 gesture(-110);
 assert.match(count(),/1 \/ 3/,'Content does not jump ahead before animation');
 assert.equal(animations.length,1,'Only one outgoing animation starts');
 assert.match(animations[0].frames[1].transform,/rotateY\(-78deg\)/,'Forward swipe turns left like a page');
 $('.ww-flash-navigation button:last-child').click();
 assert.equal(animations.length,1,'Double navigation blocked during transition');
 assert.equal(w.WortWegFlashcards.getSummary().reviewed,0,'Swipe does not rate the card');
 await finish();
 assert.match(count(),/2 \/ 3/,'Card changes at the turning midpoint');
 assert.equal(animations.length,1,'Incoming face animates into place');
 assert.match(animations[0].frames[0].transform,/rotateY\(62deg\)/);
 await finish();
 gesture(110);
 assert.equal(animations.length,1);
 assert.match(animations[0].frames[1].transform,/rotateY\(78deg\)/,'Back swipe turns right');
 await finish();await finish();
 assert.match(count(),/1 \/ 3/);
 gesture(15,120);
 assert.equal(animations.length,0,'Vertical scrolling cannot trigger a page turn');
 gesture(-110,0,true);
 assert.equal(animations.length,0,'Cancelled gesture cannot turn a page');
 $('.ww-flash-card').click();
 assert.equal(animations.length,1,'Tap starts a separate reveal animation');
 assert.match(animations[0].frames[1].transform,/rotateY\(-78deg\)/);
 await finish();
 assert.ok($('.ww-flash-face-caption').textContent==='ANSWER','Reveal occurs only at midpoint');
 await finish();
 $('.ww-flash-know').click();
 assert.equal(w.WortWegFlashcards.getSummary().reviewed,1,'Rating saved on original card');
 assert.equal(animations.length,1,'Rating advances with page turn');
 await finish();await finish();
 assert.match(count(),/2 \/ 3/);
 $('.ww-flash-navigation button:last-child').click();
 assert.equal(animations.length,1,'Original Skip button animates');
 await finish();await finish();
 assert.match(count(),/3 \/ 3/);
 $('.ww-flash-navigation button:first-child').click();
 assert.equal(animations.length,1,'Original Previous button animates');
 w.WortWegFlashcards.close();
 await finish();
 assert.ok($('#ww-flashcards').hidden,'Closing mid-animation never reopens the dialog');
 animations=[];
 reduce=true;
 w.WortWegFlashcards.open();
 $('#ww-flashcards .ww-flash-primary').click();
 gesture(-110);
 assert.match(count(),/2 \/ 3/,'Reduced-motion swipe is immediate');
 assert.equal(animations.length,0,'No motion runs with reduced-motion preference');
 $('.ww-flash-card').click();
 assert.equal($('.ww-flash-face-caption').textContent,'ANSWER','Reduced-motion reveal remains usable');
 assert.equal(animations.length,0);
 assert.equal(w.WortWegFlashcards.getSummary().reviewed,1,'Saved review stays unchanged');
 dom.window.close();
 console.log('PASS: 3D book-page transitions, button continuity, animation locks, flip timing, interruption safety, accessibility, and unchanged SRS.');
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1;});
