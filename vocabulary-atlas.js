/* WortWeg 370 · complete vocabulary atlas (11,312 German–English records).
   Independent read-only reference viewer; never changes study history. */
(()=>{
  'use strict';
  if(window.WortWegVocabularyAtlas)return;
  const URL_SVG='./assets/WortWeg_Complete_11312_German_English_ONE_IMAGE.svg';
  const css=document.createElement('link');
  css.rel='stylesheet';css.href='./vocabulary-atlas.css?v=1';document.head.append(css);
  const mk=(tag,cls,label)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(label!==undefined)node.textContent=label;
    return node;
  };
  const button=(label,title,cb)=>{
    const el=mk('button','ww-atlas-btn',label);
    el.type='button';el.title=title;el.setAttribute('aria-label',title);
    el.addEventListener('click',cb);return el;
  };
  const overlay=mk('section','ww-atlas-overlay');
  overlay.id='ww-vocabulary-atlas';overlay.hidden=true;
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Complete Vocabulary Atlas');
  const top=mk('header','ww-atlas-topbar');
  const back=button('←','Back to WortWeg',close);
  back.classList.add('ww-atlas-back');
  const heading=mk('div','ww-atlas-heading');
  heading.append(mk('strong','','Complete Vocabulary Atlas'),mk('small','','11,312 German–English entries · A1–C2'));
  const controls=mk('div','ww-atlas-controls');
  const counter=mk('span','ww-atlas-zoom','Fit');
  const view=mk('div','ww-atlas-viewport');view.tabIndex=0;
  view.setAttribute('aria-label','Scrollable vocabulary image. Pinch or use zoom buttons to enlarge.');
  const img=mk('img','ww-atlas-image');
  img.src=URL_SVG;img.alt='WortWeg 370: 11,312 German vocabulary entries with English meanings';
  img.decoding='async';img.loading='lazy';img.draggable=false;
  view.append(img);
  const msg=mk('p','ww-atlas-hint','Pinch, scroll or use + / − to zoom. Drag/scroll to explore the complete image.');
  const footer=mk('footer','ww-atlas-footer');
  footer.append(msg);
  overlay.append(top,view,footer);
  document.body.append(overlay);
  let zoom=1,savedOverflow='',returnFocus=null,pinch=null;
  const MAX=32,MIN=1;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function baseWidth(){return Math.max(220,view.clientWidth);}
  function paint(preserve){
    const oldW=img.getBoundingClientRect().width||baseWidth();
    const ratioX=oldW?view.scrollLeft/oldW:0;
    const ratioY=oldW?view.scrollTop/(oldW*15190/16218):0;
    const width=baseWidth()*zoom;
    img.style.width=width+'px';
    img.style.maxWidth='none';
    counter.textContent=zoom===1?'Fit':Math.round(zoom*100)+'%';
    if(preserve){
      view.scrollLeft=ratioX*width;
      view.scrollTop=ratioY*width*15190/16218;
    }
  }
  function setZoom(next,cx,cy){
    const val=clamp(next,MIN,MAX);if(val===zoom)return;
    const r=view.getBoundingClientRect();
    const px=Number.isFinite(cx)?cx-r.left:r.width/2;
    const py=Number.isFinite(cy)?cy-r.top:r.height/2;
    const before=baseWidth()*zoom;
    const u=(view.scrollLeft+px)/before;
    const v=(view.scrollTop+py)/(before*15190/16218);
    zoom=val;paint(false);
    const after=baseWidth()*zoom;
    view.scrollLeft=u*after-px;
    view.scrollTop=v*after*15190/16218-py;
  }
  function open(){
    if(!overlay.hidden)return;
    returnFocus=document.activeElement;
    savedOverflow=document.body.style.overflow;
    overlay.hidden=false;document.body.style.overflow='hidden';
    zoom=1;view.scrollLeft=0;view.scrollTop=0;
    requestAnimationFrame(()=>{paint(false);back.focus({preventScroll:true});});
  }
  function close(){
    if(overlay.hidden)return;
    overlay.hidden=true;document.body.style.overflow=savedOverflow;
    returnFocus?.focus?.({preventScroll:true});
  }
  const minus=button('−','Zoom out',()=>setZoom(zoom/1.5));
  const plus=button('+','Zoom in',()=>setZoom(zoom*1.5));
  const fit=button('Fit','Fit full image width',()=>{zoom=1;paint(false);view.scrollTop=0;view.scrollLeft=0;});
  const download=mk('a','ww-atlas-btn ww-atlas-download','SVG');
  download.href=URL_SVG;download.download='WortWeg-Complete-Vocabulary-11312.svg';
  download.title='Save full-resolution vocabulary image';
  download.setAttribute('aria-label','Save complete vocabulary image SVG');
  const closeButton=button('×','Close vocabulary atlas',close);
  closeButton.classList.add('ww-atlas-close');
  controls.append(minus,counter,plus,fit,download,closeButton);
  top.append(back,heading,controls);
  view.addEventListener('wheel',e=>{
    if(!e.ctrlKey&&!e.metaKey)return;
    e.preventDefault();setZoom(zoom*(e.deltaY<0?1.18:1/1.18),e.clientX,e.clientY);
  },{passive:false});
  const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  view.addEventListener('touchstart',e=>{
    if(e.touches.length===2)pinch={d:distance(e.touches),zoom};
  },{passive:true});
  view.addEventListener('touchmove',e=>{
    if(!pinch||e.touches.length!==2)return;
    e.preventDefault();
    const cx=(e.touches[0].clientX+e.touches[1].clientX)/2;
    const cy=(e.touches[0].clientY+e.touches[1].clientY)/2;
    setZoom(pinch.zoom*distance(e.touches)/pinch.d,cx,cy);
  },{passive:false});
  view.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null;},{passive:true});
  document.addEventListener('keydown',e=>{
    if(overlay.hidden)return;
    if(e.key==='Escape'){e.preventDefault();close();}
    if((e.key==='+'||e.key==='=')&&!e.ctrlKey){e.preventDefault();setZoom(zoom*1.5);}
    if(e.key==='-'&&!e.ctrlKey){e.preventDefault();setZoom(zoom/1.5);}
  });
  window.addEventListener('resize',()=>{if(!overlay.hidden)paint(true);});
  img.addEventListener('error',()=>{
    msg.textContent='The image could not be loaded. Reconnect and reload WortWeg.';
  });
  const bank=document.getElementById('ww-bank-toolbar')||document.querySelector('#bank .spread');
  if(bank&&!document.getElementById('ww-atlas-bank-launch')){
    const launch=button('▦ Vocabulary Atlas','View all 11,312 words as one zoomable image',open);
    launch.id='ww-atlas-bank-launch';launch.classList.add('ww-atlas-bank-launch');
    bank.append(launch);
  }
  window.WortWegVocabularyAtlas={open,close,getCount:()=>11312};
})();
