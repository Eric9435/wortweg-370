/* WortWeg · Session-only, scroll-anchored annotation ruler (v2).
   Ink never enters localStorage/Firebase; changing page or reloading discards it. */
(function whiteboardV2(){
  'use strict';
  if(window.WortWegWhiteboard)return;
  /* Ink deliberately exists only in RAM for the currently visible page.
     Tool preferences (never strokes) may be saved to the device. */
  const PREFS='wortweg370-teaching-whiteboard-prefs-v1';
  const MAX_STROKES=500, MAX_POINTS=1800;
  const COLORS=['#e34343','#e58a20','#efc348','#2c9b75','#2788d8','#7867d8','#161d2a','#ffffff'];
  const SIZES={pencil:[1,2,3,5],pen:[1.5,3,5,9],highlighter:[9,16,24,36],eraser:[8,16,28,44]};
  const DEFAULT={pencil:2,pen:3,highlighter:24,eraser:28};
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
    palette:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="8" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="17" cy="13" r="1"/><path d="M12 21c-2-2 0-5 3-5"/>'
  };
  const icon=name=>'<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICON[name]+'</svg>';
  const getPrefs=()=>{try{const p=JSON.parse(localStorage.getItem(PREFS));return p&&typeof p==='object'?p:{};}catch{return {};}};
  const prefs=Object.assign({tool:'pointer',color:COLORS[0],open:innerWidth>650,left:null,top:null,sizes:{}},getPrefs());
  if(!['pointer','pencil','pen','highlighter','eraser'].includes(prefs.tool))prefs.tool='pointer';
  if(!/^#[0-9a-f]{6}$/i.test(prefs.color))prefs.color=COLORS[0];
  if(!prefs.sizes||typeof prefs.sizes!=='object')prefs.sizes={};
  const savePrefs=()=>{try{localStorage.setItem(PREFS,JSON.stringify(prefs));}catch{}};
  let pageKey='',strokes=[],undone=[],working=null,raf=0;
  let canvas,ctx,panel,launcher,popover,live,toolButtons;
  const announce=msg=>{if(live)live.textContent=msg;};
  function visible(element){
    if(!element||element.hidden)return false;
    const style=getComputedStyle(element);
    return style.display!=='none'&&style.visibility!=='hidden'&&element.getClientRects().length>0;
  }
  function safeKey(){
    const main=document.querySelector('main > .section.active[id],main > section.active[id],#app > .section.active[id],.ww-screen.active[id],section.active[id]');
    const route=main?.id||'main';
    const overlay=Array.from(document.querySelectorAll('.wwr-overlay,#wg-academy,#ww-flashcards,[role="dialog"][aria-modal="true"],.ww-special-vocabulary.open')).find(el=>visible(el));
    let sub='';
    if(route==='ww-topic-detail')sub=document.getElementById('ww-topic-id')?.textContent||'';
    if(overlay){
      sub+=(overlay.id||String(overlay.className||'modal'))+'|';
      sub+=overlay.querySelector('.wwr-header h2,.wg-body h1,.ww-flash-title,[data-reading-title]')?.textContent||'';
    }
    return route+'|'+sub.slice(0,180)+'|'+location.hash.slice(0,95);
  }
  function checkPage(){
    const next=safeKey();
    if(next===pageKey)return;
    /* Leaving the page destroys its ink instead of stashing it for return. */
    pageKey=next;working=null;strokes=[];undone=[];
    scheduleRender();updateControls();
  }
  function getRoot(e){
    if(!document.elementFromPoint)return null;
    const previous=canvas.style.getPropertyValue('pointer-events'),priority=canvas.style.getPropertyPriority('pointer-events');
    canvas.style.setProperty('pointer-events','none','important');
    let el;
    try{el=document.elementFromPoint(e.clientX,e.clientY);}
    finally{
      if(previous)canvas.style.setProperty('pointer-events',previous,priority);
      else canvas.style.removeProperty('pointer-events');
    }
    for(;el&&el!==document.body&&el!==document.documentElement;el=el.parentElement){
      const css=getComputedStyle(el);
      const y=/(auto|scroll|overlay)/.test(css.overflowY)&&el.scrollHeight>el.clientHeight+2;
      const x=/(auto|scroll|overlay)/.test(css.overflowX)&&el.scrollWidth>el.clientWidth+2;
      if(x||y)return el;
    }
    return null; // The document is the scrolling surface.
  }
  function point(e,root){
    if(root){
      const r=root.getBoundingClientRect();
      return [Math.round((e.clientX-r.left+root.scrollLeft)*10)/10,
              Math.round((e.clientY-r.top+root.scrollTop)*10)/10];
    }
    return [Math.round((e.clientX+(window.scrollX||0))*10)/10,
            Math.round((e.clientY+(window.scrollY||0))*10)/10];
  }
  function drawStroke(s){
    if(!s?.p?.length||s.root&&!s.root.isConnected)return;
    ctx.save();
    let dx=-(window.scrollX||0),dy=-(window.scrollY||0);
    if(s.root){
      const box=s.root.getBoundingClientRect();
      dx=box.left-s.root.scrollLeft;dy=box.top-s.root.scrollTop;
      ctx.beginPath();ctx.rect(box.left,box.top,box.width,box.height);ctx.clip();
    }
    ctx.globalCompositeOperation=s.t==='eraser'?'destination-out':'source-over';
    ctx.globalAlpha=s.t==='highlighter'?0.25:s.t==='pencil'?0.7:1;
    ctx.strokeStyle=s.c;ctx.fillStyle=s.c;ctx.lineWidth=s.s;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(s.p[0][0]+dx,s.p[0][1]+dy);
    if(s.p.length===1){
      ctx.arc(s.p[0][0]+dx,s.p[0][1]+dy,Math.max(.5,s.s/2),0,Math.PI*2);ctx.fill();
    }else{
      for(let i=1;i<s.p.length;i++)ctx.lineTo(s.p[i][0]+dx,s.p[i][1]+dy);
      ctx.stroke();
    }
    ctx.restore();
  }
  function render(){
    raf=0;if(!ctx)return;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    strokes.forEach(drawStroke);
    if(working)drawStroke(working);
  }
  function scheduleRender(){
    if(!raf)raf=requestAnimationFrame(render);
  }
  function resize(){
    if(!canvas)return;
    const ratio=Math.max(1,Math.min(3,devicePixelRatio||1));
    canvas.width=Math.round(innerWidth*ratio);
    canvas.height=Math.round(innerHeight*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    scheduleRender();clampPanel();
  }
  function widthFor(tool){
    const w=Number(prefs.sizes[tool]);
    return Number.isFinite(w)&&w>0?Math.min(60,w):DEFAULT[tool]||3;
  }
  function beginStroke(e){
    if(prefs.tool==='pointer'||(e.pointerType==='mouse'&&e.button!==0)||working)return;
    e.preventDefault();
    try{canvas.setPointerCapture(e.pointerId);}catch{}
    const root=getRoot(e);
    working={t:prefs.tool,c:prefs.color,s:widthFor(prefs.tool),root,p:[point(e,root)],id:e.pointerId};
    scheduleRender();
  }
  function moveStroke(e){
    if(!working||working.id!==e.pointerId)return;
    e.preventDefault();
    const p=point(e,working.root),last=working.p[working.p.length-1];
    if(Math.hypot(p[0]-last[0],p[1]-last[1])<1.1)return;
    if(working.p.length<MAX_POINTS)working.p.push(p);
    scheduleRender();
  }
  function finishStroke(e){
    if(!working||e&&working.id!==e.pointerId)return;
    if(e?.type==='pointercancel'){working=null;scheduleRender();return;}
    delete working.id;
    strokes.push(working);working=null;
    if(strokes.length>MAX_STROKES)strokes.shift();
    undone=[];scheduleRender();updateControls();
  }
  function makeButton(name,label,callback){
    const b=document.createElement('button');
    b.type='button';b.className='ww-wb-button';
    b.title=label;b.setAttribute('aria-label',label);b.innerHTML=icon(name);
    b.addEventListener('click',callback);
    return b;
  }
  function switchTool(tool){
    if(working)finishStroke();
    prefs.tool=tool;savePrefs();updateControls();
    announce(tool==='pointer'?'Navigation mode':tool+' ready');
  }
  function positionPopover(button){
    if(!button||popover.hidden)return;
    const p=panel.getBoundingClientRect(),b=button.getBoundingClientRect(),w=popover.offsetWidth||250;
    popover.style.left=Math.max(0,Math.min(p.width-w,b.left-p.left-80))+'px';
    const h=popover.offsetHeight||110;
    popover.classList.toggle('ww-wb-above',p.bottom+h+10>innerHeight&&p.top>h+12);
  }
  function showPopover(tool,button){
    if(tool==='pointer'){popover.hidden=true;return;}
    popover.dataset.tool=tool;
    popover.querySelector('.ww-wb-pop-icon').innerHTML=icon(tool);
    const widths=popover.querySelector('.ww-wb-widths');widths.replaceChildren();
    SIZES[tool].forEach(value=>{
      const b=document.createElement('button');b.type='button';b.className='ww-wb-width-option';
      b.title=value+' pixel '+tool;b.setAttribute('aria-label',b.title);
      const sw=document.createElement('span');sw.className='ww-wb-width-sample';
      sw.style.height=Math.max(1,Math.min(16,value))+'px';b.append(sw);
      b.classList.toggle('is-active',widthFor(tool)===value);
      b.addEventListener('click',()=>{prefs.sizes[tool]=value;savePrefs();showPopover(tool,button);});
      widths.append(b);
    });
    popover.querySelector('.ww-wb-colors').hidden=tool==='eraser';
    popover.hidden=false;positionPopover(button);
  }
  function updateControls(){
    if(!canvas||!panel)return;
    canvas.classList.toggle('ww-wb-draw',prefs.tool!=='pointer');
    toolButtons.forEach(b=>{
      const active=b.dataset.tool===prefs.tool;
      b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));
    });
    for(const [id,disabled] of [['ww-wb-undo',!strokes.length],['ww-wb-redo',!undone.length],['ww-wb-clear',!strokes.length],['ww-wb-save',!strokes.length]]){
      const el=document.getElementById(id);if(el)el.disabled=disabled;
    }
    const current=panel.querySelector('#ww-wb-current-ink');
    if(current)current.style.backgroundColor=prefs.color;
    panel.querySelectorAll('[data-color]').forEach(b=>{
      const active=b.dataset.color.toLowerCase()===prefs.color.toLowerCase();
      b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));
    });
    if(launcher)launcher.setAttribute('aria-expanded',String(!panel.hidden));
  }
  function undo(){if(!strokes.length)return;undone.push(strokes.pop());scheduleRender();updateControls();}
  function redo(){if(!undone.length)return;strokes.push(undone.pop());scheduleRender();updateControls();}
  function clear(){
    if(!strokes.length)return;
    if(!confirm('Clear the annotations on this page?'))return;
    strokes=[];undone=[];scheduleRender();updateControls();announce('Current page cleared');
  }
  function exportInk(){
    if(!strokes.length)return;
    const a=document.createElement('a');
    a.href=canvas.toDataURL('image/png');a.download='wortweg-visible-ink.png';
    document.body.append(a);a.click();a.remove();announce('Visible ink exported');
  }
  function setOpen(open){
    panel.hidden=!open;launcher.hidden=open;popover.hidden=true;
    prefs.open=open;savePrefs();updateControls();if(open)clampPanel();
  }
  function clampPanel(){
    if(!panel||panel.hidden)return;
    const box=panel.getBoundingClientRect();
    const x=Number.isFinite(prefs.left)?prefs.left:Math.max(8,(innerWidth-box.width)/2);
    const y=Number.isFinite(prefs.top)?prefs.top:72;
    prefs.left=Math.min(Math.max(6,x),Math.max(6,innerWidth-box.width-6));
    prefs.top=Math.min(Math.max(6,y),Math.max(6,innerHeight-box.height-6));
    panel.style.left=prefs.left+'px';panel.style.top=prefs.top+'px';
    if(!popover.hidden)positionPopover(panel.querySelector('[data-tool="'+popover.dataset.tool+'"]'));
  }
  function setupDrag(handle){
    let drag=null;
    handle.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      const rect=panel.getBoundingClientRect();
      drag={id:e.pointerId,x:e.clientX-rect.left,y:e.clientY-rect.top};
      try{handle.setPointerCapture(e.pointerId);}catch{}
      e.preventDefault();
    });
    handle.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      prefs.left=e.clientX-drag.x;prefs.top=e.clientY-drag.y;clampPanel();
    });
    function stop(){if(drag){drag=null;savePrefs();}}
    handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);
  }
  function create(){
    if(document.getElementById('ww-whiteboard-panel'))return;
    const css=document.createElement('link');css.rel='stylesheet';css.href='./whiteboard.css?v=2';document.head.append(css);
    canvas=document.createElement('canvas');canvas.id='ww-whiteboard-canvas';canvas.setAttribute('aria-hidden','true');
    ctx=canvas.getContext('2d');if(!ctx)return;
    panel=document.createElement('aside');panel.id='ww-whiteboard-panel';panel.setAttribute('aria-label','Temporary annotations');
    panel.innerHTML='<div class="ww-wb-strip" role="toolbar" aria-label="Temporary drawing toolbar">'+
      '<div class="ww-wb-grip" role="button" tabindex="0" aria-label="Drag toolbar" title="Drag toolbar">'+icon('grip')+'</div>'+
      '<div class="ww-wb-tools" role="group" aria-label="Drawing tools"></div>'+
      '<span class="ww-wb-divider" aria-hidden="true"></span>'+
      '<button type="button" class="ww-wb-button" id="ww-wb-palette" title="Ink settings" aria-label="Ink settings">'+icon('palette')+'<i id="ww-wb-current-ink"></i></button>'+
      '<span class="ww-wb-divider" aria-hidden="true"></span>'+
      '<div class="ww-wb-actions" role="group" aria-label="Annotation actions"></div>'+
      '<button type="button" class="ww-wb-button ww-wb-close" title="Minimize" aria-label="Minimize">'+icon('minimize')+'</button>'+
      '</div><div class="ww-wb-popover" hidden><div class="ww-wb-pop-head"><span class="ww-wb-pop-icon"></span><div class="ww-wb-widths" role="group" aria-label="Tool widths"></div></div><div class="ww-wb-colors" role="group" aria-label="Ink colors"></div></div>'+
      '<div class="ww-wb-live" role="status" aria-live="polite"></div>';
    popover=panel.querySelector('.ww-wb-popover');live=panel.querySelector('.ww-wb-live');
    const tools=panel.querySelector('.ww-wb-tools');
    toolButtons=['pointer','pencil','pen','highlighter','eraser'].map(name=>{
      const labels={pointer:'Scroll or select',pencil:'Pencil',pen:'Pen',highlighter:'Highlighter',eraser:'Eraser'};
      const b=makeButton(name,labels[name],()=>{
        if(prefs.tool===name&&name!=='pointer')showPopover(name,b);
        else{switchTool(name);popover.hidden=true;}
      });
      b.dataset.tool=name;b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&name!=='pointer')showPopover(name,b);});
      b.addEventListener('focus',()=>{if(name!=='pointer')showPopover(name,b);});
      tools.append(b);return b;
    });
    const colors=panel.querySelector('.ww-wb-colors');
    COLORS.forEach(color=>{
      const b=document.createElement('button');b.type='button';b.className='ww-wb-color';
      b.dataset.color=color;b.style.setProperty('--ink',color);
      b.title=color;b.setAttribute('aria-label','Ink '+color);
      b.addEventListener('click',()=>{prefs.color=color;savePrefs();updateControls();});
      colors.append(b);
    });
    const custom=document.createElement('input');custom.type='color';custom.title='Custom ink color';
    custom.setAttribute('aria-label','Custom ink color');custom.value=prefs.color;
    custom.addEventListener('input',()=>{prefs.color=custom.value;savePrefs();updateControls();});
    colors.append(custom);
    panel.querySelector('#ww-wb-palette').addEventListener('click',()=>showPopover(prefs.tool==='pointer'?'pen':prefs.tool,panel.querySelector('#ww-wb-palette')));
    const actions=panel.querySelector('.ww-wb-actions');
    [['undo','Undo','ww-wb-undo',undo],['redo','Redo','ww-wb-redo',redo],
     ['clear','Clear this page','ww-wb-clear',clear],['save','Export visible ink','ww-wb-save',exportInk]].forEach(([name,label,id,cb])=>{
      const b=makeButton(name,label,cb);b.id=id;actions.append(b);
    });
    launcher=makeButton('pencil','Open annotation toolbar',()=>setOpen(true));
    launcher.id='ww-whiteboard-launcher';launcher.setAttribute('aria-controls','ww-whiteboard-panel');
    panel.querySelector('.ww-wb-close').addEventListener('click',()=>setOpen(false));
    document.body.append(canvas,panel,launcher);
    setupDrag(panel.querySelector('.ww-wb-grip'));
    document.addEventListener('pointerdown',e=>{
      if(!panel.contains(e.target)&&e.target!==launcher)popover.hidden=true;
    },true);
    canvas.addEventListener('pointerdown',beginStroke);
    canvas.addEventListener('pointermove',moveStroke);
    canvas.addEventListener('pointerup',finishStroke);
    canvas.addEventListener('pointercancel',finishStroke);
    /* Capture-phase scroll catches window AND nested reading-panel scrolling. */
    document.addEventListener('scroll',scheduleRender,{passive:true,capture:true});
    window.addEventListener('scroll',scheduleRender,{passive:true});
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('hashchange',checkPage);
    window.addEventListener('popstate',checkPage);
    document.addEventListener('click',()=>requestAnimationFrame(checkPage),true);
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){
        if(!popover.hidden){popover.hidden=true;return;}
        if(prefs.tool!=='pointer'){switchTool('pointer');return;}
      }
      if(!e.ctrlKey&&!e.metaKey||e.target?.closest?.('input,textarea,[contenteditable="true"]'))return;
      if(e.key.toLowerCase()==='z'){
        if(e.shiftKey&&undone.length){e.preventDefault();redo();}
        else if(strokes.length){e.preventDefault();undo();}
      }
    });
    const app=document.querySelector('#app')||document.body;
    const observer=new MutationObserver(()=>{
      if(observer.pending)return;
      observer.pending=true;
      requestAnimationFrame(()=>{observer.pending=false;checkPage();});
    });
    observer.observe(app,{attributes:true,attributeFilter:['class','hidden','aria-hidden'],childList:true,subtree:true});
    window.WortWegWhiteboard={open:()=>setOpen(true),close:()=>setOpen(false),setTool:switchTool,
      undo,redo,clear,getStrokeCount:()=>strokes.length,getPage:()=>pageKey};
    pageKey=safeKey();
    resize();setOpen(Boolean(prefs.open));updateControls();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});
  else create();
})();
