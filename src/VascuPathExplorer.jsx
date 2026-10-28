import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowsClockwise,Minus,Plus,X} from '@phosphor-icons/react';
import {VascuPathInspector} from './VascuPathInspector';
import {followLink,routeHref} from './navigation.mjs';
import './vascupath-explorer.css';

export default function VascuPathExplorer({sceneRef,onClose,onNavigate,onContact}){
 const dialog=useRef(null),stage=useRef(null),research=useRef(null),interaction=useRef(null),finishAction=useRef(onClose),closingRef=useRef(false);
 const [extracted,setExtracted]=useState(false),[ready,setReady]=useState(false),[modelReady,setModelReady]=useState(false),[closing,setClosing]=useState(false);
 interaction.current={ready,closing};
 const selectSlice=useCallback(()=>{if(!closingRef.current)setExtracted(true);},[]);
 const requestClose=useCallback((action=onClose)=>{
  if(closingRef.current)return;
  closingRef.current=true;finishAction.current=action;setClosing(true);
  if(sceneRef.current?.getCanvas()&&sceneRef.current?.closeBrainSlice)sceneRef.current.closeBrainSlice({onReturned:()=>finishAction.current()});else finishAction.current();
 },[onClose,sceneRef]);
 useLayoutEffect(()=>{
  const el=dialog.current,api=sceneRef.current,canvas=api?.getCanvas(),origin=canvas?.parentElement,previousFocus=document.activeElement;
  const previousOverflow=document.body.style.overflow,previousPadding=document.body.style.paddingRight;
  const canvasStyle=canvas?.style.cssText,canvasLabel=canvas?.getAttribute('aria-label');let disposed=false,lastSize='',down=null;
  const scrollbar=innerWidth-document.documentElement.clientWidth;
  if(scrollbar)document.body.style.paddingRight=parseFloat(getComputedStyle(document.body).paddingRight)+scrollbar+'px';
  document.body.style.overflow='hidden';el.showModal();
  // This canvas is created imperatively by AnatomyScene. Moving only that DOM
  // node keeps its WebGL context, geometry, camera and render buffers alive.
  if(canvas)stage.current.append(canvas);
  const positionCanvas=()=>{
   if(!canvas)return;
   const mobile=matchMedia('(max-width:760px)').matches,rect=mobile?stage.current.getBoundingClientRect():api.getView().viewport;
   if(!mobile)for(const [key,value] of Object.entries(rect))el.style.setProperty('--atlas-'+key,value+'px');
   Object.assign(canvas.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',zIndex:'2'});
   const size=mobile?rect.width+','+rect.height:'atlas';
   if(size!==lastSize){lastSize=size;api.setFocusViewport(mobile?{width:rect.width,height:rect.height}:null);}
  };
  positionCanvas();window.addEventListener('resize',positionCanvas);el.addEventListener('scroll',positionCanvas,{passive:true});
  const pointerDown=event=>{if(event.button===0)down={id:event.pointerId,x:event.clientX,y:event.clientY};};
  const pointerUp=event=>{if(down&&down.id===event.pointerId&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<6&&api.hitBrainSlice(event.clientX,event.clientY))selectSlice();down=null;};
  const pointerMove=event=>{if(!event.buttons&&canvas)canvas.style.cursor=api.hitBrainSlice(event.clientX,event.clientY)?'pointer':'grab';};
  const keydown=event=>{
   if(!interaction.current.ready||interaction.current.closing)return;
   if(['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))event.preventDefault();
   if(event.key==='Enter'||event.key===' ')selectSlice();
   if(event.key==='ArrowLeft')api.focusRotate(-.12,0);if(event.key==='ArrowRight')api.focusRotate(.12,0);
   if(event.key==='ArrowUp')api.focusRotate(0,-.08);if(event.key==='ArrowDown')api.focusRotate(0,.08);
   if(event.key==='+'||event.key==='=')api.focusZoom(1);if(event.key==='-')api.focusZoom(-1);
   if(event.key==='Home'){setExtracted(false);api.extractBrainSlice(false);api.focusReset();}
  };
  if(canvas){canvas.setAttribute('aria-label','Interactive brain with a highlighted illustrative coronal slice. Select the slice or press Enter to explore. Drag or use arrow keys to rotate; plus and minus zoom.');canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('keydown',keydown);}
  const focused=()=>{if(!disposed)setReady(true);};
  if(canvas&&api?.startBrainSlice)api.startBrainSlice({onReady:supported=>{if(!disposed)setModelReady(supported);},onFocused:focused});else focused();
  return()=>{
   disposed=true;api?.abortBrainSlice();window.removeEventListener('resize',positionCanvas);el.removeEventListener('scroll',positionCanvas);
   if(canvas){canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('keydown',keydown);canvas.style.cssText=canvasStyle;canvas.setAttribute('aria-label',canvasLabel);origin?.prepend(canvas);api?.setFocusViewport(null);}
   if(el.open)el.close();document.body.style.overflow=previousOverflow;document.body.style.paddingRight=previousPadding;
   if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  };
 },[sceneRef,selectSlice]);
 useEffect(()=>{
  sceneRef.current?.extractBrainSlice(extracted);
  if(!ready||closing)return;
  const timer=setTimeout(()=>{
   const target=extracted?research.current?.querySelector('button[aria-pressed="true"]'):stage.current?.querySelector('canvas');target?.focus({preventScroll:true});
   if(extracted&&matchMedia('(max-width:760px)').matches){const pane=research.current;dialog.current.scrollTo({top:dialog.current.scrollTop+pane.getBoundingClientRect().top-dialog.current.getBoundingClientRect().top-55,behavior:'instant'});}
  },matchMedia('(prefers-reduced-motion:reduce)').matches?0:260);
  return()=>clearTimeout(timer);
 },[extracted,ready,closing,sceneRef]);
 function link(event,path){const href=routeHref(path,location.search);followLink(event,href,()=>requestClose(()=>onNavigate(href)));}
 return <dialog ref={dialog} className={`vascu-explorer ${ready?'is-ready':''} ${closing?'is-closing':''}`} aria-labelledby="vascu-title" onCancel={event=>{event.preventDefault();requestClose();}}>
  <header className="site-header"><a className="wordmark" href={routeHref('/',location.search)} onClick={event=>link(event,'/')}>ARUSH VYAS</a><nav aria-label="Explorer navigation"><a href={routeHref('/atlas',location.search)} onClick={event=>link(event,'/atlas')}>Explore</a><a href={routeHref('/projects',location.search)} onClick={event=>link(event,'/projects')}>Projects</a><button onClick={()=>requestClose(onContact)}>Contact</button></nav></header>
  <main className="vascu-content">
   <div className="vascu-topline"><button className="vascu-back" disabled={closing} onClick={extracted?()=>setExtracted(false):()=>requestClose()}><ArrowLeft size={17}/>{extracted?'Back to brain':'Back to project'}</button>{!ready&&<span className="vascu-preparing" role="status">Focusing the brain…</span>}<button className="vascu-close" disabled={closing} onClick={()=>requestClose()} aria-label="Close VascuPath explorer"><X size={20}/><span>Close</span></button></div>
   <div className={`vascu-grid ${extracted?'is-extracted':''}`}>
    <section ref={research} inert={!ready||closing} className="vascu-research vascu-chrome" aria-label="VascuPath research figures">
     <div className="vascu-heading"><h1 id="vascu-title">VascuPath<span className="red-period">.</span></h1><p>From brain tissue to vascular insight.</p></div>
     {extracted?<div className="vascu-figure-reveal"><VascuPathInspector/></div>:<div className="vascu-intro"><p className="eyebrow">ONE LEVEL CLOSER</p><h2>Follow a slice inward<span className="red-period">.</span></h2><p>Pull the highlighted slice to the left, then explore the tissue and model outputs from my research.</p><button className="vascu-explore-button" disabled={!ready||closing} onClick={selectSlice}>Explore the slice<ArrowRight size={20}/></button><figure><img src="/vascupath/original.jpg" width="1400" height="868" alt="Stained brain tissue section from Arush Vyas’s research presentation."/><figcaption>Stained tissue · from the research presentation</figcaption></figure></div>}
    </section>
    <section inert={!ready||closing} className="vascu-brain" aria-label="Brain slice exploration">
     <div ref={stage} className="vascu-model-stage brain-slice-scene">{ready&&!modelReady&&<div className="brain-slice-status" role="status">The focused 3D view is unavailable. You can still explore the research figures.</div>}</div>
     <div className="vascu-chrome"><p className="vascu-position">Illustrative slice position<span className="vascu-sr-only">. Research figures are separate samples and are not spatially registered to this brain.</span></p><div className="vascu-brain-controls" role="group" aria-label="Brain slice controls"><button disabled={!modelReady||closing} onClick={()=>sceneRef.current?.focusZoom(-1)}><Minus size={16}/>Zoom out</button><button disabled={!modelReady||closing} onClick={()=>sceneRef.current?.focusZoom(1)}><Plus size={16}/>Zoom in</button><button disabled={!modelReady||closing} onClick={()=>{setExtracted(false);sceneRef.current?.extractBrainSlice(false);sceneRef.current?.focusReset();}}><ArrowsClockwise size={16}/>Reset view</button></div>{!extracted&&<p className="vascu-brain-hint">Drag to rotate · Select the highlighted slice</p>}</div>
    </section>
   </div>
  </main>
 </dialog>;
}
