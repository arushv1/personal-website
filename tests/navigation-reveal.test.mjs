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
