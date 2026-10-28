// Optional end-to-end prototype verification: Vite + Playwright + Chromium.
const assert=require('node:assert/strict'),fs=require('node:fs'),sharp=require('sharp');
const {chromium}=require('playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{
 const base=process.env.PREVIEW_URL||'http://127.0.0.1:5182',out=process.env.QA_DIR||'/tmp/vascupath-acceptance';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const checks=[],errors=[];const pass=name=>{checks.push(name);console.log('PASS '+name);};
 const context=await browser.newContext({viewport:{width:1536,height:1024},reducedMotion:'reduce'});await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/fonts.googleapis|ERR_FAILED|favicon/.test(m.text()+' '+m.location().url))errors.push(m.text());});
 const modal=page.locator('.vascu-explorer'),inspector=modal.locator('.vascu-inspector');
 async function open(){await page.getByRole('button',{name:'Explore brain slice',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.brain-slice-scene canvas')?.__brainSlice?.entryProgress===1,null,{timeout:60000});}
 async function extracted(){await page.waitForFunction(()=>document.querySelector('.brain-slice-scene canvas').__brainSlice.progress>.99);await inspector.locator('.vascu-source-image').evaluate(img=>img.decode());}
 async function atlas(){return page.locator('.anatomy-canvas canvas').evaluate(c=>{const e=c.__atlas;return {reveal:Number(document.querySelector('#reveal').value),camera:[...e.camera.position.toArray(),...e.camera.quaternion.toArray()],target:e.controls.target.toArray()};});}
 try{
  if(!process.env.ONLY_MOTION){
  await page.goto(base+'/projects#vascupath');await page.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false,null,{timeout:60000});const before=await atlas();
  await open();
  const modelBox=await modal.locator('.vascu-model-stage').boundingBox(),figureBox=await modal.locator('.vascu-research').boundingBox();
  assert(figureBox.x+figureBox.width<modelBox.x,'Research figures should be to the left of the model');
  assert.equal(await modal.locator('canvas').evaluate(c=>c.__brainSlice.vesselOpacity),0,'Focused view should remove the distracting vessel tree');
  await page.screenshot({path:out+'/highlight.png'});
  await modal.locator('.brain-slice-scene canvas').focus();await page.keyboard.press('Enter');await extracted();
  assert(await inspector.getByRole('button',{name:'Predictions',exact:true}).evaluate(e=>document.activeElement===e));
  assert.equal(await inspector.getByRole('button',{name:'Predictions',exact:true}).getAttribute('aria-pressed'),'true');
  assert(await modal.locator('canvas').evaluate(c=>{const e=c.__brainSlice,from=e.controls.target.clone().project(e.camera),to=e.controls.target.clone().add(e.slab.position).project(e.camera);return to.x<from.x-.1;}),'The extracted slice should travel toward the figures on screen-left');
  pass('keyboard selects the coronal slice, pulls it out and focuses the research inspector');
  const zoom=inspector.getByRole('group',{name:'Image zoom controls'}),image=inspector.locator('.vascu-source-image');
  const initialWidth=await image.evaluate(e=>e.style.width);await zoom.getByRole('button',{name:'Zoom in',exact:true}).click();await zoom.getByRole('button',{name:'Zoom in',exact:true}).click();
  const enlarged=await image.evaluate(e=>e.style.width);assert(parseFloat(enlarged)>parseFloat(initialWidth));
  const viewer=inspector.locator('.vascu-image-viewport'),box=await viewer.boundingBox(),panBefore=await image.evaluate(e=>e.style.left);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2-70,box.y+box.height/2+25,{steps:5});await page.mouse.up();
  assert.notEqual(await image.evaluate(e=>e.style.left),panBefore);
  await inspector.getByRole('button',{name:'Original',exact:true}).click();await image.evaluate(img=>img.decode());assert.equal(await image.evaluate(e=>e.style.width),enlarged);
  await viewer.focus();const point=await inspector.locator('.vascu-magnifier img').evaluate(e=>e.style.left);await page.keyboard.press('ArrowRight');assert.notEqual(await inspector.locator('.vascu-magnifier img').evaluate(e=>e.style.left),point);
  pass('original/prediction views preserve zoom and pan; pointer and keyboard control the linked magnifier');
  await inspector.getByRole('button',{name:'Attention',exact:true}).click();await image.evaluate(img=>img.decode());
  assert.equal(await image.evaluate(e=>e.naturalWidth),612);assert.equal(await image.evaluate(e=>e.naturalHeight),432);
  const detail=await sharp(await inspector.locator('.vascu-magnifier').screenshot()).removeAlpha().raw().toBuffer();let colored=0;
  for(let i=0;i<detail.length;i+=3)if(Math.max(detail[i],detail[i+1],detail[i+2])-Math.min(detail[i],detail[i+1],detail[i+2])>25)colored++;
  assert(colored>500,'The attention magnifier must start on tissue rather than blank figure margins');
  const link=inspector.getByRole('link',{name:'Open full attention figure in a new tab'});assert.equal(await link.getAttribute('href'),'/vascupath/attention.png');assert.equal(await link.getAttribute('target'),'_blank');
  await page.screenshot({path:out+'/attention.png'});await inspector.getByRole('button',{name:'Predictions',exact:true}).click();await image.evaluate(img=>img.decode());assert.equal(await image.evaluate(e=>e.style.width),enlarged);
  await viewer.focus();await page.keyboard.press('Home');assert.equal(await image.evaluate(e=>e.style.width),initialWidth);await page.screenshot({path:out+'/predictions.png'});
  pass('attention keeps its complete source figure/legend and separate view state; full-figure links and image reset work');
  await modal.getByRole('button',{name:'Back to brain',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.brain-slice-scene canvas').__brainSlice.progress<.01);
  const hit=await modal.locator('.brain-slice-scene canvas').evaluate(c=>{const e=c.__brainSlice,b=c.getBoundingClientRect(),p=e.sliceTarget.geometry.boundingBox.getCenter(e.camera.position.clone());p.applyMatrix4(e.sliceTarget.matrixWorld).project(e.camera);return {x:b.left+(p.x*.5+.5)*b.width,y:b.top+(-p.y*.5+.5)*b.height};});
  await page.mouse.click(hit.x,hit.y);await extracted();await page.keyboard.press('Escape');await modal.waitFor({state:'detached'});
  assert(page.url().endsWith('/projects#vascupath'));assert.deepEqual(await atlas(),before);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  await page.waitForFunction(()=>document.activeElement?.classList.contains('experience-link'));
  assert(await page.getByRole('button',{name:'Explore brain slice',exact:true}).evaluate(e=>e===document.activeElement));
  pass('real 3D slice hit target works; Escape closes focus mode, restores focus and preserves the underlying atlas pose/layer');
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.goto(base+'/projects#vascupath');await open();await page.screenshot({path:out+'/mobile-brain-'+width+'.png'});await modal.getByRole('button',{name:'Explore the slice',exact:true}).click();await extracted();
   assert(await modal.evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert(await inspector.getByRole('button',{name:'Predictions',exact:true}).evaluate(e=>e.getBoundingClientRect().height>=44));
   const rect=await inspector.boundingBox();assert(rect.y>=0&&rect.y<422,'Mobile extraction should bring the inspector into view');
   await page.screenshot({path:out+'/mobile-'+width+'.png'});await modal.getByRole('button',{name:'Back to brain',exact:true}).click();await modal.getByRole('button',{name:'Close VascuPath explorer'}).click();await modal.waitFor({state:'detached'});
  }
  pass('390px/320px layouts have no horizontal overflow, 44px controls, reachable Back/Close and automatic inspector focus');
  await page.setViewportSize({width:1366,height:900});await page.goto(base+'/projects#vascupath');await open();await modal.getByRole('link',{name:'Explore',exact:true}).click();await page.waitForURL(base+'/atlas');await page.waitForFunction(()=>document.querySelector('#reveal')?.value==='50');assert.equal(await page.locator('#reveal').inputValue(),'50');assert.equal(await page.locator('.vascu-explorer').count(),0);
  pass('leaving focus mode through navigation restores the established atlas preset and unmounts the extra scene');
  }
  // Exercise the actual animation separately from reduced-motion interaction QA.
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base+'/projects#vascupath');
  await page.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false,null,{timeout:60000});
  await page.getByRole('group',{name:'Choose a layer'}).getByRole('button',{name:'Vessels',exact:true}).click();
  await page.waitForFunction(()=>Math.abs(document.querySelector('.anatomy-canvas canvas').__atlas.reveal-72)<.001);
  await page.locator('.anatomy-canvas canvas').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('+');
  const custom=await atlas();
  await page.getByRole('button',{name:'Explore brain slice',exact:true}).click();
  const entryHandle=await page.waitForFunction(()=>{const e=document.querySelector('.brain-slice-scene canvas')?.__brainSlice;return e&&e.entryProgress>0&&e.entryProgress<1?{progress:e.entryProgress,vessels:e.vesselOpacity}:false;},null,{timeout:60000});
  const entry=await entryHandle.jsonValue();
  assert(entry.progress>0&&entry.progress<1);assert(entry.vessels>0&&entry.vessels<1);
  await page.waitForFunction(()=>document.querySelector('.brain-slice-scene canvas').__brainSlice.entryProgress===1);
  await modal.getByRole('button',{name:'Explore the slice',exact:true}).click();await extracted();
  await modal.locator('canvas').evaluate(c=>{const e=c.__brainSlice;window.__returnedSlice=null;const watch=()=>{if(e.phase==='returned'){window.__returnedSlice={position:e.camera.position.toArray(),target:e.controls.target.toArray()};return;}requestAnimationFrame(watch);};requestAnimationFrame(watch);});
  await modal.getByRole('button',{name:'Close VascuPath explorer'}).click();
  const returnHandle=await page.waitForFunction(()=>{const e=document.querySelector('.brain-slice-scene canvas')?.__brainSlice;return e?.phase==='returning'&&e.returnProgress<1?{progress:e.returnProgress}:false;});
  const returning=await returnHandle.jsonValue();assert(returning.progress>=0&&returning.progress<1);
  await modal.waitFor({state:'detached'});assert.deepEqual(await atlas(),custom);
  assert.deepEqual(await page.evaluate(()=>window.__returnedSlice),{position:custom.camera.slice(0,3),target:custom.target});
  pass('full-motion entry fades vessels and focuses the brain; Close retracts the slice and smoothly returns to the exact custom Projects pose and 72% layer');
  await open();await page.setViewportSize({width:1280,height:768});
  await modal.getByRole('button',{name:'Close VascuPath explorer'}).click();await modal.waitFor({state:'detached'});
  const resized=await atlas();assert.deepEqual(resized.camera,custom.camera);assert.deepEqual(resized.target,custom.target);assert.equal(resized.reveal,custom.reveal);
  pass('resizing the viewport during exploration keeps the return camera, layer and canvas handoff intact');
  const fallbackContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await fallbackContext.route('https://fonts.googleapis.com/**',r=>r.abort());
  await fallbackContext.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:original.call(this,kind,...args);};});
  const fallbackPage=await fallbackContext.newPage();await fallbackPage.goto(base+'/projects#vascupath');
  await fallbackPage.getByRole('button',{name:'Explore brain slice',exact:true}).click();
  await fallbackPage.getByRole('button',{name:'Explore the slice',exact:true}).click();
  await fallbackPage.locator('.vascu-inspector .vascu-source-image').evaluate(img=>img.decode());
  await fallbackPage.getByRole('button',{name:'Close VascuPath explorer'}).click();await fallbackPage.locator('.vascu-explorer').waitFor({state:'detached'});await fallbackContext.close();
  pass('without WebGL the original research figures remain accessible and Close still restores the reader');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
