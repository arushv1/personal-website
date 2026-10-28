import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowsClockwise,Minus,Plus,X} from '@phosphor-icons/react';
import {BrainSliceScene} from './BrainSliceScene';
import {VascuPathInspector} from './VascuPathInspector';
import {followLink,routeHref} from './navigation.mjs';
import './vascupath-explorer.css';

export default function VascuPathExplorer({initialView,returnViewport,onClose,onNavigate,onContact}){
 const dialog=useRef(null),scene=useRef(null),research=useRef(null),stage=useRef(null),previousExtraction=useRef(false);
 const flight=useRef(null),closeTimer=useRef(null),closingRef=useRef(false),finishAction=useRef(onClose);
 const [extracted,setExtracted]=useState(false),[ready,setReady]=useState(false),[modelReady,setModelReady]=useState(false),[closing,setClosing]=useState(false),[returned,setReturned]=useState(false);
 const selectSlice=useCallback(()=>{if(!closingRef.current)setExtracted(true);},[]);
 const flyCanvas=useCallback(reverse=>{
  const currentRect=stage.current?.querySelector('.brain-slice-scene')?.getBoundingClientRect();
  flight.current?.cancel();
  const el=stage.current?.querySelector('.brain-slice-scene'),source=(reverse?returnViewport?.():null)||initialView?.viewport;
  if(!el||!el.querySelector('canvas')||!source||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  // Mobile readers can leave the atlas below the viewport. A gentle dissolve
  // is clearer than flying a model from an offscreen position in that case.
  if(source.top+source.height<40||source.top>innerHeight-40)return;
  const destination=stage.current.getBoundingClientRect(),from=reverse?currentRect:source,to=reverse?source:destination;
  const properties=['position','left','top','width','height','z-index'];
  Object.assign(el.style,{position:'fixed',left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px',zIndex:'3'});
  const animation=el.animate([
   {left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'},
   {left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px'},
  ],{duration:reverse?750:900,easing:'cubic-bezier(.22,.65,.3,1)',fill:'both'});
  flight.current=animation;
  animation.onfinish=()=>{
   if(reverse)return; // Keep the returned canvas over the original until fade-out.
   for(const property of properties)el.style.removeProperty(property);
   animation.cancel();flight.current=null;
  };
 },[initialView,returnViewport]);
 const sceneReady=useCallback((supported=true)=>{setReady(true);setModelReady(supported);if(!closingRef.current)flyCanvas(false);},[flyCanvas]);
 const returnStarted=useCallback(()=>flyCanvas(true),[flyCanvas]);
 const returnedToProject=useCallback(()=>{
  setReturned(true);
  const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:180;
  closeTimer.current=setTimeout(()=>finishAction.current(),delay);
 },[]);
 const requestClose=useCallback((action=onClose)=>{
  if(closingRef.current)return;
  closingRef.current=true;finishAction.current=action;setClosing(true);setExtracted(false);
 },[onClose]);
 useEffect(()=>{
  const el=dialog.current,previousOverflow=document.body.style.overflow,previousPadding=document.body.style.paddingRight,previousFocus=document.activeElement;
  const scrollbar=innerWidth-document.documentElement.clientWidth;
  if(scrollbar)document.body.style.paddingRight=parseFloat(getComputedStyle(document.body).paddingRight)+scrollbar+'px';
  document.body.style.overflow='hidden';el.showModal();
  return()=>{flight.current?.cancel();clearTimeout(closeTimer.current);if(el.open)el.close();document.body.style.overflow=previousOverflow;document.body.style.paddingRight=previousPadding;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});};
 },[]);
 useEffect(()=>{
  if(closing||extracted===previousExtraction.current)return;
  previousExtraction.current=extracted;
  const frame=requestAnimationFrame(()=>{
   const target=extracted?research.current?.querySelector('button[aria-pressed="true"]'):dialog.current?.querySelector('.brain-slice-scene canvas');
   target?.focus({preventScroll:true});
   if(matchMedia('(max-width:760px)').matches){
    const pane=extracted?research.current:dialog.current?.querySelector('.vascu-brain');
    if(pane)dialog.current.scrollTo({top:dialog.current.scrollTop+pane.getBoundingClientRect().top-dialog.current.getBoundingClientRect().top-55,behavior:'instant'});
   }
  });
  return()=>cancelAnimationFrame(frame);
 },[extracted,closing]);
 function link(event,path){const href=routeHref(path,location.search);followLink(event,href,()=>requestClose(()=>onNavigate(href)));}
 return <dialog ref={dialog} className={`vascu-explorer ${ready?'is-ready':''} ${closing?'is-closing':''} ${returned?'is-returned':''}`} aria-labelledby="vascu-title" onCancel={event=>{event.preventDefault();requestClose();}}>
  <header className="site-header vascu-chrome" inert={!ready||closing}>
   <a className="wordmark" href={routeHref('/',location.search)} onClick={event=>link(event,'/')}>ARUSH VYAS</a>
   <nav aria-label="Explorer navigation"><a href={routeHref('/atlas',location.search)} onClick={event=>link(event,'/atlas')}>Explore</a><a href={routeHref('/projects',location.search)} onClick={event=>link(event,'/projects')}>Projects</a><button onClick={()=>requestClose(onContact)}>Contact</button></nav>
  </header>
  <main className="vascu-content">
   <div className="vascu-topline"><button className="vascu-back" disabled={closing} onClick={extracted?()=>setExtracted(false):()=>requestClose()}><ArrowLeft size={17}/>{extracted?'Back to brain':'Back to project'}</button>{!ready&&<span className="vascu-preparing" role="status">Focusing the brain…</span>}<button className="vascu-close" disabled={closing} onClick={()=>requestClose()} aria-label="Close VascuPath explorer"><X size={20}/><span>Close</span></button></div>
   <div className={`vascu-grid ${extracted?'is-extracted':''}`}>
    <section ref={research} inert={!ready||closing} className="vascu-research vascu-chrome" aria-label="VascuPath research figures">
     <div className="vascu-heading"><h1 id="vascu-title">VascuPath<span className="red-period">.</span></h1><p>From brain tissue to vascular insight.</p></div>
     {extracted?<VascuPathInspector/>:<div className="vascu-intro"><p className="eyebrow">ONE LEVEL CLOSER</p><h2>Follow a slice inward<span className="red-period">.</span></h2><p>Pull the highlighted slice to the left, then explore the tissue and model outputs from my research.</p><button className="vascu-explore-button" disabled={closing} onClick={selectSlice}>Explore the slice<ArrowRight size={20}/></button><figure><img src="/vascupath/original.jpg" width="1400" height="868" alt="Stained brain tissue section from Arush Vyas’s research presentation."/><figcaption>Stained tissue · from the research presentation</figcaption></figure></div>}
    </section>
    <section inert={!ready||closing} className="vascu-brain" aria-label="Brain slice exploration">
     <div ref={stage} className="vascu-model-stage"><BrainSliceScene ref={scene} initialView={initialView} closing={closing} onReturnStart={returnStarted} onReturned={returnedToProject} extracted={extracted} onSelectSlice={selectSlice} onReady={sceneReady} textureUrl="/vascupath/original.jpg"/></div>
     <div className="vascu-chrome"><p className="vascu-position">Illustrative slice position<span className="vascu-sr-only">. Research figures are separate samples and are not spatially registered to this brain.</span></p>
     <div className="vascu-brain-controls" role="group" aria-label="Brain slice controls"><button disabled={!modelReady||closing} onClick={()=>scene.current?.zoom(-1)}><Minus size={16}/>Zoom out</button><button disabled={!modelReady||closing} onClick={()=>scene.current?.zoom(1)}><Plus size={16}/>Zoom in</button><button disabled={!modelReady||closing} onClick={()=>{setExtracted(false);scene.current?.reset();}}><ArrowsClockwise size={16}/>Reset view</button></div>
     {!extracted&&<p className="vascu-brain-hint">Drag to rotate · Select the highlighted slice</p>}</div>
    </section>
   </div>
  </main>
 </dialog>;
}
