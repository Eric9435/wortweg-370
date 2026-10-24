/* WortWeg whiteboard v2: temporary ink, scroll anchors and icon-only ruler. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html='<!doctype html><html><head></head><body><main>'+
  '<section id="dashboard" class="active"><h1>Home</h1></section>'+
  '<section id="review"><h1>Review</h1></section>'+
  '</main></body></html>';
const dom=new JSDOM(html,{url:'https://example.org/index.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
const points=[],queue=[];
const ctx={
  setTransform(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},
  moveTo(x,y){points.push([x,y]);},lineTo(){},stroke(){},arc(){},fill(){}
};
w.HTMLCanvasElement.prototype.getContext=()=>ctx;
w.HTMLCanvasElement.prototype.setPointerCapture=function(){};
w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,AAAA';
w.Element.prototype.getClientRects=()=>[{width:100,height:100}];
w.requestAnimationFrame=cb=>{queue.push(cb);return queue.length;};
function flush(){let i=0;while(queue.length&&i++<30)queue.shift()();}
w.confirm=()=>true;
const obsolete='wortweg370-teaching-whiteboard-v1';
w.localStorage.setItem(obsolete,JSON.stringify({pages:{dashboard:{strokes:[{t:'pen',p:[[1,2]]}]}}}));
const source=fs.readFileSync('whiteboard.js','utf8');
new vm.Script(source,{filename:'whiteboard.js'});
w.eval(source);
doc.dispatchEvent(new w.Event('DOMContentLoaded'));flush();
const $=id=>doc.getElementById(id);
const panel=$('ww-whiteboard-panel'),canvas=$('ww-whiteboard-canvas');
assert.ok(panel&&canvas&&$('ww-whiteboard-launcher'),'Ruler, ink canvas and launcher exist');
assert.equal(panel.hidden,false,'Ruler initially open on desktop');
assert.equal(panel.querySelector('.ww-wb-strip').textContent.trim(),'','Ruler has no visible words');
assert.equal(w.localStorage.getItem(obsolete),null,'Legacy permanent ink removed on load');
assert.ok(!canvas.classList.contains('ww-wb-draw'),'Pointer mode initially supports page interaction');
const tool=name=>panel.querySelector('[data-tool="'+name+'"]').click();
function stroke(x,y){
  for(const [type,dx,dy] of [['pointerdown',x,y],['pointermove',x+12,y+10],['pointerup',x+12,y+10]]){
    canvas.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:dx,clientY:dy}));
  }
  flush();
}
tool('pen');assert.ok(canvas.classList.contains('ww-wb-draw'));
stroke(45,65);
assert.equal(w.WortWegWhiteboard.getStrokeCount(),1,'Pen stroke stays on current page');
assert.equal(w.localStorage.getItem(obsolete),null,'Ink is never persisted');
$('ww-wb-undo').click();flush();
assert.equal(w.WortWegWhiteboard.getStrokeCount(),0,'Undo removes ink');
$('ww-wb-redo').click();flush();
assert.equal(w.WortWegWhiteboard.getStrokeCount(),1,'Redo restores ink');
tool('pen');
assert.equal(panel.querySelector('.ww-wb-popover').hidden,false,'Tapping selected pen shows nib settings');
assert.equal(panel.querySelectorAll('.ww-wb-width-option').length,4,'Four selectable nib widths');
panel.querySelectorAll('.ww-wb-width-option')[3].click();
assert.equal(panel.querySelector('.ww-wb-popover').hidden,false,'Size selector remains usable');
tool('highlighter');stroke(30,55);
assert.equal(w.WortWegWhiteboard.getStrokeCount(),2,'Highlighter draws separate ink');
tool('eraser');stroke(34,57);
assert.equal(w.WortWegWhiteboard.getStrokeCount(),3,'Eraser stroke is undoable');
tool('pointer');assert.ok(!canvas.classList.contains('ww-wb-draw'),'Pointer restores scrolling/links');
doc.querySelector('#dashboard').classList.remove('active');
doc.querySelector('#review').classList.add('active');
w.dispatchEvent(new w.Event('hashchange'));flush();
assert.equal(w.WortWegWhiteboard.getStrokeCount(),0,'Navigating away destroys annotations');
tool('pencil');stroke(7,12);
assert.equal(w.WortWegWhiteboard.getStrokeCount(),1,'New page has its own temporary ink');
doc.querySelector('#review').classList.remove('active');
doc.querySelector('#dashboard').classList.add('active');
w.dispatchEvent(new w.Event('hashchange'));flush();
assert.equal(w.WortWegWhiteboard.getStrokeCount(),0,'Returning does not restore old ink');
const pane=doc.createElement('div'),content=doc.createElement('span');
pane.style.overflowY='auto';pane.append(content);
doc.querySelector('#dashboard').append(pane);
Object.defineProperty(pane,'scrollHeight',{value:1000});
Object.defineProperty(pane,'clientHeight',{value:200});
pane.getBoundingClientRect=()=>({left:12,top:60,width:240,height:200,right:252,bottom:260});
doc.elementFromPoint=()=>content;
pane.scrollTop=50;
tool('pen');stroke(40,110);flush();
assert.equal(w.WortWegWhiteboard.getStrokeCount(),1,'Ink draws inside nested scrolling pane');
assert.ok(points.some(([x,y])=>x===40&&y===110),'Initial stroke follows content coordinates');
points.length=0;pane.scrollTop=110;
doc.dispatchEvent(new w.Event('scroll',{bubbles:false}));flush();
assert.ok(points.some(([x,y])=>x===40&&y===50),'Ink stays anchored after nested-pane scrolling');
$('ww-wb-clear').click();flush();
assert.equal(w.WortWegWhiteboard.getStrokeCount(),0,'Clear removes page ink');
panel.querySelector('.ww-wb-close').click();
assert.equal(panel.hidden,true,'Ruler minimizes');
$('ww-whiteboard-launcher').click();
assert.equal(panel.hidden,false,'Ruler can be reopened');
assert.ok(fs.readFileSync('sw.js','utf8').includes("'./whiteboard.js'"),'Offline whiteboard precached');
assert.ok(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes("'whiteboard.css'"),'Native package includes styles');
assert.ok(fs.readFileSync('ios-polish.js','utf8').includes('whiteboard.js?v=2'),'Fresh script URL loads v2');
assert.ok(fs.readFileSync('whiteboard.css','utf8').includes('touch-action:none'),'Touch drawing supported');
dom.window.close();
console.log('PASS: session-only ink, tool popovers, nested scroll anchors, navigation clearing, mobile/web packaging.');
