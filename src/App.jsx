import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ArrowLeft, MouseSimple, ArrowsClockwise, Pause, Play, X, Minus, Plus, EnvelopeSimple } from '@phosphor-icons/react';
import { AnatomyScene } from './AnatomyScene';
import { SectionReader } from './SectionReader';
import { CourseMap } from './CourseMap';
import { sections, sectionById, overviewView } from './content/portfolio.mjs';
import { readRoute, followLink, routeHref } from './navigation.mjs';
const VascuPathExplorer=lazy(()=>import('./VascuPathExplorer'));

function RouteLink({to,navigate,children,...props}) {
 const href=routeHref(to,location.search);
 return <a {...props} href={href} onClick={event=>followLink(event,href,navigate)}>{children}</a>;
}
const layers=[{value:0,name:'You'},{value:34,name:'Bone'},{value:72,name:'Vessels'},{value:100,name:'Within'}];
export function App(){
 const [route,setRoute]=useState(()=>readRoute(location.pathname));
 const chapter=route.slice(1),current=sectionById[chapter],exploring=route!=='/'&&route!=='not-found';
 const [reveal,setReveal]=useState(()=>current?.view.reveal??(exploring?overviewView.reveal:0));
 const [vascuOpen,setVascuOpen]=useState(false);
 const [spinning,setSpinning]=useState(()=>route==='/'&&!matchMedia('(prefers-reduced-motion: reduce)').matches),[ready,setReady]=useState(false),[dialog,setDialog]=useState(null);
 const scene=useRef(null),dialogRef=useRef(null),chapterHeading=useRef(null),atlasHeading=useRef(null),previousRoute=useRef(route);
 function resetView(){setReveal(0);setSpinning(false);scene.current?.reset();}
 const openExperience=useCallback(experience=>{if(experience==='brain-slice'){setSpinning(false);scene.current?.stopMotion();setVascuOpen(true);}},[]);
 const closeExperience=useCallback(()=>setVascuOpen(false),[]);
 function navigate(path){
  const next=readRoute(new URL(path,location.origin).pathname);
  if(next===route){if(current){setReveal(current.view.reveal);setSpinning(false);scene.current?.focusSection(current.id);}return;}
  history.pushState(null,'',path);setRoute(next);
 }
 useEffect(()=>{
  const canonical=readRoute(location.pathname);
  if(canonical!=='not-found'&&location.pathname.replace(/\/+$/,'')!==canonical)history.replaceState(null,'',canonical+location.search+location.hash);
  const pop=()=>setRoute(readRoute(location.pathname));window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);
 },[]);
 useEffect(()=>{
  document.title=`Arush Vyas — ${current?.label||(route==='/atlas'?'The atlas':route==='not-found'?'Page not found':'A closer look')}`;
  document.documentElement.style.colorScheme='dark';
  setVascuOpen(false);
  setReveal(current?.view.reveal??(exploring?overviewView.reveal:0));
  if(exploring)setSpinning(false);
  if(previousRoute.current!==route){
   if(route==='/'){scene.current?.reset();document.querySelector('.primary-action')?.focus({preventScroll:true});}
   if(route==='/atlas')atlasHeading.current?.focus({preventScroll:true});
   previousRoute.current=route;
  }
 },[route,current,exploring]);
 useEffect(()=>{if(dialog&&!dialogRef.current.open)dialogRef.current.showModal();else if(!dialog&&dialogRef.current.open)dialogRef.current.close();},[dialog]);
 useEffect(()=>{
  if(!current)return;chapterHeading.current?.focus({preventScroll:true});
  if(matchMedia('(max-width: 760px)').matches)chapterHeading.current?.closest('article')?.scrollIntoView({block:'start',behavior:'instant'});
 },[current]);
 useEffect(()=>{const handler=event=>{if(event.key==='Escape'&&!dialog&&!vascuOpen&&exploring)navigate('/');};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[dialog,vascuOpen,exploring,route]);
 function changeReveal(value){setSpinning(false);scene.current?.stopMotion();setReveal(value);}
 const layerIndex=reveal<17?0:reveal<53?1:reveal<86?2:3;
 const layerDescription=reveal<=15?'Arush’s 3D avatar':reveal<34?'Glassy avatar revealing internal anatomy':reveal<52?'Bone with emerging vessels':reveal<65?'Bone and vessels in a CTA-style view':reveal<72?'Vessels with receding bone':reveal<=74?'Vascular tree':'Cortex and major vessels within the atlas';
 return <div className={`site-shell ${exploring?'is-exploring':''} ${current?'has-chapter':''} ${current?.id==='courses'?'has-course-map':''} ${vascuOpen?'has-vascu':''}`}>
  <header className="site-header"><RouteLink className="wordmark" aria-label="Arush Vyas, return home" to="/" navigate={navigate}>ARUSH VYAS</RouteLink><nav aria-label="Main navigation"><RouteLink to="/atlas" navigate={navigate}>Explore</RouteLink><RouteLink to="/projects" navigate={navigate}>Projects</RouteLink><button onClick={()=>setDialog('contact')}>Contact</button></nav></header>
  <main className="hero">
   <div className="portrait-region" id="model-view">{exploring&&<div className="view-caption"><span className="eyebrow">{current?'SELECTED VIEW':'A PERSONAL ATLAS'}</span><span>{current?.region||(exploring?'Choose a section on the model':'Explore the atlas to reveal sections')}</span>{current&&<a className="back-to-reading" href="#chapter-title">Back to reading</a>}</div>}<AnatomyScene ref={scene} reveal={reveal} exploring={exploring} activeChapter={current?.id||null} spinning={spinning} onNavigate={navigate} onReset={resetView} onInteraction={()=>setSpinning(false)} onReady={()=>setReady(true)}/>
    <div className="portrait-bottom">
     <div className="scene-actions" role="group" aria-label="3D view controls"><button aria-label={spinning?'Pause rotation':'Start rotation'} onClick={()=>setSpinning(!spinning)} disabled={!ready}>{spinning?<Pause size={18}/>:<Play size={18}/>}<span>{spinning?'Pause':'Rotate'}</span></button><button aria-label="Reset view and layers" onClick={resetView} disabled={!ready}><ArrowsClockwise size={18}/><span>Reset</span></button><button aria-label="Zoom out" onClick={()=>scene.current?.zoom(-1)} disabled={!ready}><Minus size={18}/><span>Zoom out</span></button><button aria-label="Zoom in" onClick={()=>scene.current?.zoom(1)} disabled={!ready}><Plus size={18}/><span>Zoom in</span></button></div>
     <div className="layer-control"><div className="layer-heading"><label htmlFor="reveal">Look within</label><span>{layers[layerIndex].name} · {reveal}%</span></div><input id="reveal" type="range" min="0" max="100" value={reveal} onPointerDown={()=>{setSpinning(false);scene.current?.stopMotion();}} onKeyDown={()=>{setSpinning(false);scene.current?.stopMotion();}} onChange={e=>changeReveal(Number(e.target.value))} disabled={!ready} aria-label="Reveal avatar and internal layers" aria-valuetext={layerDescription}/><div className="layer-stops" role="group" aria-label="Choose a layer">{layers.map((layer,index)=><button key={layer.name} aria-pressed={index===layerIndex} onClick={()=>changeReveal(layer.value)} disabled={!ready}>{layer.name}</button>)}</div></div>
     <div className="gesture-hint"><MouseSimple size={17}/><span className="desktop-gesture">Drag to rotate · Scroll over model to zoom</span><span className="mobile-gesture">Swipe sideways to rotate · Scroll the page to explore</span></div>
    </div>
   </div>
   {route==='/'&&<section className="hero-copy" aria-label="Introduction"><h1 aria-label="Take a closer look.">Take a<br/>{' '}closer<br/>{' '}look<span className="red-period">.</span></h1><p className="hero-subtitle">Biomedical engineering. Building. Exploring.</p><RouteLink className="primary-action" to="/atlas" navigate={navigate}>Explore the atlas <ArrowRight size={23}/></RouteLink></section>}
   {route==='/atlas'&&<section className="atlas-intro"><RouteLink className="back-action" to="/" navigate={navigate}><ArrowLeft size={17}/> The whole picture</RouteLink><p className="eyebrow">SEVEN WAYS TO LOOK CLOSER</p><h1 ref={atlasHeading} tabIndex={-1}>An atlas of<br/>a person<span className="red-period">.</span></h1><p className="atlas-description">Choose a section. Each one brings a different part of the structure into view.</p><div className="chapter-list">{sections.map((section,index)=><RouteLink key={section.id} to={'/'+section.id} navigate={navigate}><span className="chapter-number">{String(index+1).padStart(2,'0')}</span><span>{section.label}</span><span className="section-count">{section.items.length||'—'}</span><ArrowUpRight size={18}/></RouteLink>)}</div></section>}
   {current&&<article className="chapter-content" aria-labelledby="chapter-title"><RouteLink className="back-action" to="/atlas" navigate={navigate}><ArrowLeft size={17}/> All sections</RouteLink><a className="view-model-link" href="#model-view">View 3D · {current.region}<ArrowUpRight size={15}/></a><p className="eyebrow">{current.eyebrow}</p><h1 id="chapter-title" ref={chapterHeading} tabIndex={-1}>{current.title}<span className="red-period">.</span></h1><p className="chapter-intro">{current.intro}</p>{current.id==='courses'?<CourseMap onNavigate={navigate}/>:<SectionReader key={current.id} section={current} onExplore={openExperience}/>}<nav className="chapter-pager" aria-label="Portfolio sections">{sections.map(section=><RouteLink key={section.id} aria-current={current.id===section.id?'page':undefined} to={'/'+section.id} navigate={navigate}>{section.label}</RouteLink>)}</nav></article>}
   {route==='not-found'&&<section className="atlas-intro"><h1>Page not found<span className="red-period">.</span></h1><p className="atlas-description">This part of the atlas doesn’t exist.</p><RouteLink className="back-action" to="/" navigate={navigate}>Return home <ArrowRight size={17}/></RouteLink></section>}
  </main>
  <footer className="site-footer"><span>A personal atlas. Always a work in progress.</span><div><a href="/arush-vyas-resume.pdf" target="_blank" rel="noreferrer">Résumé <ArrowUpRight size={13}/></a><button onClick={()=>setDialog('credits')}>Model credits</button></div></footer>
  {vascuOpen&&<Suspense fallback={<div role="status">Opening VascuPath…</div>}><VascuPathExplorer sceneRef={scene} onClose={closeExperience} onNavigate={path=>{setVascuOpen(false);navigate(path);}} onContact={()=>{setVascuOpen(false);setDialog('contact');}}/></Suspense>}
  <dialog ref={dialogRef} onCancel={()=>setDialog(null)} onClick={e=>{if(e.target===dialogRef.current)setDialog(null);}} aria-labelledby="dialog-heading"><div className="dialog-content"><button className="dialog-close icon-action" aria-label="Close dialog" onClick={()=>setDialog(null)}><X size={23}/></button>
   {dialog==='contact'?<><p className="eyebrow">START A CONVERSATION</p><h2 id="dialog-heading">Let’s connect<span className="red-period">.</span></h2><p>Research, a project idea, or a shared curiosity.</p><a className="contact-link" href="mailto:arushv16@gmail.com"><EnvelopeSimple size={25}/> arushv16@gmail.com <ArrowUpRight size={24}/></a><a className="secondary-link" href="https://www.linkedin.com/in/arush-vyas" target="_blank" rel="noreferrer">Find me on LinkedIn <ArrowUpRight size={17}/></a></>:<><p className="eyebrow">BEHIND THE ATLAS</p><h2 id="dialog-heading">Anatomy & credits<span className="red-period">.</span></h2><p>The stylized 3D avatar was created from Arush’s supplied likeness using <a href="https://www.meshy.ai/" target="_blank" rel="noreferrer">Meshy</a>, CC BY 4.0. Adaptations include geometry and texture optimization and registration with the internal atlas.</p><p>The internal anatomy and density reveal are illustrative. They do not represent Arush’s medical scan or measured tissue densities. Chapter locations are part of this site’s storytelling.</p><p>BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan</p><p>Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0</p><p>Brain for Blender by Anderson Winkler — CC BY-SA 3.0. <a href="https://brainder.org/research/brain-for-blender/" target="_blank" rel="noreferrer">Original brain meshes</a>.</p><p>Web-exported skeletal and artery models by <a href="https://github.com/nqwrc/3d-anatomy" target="_blank" rel="noreferrer">nqwrc / 3d-anatomy</a>. Adaptations: head-and-neck selection, merged structures, geometry reduction, Draco compression, and display materials.</p><a href="/models/NOTICE.txt" target="_blank" rel="noreferrer">Full source notices <ArrowUpRight size={15}/></a><a className="secondary-link" href="/models/ATTRIBUTION.md" target="_blank" rel="noreferrer">Selected model licenses <ArrowUpRight size={15}/></a></>}
  </div></dialog>
 </div>;
}
