const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
require('node:fs').mkdirSync('audit-captures',{recursive:true});
const base = process.env.TEST_URL || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch({channel:'msedge'});
  const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  for (const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),`Overflow at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('.render-tile').first().click();
  assert.equal(await page.locator('.render-tile').first().getAttribute('aria-pressed'),'true');
  await page.locator('.render-tile').nth(1).click();
  assert.equal(await page.locator('.render-tile').nth(1).getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>scrollTo(0,0));
  await page.getByRole('button',{name:'进入空间漫游',exact:true}).focus();
  await page.waitForLoadState('networkidle');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:512*1024,uploadThroughput:512*1024});
  await page.getByRole('button',{name:'进入空间漫游',exact:true}).click();
  await page.waitForTimeout(3000);
  const progress=await page.getByRole('progressbar').getAttribute('value');
  assert(Number(progress)>0 && Number(progress)<100,`Real byte progress: ${progress}`);
  await page.screenshot({path:'audit-captures/slow-mobile-after.png'});
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'返回浏览图文');
  await page.waitForTimeout(12500);
  assert((await page.locator('.scene-welcome__note').textContent()).includes('等待较久'));
  await page.getByRole('button',{name:'返回浏览图文',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'detached'});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await page.getByRole('button',{name:'进入空间漫游',exact:true}).click();
  await page.locator('.scene-welcome.is-ready').waitFor({state:'attached',timeout:60000});
  await page.waitForTimeout(700);
  await page.screenshot({path:'audit-captures/scene-mobile-after.png'});
  await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
  for (const img of await page.locator('img').all()) {
    if (await img.isVisible()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(i=>i.decode()); }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: 4 viewport widths, mobile gallery selection, real slow-network progress, slow hint, loading focus trap, close/reopen during download, all displayed images decode.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
