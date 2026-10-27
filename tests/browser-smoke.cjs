// Optional browser acceptance suite: requires Playwright and a running Vite preview.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{
 const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173';
 const out=process.env.QA_DIR||'/tmp/atlas-browser-qa';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
 await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 const page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(['error','warning'].includes(m.type())&&!/fonts.googleapis|favicon.ico|ERR_FAILED/.test(m.text()+' '+m.location().url))errors.push(m.text());});
 async function route(path,title){await page.waitForURL(base+path,{waitUntil:'domcontentloaded'});await page.waitForFunction(t=>document.title===t,'Arush Vyas — '+title);}
 async function ready(){await page.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false,null,{timeout:60000});}
 async function setReveal(v){await page.locator('#reveal').evaluate((e,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},v);}
 try{
  await page.goto(base+'/research',{waitUntil:'domcontentloaded'});await route('/research','Research');await ready();assert.equal(await page.locator('#chapter-title').textContent(),'Making the invisible visible.');
  await page.reload({waitUntil:'domcontentloaded'});await route('/research','Research');
  const tab=await context.newPage();await tab.goto(base+'/research',{waitUntil:'domcontentloaded'});await tab.getByRole('heading',{name:'Making the invisible visible.'}).waitFor();await tab.close();checks.push('direct Research, refresh, new tab');
  await page.getByRole('link',{name:'Arush Vyas, return home'}).click();await route('/','A closer look');
  await page.getByRole('link',{name:'Explore within',exact:true}).click();await route('/atlas','The atlas');
  await page.locator('.chapter-list').getByRole('link',{name:'Research'}).click();await route('/research','Research');
  await page.locator('.chapter-pager').getByRole('link',{name:'Roots'}).click();await route('/roots','Roots');
  await page.goBack();await route('/research','Research');await page.goBack();await route('/atlas','The atlas');
  await page.goForward();await route('/research','Research');await page.goForward();await route('/roots','Roots');
  const length=await page.evaluate(()=>history.length);await page.locator('.chapter-pager').getByRole('link',{name:'Roots'}).click();assert.equal(await page.evaluate(()=>history.length),length);checks.push('history Back twice/Forward twice, duplicate selection');
  await page.getByRole('link',{name:'Back to the atlas'}).click();await route('/atlas','The atlas');
  await ready();await page.getByRole('link',{name:'Explore Research',exact:true}).click();await route('/research','Research');checks.push('hotspot, pager, atlas and home links');
  await page.getByRole('link',{name:'About',exact:true}).focus();await page.keyboard.press('Enter');await route('/about','About');assert.equal(await page.locator('#chapter-title').evaluate(e=>document.activeElement===e),true);
  for(const name of ['Contact','Model credits']){await page.getByRole('button',{name,exact:true}).click();assert(await page.locator('dialog').evaluate(d=>d.open));await page.keyboard.press('Escape');}checks.push('keyboard links, chapter focus, dialogs');
  const [popup]=await Promise.all([context.waitForEvent('page'),page.getByRole('link',{name:'Work',exact:true}).click({modifiers:['Control']})]);await popup.waitForLoadState('domcontentloaded');assert(new URL(popup.url()).pathname==='/research');await popup.close();checks.push('Ctrl-click opens Research in a new tab');
  for(const [w,h] of [[1536,1024],[1366,768],[390,844],[320,800]]){
   await page.setViewportSize({width:w,height:h});await page.getByRole('link',{name:'Work',exact:true}).click();await route('/research','Research');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(w<=390){const box=await page.locator('#chapter-title').boundingBox();assert(box.y>=0&&box.y<h);assert.equal(await page.locator('canvas').evaluate(e=>getComputedStyle(e).touchAction),'pan-y');}
   await page.screenshot({path:`${out}/research-${w}.png`});
  }checks.push('1536 desktop, 1366 short laptop, 390 and 320 mobile, chapter scrolling and pan-y');
  await page.setViewportSize({width:1366,height:768});await page.getByRole('link',{name:'Arush Vyas, return home'}).click();await ready();
  await page.locator('canvas').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');await page.getByRole('button',{name:'Reset view'}).click();await page.waitForTimeout(250);
  const before=await page.locator('canvas').screenshot();await setReveal(100);await page.waitForTimeout(150);await setReveal(0);await page.waitForTimeout(150);assert(before.equals(await page.locator('canvas').screenshot()),'Reveal should return to exactly the same camera and avatar');
  for(const name of ['Bone','Vessels','Within','You']){await page.getByRole('button',{name,exact:true}).click();}checks.push('keyboard orbit/zoom, reset, layer shortcuts, identical camera after round trip');
  for(const path of ['/models/avatar.glb','/models/bone.glb','/models/arteries.glb','/models/brain.glb','/draco/draco_decoder.wasm','/draco/draco_wasm_wrapper.js','/arush-vyas-resume.pdf']){const r=await context.request.get(base+path);assert.equal(r.status(),200);assert((await r.body()).length>1000);}checks.push('four models, decoder, resume');
  await page.goto(base+'/does-not-exist',{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Page not found.'}).waitFor();await page.getByRole('link',{name:'Return home',exact:true}).click();checks.push('unknown route and home recovery');
  // Full-motion slow scrub, rapid jumps and reversals. Capture real frames.
  await page.emulateMedia({reducedMotion:'no-preference'});await page.reload({waitUntil:'domcontentloaded'});await ready();
  await page.getByRole('button',{name:'Pause rotation'}).click();
  const frames=[];await page.evaluate(()=>{window.qaTimes=[];window.qaActive=true;function tick(t){window.qaTimes.push(t);if(window.qaActive)requestAnimationFrame(tick);}requestAnimationFrame(tick);});
  for(const value of [0,8,16,24,34,44,56,68,80,90,100,0,100,50,75,25,0]){
   await setReveal(value);await page.waitForTimeout(100);frames.push(await page.locator('canvas').screenshot());
  }
  const times=await page.evaluate(()=>{window.qaActive=false;return window.qaTimes;});
  const fps=1000*(times.length-1)/(times.at(-1)-times[0]);
  for(const [i,frame] of frames.entries())fs.writeFileSync(`${out}/motion-${String(i).padStart(2,'0')}.png`,frame);
  assert.equal(await page.getByRole('button',{name:'Start rotation'}).count(),1);checks.push('full-motion slow/fast/reverse scrubbing; automatic rotation stays paused');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base+'/?reveal=section',{waitUntil:'domcontentloaded'});await ready();
  await setReveal(15);await page.waitForTimeout(150);
  await page.locator('.anatomy-canvas').screenshot({path:`${out}/sectional-backup.png`});
  assert.equal(await page.getByRole('link',{name:'Work',exact:true}).getAttribute('href'),'/research?reveal=section');
  await page.getByRole('link',{name:'Work',exact:true}).click();await page.waitForURL(base+'/research?reveal=section',{waitUntil:'domcontentloaded'});
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  await page.getByRole('heading',{name:'Making the invisible visible.'}).waitFor();
  checks.push('sectional backup, chapter link retains comparison mode, refresh');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors,observedBrowserRafFps:fps,frameCount:times.length},null,2));console.log(JSON.stringify({checks,errors,observedBrowserRafFps:fps},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
