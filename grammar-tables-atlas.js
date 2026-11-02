/* WortWeg 370 · German grammar atlas (120 original A1–C1 tables).
   Independent read-only reference viewer; never changes study history. */
(()=>{
  'use strict';
  if(window.WortWegGrammarTablesAtlas)return;
  const URL_SVG='./assets/german-grammar-a1-c1-120.svg';
  const css=document.createElement('link');
  css.rel='stylesheet';css.href='./grammar-tables-atlas.css?v=1';document.head.append(css);
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
  overlay.id='ww-grammar-tables-atlas';overlay.hidden=true;
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','German Grammar · 120 Tables');
  const top=mk('header','ww-atlas-topbar');
  const back=button('←','Back to WortWeg',close);
  back.classList.add('ww-atlas-back');
  const heading=mk('div','ww-atlas-heading');
  heading.append(mk('strong','','German Grammar · 120 Tables'),mk('small','','120 detailed tables · A1–C1'));
  const controls=mk('div','ww-atlas-controls');
  const counter=mk('span','ww-atlas-zoom','Fit');
  const view=mk('div','ww-atlas-viewport');view.tabIndex=0;
  view.setAttribute('aria-label','Scrollable grammar image. Pinch or use zoom buttons to enlarge.');
  const img=mk('img','ww-atlas-image');
  img.src=URL_SVG;img.alt='WortWeg 370: 120 complete German grammar tables covering A1 to C1';
  img.decoding='async';img.loading='lazy';img.draggable=false;
  view.append(img);
  const msg=mk('p','ww-atlas-hint','Pinch, scroll or use + / − to zoom.');
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
    const ratioY=oldW?view.scrollTop/(oldW*17515/11700):0;
    const width=baseWidth()*zoom;
    img.style.width=width+'px';
    img.style.maxWidth='none';
    counter.textContent=zoom===1?'Fit':Math.round(zoom*100)+'%';
    if(preserve){
      view.scrollLeft=ratioX*width;
      view.scrollTop=ratioY*width*17515/11700;
    }
  }
  function setZoom(next,cx,cy){
    const val=clamp(next,MIN,MAX);if(val===zoom)return;
    const r=view.getBoundingClientRect();
    const px=Number.isFinite(cx)?cx-r.left:r.width/2;
    const py=Number.isFinite(cy)?cy-r.top:r.height/2;
    const before=baseWidth()*zoom;
    const u=(view.scrollLeft+px)/before;
    const v=(view.scrollTop+py)/(before*17515/11700);
    zoom=val;paint(false);
    const after=baseWidth()*zoom;
    view.scrollLeft=u*after-px;
    view.scrollTop=v*after*17515/11700-py;
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
  download.href=URL_SVG;download.download='WortWeg-German-Grammar-A1-C1-120-Tables.svg';
  download.title='Save full-resolution grammar image';
  download.setAttribute('aria-label','Save 120-table grammar image SVG');
  const closeButton=button('×','Close grammar tables',close);
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
  window.WortWegGrammarTablesAtlas={open,close,getCount:()=>120};
})();
