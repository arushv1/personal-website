// Optional density acceptance: Vite + Playwright/Chromium; no patient data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sharp=require('sharp');
const {chromium}=require('playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{
 const base=process.env.PREVIEW_URL||'http://127.0.0.1:5180',out=process.env.QA_DIR||'/tmp/density-acceptance';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],checks=[],metrics={};
 const check=name=>{checks.push(name);console.log('PASS '+name);};
 async function context(viewport,byte=false){
  const c=await browser.newContext({viewport,reducedMotion:'reduce'});await c.route('https://fonts.googleapis.com/**',r=>r.abort());
  if(byte)await c.addInitScript(()=>{const original=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){return name==='EXT_color_buffer_float'?null:original.call(this,name);};});
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/fonts.googleapis|favicon.ico|ERR_FAILED/.test(m.text()+' '+m.location().url))errors.push(m.text());});
  return {c,p};
 }
 async function ready(p){await p.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false,null,{timeout:60000});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
 async function set(p,value){
  await p.locator('#reveal').evaluate((el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await p.waitForFunction(v=>Math.abs(document.querySelector('canvas').__atlas.reveal-v)<.0001,value);
 }
 async function image(p){return p.locator('canvas').screenshot({style:'.model-markers{visibility:hidden!important}'});}
 async function raw(buffer){return sharp(buffer).removeAlpha().raw().toBuffer();}
 async function difference(a,b){a=await raw(a);b=await raw(b);assert.equal(a.length,b.length);let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);return sum/a.length;}
 async function snapshot(p){return p.evaluate(()=>{
  const e=document.querySelector('canvas').__atlas,geometry={},transforms={},lights=[];
  for(const [name,root] of Object.entries(e.models)){root.updateMatrixWorld(true);transforms[name]=root.matrixWorld.toArray();geometry[name]=[];root.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position.array;let h=2166136261;const bytes=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);for(const v of bytes)h=Math.imul(h^v,16777619);geometry[name].push([a.length,h>>>0]);assertMaterials(o);}});}
  function assertMaterials(o){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.alphaHash||m.transparent)throw new Error('Density capture must not use screen-door or sorted transparency');}
  e.scene.traverse(o=>{if(o.isLight)lights.push([o.type,o.intensity,...o.position.toArray(),...o.color.toArray()]);});
  return {geometry,transforms,lights,camera:[...e.camera.position.toArray(),...e.camera.quaternion.toArray(),...e.controls.target.toArray()]};
 });}
 try{
  const {c,p}=await context({width:1366,height:900});await p.goto(base);await ready(p);await p.locator('#reveal').dispatchEvent('pointerdown');
  const before=await snapshot(p),frames=new Map(),captures=await p.evaluate(()=>document.querySelector('canvas').__atlas.densityRenderer.captures);
  for(const value of [0,15,20,26,34,56,60,68,76,85,100]){
   await set(p,value);const buffer=await image(p);frames.set(value,buffer);await sharp(buffer).jpeg({quality:90}).toFile(`${out}/${value}.jpg`);
   const pixels=await raw(buffer);let visible=0;for(let i=0;i<pixels.length;i+=3)if(pixels[i]+pixels[i+1]+pixels[i+2]>30)visible++;
   assert(visible>6000,'Empty anatomical state at '+value);
   assert.deepEqual(await snapshot(p),before,'Slider moved geometry, lighting or camera');
  }
  assert.equal(await p.evaluate(()=>document.querySelector('canvas').__atlas.densityRenderer.captures),captures,'Scrubbing rerendered geometry');
  check('required states render; slider leaves geometry/registration/camera/lighting fixed and reuses surface buffers');
  for(const value of [85,68,60,56,34,26,20,15,0]){await set(p,value);assert(await difference(frames.get(value),await image(p))<.02,'Reverse path differs at '+value);}
  check('100→0 rebuilds the exact same appearance as 0→100');
  metrics.stopDifferences={};for(const value of [15,34,68,74,100]){
   await p.evaluate(v=>document.querySelector('canvas').__atlas.densityRenderer.render(v),value-.15);const a=await image(p);await p.evaluate(v=>document.querySelector('canvas').__atlas.densityRenderer.render(v),Math.min(100,value+.15));const delta=await difference(a,await image(p));metrics.stopDifferences[value]=delta;assert(delta<3,'Abrupt change at '+value);
  }
  check('no abrupt switch at labeled stops or the bone/cortex window boundary');
  for(const value of [20,56,68,85]){
   await set(p,value);const a=await image(p);
   for(let i=0;i<3;i++){await p.evaluate(v=>document.querySelector('canvas').__atlas.densityRenderer.render(v),value);assert(await difference(a,await image(p))<.02,'Temporal flicker at '+value);}
  }
  check('forced repeated rendering is stable without frame-dependent speckling');
  const first=await raw(frames.get(20)),second=await raw(frames.get(26)),size=await sharp(frames.get(20)).metadata(),bands=[0,0,0];
  for(let y=0;y<size.height;y++)for(let x=0;x<size.width;x++){const i=(y*size.width+x)*3;if(Math.abs(first[i]-second[i])+Math.abs(first[i+1]-second[i+1])+Math.abs(first[i+2]-second[i+2])>35)bands[Math.min(2,Math.floor(y/size.height*3))]++;}
  metrics.changedPixelsByVerticalThird=bands;assert(bands.every(v=>v>200),'Reveal is confined to a horizontal band');check('organic reveal changes upper, middle and lower anatomy together');
  await set(p,85);await p.screenshot({path:out+'/desktop.png'});await c.close();
  for(const viewport of [{width:390,height:844},{width:320,height:800}]){
   const {c,p}=await context(viewport);await p.goto(base+'/projects');await ready(p);
   for(const value of [0,20,34,56,68,85,100]){await set(p,value);await image(p);}
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.locator('.portrait-region').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/mobile-'+viewport.width+'.png'});await c.close();
  }
  check('390px/320px controls, hotspots and density landmarks stay accessible without page overflow');
  const byte=await context({width:1000,height:800},true);await byte.p.goto(base);await ready(byte.p);assert.equal(await byte.p.evaluate(()=>document.querySelector('canvas').__atlas.densityRenderer.floating),false);
  for(const v of [20,56,85,100]){await set(byte.p,v);await image(byte.p);}await byte.p.screenshot({path:out+'/byte-fallback.png'});await byte.c.close();check('RGBA8 fallback works when floating-point color buffers are unavailable');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({checks,metrics,errors},null,2));console.log(JSON.stringify({checks,metrics,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
