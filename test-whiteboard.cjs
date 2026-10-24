/* Regression checks for the independent teaching-whiteboard layer. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html='<!doctype html><html><head></head><body><main>'
  +'<section id="dashboard" class="active"><h1>Home</h1></section>'
  +'<section id="review"><h1>Review</h1></section>'
  +'</main></body></html>';
const dom=new JSDOM(html,{url:'https://example.org/index.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
const ctx={setTransform(){},clearRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};
w.HTMLCanvasElement.prototype.getContext=function(){return ctx};
w.HTMLCanvasElement.prototype.setPointerCapture=function(){};
w.HTMLCanvasElement.prototype.toDataURL=function(){return 'data:image/png;base64,AAAA'};
w.Element.prototype.getClientRects=function(){return [{width:100,height:100}]};
w.confirm=()=>true;
const source=fs.readFileSync('whiteboard.js','utf8');
new (require('node:vm').Script)(source,{filename:'whiteboard.js'});
w.eval(source);
doc.dispatchEvent(new w.Event('DOMContentLoaded'));
const $=id=>doc.getElementById(id);
const panel=$('ww-whiteboard-panel'),canvas=$('ww-whiteboard-canvas');
assert.ok(panel&&canvas&&$('ww-whiteboard-launcher'),'Toolbar, canvas and launcher exist');
assert.equal(panel.hidden,false,'Desktop toolbar starts open');
assert.ok(!canvas.classList.contains('ww-wb-draw'),'Pointer mode keeps lesson clickable');
function tool(name){panel.querySelector('[data-tool="'+name+'"]').click();}
function stroke(x,y){
 const event=(name,dx,dy)=>canvas.dispatchEvent(new w.MouseEvent(name,{bubbles:true,cancelable:true,button:0,clientX:dx,clientY:dy}));
 event('pointerdown',x,y);event('pointermove',x+12,y+10);event('pointerup',x+12,y+10);
}
function records(){return JSON.parse(w.localStorage.getItem('wortweg370-teaching-whiteboard-v1'))?.pages||{};}
tool('pen');
assert.ok(canvas.classList.contains('ww-wb-draw'),'Pen activates overlay input');
stroke(45,65);
let saved=records();
assert.equal(saved['dashboard||']?.strokes?.length,1,'Pen stroke is saved per screen');
assert.equal(saved['dashboard||'].strokes[0].t,'pen');
$('ww-wb-undo').click();
assert.equal(records()['dashboard||'].strokes.length,0,'Undo removes stroke');
$('ww-wb-redo').click();
assert.equal(records()['dashboard||'].strokes.length,1,'Redo restores stroke');
tool('highlighter');stroke(30,55);
assert.equal(records()['dashboard||'].strokes[1].t,'highlighter','Highlighter is its own tool');
tool('eraser');stroke(34,57);
assert.equal(records()['dashboard||'].strokes[2].t,'eraser','Eraser removes ink during replay');
tool('pointer');
assert.ok(!canvas.classList.contains('ww-wb-draw'),'Pointer mode restores UI interaction');
doc.querySelector('#dashboard').classList.remove('active');
doc.querySelector('#review').classList.add('active');
w.dispatchEvent(new w.Event('hashchange'));
assert.equal($('ww-wb-undo').disabled,true,'New screen starts without prior ink');
tool('pencil');stroke(7,12);
saved=records();
assert.equal(saved['review||'].strokes[0].t,'pencil','Ink is stored under the new route');
doc.querySelector('#review').classList.remove('active');
doc.querySelector('#dashboard').classList.add('active');
w.dispatchEvent(new w.Event('hashchange'));
assert.equal($('ww-wb-undo').disabled,false,'Returning to previous route restores ink');
$('ww-wb-clear').click();
assert.equal(records()['dashboard||'].strokes.length,0,'Clear is limited to current screen');
assert.equal(records()['review||'].strokes.length,1,'Other screen annotations remain');
panel.querySelector('.ww-wb-close').click();
assert.equal(panel.hidden,true,'Floating toolbar minimizes');
$('ww-whiteboard-launcher').click();
assert.equal(panel.hidden,false,'Toolbar can reopen');
assert.ok(fs.readFileSync('sw.js','utf8').includes("'./whiteboard.js'"),'Offline precache contains module');
assert.ok(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes("'whiteboard.css'"),'Native packaging contains styles');
assert.ok(fs.readFileSync('ios-polish.js','utf8').includes('whiteboard.js'),'Shared web boot loads whiteboard');
assert.ok(fs.readFileSync('whiteboard.css','utf8').includes('touch-action:none'),'Touch drawing supported');
dom.window.close();
console.log('PASS: floating toolbar, draw/pointer, pen/pencil/highlight/eraser, undo/redo, route isolation, clear, offline/native wiring.');