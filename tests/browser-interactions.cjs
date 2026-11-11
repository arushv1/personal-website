// Optional end-to-end suite for the scroll-driven opening, scan-viewer overlay,
// hover previews, blood-flow pulse, scan sweep, résumé link and entry content.
// Requires Playwright + Chromium and a running Vite server (see README.md).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{
 const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173',out=process.env.QA_DIR||'/tmp/atlas-interactions-qa';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],checks=[];
 function check(name){checks.push(name);console.log('PASS '+name);}
 async function open(options){
  const context=await browser.newContext(options);await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/fonts.googleapis|favicon.ico|ERR_FAILED|GL Driver Message/.test(m.text()+' '+m.location().url))errors.push(m.text());});
  return page;
 }
 const ready=page=>page.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false&&document.querySelector('.scan-overlay'),null,{timeout:90000});
 const reveal=page=>page.locator('#reveal').inputValue().then(Number);
 const shot=(page,name)=>page.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:72});
 const readout=page=>page.locator('.scan-overlay').evaluate(node=>[...node.querySelectorAll('span')].map(span=>span.textContent));
 const azimuth=async page=>Number((await readout(page)).find(text=>text.startsWith('AZ')).match(/AZ ([+-]\d+)/)[1]);
 const settle=(page,value)=>page.waitForFunction(v=>Number(document.querySelector('#reveal').value)===v,value,{timeout:15000});
 try{
  // ---- Desktop, full motion ----
  let page=await open({viewport:{width:1366,height:768}});
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  assert(await page.locator('.site-shell').evaluate(node=>node.classList.contains('has-intro')));
  const track=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);assert(track>768*1.8,'Opening should provide a scroll track');
  const pinned=await page.locator('#model-view').evaluate(node=>node.getBoundingClientRect().top);
  assert.equal(await page.locator('.model-marker').count(),0);
  assert.equal(await page.locator('.hero-copy>.eyebrow,.home-hint,.view-caption').count(),0);
  await shot(page,'intro-you');
  // A plain wheel over the model scrolls the page (and peels a layer); it no longer zooms on home.
  const zoomBefore=(await readout(page)).find(text=>text.startsWith('ZOOM'));
  await page.mouse.move(980,330);await page.mouse.wheel(0,560);
  await page.waitForFunction(()=>scrollY>300);await settle(page,34);
  assert.equal((await readout(page)).find(text=>text.startsWith('ZOOM')),zoomBefore);
  assert(Math.abs(await page.locator('#model-view').evaluate(node=>node.getBoundingClientRect().top)-pinned)<1,'The portrait should stay pinned while the page scrolls');
  assert.equal(await page.locator('.intro-stage[data-active=true] h2').textContent(),'Structure.');
  assert.equal(await page.locator('.intro-layer p:not(.intro-kicker)').count(),0,'Layer captions are a label and one word, with no sentence');
  assert.equal(await page.getByRole('button',{name:'Pause rotation'}).count(),0,'Scrolling pauses the idle turn');
  await shot(page,'intro-bone');
  for(const [fraction,value,title,name] of [[2/3,72,'Flow.','intro-vessels'],[1,100,'Ideas.','intro-within']]){
   await page.evaluate(f=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*f*.9),fraction);await settle(page,value);
   assert.equal(await page.locator('.intro-stage[data-active=true] h2').textContent(),title);
   assert((await readout(page)).includes('IM '+String(value).padStart(3,'0')+' / 100'));await page.waitForTimeout(700);await shot(page,name);
  }
  assert.equal(await page.locator('.model-marker').count(),0,'The opening stays free of hotspots at every layer');
  check('scroll-driven opening: pinned portrait, wheel scrolls instead of zooming, four layers with captions and no hotspots');
  // Ctrl/⌘ + wheel still zooms.
  await page.keyboard.down('Control');await page.mouse.wheel(0,-240);await page.keyboard.up('Control');
  await page.waitForFunction(before=>[...document.querySelectorAll('.scan-overlay span')].some(span=>span.textContent.startsWith('ZOOM')&&span.textContent!==before),zoomBefore);
  // The slider and the page stay one state: keys move both without drifting.
  await page.getByRole('button',{name:'Reset view and layers'}).click();await settle(page,0);assert.equal(await page.evaluate(()=>scrollY),0);
  await page.locator('#reveal').focus();for(let i=0;i<20;i++)await page.keyboard.press('ArrowRight');
  await settle(page,20);const sliderY=await page.evaluate(()=>scrollY);assert(sliderY>40,'Slider input should move the page position');
  await page.waitForTimeout(400);assert.equal(await reveal(page),20,'Slider value must not be pulled back by its own scroll');
  await page.mouse.move(300,400);await page.mouse.wheel(0,90);await page.waitForFunction(()=>Number(document.querySelector('#reveal').value)>20);
  await page.getByRole('button',{name:'Vessels',exact:true}).click();await settle(page,72);
  await page.waitForFunction(()=>document.querySelector('.intro-stage[data-active=true] h2')?.textContent==='Flow.');
  await page.getByRole('button',{name:'You',exact:true}).click();await settle(page,0);await page.waitForFunction(()=>scrollY<2);
  assert.equal(await page.locator('.intro-stage[data-active=true] h1').count(),1);
  check('slider, layer buttons, reset and Ctrl+wheel zoom stay in step with the page position');
  // ---- Scan-viewer overlay ----
  assert.equal(await page.locator('.scan-overlay').getAttribute('aria-hidden'),'true');
  let text=await readout(page);
  for(const expected of ['VYAS, ARUSH','ILLUSTRATIVE MODEL','SERIES · LOOK WITHIN','LAYER · You','IM 000 / 100','VIEW · Whole person','R','L'])assert(text.includes(expected),'Missing readout: '+expected+' in '+text.join(' | '));
  await page.locator('canvas').focus();for(let i=0;i<10;i++)await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.scan-edge-right').textContent==='P');
  assert.equal(await page.locator('.scan-edge-left').textContent(),'A');
  check('scan overlay reports layer, slice, zoom, view angle and patient-style orientation from the live scene');
  // ---- Résumé link ----
  const resume=page.locator('.site-header').getByRole('link',{name:/Résumé/});
  assert.equal(await resume.getAttribute('href'),'/arush-vyas-resume.pdf');assert.equal(await resume.getAttribute('target'),'_blank');
  assert.equal((await page.context().request.get(base+'/arush-vyas-resume.pdf')).status(),200);
  check('header résumé link opens the served PDF in a new tab');
  // ---- Hover previews ----
  // ---- Scan sweep (text column) ----
  await page.evaluate(()=>{window.__wipe=[];new MutationObserver(()=>window.__wipe.push(document.documentElement.dataset.wipe||'')).observe(document.documentElement,{attributes:true,attributeFilter:['data-wipe']});});
  await page.addStyleTag({content:':root{--wipe-ms:2600ms!important}'});
  await page.getByRole('link',{name:'Explore the atlas',exact:true}).click();await page.waitForURL(base+'/atlas');
  await page.waitForFunction(()=>document.documentElement.dataset.wipe==='run');
  await page.getByRole('heading',{name:'An atlas of a person.'}).waitFor();
  const sweeping=await page.evaluate(()=>{const style=name=>document.documentElement.style.getPropertyValue('--wipe-'+name);return {names:document.getAnimations().map(animation=>animation.animationName).filter(Boolean),from:parseFloat(style('from')),to:parseFloat(style('to')),width:parseFloat(style('w')),line:getComputedStyle(document.querySelector('.scan-sweep')).display,readout:document.querySelector('.scan-br span').textContent};});
  for(const name of ['wipe-old','wipe-new','wipe-line'])assert(sweeping.names.includes(name),'Missing sweep animation '+name+': '+sweeping.names.join());
  assert(sweeping.to-sweeping.from>300&&sweeping.width>300&&sweeping.line==='block');assert.match(sweeping.readout,/^ACQUIRING · /);
  await page.waitForTimeout(1100);await shot(page,'scan-sweep');
  await page.waitForFunction(()=>!document.documentElement.dataset.wipe,null,{timeout:15000});
  assert.deepEqual(await page.evaluate(()=>window.__wipe),['capture','run','']);assert.equal(await page.locator('.scan-sweep').evaluate(node=>getComputedStyle(node).display),'none');
  await page.addStyleTag({content:':root{--wipe-ms:780ms!important}'});
  // A second navigation during a sweep simply restarts it; Back uses the same transition.
  await page.locator('.chapter-list').getByRole('link',{name:/Education/}).click();await page.locator('.chapter-pager').getByRole('link',{name:'Awards',exact:true}).click();
  await page.waitForURL(base+'/awards');await page.getByRole('heading',{name:'Awards.',exact:true}).waitFor();await page.waitForFunction(()=>!document.documentElement.dataset.wipe,null,{timeout:15000});
  await page.goBack();await page.waitForURL(base+'/education');await page.getByRole('heading',{name:'Education.',exact:true}).waitFor();await page.goBack();await page.waitForURL(base+'/atlas');
  await page.getByRole('heading',{name:'An atlas of a person.'}).waitFor();await page.waitForFunction(()=>!document.documentElement.dataset.wipe&&scrollY===0,null,{timeout:15000});
  assert.equal(await page.locator('.hero-copy,.atlas-intro,.chapter-content').count(),1);
  check('scan sweep: the text column wipes from old to new behind a travelling line, restarts cleanly and follows Back');
  assert(!(await page.locator('.site-shell').evaluate(node=>node.classList.contains('has-intro'))));
  await page.waitForFunction(()=>[...document.querySelectorAll('.model-marker')].length===7&&[...document.querySelectorAll('.model-marker')].every(node=>node.style.transform));
  await page.mouse.move(700,20);await page.waitForFunction(()=>document.querySelector('.scan-br span').textContent==='VIEW · Atlas overview');
  await page.waitForTimeout(1600);
  const rest=await azimuth(page),label=page.getByRole('link',{name:/^Open Publications —/}).locator('.marker-label');
  const boxBefore=await label.boundingBox();await label.hover();
  await page.waitForFunction(()=>document.querySelector('.scan-br span').textContent==='PREVIEW · Posterior cortex');
  assert.equal(await page.locator('.model-marker.is-previewing').count(),1);
  await page.waitForFunction(before=>{const match=[...document.querySelectorAll('.scan-overlay span')].map(span=>span.textContent).find(text=>text.startsWith('AZ')).match(/AZ ([+-]\d+)/);return Math.abs(Number(match[1])-before)>=4;},rest);
  await page.waitForTimeout(900);const peek=await azimuth(page),boxDuring=await label.boundingBox();
  assert(Math.abs(peek-rest)<=11,'A preview is a small lean, not a section change: '+rest+' → '+peek);
  assert(Math.abs(boxBefore.x-boxDuring.x)<.6&&Math.abs(boxBefore.y-boxDuring.y)<.6,'The hovered label must hold still');
  assert.equal(new URL(page.url()).pathname,'/atlas');await shot(page,'hover-preview');
  await page.mouse.move(300,120);await page.waitForFunction(()=>document.querySelector('.scan-br span').textContent==='VIEW · Atlas overview');
  await page.waitForFunction(before=>{const match=[...document.querySelectorAll('.scan-overlay span')].map(span=>span.textContent).find(text=>text.startsWith('AZ')).match(/AZ ([+-]\d+)/);return Number(match[1])===before;},rest);
  await page.locator('.chapter-list').getByRole('link',{name:/Awards/}).hover();
  await page.waitForFunction(()=>document.querySelector('.model-marker.is-previewing')?.getAttribute('aria-label').startsWith('Open Awards'));
  await page.mouse.move(700,20);await page.waitForFunction(()=>!document.querySelector('.model-marker.is-previewing'));
  check('hover previews glow the anchor, lean the camera a few degrees, keep labels still and return on leave');
  // ---- Now note: in About Me only ----
  assert.equal(await page.locator('.now-strip').count(),0,'The atlas page no longer carries a Now bar');
  await page.goto(base+'/about#now',{waitUntil:'domcontentloaded'});await ready(page);
  await page.waitForFunction(()=>document.querySelector('.item-index [aria-current]')?.hash==='#now');
  assert.equal(await page.locator('#now .entry-highlights li').count(),3);
  check('Now note lives in About Me and is no longer shown on the atlas');
  // ---- Entry content ----
  await page.goto(base+'/experience',{waitUntil:'domcontentloaded'});await ready(page);
  for(const id of ['boston-scientific','tian-lab','btec','albro-lab']){assert.equal(await page.locator(`#${id} .entry-terms h3`).textContent(),'Key terms');assert.equal(await page.locator(`#${id} .entry-terms dt`).count(),3);}
  assert(await page.locator('#boston-scientific .entry-terms').evaluate(node=>node.getBoundingClientRect().height<150),'Key terms should stay compact');
  assert.equal(await page.locator('#albro-lab .entry-highlights li').count(),2);await page.locator('#boston-scientific .entry-terms').scrollIntoViewIfNeeded();await shot(page,'key-terms');
  // ---- Blood-flow pulse ----
  const atlas=()=>page.evaluate(()=>{const state=document.querySelector('canvas').__atlas;return state?{flowing:state.flowing,strength:state.densityRenderer.flow.strength.value,captures:state.densityRenderer.captures}:null;});
  if(await atlas()){
   await page.waitForFunction(()=>document.querySelector('canvas').__atlas.flowing&&document.querySelector('canvas').__atlas.densityRenderer.flow.strength.value>.3,null,{timeout:30000});
   const during=await atlas();await page.waitForTimeout(900);await shot(page,'blood-flow');
   assert.equal((await atlas()).captures,during.captures,'A pulse must reuse the cached surfaces, not redraw geometry');
   await page.waitForFunction(()=>!document.querySelector('canvas').__atlas.flowing,null,{timeout:30000});assert.equal((await atlas()).strength,0);
   await page.waitForTimeout(600);assert.equal((await atlas()).flowing,false,'The pulse stops by itself; the scene goes idle again');
   await page.getByRole('button',{name:'Zoom in'}).click();await page.waitForFunction(()=>document.querySelector('canvas').__atlas.flowing,null,{timeout:30000});
   await page.getByRole('button',{name:'You',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('canvas').__atlas.flowing);
   await page.waitForTimeout(1500);assert.equal((await atlas()).flowing,false,'No pulse where vessels are not visible');
   check('blood flow: a few beats after a vessel view settles, from cached buffers, stopping on movement and where vessels are hidden');
  }
  await page.goto(base+'/projects#threshold',{waitUntil:'domcontentloaded'});await ready(page);
  assert.deepEqual(await page.locator('#threshold .entry-writeup h3').allTextContents(),['The problem','What it does','How it works','What we found','What was hard','What’s next','Context']);
  assert.equal(await page.locator('#threshold .writeup-steps li').count(),5);
  assert.equal(await page.locator('#threshold .entry-links a').nth(1).getAttribute('href'),'https://devpost.com/software/stageshare');
  assert(await page.locator('#symptomai .entry-writeup h3').count()>=4);assert(!(await page.locator('#vascupath').textContent()).includes('Reserarch'));
  await page.locator('#threshold .entry-writeup').scrollIntoViewIfNeeded();await shot(page,'writeup');
  check('key terms, both project write-ups and the corrected entries render from content data');
  await page.goto(base+'/publications#vascupath-poster',{waitUntil:'domcontentloaded'});await ready(page);
  await page.getByRole('button',{name:/^Open the poster viewer/}).click();
  const viewer=page.locator('dialog.poster-dialog');assert(await viewer.evaluate(node=>node.open));
  const image=viewer.locator('.poster-stage img');await image.evaluate(node=>node.decode());
  const fit=await image.evaluate(node=>node.getBoundingClientRect().width);assert(await viewer.evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  await viewer.getByRole('button',{name:'Zoom in'}).click();await viewer.getByRole('button',{name:'Zoom in'}).click();
  await page.waitForFunction(width=>document.querySelector('.poster-stage img').getBoundingClientRect().width>width*1.9,fit);await shot(page,'poster-zoomed');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog.poster-dialog').open);
  await page.waitForTimeout(200);assert.equal(new URL(page.url()).pathname,'/publications','Closing the poster must not leave the section');
  check('poster opens in a zoomable viewer and Escape closes only the viewer');
  await page.goto(base+'/courses#introduction-machine-learning',{waitUntil:'domcontentloaded'});await ready(page);
  assert.match(await page.locator('.course-map-catalog').textContent(),/FROM THE COURSE CATALOG.*support vector machines/);
  assert.equal(await page.locator('.course-map-catalog a').getAttribute('href'),'https://www.bu.edu/academics/eng/courses/eng-ec-414/');
  assert(await page.locator('.course-flow').count()>=1);assert(await page.locator('.course-flow').first().evaluate(node=>node.getAnimations().every(animation=>animation.effect.getTiming().iterations===1)),'The course flow dash plays once');
  check('course catalog summaries appear with their source link');
  await page.context().close();
  // ---- Phones, full motion ----
  for(const [width,height] of [[390,844],[320,800]]){
   page=await open({viewport:{width,height},hasTouch:true,isMobile:true});
   await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);
   assert(await page.locator('.site-header nav').evaluate(node=>node.getBoundingClientRect().right<=innerWidth+.5&&[...node.children].filter(child=>child.offsetParent).every(child=>child.getBoundingClientRect().height>=36)));
   assert(await page.locator('.site-header .nav-resume').isVisible());
   const start=await page.evaluate(()=>{const hero=document.querySelector('.hero'),copy=hero.querySelector('.hero-copy');return hero.getBoundingClientRect().top+scrollY+copy.offsetHeight+parseFloat(getComputedStyle(hero).rowGap)-8;});
   await page.evaluate(y=>window.scrollTo(0,y-40),start);await page.waitForTimeout(300);assert.equal(await reveal(page),0,'Nothing peels before the model is pinned');
   const range=await page.evaluate(()=>{const hero=document.querySelector('.hero'),copy=hero.querySelector('.hero-copy'),portrait=document.getElementById('model-view');return (hero.offsetHeight-copy.offsetHeight-parseFloat(getComputedStyle(hero).rowGap)-portrait.offsetHeight)*.94;});
   await page.evaluate(y=>window.scrollTo(0,y),start+range/3);await settle(page,34);
   const box=await page.locator('#model-view').boundingBox();assert(Math.abs(box.y-8)<1.5&&box.y+box.height<=height+1,'Pinned model and controls should fit the phone viewport');
   assert.equal(await page.locator('.intro-caption-overlay .intro-overlay-title').textContent(),'Structure.');assert.equal(await page.locator('.intro-caption-overlay p').count(),2);
   assert.equal(await page.locator('canvas').evaluate(node=>getComputedStyle(node).touchAction),'pan-y');
   await page.waitForTimeout(700);await shot(page,'intro-phone-'+width);
   await page.evaluate(y=>window.scrollTo(0,y),start+range);await settle(page,100);
   await page.context().close();
  }
  check('390 and 320 px phones: header fits, the model pins after the headline, captions overlay the pinned model');
  // ---- Reduced motion keeps the plain slider ----
  page=await open({viewport:{width:1366,height:768},reducedMotion:'reduce'});
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  assert(!(await page.locator('.site-shell').evaluate(node=>node.classList.contains('has-intro'))));
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<innerHeight*1.2),'Reduced motion should not add a scroll track');assert.equal(await page.locator('.scroll-cue').count(),0);
  await page.getByRole('button',{name:'Within',exact:true}).click();assert.equal(await reveal(page),100);
  assert.equal(await page.locator('.intro-stage[data-active=true] h2').textContent(),'Ideas.');
  await page.goto(base+'/atlas',{waitUntil:'domcontentloaded'});await ready(page);await page.waitForFunction(()=>[...document.querySelectorAll('.model-marker')].every(node=>node.style.transform)&&document.querySelectorAll('.model-marker').length===7);
  const still=await azimuth(page);await page.getByRole('link',{name:/^Open Publications —/}).locator('.marker-label').hover();
  await page.waitForFunction(()=>document.querySelector('.scan-br span').textContent==='PREVIEW · Posterior cortex');await page.waitForTimeout(500);
  assert.equal(await azimuth(page),still,'Reduced motion previews must not move the camera');
  await page.evaluate(()=>{window.__wipe=[];new MutationObserver(()=>window.__wipe.push(document.documentElement.dataset.wipe||'')).observe(document.documentElement,{attributes:true,attributeFilter:['data-wipe']});});
  await page.locator('.chapter-list').getByRole('link',{name:/Experience/}).click();await page.waitForURL(base+'/experience');await page.getByRole('heading',{name:'Experience.',exact:true}).waitFor();
  await page.waitForTimeout(1500);assert.deepEqual(await page.evaluate(()=>window.__wipe),[],'Reduced motion changes sections at once');
  assert.equal(await page.evaluate(()=>document.querySelector('canvas').__atlas?.flowing??false),false,'Reduced motion has no blood-flow pulse');
  await page.context().close();
  check('reduced motion: no scroll track, sweep or pulse; slider drives captions; previews glow without camera movement');
  assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
