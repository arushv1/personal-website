// Optional acceptance checks: run against Vite with Playwright and Chromium installed.
// PREVIEW_URL=http://127.0.0.1:5187 QA_DIR=/tmp/course-map node tests/browser-course-map.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),path=require('node:path');
const {chromium}=require('playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{
 const {courseBranches,workNodes,connections}=await import(pathToFileURL(path.join(__dirname,'../src/content/course-map.mjs')));
 const {sectionById}=await import(pathToFileURL(path.join(__dirname,'../src/content/portfolio.mjs')));
 const courses=sectionById.courses.items,byId=Object.fromEntries(courses.map(course=>[course.id,course]));
 const base=(process.env.PREVIEW_URL||'http://127.0.0.1:5187').replace(/\/$/,''),out=process.env.QA_DIR||'/tmp/course-map-acceptance';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1536,height:1024},reducedMotion:'reduce'});
 await context.route('https://fonts.googleapis.com/**',route=>route.abort());
 const page=await context.newPage(),checks=[],errors=[];const pass=name=>{checks.push(name);console.log('PASS '+name);};
 const listen=tab=>{tab.on('pageerror',error=>errors.push(error.message));tab.on('console',message=>{if(['warning','error'].includes(message.type())&&!/fonts.googleapis|ERR_FAILED|favicon/.test(message.text()+' '+message.location().url))errors.push(message.text());});};listen(page);
 const map=page.locator('[data-course-map]'),detail=map.locator('.course-map-detail'),catalogue=map.locator('details.course-map-catalogue');
 const branch=id=>map.locator('.course-map-branch').filter({hasText:courseBranches.find(item=>item.id===id).title}).first();
 const branchButton=id=>branch(id).locator('button[aria-expanded]').first();
 const course=id=>map.locator('.course-map-course[data-course-id="'+id+'"]');
 const work=id=>map.locator('.course-map-work[data-work-id="'+id+'"]');
 const expectedWorks=id=>[...new Set(connections.filter(link=>link.courseId===id).map(link=>link.workId))].sort();
 const expectedCourses=id=>[...new Set(connections.filter(link=>link.workId===id).map(link=>link.courseId))].sort();
 async function ready(){await map.waitFor();await page.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false,null,{timeout:60000});}
 async function shot(name){await page.screenshot({path:out+'/'+name+'.png',fullPage:true});if(name==='default-desktop')await page.screenshot({path:out+'/'+name+'-viewport.png'});}
 async function expand(id){if(await branchButton(id).getAttribute('aria-expanded')!=='true')await branchButton(id).click();}
 async function selected(id){await page.waitForFunction(id=>document.querySelector('.course-map-course[data-course-id="'+id+'"]')?.getAttribute('aria-pressed')==='true',id);assert.equal(new URL(page.url()).hash,'#'+id);}
 async function choose(id){await expand(courseBranches.find(item=>item.courseIds.includes(id)).id);await course(id).click();await selected(id);}
 async function focusedInMap(id){await page.waitForFunction(id=>{const node=document.activeElement,rect=node?.getBoundingClientRect();return node?.classList.contains('course-map-course')&&node.dataset.courseId===id&&rect.top>=0&&rect.bottom<=innerHeight+1;},id);}
 async function activeWorkIds(){return map.locator('.course-map-work[data-active="true"]').evaluateAll(nodes=>nodes.map(node=>node.dataset.workId).sort());}
 async function activeBranchIds(){const result=[];for(const item of courseBranches)if(await branch(item.id).getAttribute('data-active')==='true'||await branchButton(item.id).getAttribute('data-active')==='true')result.push(item.id);return result.sort();}
 async function pose(){return page.locator('.anatomy-canvas canvas').evaluate(canvas=>{const atlas=canvas.__atlas;return atlas?{camera:atlas.camera.position.toArray(),quaternion:atlas.camera.quaternion.toArray(),target:atlas.controls.target.toArray(),reveal:Number(document.querySelector('#reveal').value)}:null;});}
 async function twoFrames(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
 const poseDelta=(before,after)=>Math.max(...['camera','quaternion','target'].flatMap(key=>before[key].map((value,index)=>Math.abs(value-after[key][index]))));
 async function samePose(before){await twoFrames();const after=await pose();if(before&&after){assert(poseDelta(before,after)<1e-7,'Map selections must not move or reset the anatomical camera');assert.equal(after.reveal,before.reveal);}}
 try{
  await page.goto(base+'/courses',{waitUntil:'domcontentloaded'});await ready();
  assert.equal(await map.locator('.course-map-branch button[aria-expanded]').count(),3);assert.equal(await map.locator('.course-map-work').count(),4);
  assert.equal(await branchButton('design').getAttribute('aria-expanded'),'true');assert.equal(await map.locator('.course-map-branch button[aria-expanded="true"]').count(),1);
  for(const id of ['introduction-engineering-hands-on','engineering-design-refugee-health']){assert(await course(id).isVisible());assert.match(await course(id).innerText(),new RegExp(byId[id].subtitle.replace(/\s+/g,'\\s*')));}
  assert.match(await map.innerText(),/proposed/i);assert(await detail.getByRole('link',{name:/View project/i}).evaluate(element=>element.getBoundingClientRect().bottom<=innerHeight),'The default connection CTA should fit in the desktop viewport');await shot('default-desktop');pass('direct Courses entry opens only the design branch and shows both supplied design courses, three branches and four works');

  const originalPose=await pose();await branchButton('computation').click();assert.equal(await branchButton('computation').getAttribute('aria-expanded'),'true');assert.equal(await branchButton('design').getAttribute('aria-expanded'),'false');
  await branchButton('computation').click();assert.equal(await branchButton('computation').getAttribute('aria-expanded'),'false');await expand('computation');
  const ml='introduction-machine-learning';await choose(ml);assert.deepEqual(await activeWorkIds(),expectedWorks(ml));assert((await detail.innerText()).includes(byId[ml].title));assert(await map.locator('svg .course-vessel[data-active="true"]').count()>0);await samePose(originalPose);
  await shot('course-selected');pass('branch toggles are compact; selecting a course reveals its detail and both linked works without changing the atlas pose');

  for(const item of workNodes){
   await work(item.id).click();assert.equal(await work(item.id).getAttribute('aria-pressed'),'true');
   const supporting=expectedCourses(item.id),supportingBranches=courseBranches.filter(item=>item.courseIds.some(id=>supporting.includes(id))).map(item=>item.id).sort();
   assert.deepEqual(await detail.locator('[data-related-course-id]').evaluateAll(nodes=>[...new Set(nodes.map(node=>node.dataset.relatedCourseId))].sort()),supporting);
   assert.deepEqual(await activeBranchIds(),supportingBranches);assert.equal(await map.locator('.course-map-branch button[aria-expanded="true"]').count(),1);
   for(const node of await map.locator('.course-map-course:visible').all())assert.equal(await node.getAttribute('data-active')==='true',supporting.includes(await node.getAttribute('data-course-id')));
   assert(await map.locator('svg .course-vessel[data-active="true"]').count()>0);await samePose(originalPose);
  }
  await work('vascupath').click();await shot('work-selected');const hiddenSupport=expectedCourses('vascupath').find(id=>!courseBranches.find(item=>item.courseIds.includes(id)).courseIds.includes(ml));
  // Select a supporting course from the other branch, even while its branch is collapsed.
  const chipId=hiddenSupport||'molecular-cell-biology';await detail.locator('[data-related-course-id="'+chipId+'"]').click();await selected(chipId);assert.equal(await branchButton(courseBranches.find(item=>item.courseIds.includes(chipId)).id).getAttribute('aria-expanded'),'true');
  pass('work selection highlights every supporting branch, lists all related courses and lets hidden-branch course chips reopen the right branch');

  assert.equal(await catalogue.evaluate(element=>element.tagName),'DETAILS');await catalogue.locator('summary').click();assert(await catalogue.evaluate(element=>element.open));
  assert.equal(await catalogue.locator('[data-course-id]').count(),13);const unconnected='thermodynamics-statistical-mechanics';await catalogue.locator('[data-course-id="'+unconnected+'"]').click();await selected(unconnected);await focusedInMap(unconnected);assert(await course(unconnected).isVisible());assert.deepEqual(await activeWorkIds(),[]);assert((await detail.innerText()).includes(byId[unconnected].title));
  await page.reload({waitUntil:'domcontentloaded'});await ready();await selected(unconnected);assert.equal(await branchButton('biomedical').getAttribute('aria-expanded'),'true');
  await choose(ml);await choose('computational-linear-algebra');await page.goBack();await selected(ml);await page.goForward();await selected('computational-linear-algebra');
  await shot('catalogue-selection');pass('the native catalogue contains all 13 courses; an unconnected course remains browseable and hashes survive refresh and browser Back/Forward');

  await page.goto(base+'/courses?reveal=blend#engineering-design-refugee-health',{waitUntil:'domcontentloaded'});await ready();await selected('engineering-design-refugee-health');await work('threshold').click();
  const projectLink=detail.getByRole('link',{name:/View project/i});assert.equal(await projectLink.evaluate(element=>element.tagName),'A');const destination=new URL(await projectLink.getAttribute('href'),base);assert.equal(destination.pathname,'/projects');assert.equal(destination.hash,'#threshold');assert.equal(destination.search,'?reveal=blend');
  const [newTab]=await Promise.all([context.waitForEvent('page'),projectLink.click({modifiers:['Control']})]);listen(newTab);await newTab.waitForLoadState('domcontentloaded');assert.equal(new URL(newTab.url()).pathname,'/projects');assert.equal(new URL(newTab.url()).hash,'#threshold');assert.equal(new URL(newTab.url()).search,'?reveal=blend');await newTab.close();assert.equal(new URL(page.url()).pathname,'/courses');
  await projectLink.click();await page.waitForURL(url=>url.pathname==='/projects'&&url.hash==='#threshold');assert.equal(new URL(page.url()).search,'?reveal=blend');await page.goBack();await ready();assert.equal(new URL(page.url()).pathname,'/courses');assert.equal(new URL(page.url()).search,'?reveal=blend');
  pass('View project is a native modified-clickable link to the exact item, preserves reveal comparison and returns through browser history');

  await page.goto(base+'/courses',{waitUntil:'domcontentloaded'});await ready();const canvas=page.locator('.anatomy-canvas canvas');await canvas.scrollIntoViewIfNeeded();let before=await pose();const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.65);await page.mouse.down();await page.mouse.move(box.x+box.width*.55+65,box.y+box.height*.65+10,{steps:8});await page.mouse.up();
  if(before)await page.waitForFunction(before=>{const now=document.querySelector('.anatomy-canvas canvas').__atlas.camera.position.toArray();return now.some((value,index)=>Math.abs(value-before.camera[index])>.001);},before);
  await canvas.focus();await page.keyboard.press('+');await twoFrames();const after=await pose();if(before&&after)assert.notDeepEqual(after.camera,before.camera);
  await canvas.focus();await page.keyboard.press('ArrowLeft');await twoFrames();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await twoFrames();
  // Clicking a course should stop neither normal orbit controls nor the native wheel listener.
  before=await pose();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.65);await page.mouse.wheel(0,-100);await twoFrames();if(before)assert.notDeepEqual((await pose()).camera,before.camera);
  // Reset uses the existing engine's inertia drain, so residual drag damping is not mistaken for a map-triggered flight.
  await page.getByRole('button',{name:'Reset view and layers',exact:true}).click();await twoFrames();assert.equal(await page.locator('#reveal').inputValue(),'0');const resetPose=await pose();await choose(ml);await samePose(resetPose);await choose('engineering-design-refugee-health');await samePose(resetPose);
  pass('the original atlas retains pointer orbit, wheel, keyboard and visible zoom controls; course selection leaves its pose untouched');

  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.goto(base+'/courses',{waitUntil:'domcontentloaded'});await ready();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await map.evaluate(element=>element.scrollWidth<=element.clientWidth+1));
   await work('threshold').click();await shot('mobile-'+width);for(const node of await map.locator('button:visible,summary:visible,a:visible').all())assert(await node.evaluate(element=>element.getBoundingClientRect().height>=43.9),'Visible course controls require 44px touch height');
   await expand('computation');await course(ml).click();await selected(ml);assert.deepEqual(await activeWorkIds(),expectedWorks(ml));
   const mapBox=await map.boundingBox();assert(mapBox.width<=width+1);assert.equal(await canvas.evaluate(element=>getComputedStyle(element).touchAction),'pan-y');
   const summary=catalogue.locator('summary');await summary.click();await catalogue.locator('[data-course-id="'+unconnected+'"]').click();await selected(unconnected);await focusedInMap(unconnected);assert(await course(unconnected).isVisible());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('mobile-catalogue-'+width);
  }
  assert.equal(await map.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.effect.getTiming().iterations===Infinity).length),0);
  pass('390px and 320px layouts fit without horizontal overflow, keep 44px controls and native mobile scrolling, and honor reduced motion without looping vessel animation');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
 }catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});fs.writeFileSync(out+'/report.json',JSON.stringify({checks,errors,failure:error.stack},null,2));throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
