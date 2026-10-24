/* WortWeg · Teaching Whiteboard
   Screen-wide ink for lessons and tab/screen sharing. No external services.
   Annotations stay on this device and are independent of learning progress. */
(function(){
  'use strict';
  if(window.WortWegWhiteboard)return;
  const STORE='wortweg370-teaching-whiteboard-v1';
  const PREFS='wortweg370-teaching-whiteboard-prefs-v1';
  const MAX_PAGES=36, MAX_STROKES=300, MAX_POINTS=1200;
  const COLORS=['#e34343','#e58a20','#efc348','#2c9b75','#2788d8','#7867d8','#161d2a','#ffffff'];
  const ICON={
    pointer:'<path d="m5 3 13 9-7 1-2 7-4-17Z"/>',
    pencil:'<path d="m3 17 13-13 4 4L7 21l-5 1 1-5Zm11-11 4 4M3 17l4 4"/>',
    pen:'<path d="m12 3 8 8-8 10-4-8 4-10Zm0 0 0 10m-4 0 12-2M4 21h16"/>',
    highlighter:'<path d="m15 3 6 6-9 9H6v-6l9-9ZM4 21h15M6 12l6 6"/>',
    eraser:'<path d="m8 4 13 13-5 5H9L2 15 8 4Zm-2 14h15"/>',
    undo:'<path d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 7 7"/>',
    redo:'<path d="m15 14 5-5-5-5m5 5h-9a7 7 0 0 0-7 7"/>',
    clear:'<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v7m4-7v7"/>',
    save:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    minimize:'<path d="M5 12h14"/>',
    grip:'<path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01"/>',
    expand:'<path d="m4 16 5-5 4 4 7-8M14 7h6v6"/>'
  };
  const icon=(name)=>'<svg viewBox="0 0 24 24" aria-hidden="true" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICON[name]+'</svg>';
  function load(key,fallback){
    try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback;}catch{return fallback;}
  }
  const book=load(STORE,{pages:{}});
  if(!book.pages||typeof book.pages!=='object'||Array.isArray(book.pages))book.pages={};
  const prefs=Object.assign({tool:'pointer',color:'#e34343',size:4,open:innerWidth>650,left:null,top:null},load(PREFS,{}));
  if(!['pointer','pencil','pen','highlighter','eraser'].includes(prefs.tool))prefs.tool='pointer';
  if(!/^#[a-f0-9]{6}$/i.test(prefs.color))prefs.color=COLORS[0];
  prefs.size=Math.min(36,Math.max(1,Number(prefs.size)||4));
  const empty=()=>[];
  let pageKey='', strokes=empty(), redo=empty(), working=null;
  let canvas,ctx,panel,launcher,live,toolButtons,sizeInput,sizeText,colorInput;
  let lastStoreWarning=false;
  function safeKey(){
    const hash=location.hash.replace(/[^a-zA-Z0-9-_#/]/g,'').slice(0,95);
    const selectors='main > section.active[id], main > div.active[id], #app > section.active[id], .ww-screen.active[id], body > section.active[id], section.active[id]';
    const visible=Array.from(document.querySelectorAll(selectors)).filter(el=>{
      if(el.closest('#ww-whiteboard-panel'))return false;
      const style=getComputedStyle(el);
      return style.display!=='none'&&style.visibility!=='hidden'&&el.getClientRects().length>0;
    });
    visible.sort((a,b)=>{
      function depth(node){let n=0;while(node.parentElement){n++;node=node.parentElement;}return n;}
      return depth(a)-depth(b);
    });
    const route=visible[0]?.id||'main';
    const overlay=Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"], .ww-reading-studio.open, .ww-special-vocabulary.open, .ww-flashcards.open')).find(el=>{
      if(el.closest('#ww-whiteboard-panel'))return false;
      return !el.hidden&&getComputedStyle(el).display!=='none'&&el.getClientRects().length;
    });
    return (route+'|'+(overlay?.id||'')+'|'+hash).slice(0,160);
  }
  function pageStrokes(key){
    const stored=book.pages[key]?.strokes;
    if(!Array.isArray(stored))return [];
    return stored.filter(s=>s&&['pen','pencil','highlighter','eraser'].includes(s.t)&&Array.isArray(s.p)&&s.p.length).slice(-MAX_STROKES);
  }
  function savePrefs(){
    try{localStorage.setItem(PREFS,JSON.stringify(prefs));}catch{}
  }
  function persist(){
    if(!pageKey)return;
    book.pages[pageKey]={strokes:strokes.slice(-MAX_STROKES),updated:Date.now()};
    const keys=Object.keys(book.pages);
    if(keys.length>MAX_PAGES){
      keys.sort((a,b)=>(book.pages[a].updated||0)-(book.pages[b].updated||0));
      keys.slice(0,keys.length-MAX_PAGES).forEach(k=>delete book.pages[k]);
    }
    try{localStorage.setItem(STORE,JSON.stringify(book));lastStoreWarning=false;}
    catch{
      if(!lastStoreWarning){announce('Storage full. Ink remains until this page is closed.');lastStoreWarning=true;}
    }
  }
  function checkPage(){
    const next=safeKey();
    if(next===pageKey)return;
    if(working)finishStroke();
    pageKey=next;strokes=pageStrokes(next);redo=[];
    render();
    updateControls();
  }
  function resize(){
    if(!canvas)return;
    const ratio=Math.max(1,Math.min(3,window.devicePixelRatio||1));
    canvas.width=Math.round(window.innerWidth*ratio);
    canvas.height=Math.round(window.innerHeight*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    render();
    clampPanel();
  }
  function drawStroke(s){
    if(!s||!s.p||!s.p.length)return;
    ctx.save();
    ctx.globalCompositeOperation=s.t==='eraser'?'destination-out':'source-over';
    ctx.globalAlpha=s.t==='highlighter'?0.24:s.t==='pencil'?0.62:1;
    ctx.strokeStyle=s.t==='eraser'?'#000000':s.c;
    ctx.fillStyle=s.t==='eraser'?'#000000':s.c;
    ctx.lineWidth=s.s;
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();
    const offsetX=window.scrollX||0,offsetY=window.scrollY||0;
    ctx.moveTo(s.p[0][0]-offsetX,s.p[0][1]-offsetY);
    if(s.p.length===1){
      ctx.arc(s.p[0][0]-offsetX,s.p[0][1]-offsetY,Math.max(0.5,s.s/2),0,Math.PI*2);
      ctx.fill();
    }else{
      for(let i=1;i<s.p.length;i++)ctx.lineTo(s.p[i][0]-offsetX,s.p[i][1]-offsetY);
      ctx.stroke();
    }
    ctx.restore();
  }
  function render(){
    if(!ctx||!canvas)return;
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    strokes.forEach(drawStroke);
    if(working)drawStroke(working);
  }
  function point(event){return [Math.round((event.clientX+(window.scrollX||0))*10)/10,Math.round((event.clientY+(window.scrollY||0))*10)/10];}
  function beginStroke(event){
    if(prefs.tool==='pointer'||event.button!==0&&event.pointerType!=='touch'&&event.pointerType!=='pen')return;
    event.preventDefault();
    try{canvas.setPointerCapture(event.pointerId);}catch{}
    const defaults={pencil:2.3,pen:4,highlighter:20,eraser:26};
    const width=prefs.tool==='highlighter'?Math.max(12,prefs.size*3.5):
                prefs.tool==='eraser'?Math.max(12,prefs.size*4):prefs.tool==='pencil'?Math.max(1,prefs.size*0.65):prefs.size;
    working={t:prefs.tool,c:prefs.color,s:Math.min(100,Number(width||defaults[prefs.tool])),p:[point(event)]};
    render();
  }
  function moveStroke(event){
    if(!working)return;
    event.preventDefault();
    const p=point(event),last=working.p[working.p.length-1];
    if(Math.hypot(p[0]-last[0],p[1]-last[1])<1.5)return;
    if(working.p.length<MAX_POINTS)working.p.push(p);
    render();
  }
  function finishStroke(){
    if(!working)return;
    strokes.push(working);working=null;
    if(strokes.length>MAX_STROKES)strokes.shift();
    redo=[];persist();render();updateControls();
  }
  function announce(message){
    if(live)live.textContent=message;
  }
  function button(name,title,action){
    const b=document.createElement('button');b.type='button';b.className='ww-wb-button';
    b.title=title;b.setAttribute('aria-label',title);b.innerHTML=icon(name);
    b.addEventListener('click',action);return b;
  }
  function switchTool(tool){
    prefs.tool=tool;savePrefs();updateControls();
    announce(tool==='pointer'?'Pointer mode: interact with the lesson.':tool+' enabled. Draw on the screen.');
  }
  function updateControls(){
    if(!canvas)return;
    const drawing=prefs.tool!=='pointer';
    canvas.classList.toggle('ww-wb-draw',drawing);
    canvas.setAttribute('aria-hidden','true');
    toolButtons.forEach(b=>{const active=b.dataset.tool===prefs.tool;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    document.getElementById('ww-wb-undo').disabled=strokes.length===0;
    document.getElementById('ww-wb-redo').disabled=redo.length===0;
    document.getElementById('ww-wb-clear').disabled=strokes.length===0;
    document.getElementById('ww-wb-save').disabled=strokes.length===0;
    if(sizeText)sizeText.textContent=String(prefs.size)+' px';
    if(sizeInput)sizeInput.value=String(prefs.size);
    if(colorInput)colorInput.value=prefs.color;
    const colorButtons=panel.querySelectorAll('[data-color]');
    colorButtons.forEach(b=>{const selected=b.dataset.color.toLowerCase()===prefs.color.toLowerCase();b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected));});
    panel.querySelector('.ww-wb-hint').textContent=drawing?'Draw on the screen · Select pointer to click links':'Pointer mode · Lesson remains interactive';
    launcher.setAttribute('aria-expanded',String(!panel.hidden));
  }
  function undoLast(){if(!strokes.length)return;redo.push(strokes.pop());persist();render();updateControls();}
  function redoLast(){if(!redo.length)return;strokes.push(redo.pop());persist();render();updateControls();}
  function clearPage(){
    if(!strokes.length)return;
    if(!window.confirm('Clear all annotations on this screen? This cannot be undone.'))return;
    strokes=[];redo=[];persist();render();updateControls();announce('Annotations cleared for this screen.');
  }
  function exportInk(){
    if(!strokes.length)return;
    const anchor=document.createElement('a');
    anchor.href=canvas.toDataURL('image/png');
    anchor.download='wortweg-annotations-'+new Date().toISOString().slice(0,10)+'.png';
    document.body.append(anchor);anchor.click();anchor.remove();
    announce('Transparent annotation PNG exported.');
  }
  function setOpen(open){
    panel.hidden=!open;launcher.hidden=open;prefs.open=open;savePrefs();
    updateControls();if(open)clampPanel();
  }
  function clampPanel(){
    if(!panel||panel.hidden)return;
    const box=panel.getBoundingClientRect();
    const x=Number.isFinite(prefs.left)?prefs.left:Math.max(8,window.innerWidth-box.width-18);
    const y=Number.isFinite(prefs.top)?prefs.top:94;
    prefs.left=Math.min(Math.max(8,x),Math.max(8,window.innerWidth-box.width-8));
    prefs.top=Math.min(Math.max(8,y),Math.max(8,window.innerHeight-box.height-8));
    panel.style.left=prefs.left+'px';panel.style.top=prefs.top+'px';
  }
  function setupDrag(handle){
    let drag=null;
    handle.addEventListener('pointerdown',event=>{
      if(event.button!==0&&event.pointerType==='mouse')return;
      const rect=panel.getBoundingClientRect();
      drag={id:event.pointerId,x:event.clientX-rect.left,y:event.clientY-rect.top};
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    handle.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      prefs.left=event.clientX-drag.x;prefs.top=event.clientY-drag.y;
      clampPanel();
    });
    const stop=()=>{if(drag){drag=null;savePrefs();}};
    handle.addEventListener('pointerup',stop);
    handle.addEventListener('pointercancel',stop);
  }
  function create(){
    if(document.getElementById('ww-whiteboard-panel'))return;
    const css=document.createElement('link');css.rel='stylesheet';css.href='./whiteboard.css?v=1';document.head.append(css);
    canvas=document.createElement('canvas');canvas.id='ww-whiteboard-canvas';canvas.setAttribute('aria-hidden','true');
    ctx=canvas.getContext('2d');
    if(!ctx)return;
    panel=document.createElement('aside');panel.id='ww-whiteboard-panel';panel.setAttribute('aria-label','Teaching whiteboard tools');
    panel.innerHTML='<div class="ww-wb-head"><div class="ww-wb-grip" role="img" aria-label="Drag toolbar">'+icon('grip')+'</div><div class="ww-wb-headline"><strong>Teaching whiteboard</strong><small>WortWeg · Screen annotation</small></div><button type="button" class="ww-wb-close" aria-label="Minimize whiteboard" title="Minimize">'+icon('minimize')+'</button></div><div class="ww-wb-tools" role="group" aria-label="Drawing tools"></div><div class="ww-wb-palette" role="group" aria-label="Ink colors"><span class="ww-wb-label">Color</span><div class="ww-wb-swatches"></div><label class="ww-wb-custom" title="Custom ink color"><input aria-label="Custom ink color" type="color" value="#e34343"><span>Custom</span></label></div><div class="ww-wb-size"><label for="ww-wb-size-range">Stroke width</label><input type="range" min="1" max="36" step="1" id="ww-wb-size-range" aria-label="Stroke width"><output for="ww-wb-size-range"></output></div><div class="ww-wb-actions" role="group" aria-label="Drawing actions"></div><p class="ww-wb-hint"></p><div class="ww-wb-live" role="status" aria-live="polite"></div>';
    live=panel.querySelector('.ww-wb-live');
    launcher=button('pencil','Open teaching whiteboard',()=>setOpen(true));
    launcher.id='ww-whiteboard-launcher';launcher.setAttribute('aria-controls','ww-whiteboard-panel');
    panel.querySelector('.ww-wb-close').addEventListener('click',()=>setOpen(false));
    const tools=panel.querySelector('.ww-wb-tools');
    toolButtons=['pointer','pencil','pen','highlighter','eraser'].map(name=>{
      const label={pointer:'Pointer / navigate',pencil:'Pencil',pen:'Pen',highlighter:'Highlighter',eraser:'Eraser'}[name];
      const b=button(name,label,()=>switchTool(name));b.dataset.tool=name;
      const nameEl=document.createElement('span');nameEl.textContent=label.split(' /')[0];b.append(nameEl);tools.append(b);return b;
    });
    const swatches=panel.querySelector('.ww-wb-swatches');
    COLORS.forEach(color=>{
      const b=document.createElement('button');b.type='button';b.className='ww-wb-color';
      b.style.setProperty('--ink',color);b.dataset.color=color;
      b.title='Ink '+color;b.setAttribute('aria-label','Select color '+color);
      b.addEventListener('click',()=>{prefs.color=color;savePrefs();updateControls();});
      swatches.append(b);
    });
    colorInput=panel.querySelector('input[type="color"]');
    colorInput.addEventListener('input',()=>{prefs.color=colorInput.value;savePrefs();updateControls();});
    sizeInput=panel.querySelector('#ww-wb-size-range');sizeText=panel.querySelector('output');
    sizeInput.addEventListener('input',()=>{prefs.size=Number(sizeInput.value);sizeText.textContent=prefs.size+' px';savePrefs();});
    const actions=panel.querySelector('.ww-wb-actions');
    const definitions=[['undo','Undo','ww-wb-undo',undoLast],['redo','Redo','ww-wb-redo',redoLast],['clear','Clear current screen','ww-wb-clear',clearPage],['save','Export transparent PNG','ww-wb-save',exportInk]];
    definitions.forEach(([name,title,id,callback])=>{
      const b=button(name,title,callback);b.id=id;
      const caption=document.createElement('span');caption.textContent=name==='save'?'PNG':title.split(' ')[0];b.append(caption);
      actions.append(b);
    });
    document.body.append(canvas,panel,launcher);
    setupDrag(panel.querySelector('.ww-wb-grip'));
    canvas.addEventListener('pointerdown',beginStroke);
    canvas.addEventListener('pointermove',moveStroke);
    canvas.addEventListener('pointerup',finishStroke);
    canvas.addEventListener('pointercancel',finishStroke);
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('scroll',render,{passive:true});
    window.addEventListener('hashchange',checkPage);
    window.addEventListener('popstate',checkPage);
    document.addEventListener('click',()=>requestAnimationFrame(checkPage),true);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&prefs.tool!=='pointer'){switchTool('pointer');return;}
      const editable=event.target?.closest?.('input,textarea,[contenteditable="true"]');
      if(editable||!event.ctrlKey&&!event.metaKey)return;
      if(event.key.toLowerCase()==='z'&&event.shiftKey){if(!redo.length)return;event.preventDefault();redoLast();}
      else if(event.key.toLowerCase()==='z'){if(!strokes.length)return;event.preventDefault();undoLast();}
    });
    const app=document.querySelector('#app')||document.body;
    const observer=new MutationObserver(()=>{
      if(!observer.pending){
        observer.pending=true;requestAnimationFrame(()=>{observer.pending=false;checkPage();});
      }
    });
    observer.observe(app,{attributes:true,attributeFilter:['class','hidden','aria-hidden'],subtree:true});
    window.WortWegWhiteboard={open:()=>setOpen(true),close:()=>setOpen(false),setTool:switchTool,undo:undoLast,redo:redoLast,clear:clearPage};
    pageKey=safeKey();strokes=pageStrokes(pageKey);
    resize();setOpen(Boolean(prefs.open));updateControls();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});
  else create();
})();