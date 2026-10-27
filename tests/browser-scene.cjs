// Focused full-motion check: manual input must interrupt a section camera move.
const assert=require('node:assert/strict');const {chromium}=require('playwright');const sharp=require('sharp');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'no-preference'});await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!document.querySelector('#reveal')?.disabled);
 await page.getByRole('button',{name:'Pause rotation'}).click();
 await page.getByRole('link',{name:'Explore the atlas',exact:true}).click();
 const canvas=page.locator('canvas');const image=()=>canvas.screenshot({style:'.model-markers{visibility:hidden!important}'});
 async function difference(a,b){const x=await sharp(a).removeAlpha().raw().toBuffer(),y=await sharp(b).removeAlpha().raw().toBuffer();assert.equal(x.length,y.length);let total=0;for(let i=0;i<x.length;i++)total+=Math.abs(x[i]-y[i]);return total/x.length;}
 await page.getByRole('link',{name:/^Open Projects —/}).click();await canvas.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(1000);const manual=await image();await page.waitForTimeout(400);assert(await difference(manual,await image())<.3,'Camera continued moving after manual interruption');
 await page.getByRole('link',{name:/^Open Projects —/}).click();await page.waitForTimeout(1300);const preset=await image();assert(await difference(manual,preset)>1,'Manual orbit should differ from the restored section preset');
 const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:8});await page.mouse.up();await page.waitForTimeout(900);const orbit=await image();assert(await difference(preset,orbit)>1);
 await page.mouse.wheel(0,-180);await page.waitForTimeout(800);assert(await difference(orbit,await image())>1);
 await page.getByRole('button',{name:'Reset view and layers'}).click();assert.equal(await page.locator('#reveal').inputValue(),'0');
 console.log('Full-motion camera interruption, section reselect, pointer orbit, wheel zoom and full reset passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
