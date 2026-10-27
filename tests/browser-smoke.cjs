// Optional end-to-end suite: Playwright + Chromium and a running Vite server.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sharp=require('sharp');
const {chromium}=require('playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{
 const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173',out=process.env.QA_DIR||'/tmp/atlas-portfolio-qa';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 const page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/fonts.googleapis|favicon.ico|ERR_FAILED/.test(m.text()+' '+m.location().url))errors.push(m.text());});
 function check(name){checks.push(name);console.log('PASS '+name);}
 const names=['About Me','Education','Experience','Projects','Awards','Courses','Publications'];
 const ids=['about','education','experience','projects','awards','courses','publications'];
 async function ready(){await page.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false,null,{timeout:60000});await page.waitForFunction(()=>[...document.querySelectorAll('.model-marker')].every(e=>e.style.transform));}
 async function route(path,title){await page.waitForURL(base+path,{waitUntil:'domcontentloaded'});await page.waitForFunction(t=>document.title===t,'Arush Vyas — '+title);}
 async function shot(name){await page.screenshot({path:`${out}/${name}.png`});}
 async function modelImage(){return page.locator('canvas').screenshot({style:'.model-markers{visibility:hidden!important}'});}
 async function pixels(buffer){return sharp(buffer).removeAlpha().raw().toBuffer();}
 async function sameImage(a,b){const x=await pixels(a),y=await pixels(b);assert.equal(x.length,y.length);let difference=0;for(let i=0;i<x.length;i++)difference+=Math.abs(x[i]-y[i]);assert(difference/x.length<.3,'Camera/model pixels changed: '+difference/x.length);}
 async function visibleHotspots(){
  assert.equal(await page.locator('.model-marker').count(),7);
  const boxes=await page.locator('.model-marker').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};}));
  for(const b of boxes)assert(b.height>=43.5&&b.width>=55);
  const dots=await page.locator('.marker-dot').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y};}));
  assert(Math.max(...dots.map(d=>d.x))-Math.min(...dots.map(d=>d.x))>20,'Projected anchors collapsed at the viewer edge');
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(a.x+a.width<=b.x+.5||b.x+b.width<=a.x+.5||a.y+a.height<=b.y+.5||b.y+b.height<=a.y+.5,'Hotspot labels overlap');}
 }
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready();assert.equal(await page.locator('.model-marker').count(),0);
  await page.getByRole('button',{name:'Within',exact:true}).click();assert.equal(await page.locator('.model-marker').count(),0);await page.getByRole('button',{name:'Reset view and layers'}).click();
  assert.equal(await page.locator('#reveal').inputValue(),'0');const home=await modelImage();
  await shot('home');
  for(const button of await page.locator('.scene-actions button').all()){
   const info=await button.evaluate(e=>({text:e.textContent.trim(),height:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e).fontSize)}));assert(info.text&&info.height>=44&&info.font>=14);
  }
  for(const button of await page.locator('.layer-stops button').all()){assert(await button.evaluate(e=>e.getBoundingClientRect().height>=44&&parseFloat(getComputedStyle(e).fontSize)>=14));}
  await page.getByRole('link',{name:'Explore the atlas',exact:true}).click();await route('/atlas','The atlas');await ready();await visibleHotspots();await shot('atlas-entry');
  check('home and manual reveal hide hotspots; Explore the atlas reveals seven compact hotspots; controls retain 44px targets');
  const views=[];
  for(let i=0;i<ids.length;i++){
   await page.getByRole('link',{name:new RegExp('^Open '+names[i]+' —')}).click();await route('/'+ids[i],names[i]);
   await page.waitForFunction(region=>document.querySelector('canvas').getAttribute('aria-description')==='Selected view: '+region,['Face','Cortex','Vascular tree','Frontal cortex','Crown of the skull','Cervical spine','Posterior cortex'][i]);
   await visibleHotspots();views.push(await modelImage());await shot(ids[i]);
   assert.equal(await page.locator('.model-marker[aria-current="page"]').count(),1);
  }
  assert(!views[1].equals(views[3]),'Education and Projects should have different cortex views');
  assert(!views[4].equals(views[5]),'Awards and Courses should have different bone views');
  check('all seven sections, distinct structure views, layer presets and selected hotspots');
  await page.getByRole('link',{name:/^Open Projects —/}).click();await route('/projects','Projects');
  assert.equal(await page.locator('.item-index a').count(),3);
  const canvas=page.locator('canvas'),before=await modelImage(),scrollBefore=await page.evaluate(()=>scrollY);
  for(const [title,id] of [['Threshold','threshold'],['VascuPath','vascupath'],['SymptomAI','symptomai']]){
   await page.locator('.item-index').getByRole('link',{name:new RegExp(title)}).click();
   await page.waitForFunction(id=>document.querySelector('.item-index [aria-current]')?.getAttribute('href')==='#'+id,id);
   assert.equal(await page.evaluate(()=>scrollY),scrollBefore);await sameImage(before,await modelImage());
  }
  await page.getByRole('button',{name:'Next Projects item'}).click();await page.waitForFunction(()=>document.querySelector('.item-index [aria-current]')?.hash==='#threshold');
  await page.getByRole('button',{name:'Previous Projects item'}).click();await page.waitForFunction(()=>document.querySelector('.item-index [aria-current]')?.hash==='#symptomai');
  const reader=page.getByRole('region',{name:'Projects entries'});await reader.hover();await page.mouse.wheel(0,500);await page.waitForFunction(()=>document.querySelector('.item-reader').scrollTop>100);await sameImage(before,await modelImage());
  await shot('projects-scrolled');check('project index, previous/next and native wheel scroll preserve page and camera');
  await page.getByRole('button',{name:'Within',exact:true}).click();assert.equal(await page.locator('#reveal').inputValue(),'100');
  await page.getByRole('button',{name:'Reset view and layers'}).click();assert.equal(await page.locator('#reveal').inputValue(),'0');const reset=await modelImage();
  await page.getByRole('button',{name:'Within',exact:true}).click();await canvas.focus();await page.keyboard.press('Home');assert.equal(await page.locator('#reveal').inputValue(),'0');await sameImage(reset,await modelImage());
  const historyLength=await page.evaluate(()=>history.length);await page.getByRole('link',{name:/^Open Projects —/}).click();assert.equal(await page.locator('#reveal').inputValue(),'100');assert.equal(await page.evaluate(()=>history.length),historyLength);
  check('button and keyboard reset slider + camera; current-section hotspot reselects preset without history spam');
  await page.goto(base+'/projects#threshold',{waitUntil:'domcontentloaded'});await ready();await page.waitForFunction(()=>document.querySelector('.item-index [aria-current]')?.hash==='#threshold');
  await page.reload({waitUntil:'domcontentloaded'});await ready();assert((await page.title()).endsWith('Projects'));
  await page.getByRole('link',{name:'All sections',exact:true}).click();await route('/atlas','The atlas');await shot('atlas');
  await page.locator('.chapter-list').getByRole('link',{name:/Education/}).click();await route('/education','Education');
  await page.locator('.chapter-pager').getByRole('link',{name:'Experience',exact:true}).click();await route('/experience','Experience');
  await page.goBack();await route('/education','Education');await page.goBack();await route('/atlas','The atlas');await page.goForward();await route('/education','Education');await page.goForward();await route('/experience','Experience');
  const [tab]=await Promise.all([context.waitForEvent('page'),page.getByRole('link',{name:/^Open Projects —/}).click({modifiers:['Control']})]);await tab.waitForLoadState('domcontentloaded');await tab.getByRole('heading',{name:'Projects.',exact:true}).waitFor();await tab.close();
  await page.goto(base+'/research',{waitUntil:'domcontentloaded'});await route('/projects','Projects');await page.goto(base+'/roots',{waitUntil:'domcontentloaded'});await route('/about','About Me');
  check('direct item links/refresh, section history/new tabs and legacy-route migration');
  for(const name of ['Contact','Model credits']){await page.getByRole('button',{name,exact:true}).click();assert(await page.locator('dialog').evaluate(d=>d.open));if(name==='Contact')assert.equal(await page.locator('.contact-link').getAttribute('href'),'mailto:arushv16@gmail.com');await page.keyboard.press('Escape');}
  await page.getByRole('link',{name:'Projects',exact:true}).first().focus();await page.keyboard.press('Enter');await route('/projects','Projects');assert.equal(await page.locator('#chapter-title').evaluate(e=>document.activeElement===e),true);
  check('updated contact details, dialogs and keyboard section focus');
  for(const [width,height] of [[1536,1024],[1366,768],[390,844],[320,800]]){
   await page.setViewportSize({width,height});await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});await ready();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const y=await page.evaluate(()=>scrollY);await page.locator('.item-index').getByRole('link',{name:/Threshold/}).click();await page.waitForFunction(()=>document.querySelector('.item-index [aria-current]')?.hash==='#threshold');assert.equal(await page.evaluate(()=>scrollY),y);
   await shot('projects-'+width);
   if(width<=390){await page.getByRole('link',{name:/View 3D/}).click();await visibleHotspots();await shot('model-'+width);assert.equal(await canvas.evaluate(e=>getComputedStyle(e).touchAction),'pan-y');await page.getByRole('link',{name:'Back to reading'}).click();}
  }
  check('desktop/short laptop/390/320 layouts; mobile item navigation, 3D jump and pan-y');
  // Demonstrate a data-only addition with no component changes (development fixture).
  const moduleUrl=await page.evaluate(()=>performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/content/portfolio.mjs')?.name);
  if(moduleUrl){
   await page.evaluate(async url=>{const data=await import(url);data.sectionById.projects.items.push({id:'qa-project',title:'QA fixture project',summary:'Data-only addition.',body:['No component edits.']});},moduleUrl);
   await page.getByRole('link',{name:/^Open About Me —/}).click();await page.getByRole('link',{name:/^Open Projects —/}).click();
   assert.equal(await page.locator('.item-index a').count(),4);await page.locator('.item-index').getByRole('link',{name:/QA fixture project/}).click();await page.getByRole('heading',{name:'QA fixture project',exact:true}).waitFor();
   await page.evaluate(async url=>{const data=await import(url);data.sectionById.projects.items.pop();},moduleUrl);check('adding a fourth project in the content array automatically builds the index and reader');
  }
  await page.setViewportSize({width:1366,height:768});await page.goto(base+'/?reveal=blend',{waitUntil:'domcontentloaded'});await ready();assert.equal(await page.locator('.model-marker').count(),0);await page.getByRole('link',{name:'Explore the atlas',exact:true}).click();await page.getByRole('link',{name:/^Open Projects —/}).click();await page.waitForURL(base+'/projects?reveal=blend',{waitUntil:'domcontentloaded'});await page.reload({waitUntil:'domcontentloaded'});await ready();
  for(const asset of ['/models/avatar.glb','/models/bone.glb','/models/arteries.glb','/models/brain.glb','/draco/draco_decoder.wasm','/arush-vyas-resume.pdf']){const response=await context.request.get(base+asset);assert.equal(response.status(),200);}
  await page.goto(base+'/does-not-exist',{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Page not found.'}).waitFor();
  await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});await ready();await page.getByRole('link',{name:'Arush Vyas, return home'}).click();await route('/','A closer look');assert.equal(await page.locator('.model-marker').count(),0);
  check('blend alternative retains mode, assets load, unknown routes recover and returning home hides hotspots');
  assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors,fixtureVerified:!!moduleUrl},null,2));console.log(JSON.stringify({checks,errors,fixtureVerified:!!moduleUrl},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
