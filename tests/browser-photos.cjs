// Optional acceptance: run Vite, then node tests/browser-photos.cjs.
// Temporary local images and content fixtures are removed; no sample photos ship.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{
 const base=process.env.PREVIEW_URL||'http://127.0.0.1:5173',out=process.env.QA_DIR||'/tmp/atlas-photo-qa';fs.mkdirSync(out,{recursive:true});
 const dir=fs.mkdtempSync(path.join(__dirname,'../public/photos/.qa-'));
 const photoUrl='/photos/'+path.basename(dir);
 for(const [name,w,h,color] of [['landscape',1000,600,'#263f5c'],['portrait',600,1000,'#563035']]){
  fs.writeFileSync(path.join(dir,name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-family="sans-serif" font-size="32">${name} QA fixture</text></svg>`);
 }
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
  await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  await context.route('**/src/content/portfolio.mjs*',async route=>{
   const response=await route.fetch();
   const photos=[{src:photoUrl+'/landscape.svg',alt:'Landscape test image',caption:'Landscape QA fixture; not portfolio content.'},{src:photoUrl+'/portrait.svg',alt:'Portrait test image',caption:'Portrait QA fixture; full frame retained.'}];
   await route.fulfill({response,body:await response.text()+`\nfor(const section of sections)for(const item of section.items)item.photos=[];sectionById.projects.items.find(i=>i.id==='symptomai').photos=${JSON.stringify(photos)};sectionById.awards.items[0].title='Health and Biotech Hack';sectionById.awards.items[0].photos=${JSON.stringify(photos.slice(1))};`});
  });
  const page=await context.newPage(),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().includes(photoUrl))assert.equal(r.status(),200);});
  async function ready(){await page.waitForFunction(()=>document.querySelector('#reveal')?.disabled===false,null,{timeout:60000});}
  async function photoReady(){await page.waitForFunction(()=>[...document.querySelectorAll('#symptomai .entry-photos img:first-child, #health-biotech-hack .entry-photos img:first-child')].some(i=>i.complete&&i.naturalWidth>0));}
  await page.goto(base+'/projects#symptomai');await ready();await photoReady();
  const gallery=page.getByRole('group',{name:'SymptomAI photos'});
  assert.equal(await page.locator('.entry-photos').count(),1,'Empty arrays must render no gallery');
  assert.equal(await gallery.locator('img').first().getAttribute('loading'),'lazy');
  assert.equal(await gallery.locator('img').last().evaluate(i=>getComputedStyle(i).objectFit),'contain');
  assert(Math.abs((await gallery.locator('.photo-frame').first().boundingBox()).width-(await gallery.locator('.photo-track').boundingBox()).width)<1);
  assert(await gallery.getByRole('button',{name:'Previous SymptomAI photo'}).isDisabled());
  await gallery.locator('.photo-toolbar').scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>({body:scrollY,reader:document.querySelector('.item-reader').scrollTop,reveal:document.querySelector('#reveal').value}));
  const canvasBefore=await page.locator('canvas').screenshot();
  await gallery.getByRole('button',{name:'Next SymptomAI photo'}).click();
  await page.waitForFunction(()=>document.querySelector('.photo-toolbar>span').textContent==='2 / 2');
  await page.waitForFunction(()=>{const i=document.querySelector('#symptomai .entry-photo:last-child img');return i.complete&&i.naturalWidth>0;});
  assert(await gallery.getByRole('button',{name:'Next SymptomAI photo'}).isDisabled());
  assert.equal(await gallery.locator('img').last().getAttribute('alt'),'Portrait test image');
  assert.equal(await gallery.locator('.photo-frame').last().getAttribute('target'),'_blank');
  assert.equal(await gallery.locator('.photo-frame').last().getAttribute('href'),photoUrl+'/portrait.svg');
  assert.deepEqual(await page.evaluate(()=>({body:scrollY,reader:document.querySelector('.item-reader').scrollTop,reveal:document.querySelector('#reveal').value})),before);
  assert((await page.locator('canvas').screenshot()).equals(canvasBefore),'Photo navigation changed the scene');
  await gallery.getByRole('button',{name:'Previous SymptomAI photo'}).click();
  await page.waitForFunction(()=>document.querySelector('.photo-toolbar>span').textContent==='1 / 2');
  const track=gallery.locator('.photo-track');await track.focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.photo-toolbar>span').textContent==='2 / 2');
  await page.waitForFunction(()=>{const t=document.querySelector('.photo-track');return Math.abs(t.scrollLeft-(t.scrollWidth-t.clientWidth))<1;});
  await page.screenshot({path:out+'/projects-desktop.png'});
  checks.push('Data-only multiple-photo entry; real static-file loading, alt/caption, lazy decoding, Previous/Next and keyboard browsing; page/reader/camera unchanged');
  await page.setViewportSize({width:320,height:800});
  await gallery.scrollIntoViewIfNeeded();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const frame=await gallery.locator('.photo-frame').first().boundingBox();assert(frame.width<320&&frame.height>100);
  for(const b of await gallery.locator('button').all())assert((await b.boundingBox()).height>=44);
  await page.screenshot({path:out+'/projects-320.png'});
  checks.push('320px layout has no page overflow and retains 44px photo controls');
  await page.goto(base+'/awards');await ready();await photoReady();
  const award=page.getByRole('group',{name:'Health and Biotech Hack photos'});
  assert.equal(await award.locator('img').count(),1);assert.equal(await award.locator('.photo-toolbar').count(),0);
  assert.equal(await page.locator('.entry-photos').count(),1);
  await page.screenshot({path:out+'/award-single-320.png'});
  await page.getByRole('link',{name:/02 UROP Symposium/}).click();
  await page.waitForFunction(()=>document.querySelector('.item-index [aria-current]')?.hash==='#urop-poster');
  checks.push('Single award photo has no unnecessary gallery controls; text-only awards and item navigation remain intact');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
 }finally{await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
