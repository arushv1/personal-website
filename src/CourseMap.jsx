import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowUpRight,Brain,Heartbeat,UsersThree,CaretDown,CaretRight} from '@phosphor-icons/react';
import {sectionById} from './content/portfolio.mjs';
import {courseBranches,workNodes,connections,courseSkills,courseMapNote,courseLabels} from './content/course-map.mjs';
import {followLink,routeHref} from './navigation.mjs';
import './course-map.css';

const courses=sectionById.courses.items,courseById=Object.fromEntries(courses.map(c=>[c.id,c]));
const branchByCourse=Object.fromEntries(courseBranches.flatMap(b=>b.courseIds.map(id=>[id,b.id])));
const workById=Object.fromEntries(workNodes.map(w=>[w.id,w]));
const icons={computation:Brain,biomedical:Heartbeat,design:UsersThree};
const defaultCourse='introduction-engineering-hands-on';

const edges=courseBranches.flatMap(branch=>workNodes.flatMap(work=>connections.some(c=>branch.courseIds.includes(c.courseId)&&c.workId===work.id)?[{id:branch.id+'-'+work.id,branchId:branch.id,workId:work.id}]:[]));
function fromHash(){
 let hash=location.hash.slice(1);try{hash=decodeURIComponent(hash);}catch{/* Unknown hashes keep the default course. */}
 if(courseById[hash])return {kind:'course',id:hash};
 if(hash.startsWith('work-')&&workById[hash.slice(5)])return {kind:'work',id:hash.slice(5)};
 return {kind:'course',id:defaultCourse};
}
function firstBranch(selection){return selection.kind==='course'?branchByCourse[selection.id]:courseBranches.find(b=>connections.some(c=>b.courseIds.includes(c.courseId)&&c.workId===selection.id))?.id||'design';}
function vesselShape(s,t){
 const d=t.x-s.x,w=2.2,v=.65;
 return `M${s.x},${s.y-w} C${s.x+d*.44},${s.y-w} ${t.x-d*.4},${t.y-v} ${t.x},${t.y-v} L${t.x},${t.y+v} C${t.x-d*.4},${t.y+v} ${s.x+d*.44},${s.y+w} ${s.x},${s.y+w} Z`;
}

export function CourseMap({onNavigate}){
 const [selection,setSelection]=useState(fromHash),[expanded,setExpanded]=useState(()=>firstBranch(fromHash())),[geometry,setGeometry]=useState({width:0,height:0,paths:[]});
 const network=useRef(null),branchRefs=useRef({}),workRefs=useRef({}),courseRefs=useRef({});
 const selectedCourse=selection.kind==='course'?courseById[selection.id]:null;
 const selectedConnections=connections.filter(c=>selection.kind==='course'?c.courseId===selection.id:c.workId===selection.id);
 const activeWorkIds=new Set(selectedConnections.map(c=>c.workId)),activeCourseIds=new Set(selectedConnections.map(c=>c.courseId));
 const chosenWork=selection.kind==='work'?workById[selection.id]:workById[selection.workId]||workById[selectedConnections[0]?.workId];
 const chosenConnection=selectedConnections.find(c=>c.workId===chosenWork?.id);
 const activeBranches=new Set([...activeCourseIds].map(id=>branchByCourse[id]));
 if(selectedCourse)activeBranches.add(branchByCourse[selectedCourse.id]);
 function updateSelection(next,push=true){
  setSelection(next);
  if(next.kind==='course')setExpanded(branchByCourse[next.id]);
  else setExpanded(current=>courseBranches.find(b=>b.id===current&&connections.some(c=>b.courseIds.includes(c.courseId)&&c.workId===next.id))?.id||firstBranch(next));
  const hash=next.kind==='course'?next.id:'work-'+next.id;
  if(push&&location.hash!=='#'+hash)history.pushState(null,'',location.pathname+location.search+'#'+hash);
 }
 function selectCourse(id){updateSelection({kind:'course',id,workId:chosenWork?.id&&connections.some(c=>c.courseId===id&&c.workId===chosenWork.id)?chosenWork.id:undefined});}
 function toggleBranch(branch){
  if(expanded===branch.id){setExpanded(null);return;}
  if(selection.kind==='work'){setExpanded(branch.id);return;}
  if(branchByCourse[selection.id]===branch.id)setExpanded(branch.id);else selectCourse(branch.courseIds[0]);
 }
 useEffect(()=>{const restore=()=>updateSelection(fromHash(),false);window.addEventListener('hashchange',restore);window.addEventListener('popstate',restore);return()=>{window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore);};},[]);
 useLayoutEffect(()=>{
  const root=network.current;
  const measure=()=>{
   const bounds=root.getBoundingClientRect(),point=(node,end)=>{const r=node.getBoundingClientRect();return {x:(end?r.left:r.right)-bounds.left,y:r.top+r.height/2-bounds.top};};
   const paths=edges.flatMap(edge=>{const a=branchRefs.current[edge.branchId],b=workRefs.current[edge.workId];if(a)a.parentElement.style.setProperty('--port-y',(a.getBoundingClientRect().height/2+1)+'px');return a&&b?[{...edge,d:vesselShape(point(a,false),point(b,true))}]:[];});
   setGeometry(previous=>{const next={width:bounds.width,height:bounds.height,paths};return JSON.stringify(previous)===JSON.stringify(next)?previous:next;});
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(root);for(const node of [...Object.values(branchRefs.current),...Object.values(workRefs.current)])if(node)observer.observe(node);
  return()=>observer.disconnect();
 },[expanded]);
 useEffect(()=>{
  if(!selectedCourse||!expanded)return;
  const node=courseRefs.current[selectedCourse.id],list=node?.parentElement;if(!node||!list)return;
  const a=node.getBoundingClientRect(),b=list.getBoundingClientRect();if(a.top<b.top)list.scrollTop+=a.top-b.top;else if(a.bottom>b.bottom)list.scrollTop+=a.bottom-b.bottom;
 },[selectedCourse,expanded]);
 const workHref=chosenWork?routeHref('/'+chosenWork.sectionId,location.search)+'#'+chosenWork.itemId:null;
 return <div className="course-map" data-course-map>
  <p className="course-map-hint">Open a branch. Select a course or a project to follow its connections.</p>
  <div className="course-map-columns" aria-hidden="true"><span>LEARNING</span><span>APPLICATION</span></div>
  <div ref={network} className="course-map-network">
   <svg className="course-map-vessels" width="100%" height="100%" viewBox={`0 0 ${geometry.width||1} ${geometry.height||1}`} aria-hidden="true" focusable="false">
    {geometry.paths.map(edge=>{const active=selectedConnections.some(c=>c.workId===edge.workId&&branchByCourse[c.courseId]===edge.branchId);return <path key={edge.id} className="course-vessel" data-active={active} d={edge.d}/>;})}
   </svg>
   <div className="course-map-branches">
    {courseBranches.map(branch=>{const Icon=icons[branch.id],open=expanded===branch.id,support=branch.courseIds.filter(id=>activeCourseIds.has(id)).length;return <section className="course-map-branch" data-active={activeBranches.has(branch.id)} key={branch.id}>
     <button ref={el=>{branchRefs.current[branch.id]=el;}} className="course-map-branch-toggle" aria-expanded={open} aria-controls={'branch-'+branch.id} onClick={()=>toggleBranch(branch)}><Icon size={27} weight="light"/><span><strong>{branch.title}</strong><span>{selection.kind==='work'&&support?`${support} related ${support===1?'course':'courses'}`:branch.description}</span></span><CaretDown className={open?'is-open':''} size={15}/></button>
     <span className="course-map-source-port" aria-hidden="true"/>
     {open&&<div id={'branch-'+branch.id} className="course-map-course-list">{branch.courseIds.map(id=>{const course=courseById[id];return <button key={id} ref={el=>{courseRefs.current[id]=el;}} data-course-id={id} className="course-map-course" title={course.title} aria-label={course.title+' · '+course.subtitle} aria-pressed={selectedCourse?.id===id} data-active={selectedCourse?.id===id||activeCourseIds.has(id)} onClick={()=>selectCourse(id)}><span>{courseLabels[id]||course.title}</span><small>{course.subtitle}</small></button>;})}</div>}
    </section>;})}
   </div>
   <div className="course-map-works" aria-label="Connected work">{workNodes.map(work=><button key={work.id} ref={el=>{workRefs.current[work.id]=el;}} data-work-id={work.id} className="course-map-work" data-active={activeWorkIds.has(work.id)} aria-pressed={chosenWork?.id===work.id} onClick={()=>updateSelection({kind:'work',id:work.id})}><span className="course-map-work-port" aria-hidden="true"/><span><strong>{work.label}</strong><small>{work.description}</small></span><CaretRight size={14}/></button>)}</div>
  </div>
  <section className="course-map-detail" aria-label="Selected connection">
   <p className="eyebrow">{chosenWork?'SELECTED CONNECTION':'BROADER FOUNDATION'}</p>
   <h2>{selectedCourse?(courseSkills[selectedCourse.id]||selectedCourse.title):chosenWork?.label}{selectedCourse&&chosenWork&&<><span className="course-map-arrow"> → </span>{chosenWork.label}</>}</h2>
   {selectedCourse?<p className="course-map-selected-course">{selectedCourse.title} · {selectedCourse.subtitle}<br/>{selectedCourse.summary}</p>:<p className="course-map-selected-course">{chosenWork?.description}</p>}
   <p className="course-map-connection-summary">{selectedCourse?(chosenConnection?.summary||'Part of the broader biomedical foundation. A direct project connection has not been assigned in this preview.'):'Select a supporting course to explore the connection.'}</p>
   {selection.kind==='work'&&<div className="course-map-related" aria-label="Supporting courses">{[...activeCourseIds].map(id=><button data-related-course-id={id} key={id} onClick={()=>selectCourse(id)}><span>{courseSkills[id]||courseById[id].title}</span><small>{courseById[id].subtitle}</small></button>)}</div>}
   {selectedCourse&&activeWorkIds.size>1&&<div className="course-map-related" aria-label="Related work">{[...activeWorkIds].map(id=><button key={id} aria-pressed={chosenWork?.id===id} onClick={()=>setSelection({...selection,workId:id})}>{workById[id].label}</button>)}</div>}
   {chosenWork&&<a className="course-map-open-work" href={workHref} onClick={event=>followLink(event,workHref,onNavigate)}>{chosenWork.sectionId==='publications'?'View publication':'View project'}<ArrowUpRight size={17}/></a>}
  </section>
  <p className="course-map-note">{courseMapNote}</p>
  <details className="course-map-catalogue"><summary>Explore all {courses.length} courses<CaretDown size={16}/></summary><div>{courseBranches.map(branch=><section key={branch.id}><h3>{branch.title}</h3>{branch.courseIds.map(id=>{const course=courseById[id];return <button key={id} className="course-map-catalogue-course" data-course-id={id} aria-pressed={selectedCourse?.id===id} onClick={()=>{selectCourse(id);requestAnimationFrame(()=>{courseRefs.current[id]?.focus({preventScroll:true});network.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});}}><span>{course.title}<small>{course.subtitle}</small></span><small>{course.summary}</small></button>;})}</section>)}</div></details>
 </div>;
}
