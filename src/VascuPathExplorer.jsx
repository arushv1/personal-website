import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowsClockwise,Minus,Plus,X} from '@phosphor-icons/react';
import {BrainSliceScene} from './BrainSliceScene';
import {VascuPathInspector} from './VascuPathInspector';
import {followLink,routeHref} from './navigation.mjs';
import './vascupath-explorer.css';

export default function VascuPathExplorer({onClose,onNavigate,onContact}){
 const dialog=useRef(null),scene=useRef(null),research=useRef(null),previousExtraction=useRef(false);
 const [extracted,setExtracted]=useState(false),[ready,setReady]=useState(false);
 const selectSlice=useCallback(()=>setExtracted(true),[]);
 const sceneReady=useCallback(()=>setReady(true),[]);
 useEffect(()=>{
  const el=dialog.current,previousOverflow=document.body.style.overflow,previousFocus=document.activeElement;
  document.body.style.overflow='hidden';el.showModal();
  return()=>{if(el.open)el.close();document.body.style.overflow=previousOverflow;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});};
 },[]);
 useEffect(()=>{
  if(extracted===previousExtraction.current)return;
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
 },[extracted]);
 function link(event,path){const href=routeHref(path,location.search);followLink(event,href,onNavigate);}
 return <dialog ref={dialog} className="vascu-explorer" aria-labelledby="vascu-title" onCancel={event=>{event.preventDefault();onClose();}}>
  <header className="site-header">
   <a className="wordmark" href={routeHref('/',location.search)} onClick={event=>link(event,'/')}>ARUSH VYAS</a>
   <nav aria-label="Explorer navigation"><a href={routeHref('/atlas',location.search)} onClick={event=>link(event,'/atlas')}>Explore</a><a href={routeHref('/projects',location.search)} onClick={event=>link(event,'/projects')}>Projects</a><button onClick={onContact}>Contact</button></nav>
  </header>
  <main className="vascu-content">
   <div className="vascu-topline"><button className="vascu-back" onClick={extracted?()=>setExtracted(false):onClose}><ArrowLeft size={17}/>{extracted?'Back to brain':'Back to project'}</button><button className="vascu-close" onClick={onClose} aria-label="Close VascuPath explorer"><X size={20}/><span>Close</span></button></div>
   <div className="vascu-heading"><h1 id="vascu-title">VascuPath<span className="red-period">.</span></h1><p>From brain tissue to vascular insight.</p></div>
   <div className={`vascu-grid ${extracted?'is-extracted':''}`}>
    <section className="vascu-brain" aria-label="Brain slice exploration">
     <BrainSliceScene ref={scene} extracted={extracted} onSelectSlice={selectSlice} onReady={sceneReady} textureUrl="/vascupath/original.jpg"/>
     <p className="vascu-position">Illustrative slice position<span className="vascu-sr-only">. Research figures are separate samples and are not spatially registered to this brain.</span></p>
     <div className="vascu-brain-controls" role="group" aria-label="Brain slice controls"><button disabled={!ready} onClick={()=>scene.current?.zoom(-1)}><Minus size={16}/>Zoom out</button><button disabled={!ready} onClick={()=>scene.current?.zoom(1)}><Plus size={16}/>Zoom in</button><button disabled={!ready} onClick={()=>{setExtracted(false);scene.current?.reset();}}><ArrowsClockwise size={16}/>Reset view</button></div>
     {!extracted&&<p className="vascu-brain-hint">Drag to rotate · Select the highlighted slice</p>}
    </section>
    <section ref={research} className="vascu-research" aria-label="VascuPath research figures">
     {extracted?<VascuPathInspector/>:<div className="vascu-intro"><p className="eyebrow">ONE LEVEL CLOSER</p><h2>Follow a slice inward<span className="red-period">.</span></h2><p>Start with the brain. Pull out the highlighted coronal slice, then explore the tissue and model outputs from my research.</p><button className="vascu-explore-button" onClick={selectSlice}>Explore the slice<ArrowRight size={20}/></button><figure><img src="/vascupath/original.jpg" width="1400" height="868" alt="Stained brain tissue section from Arush Vyas’s research presentation."/><figcaption>Stained tissue · from the research presentation</figcaption></figure></div>}
    </section>
   </div>
  </main>
 </dialog>;
}
