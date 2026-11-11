import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {layerStops,layerIndex,introReveal,introProgressFor,introCaptions} from '../src/intro.mjs';
import {orientationLabels,scanReadout,peekPose,toSpherical,fromSpherical} from '../src/scan.mjs';
import {layoutHotspots} from '../src/hotspots.mjs';
import {sections,sectionById,overviewView} from '../src/content/portfolio.mjs';

test('scroll-driven opening rests on each named layer and never runs backwards',()=>{
 const values=layerStops.map(stop=>stop.value);assert.deepEqual(values,[0,34,72,100]);
 values.forEach((value,index)=>{
  const progress=index/(values.length-1);
  assert.equal(introReveal(progress),value);assert.equal(layerIndex(value),index);
  // A short hold either side of a stop keeps its caption readable.
  for(const offset of [-.04,.04])if(progress+offset>=0&&progress+offset<=1)assert.equal(introReveal(progress+offset),value);
 });
 let previous=-1;
 for(let step=0;step<=3000;step++){const value=introReveal(step/3000);assert(value>=previous&&value>=0&&value<=100);previous=value;}
 assert.equal(introReveal(-1),0);assert.equal(introReveal(2),100);
});

test('slider values and page positions convert both ways without drift',()=>{
 for(let value=0;value<=100;value++){
  const progress=introProgressFor(value);assert(progress>=0&&progress<=1);
  assert.equal(Math.round(introReveal(progress)),value);
 }
 for(let value=1;value<=100;value++)assert(introProgressFor(value)>introProgressFor(value-1));
 assert.equal(introCaptions.length,layerStops.length-1);
 introCaptions.forEach((caption,index)=>{assert.equal(caption.layer,layerStops[index+1].name);assert(caption.title&&caption.text);});
});

test('scan readouts follow a radiology viewer convention and the live values',()=>{
 assert.deepEqual(orientationLabels(0),{left:'R',right:'L'});
 assert.deepEqual(orientationLabels(Math.PI/2),{left:'A',right:'P'});
 assert.deepEqual(orientationLabels(Math.PI),{left:'L',right:'R'});
 assert.deepEqual(orientationLabels(-Math.PI/2),{left:'P',right:'A'});
 assert.deepEqual(orientationLabels(Math.PI*2+.2),orientationLabels(.2));
 const readout=scanReadout({reveal:71.6,position:[0,.55,5],target:[0,.55,0],baseRadius:10,view:'Whole person'});
 assert.deepEqual(readout,{layer:'LAYER · Vessels',image:'IM 072 / 100',zoom:'ZOOM 2.00×',angle:'AZ +000°  EL +00°',view:'VIEW · Whole person',left:'R',right:'L'});
 assert.equal(scanReadout({reveal:0,position:[-5,.55,0],target:[0,.55,0],baseRadius:5,view:'Face',preview:'Crown of the skull'}).view,'PREVIEW · Crown of the skull');
 assert.match(scanReadout({reveal:0,position:[-5,3,0],target:[0,.55,0],baseRadius:5,view:'Face'}).angle,/^AZ -090°  EL \+26°$/);
 for(const point of [[2.1,1.3,6.7],[-6.2,1,0],[2.4,1.8,-5.4]]){
  const target=[0,.8,.1],back=fromSpherical(toSpherical(point,target),target);
  back.forEach((value,index)=>assert(Math.abs(value-point[index])<1e-9));
 }
});

test('hover previews are small, bounded leans that never become a section change',()=>{
 const views=[overviewView,...sections.map(section=>section.view)];
 for(const from of views)for(const to of views){
  const pose=peekPose(from,to),a=toSpherical(from.position,from.target),b=toSpherical(pose.position,pose.target);
  const turn=Math.abs(Math.atan2(Math.sin(b.theta-a.theta),Math.cos(b.theta-a.theta)));
  assert(turn<=.1701&&Math.abs(b.phi-a.phi)<=.0901,'Lean exceeds its limits');
  assert(b.radius>=2.5-1e-9&&b.radius<=a.radius+1e-9&&b.radius>=a.radius*.95);
  assert(Math.hypot(...pose.target.map((value,index)=>value-from.target[index]))<=.1201);
  assert(pose.position.every(Number.isFinite)&&pose.target.every(Number.isFinite));
 }
 // Half a turn away still only leans; it does not swing through the model.
 const far=peekPose({position:[0,1,6],target:[0,1,0]},{position:[0,1,-6],target:[0,1,0]});
 assert(Math.abs(toSpherical(far.position,far.target).theta)<=.1701);
});

test('label layout can reserve the readout corners and gives the space back when short',()=>{
 const points=sections.map((section,index)=>({id:section.id,side:section.callout.side,width:90,x:230+Math.sin(index)*40,y:20+index*70}));
 const roomy=layoutHotspots(points,520,560,{top:34,bottom:30});
 for(const box of Object.values(roomy))assert(box.y>=42-1e-9&&box.y+box.height<=560-38+1e-9);
 assert.deepEqual(layoutHotspots(points,520,560,{}),layoutHotspots(points,520,560));
 const tight=layoutHotspots(points,300,210,{top:34,bottom:30});
 const boxes=Object.values(tight);assert.equal(boxes.length,7);
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
  const a=boxes[i],b=boxes[j];assert(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
 }
});

test('new entry content is complete, sourced and free of the corrected mistakes',async()=>{
 const text=JSON.stringify(sections);
 assert(!/Reserarch/.test(text));assert(!/devpost\.com[^"]*[?&]_g[al]/.test(text),'Tracking parameters should not ship in links');
 const experience=sectionById.experience.items,highlights=experience.flatMap(item=>item.highlights||[]);
 assert.equal(new Set(highlights).size,highlights.length,'A highlight is repeated across experience entries');
 const glossary=experience.find(item=>item.id==='boston-scientific').glossary;
 assert(glossary.length>=6);for(const entry of glossary){assert.equal(entry.length,2);assert(entry[0]&&entry[1].length>30);}
 for(const id of ['threshold','symptomai']){
  const writeup=sectionById.projects.items.find(item=>item.id===id).writeup;
  assert(writeup.length>=4);assert.equal(new Set(writeup.map(part=>part.heading)).size,writeup.length);
  for(const part of writeup){assert(part.heading);assert([].concat(part.text||[],part.steps||[],part.list||[]).length>0,'Empty write-up part: '+part.heading);}
  assert(writeup.some(part=>part.steps?.length>=3),'Each write-up explains how the project works');
 }
 const now=sectionById.about.items.find(item=>item.id==='now');
 assert.equal(now.highlights.length,3);assert.match(now.period,/\b20\d\d\b/);
 for(const course of sectionById.courses.items){assert(course.catalog.length>60,'Missing catalog summary: '+course.id);assert.match(course.catalogUrl,/^https:\/\/(www\.bu\.edu|catalog\.ucsc\.edu)\//);}
 const poster=sectionById.publications.items.find(item=>item.id==='vascupath-poster').poster;
 assert(poster.alt.length>80&&poster.width/poster.height>1.7);
 for(const src of [poster.src,poster.preview]){
  await access(new URL('../public'+src,import.meta.url));
  const header=await readFile(new URL('../public'+src,import.meta.url));
  assert.equal(header.subarray(0,4).toString('latin1'),'RIFF');assert.equal(header.subarray(8,12).toString('latin1'),'WEBP');
 }
});
