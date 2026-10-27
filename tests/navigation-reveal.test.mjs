import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { paths, readRoute, followLink } from '../src/navigation.mjs';
import { damp, revealState } from '../src/reveal.mjs';

test('chapter URLs round trip, including refresh paths and trailing slashes', () => {
  for(const path of paths) assert.equal(readRoute(path+'/'),path);
  for(const path of ['/missing','/models/no.glb','/research/extra']) assert.equal(readRoute(path),'not-found');
});
test('links preserve browser new-tab and modified-click behavior', () => {
  for(const extra of [{button:1},{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{defaultPrevented:true},{currentTarget:{target:'_blank'}}]) {
    followLink({button:0,currentTarget:{},preventDefault(){assert.fail('intercepted native link');},...extra},'/research',()=>assert.fail('navigated'));
  }
  let prevented=false,route;
  followLink({button:0,currentTarget:{},preventDefault(){prevented=true;}},'/research',p=>route=p);
  assert.equal(prevented,true);assert.equal(route,'/research');
});
test('reveal damping settles promptly at 20, 30 and 60fps and reverses without overshoot', () => {
  const results=[];
  for(const fps of [20,30,60]) {
    let value=0;
    for(let i=0;i<fps/5;i++)value=damp(value,100,1/fps);
    assert(value>98&&value<=100);results.push(value);
    for(let i=0;i<fps/5;i++){value=damp(value,0,1/fps);assert(value>=0&&value<100);}
    assert(value<2);
  }
  assert(Math.max(...results)-Math.min(...results)<1e-10);
});
test('reveal has visible contents throughout and stable endpoint sections', () => {
  assert(revealState(0).cut>2.6);assert(revealState(34).cut<-1.5);
  for(let i=0;i<=100;i++){
    const state=revealState(i);
    assert(state.cut<=state.boneCut&&state.boneCut<=state.brainCut);
    for(const cut of [state.cut,state.boneCut,state.brainCut])assert(cut>=-1.56&&cut<=2.65);
  }
});
test('Vercel rewrite covers every app route without swallowing asset paths', async () => {
  const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url)));
  const pattern=new RegExp('^'+config.rewrites[0].source.replace(':chapter','')+'/?$');
  for(const path of paths.filter(p=>p!=='/'))assert(pattern.test(path));
  for(const path of ['/models/avatar.glb','/draco/draco_decoder.wasm','/arush-vyas-resume.pdf','/assets/main.js'])assert(!pattern.test(path));
});

test('whole-model reveal blends adjacent complete views with stable shortcuts', async () => {
  const {layerBlend}=await import('../src/reveal.mjs');
  for(const [value,stage] of [[0,0],[34,1],[68,2],[100,3]])assert.deepEqual(layerBlend(value),{from:stage,to:stage,weight:0});
  for(let value=0;value<=100;value+=.125){
    const state=layerBlend(value);
    assert(state.to===state.from||state.to===state.from+1);
    assert(state.weight>=0&&state.weight<1);
  }
  assert(layerBlend(18).weight>0&&layerBlend(18).weight<1);
  assert(layerBlend(50).weight>0&&layerBlend(50).weight<1);
  assert(layerBlend(85).weight>0&&layerBlend(85).weight<1);
});

test('sectional backup is retained when copying or opening chapter links', async () => {
  const {routeHref}=await import('../src/navigation.mjs');
  assert.equal(routeHref('/research','?reveal=section'),'/research?reveal=section');
  assert.equal(routeHref('/atlas','?source=shared&reveal=section'),'/atlas?reveal=section');
  assert.equal(routeHref('/research'),'/research');
});

test('whole-model scrubbing reuses opaque views; camera and size changes redraw them', async () => {
  const {LayerBlendRenderer}=await import('../src/LayerBlendRenderer.mjs');
  const {layerBlend}=await import('../src/reveal.mjs');
  const models=Object.fromEntries(['avatar','bone','arteries','brain'].map(name=>[name,{visible:true}]));
  const scene={},camera={},draws=[];let target=null,size=256;
  const renderer={
    capabilities:{maxSamples:2},extensions:{has:()=>true},
    getDrawingBufferSize:v=>v.set(size,size),
    setRenderTarget:t=>{target=t;},
    render:s=>draws.push(s===scene?Object.keys(models).filter(name=>models[name].visible).join('+'):'output'),
  };
  const blend=new LayerBlendRenderer(renderer,scene,camera,models);
  blend.render(layerBlend(15));assert.deepEqual(draws,['avatar','bone','output']);
  draws.length=0;blend.render(layerBlend(25));assert.deepEqual(draws,['output'],'Scrubbing the same layer pair should only blend cached views');
  draws.length=0;blend.render(layerBlend(50));assert.deepEqual(draws,['arteries','output'],'The shared bone view should be retained');
  draws.length=0;blend.render(layerBlend(100));assert.deepEqual(draws,['arteries+brain','output']);
  draws.length=0;blend.invalidate();blend.render(layerBlend(100));assert.deepEqual(draws,['arteries+brain','output']);
  draws.length=0;size=512;blend.render(layerBlend(100));assert.deepEqual(draws,['arteries+brain','output']);
  assert.equal(blend.targets.length,2);assert.equal(target,null);
  let disposed=0;blend.targets.forEach(s=>s.target.addEventListener('dispose',()=>disposed++));blend.dispose();assert.equal(disposed,2);
});

test('shared head/neck registration stays continuous and does not fold or mirror anatomy', async () => {
  const {registerAnatomyPoint}=await import('../src/registration.mjs');
  let previous=-Infinity;
  for(let y=-2;y<=2.3;y+=.01){
    const point=registerAnatomyPoint(.5,y,.5);
    assert(point.every(Number.isFinite));assert(point[1]>previous);previous=point[1];
    assert(point[0]>0);assert.equal(registerAnatomyPoint(-.5,y,.5)[0],-point[0]);
    assert(registerAnatomyPoint(0,y,1)[2]>registerAnatomyPoint(0,y,-1)[2]);
  }
  assert(registerAnatomyPoint(0,.6,0)[1]>.95,'Head landmarks should move up toward the avatar');
  assert(registerAnatomyPoint(0,-1,0)[1]<-.4,'Shoulder base must remain low rather than following the head lift');
});

test('production uses the aligned sectional reveal and retains the blend alternative', async () => {
  const {revealMode}=await import('../src/reveal.mjs');
  const {routeHref}=await import('../src/navigation.mjs');
  assert.equal(revealMode(),'section');
  assert.equal(revealMode('?reveal=section'),'section');
  assert.equal(revealMode('?reveal=blend'),'blend');
  assert.equal(revealMode('?reveal=unknown'),'section');
  assert.equal(routeHref('/research','?reveal=blend'),'/research?reveal=blend');
});

test('portfolio sections, items, views and legacy links remain consistent', async () => {
  const {sections,sectionById}=await import('../src/content/portfolio.mjs');
  const {legacyRoutes}=await import('../src/navigation.mjs');
  assert.deepEqual(sections.map(s=>s.label),['About Me','Education','Experience','Projects','Awards','Courses','Publications']);
  assert.equal(new Set(sections.map(s=>s.id)).size,7);
  assert.equal(new Set(sections.map(s=>s.anchor.join(','))).size,7);
  assert.equal(new Set(sections.map(s=>s.view.position.join(','))).size,7);
  for(const section of sections){
    assert.equal(readRoute('/'+section.id),'/'+section.id);
    assert.equal(sectionById[section.id],section);
    assert.equal(new Set(section.items.map(i=>i.id)).size,section.items.length);
    assert(section.view.position.every(Number.isFinite)&&section.view.target.every(Number.isFinite));
    assert(Math.hypot(...section.view.position.map((v,i)=>v-section.view.target[i]))>=2.5);
    assert(section.view.reveal>=0&&section.view.reveal<=100);
    for(const item of section.items){assert(item.id&&item.title&&item.summary);}
  }
  assert.deepEqual(new Set(sectionById.projects.items.map(i=>i.id)),new Set(['symptomai','threshold','vascupath']));
  for(const [old,destination] of Object.entries(legacyRoutes))assert.equal(readRoute(old),destination);
});

test('compact side gutters stay bounded, separated and clear of the feature dots', async () => {
  const {sections}=await import('../src/content/portfolio.mjs');
  const {layoutHotspots}=await import('../src/hotspots.mjs');
  for(const [width,height] of [[288,410],[350,440],[510,398],[650,600]]){
    for(const spread of [0,.11]){
      const points=sections.map((section,index)=>({id:section.id,side:section.callout.side,width:Math.max(64,section.label.length*6.5+18),x:width*(.5+Math.sin(index)*spread),y:height*(.22+index*.08)}));
      const labels=layoutHotspots(points,width,height),boxes=Object.values(labels);
      assert.equal(boxes.length,7);
      for(const point of points){
        const box=labels[point.id];assert(box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<=height);
        const closestX=Math.max(box.x,Math.min(point.x,box.x+box.width));
        assert(Math.hypot(closestX-point.x,box.y+22-point.y)<Math.min(210,width*.34+32));
      }
      const left=points.filter(p=>p.side==='left').map(p=>labels[p.id].x+labels[p.id].width);
      const right=points.filter(p=>p.side==='right').map(p=>labels[p.id].x);
      assert(Math.max(...left)-Math.min(...left)<.01&&Math.max(...right)-Math.min(...right)<.01);
      assert(Math.min(...right)-Math.max(...left)>40);
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
        const a=boxes[i],b=boxes[j];assert(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
      }
    }
  }
});
