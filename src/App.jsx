import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ArrowLeft, ArrowDown, MouseSimple, ArrowsClockwise, Pause, Play, X, Minus, Plus, EnvelopeSimple } from '@phosphor-icons/react';
import { AnatomyScene } from './AnatomyScene';
import { SectionReader } from './SectionReader';
import { CourseMap } from './CourseMap';
import { sections, sectionById, overviewView } from './content/portfolio.mjs';
import { readRoute, followLink, routeHref } from './navigation.mjs';
import { layerStops as layers, layerIndex as layerFor, introReveal, introProgressFor, introCaptions } from './intro.mjs';
const VascuPathExplorer=lazy(()=>import('./VascuPathExplorer'));

function RouteLink({to,navigate,children,...props}) {
 const href=routeHref(to,location.search);
 return <a {...props} href={href} onClick={event=>followLink(event,href,navigate)}>{children}</a>;
}
const nowNote=sectionById.about.items.find(item=>item.id==='now');
export function App(){
 const [route,setRoute]=useState(()=>readRoute(location.pathname));
 const chapter=route.slice(1),current=sectionById[chapter],exploring=route!=='/'&&route!=='not-found';
 const [reveal,setReveal]=useState(()=>current?.view.reveal??(exploring?overviewView.reveal:0));
 const [vascuOpen,setVascuOpen]=useState(false);
 const [spinning,setSpinning]=useState(()=>route==='/'&&!matchMedia('(prefers-reduced-motion: reduce)').matches),[ready,setReady]=useState(false),[dialog,setDialog]=useState(null);
 const scene=useRef(null),dialogRef=useRef(null),chapterHeading=useRef(null),atlasHeading=useRef(null),previousRoute=useRef(route);
 // Scroll-driven opening (home only). The page position and the slider describe
 // the same reveal value; reduced-motion visitors keep the plain slider.
 const reducedMotion=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const introOn=route==='/'&&!reducedMotion;
 const intro=useRef({start:0,range:1,last:0,expected:null,paused:false}),spinningRef=useRef(spinning);
 spinningRef.current=spinning;
 // Returns true when a smooth page scroll will carry the reveal by itself.
 function syncIntro(value,behavior){
  const state=intro.current;
  if(!introOn||scrollY<state.start-1)return false;
  const progress=introProgressFor(value),top=state.start+progress*state.range;
  if(behavior==='smooth'&&Math.abs(top-scrollY)>2){state.expected=null;window.scrollTo({top,behavior});return true;}
  state.expected=top;state.last=progress;window.scrollTo({top,behavior:'instant'});return false;
 }
 function resetView(){setReveal(0);setSpinning(false);scene.current?.reset();intro.current.paused=false;syncIntro(0,'instant');}
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
   if(route==='/'||previousRoute.current==='/')window.scrollTo({top:0,behavior:'instant'});
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
 useEffect(()=>{const handler=event=>{if(event.key==='Escape'&&!dialog&&!vascuOpen&&exploring&&!document.querySelector('dialog[open]'))navigate('/');};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[dialog,vascuOpen,exploring,route]);
 useEffect(()=>{
  if(!introOn)return;
  const state=intro.current,hero=document.querySelector('.hero'),portrait=document.getElementById('model-view');
  Object.assign(state,{last:0,expected:null,paused:false});
  let frame=0;
  // The portrait is pinned (position: sticky) inside a tall hero. Its travel
  // distance is the scroll range; 6% is kept in hand so the last layer settles.
  const measure=()=>{
   const copy=hero.querySelector('.hero-copy'),style=getComputedStyle(hero),stacked=style.display==='flex';
   const offset=stacked&&copy?copy.offsetHeight+(parseFloat(style.rowGap)||0):0;
   state.start=Math.max(0,hero.getBoundingClientRect().top+scrollY+offset-(parseFloat(getComputedStyle(portrait).top)||0));
   state.range=Math.max(1,(hero.offsetHeight-offset-portrait.offsetHeight)*.94);
  };
  const apply=()=>{
   frame=0;
   const progress=Math.max(0,Math.min(1,(scrollY-state.start)/state.range));
   if(state.expected!==null&&Math.abs(scrollY-state.expected)<2){state.last=progress;return;}
   state.expected=null;
   if(progress===state.last)return;
   state.last=progress;
   // Face the visitor before peeling layers; resume the idle turn back at the top.
   if(progress>0&&spinningRef.current){state.paused=true;setSpinning(false);scene.current?.reset();}
   else if(progress===0&&state.paused){state.paused=false;setSpinning(true);}
   setReveal(Math.round(introReveal(progress)));
  };
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(apply);};
  const onResize=()=>{measure();onScroll();};
  measure();apply();
  const observer=new ResizeObserver(onResize);observer.observe(hero);observer.observe(portrait);
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onResize);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);};
 },[introOn]);
 function changeReveal(value,smooth){
  setSpinning(false);intro.current.paused=false;scene.current?.stopMotion();
  if(!syncIntro(value,smooth?'smooth':'instant'))setReveal(value);
 }
 const layerIndex=layerFor(reveal),stage=route==='/'?layerIndex:0;
 const nowHref=routeHref('/about',location.search)+'#now';
 const previewProps=id=>({onPointerEnter:event=>{if(event.pointerType!=='touch')scene.current?.preview(id);},onPointerLeave:()=>scene.current?.preview(null),onFocus:event=>{if(event.currentTarget.matches(':focus-visible'))scene.current?.preview(id);},onBlur:()=>scene.current?.preview(null)});
 const layerDescription=reveal<=15?'Arush’s 3D avatar':reveal<34?'Glassy avatar revealing internal anatomy':reveal<52?'Bone with emerging vessels':reveal<65?'Bone and vessels in a CTA-style view':reveal<72?'Vessels with receding bone':reveal<=74?'Vascular tree':'Cortex and major vessels within the atlas';
 return <div className={`site-shell ${exploring?'is-exploring':''} ${current?'has-chapter':''} ${current?.id==='courses'?'has-course-map':''} ${vascuOpen?'has-vascu':''} ${introOn?'has-intro':''}`}>
  <header className="site-header"><RouteLink className="wordmark" aria-label="Arush Vyas, return home" to="/" navigate={navigate}>ARUSH VYAS</RouteLink><nav aria-label="Main navigation"><RouteLink to="/atlas" navigate={navigate}>Explore</RouteLink><RouteLink to="/projects" navigate={navigate}>Projects</RouteLink><button onClick={()=>setDialog('contact')}>Contact</button><a className="nav-resume" href="/arush-vyas-resume.pdf" target="_blank" rel="noreferrer" aria-label="Résumé (PDF, opens in a new tab)">Résumé<ArrowUpRight size={14}/></a></nav></header>
  <main className="hero">
   <div className="portrait-region" id="model-view">{exploring&&<div className="view-caption"><span className="eyebrow">{current?'SELECTED VIEW':'A PERSONAL ATLAS'}</span><span>{current?.region||(exploring?'Choose a section on the model':'Explore the atlas to reveal sections')}</span>{current&&<a className="back-to-reading" href="#chapter-title">Back to reading</a>}</div>}<AnatomyScene ref={scene} reveal={reveal} exploring={exploring} activeChapter={current?.id||null} spinning={spinning} onNavigate={navigate} onReset={resetView} onInteraction={()=>setSpinning(false)} onReady={()=>setReady(true)} wheelZoom={!introOn}>{route==='/'&&stage>0&&<div className="intro-caption-overlay" role="status"><p className="intro-kicker">{String(stage+1).padStart(2,'0')} · {introCaptions[stage-1].layer}</p><p className="intro-overlay-title">{introCaptions[stage-1].title}<span className="red-period">.</span></p><p>{introCaptions[stage-1].text}</p></div>}</AnatomyScene>
    <div className="portrait-bottom">
     <div className="scene-actions" role="group" aria-label="3D view controls"><button aria-label={spinning?'Pause rotation':'Start rotation'} onClick={()=>setSpinning(!spinning)} disabled={!ready}>{spinning?<Pause size={18}/>:<Play size={18}/>}<span>{spinning?'Pause':'Rotate'}</span></button><button aria-label="Reset view and layers" onClick={resetView} disabled={!ready}><ArrowsClockwise size={18}/><span>Reset</span></button><button aria-label="Zoom out" onClick={()=>scene.current?.zoom(-1)} disabled={!ready}><Minus size={18}/><span>Zoom out</span></button><button aria-label="Zoom in" onClick={()=>scene.current?.zoom(1)} disabled={!ready}><Plus size={18}/><span>Zoom in</span></button></div>
     <div className="layer-control"><div className="layer-heading"><label htmlFor="reveal">Look within</label><span>{layers[layerIndex].name} · {reveal}%</span></div><input id="reveal" type="range" min="0" max="100" value={reveal} onPointerDown={()=>{setSpinning(false);scene.current?.stopMotion();}} onKeyDown={()=>{setSpinning(false);scene.current?.stopMotion();}} onChange={e=>changeReveal(Number(e.target.value))} disabled={!ready} aria-label="Reveal avatar and internal layers" aria-valuetext={layerDescription}/><div className="layer-stops" role="group" aria-label="Choose a layer">{layers.map((layer,index)=><button key={layer.name} aria-pressed={index===layerIndex} onClick={()=>changeReveal(layer.value,true)} disabled={!ready}>{layer.name}</button>)}</div></div>
     <div className="gesture-hint"><MouseSimple size={17}/><span className="desktop-gesture">{introOn?'Drag to rotate · Scroll to look within':'Drag to rotate · Scroll over model to zoom'}</span><span className="mobile-gesture">{introOn?'Swipe sideways to rotate · Scroll to look within':'Swipe sideways to rotate · Scroll the page to explore'}</span></div>
    </div>
   </div>
   {route==='/'&&<section className="hero-copy" aria-label="Introduction">
    <div className="intro-stages">
     <div className="intro-stage" data-active={stage===0}><h1 aria-label="Take a closer look.">Take a<br/>{' '}closer<br/>{' '}look<span className="red-period">.</span></h1><p className="hero-subtitle">Biomedical engineering. Building. Exploring.</p></div>
     {introCaptions.map((caption,index)=><div className="intro-stage intro-layer" key={caption.layer} data-active={stage===index+1} aria-hidden={stage!==index+1}><p className="intro-kicker">{String(index+2).padStart(2,'0')} · {caption.layer}</p><h2>{caption.title}<span className="red-period">.</span></h2><p className="hero-subtitle">{caption.text}</p></div>)}
    </div>
    <RouteLink className="primary-action" to="/atlas" navigate={navigate}>Explore the atlas <ArrowRight size={23}/></RouteLink>
    {introOn&&<p className="scroll-cue" data-hidden={stage>0} aria-hidden={stage>0}>Scroll to look within <ArrowDown size={14}/></p>}
   </section>}
   {route==='/atlas'&&<section className="atlas-intro"><RouteLink className="back-action" to="/" navigate={navigate}><ArrowLeft size={17}/> The whole picture</RouteLink><p className="eyebrow">SEVEN WAYS TO LOOK CLOSER</p><h1 ref={atlasHeading} tabIndex={-1}>An atlas of<br/>a person<span className="red-period">.</span></h1><p className="atlas-description">Choose a section. Each one brings a different part of the structure into view.</p><div className="chapter-list">{sections.map((section,index)=><RouteLink key={section.id} to={'/'+section.id} navigate={navigate} {...previewProps(section.id)}><span className="chapter-number">{String(index+1).padStart(2,'0')}</span><span>{section.label}</span><span className="section-count">{section.items.length||'—'}</span><ArrowUpRight size={18}/></RouteLink>)}</div>{nowNote?.highlights?.length>0&&<a className="now-strip" href={nowHref} onClick={event=>followLink(event,nowHref,navigate)}><span className="eyebrow">NOW</span><span>{nowNote.highlights.join(' · ')}</span><ArrowUpRight size={16}/></a>}</section>}
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
