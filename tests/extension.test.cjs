const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const extension = path.resolve(__dirname, '../extension');
const fixture = `<!doctype html><html><head><meta charset="utf-8"><title>Amazon layout fixture</title><style>
body{font:16px system-ui;margin:0;background:#f1f5f9;color:#172033}nav{padding:20px;background:#131921;color:white;display:flex;gap:60px}a{color:inherit;text-decoration:none}main{padding:30px}.nav-line-1{font-size:12px}.nav-line-2{font-weight:bold}article{background:white;padding:28px;border-radius:12px;margin:24px 0}button{padding:10px}
</style></head><body><nav><strong>amazon</strong><a id="nav-global-location-popover-link" href="#"><span id="glow-ingress-line1">Deliver to Demo Customer</span><br><span id="glow-ingress-line2">Example City AB1 2CD</span></a><a id="nav-link-accountList" href="#"><span class="nav-line-1">Hello, Demo Customer</span><br><span class="nav-line-2">Account &amp; Lists</span></a><span>Returns &amp; Orders</span></nav><main><h1>Amazon Privacy Shield — demo</h1><div id="contextualIngressPt"><span id="contextualIngressPtLabel">Deliver to Demo Customer - Example City AB1 2CD</span></div><article><h2>Example product</h2><p id="product-description">Product information stays visible.</p><button id="add-to-cart">Add to basket</button></article><p id="uncovered">Order-history details are outside the supported coverage.</p><div id="GLUXAddressList"><span style="visibility:visible">Demo Customer, 1 Example Street, AB1 2CD</span></div></main></body></html>`;
const options = { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`], viewport: { width: 1100, height: 660 } };
const route = ctx => ctx.route('https://**/*', r => r.fulfill({ contentType: 'text/html', body: fixture }));
const visibility = (tab, sel) => tab.locator(sel).evaluate(el => getComputedStyle(el).visibility);
const state = (tab, key, value) => tab.waitForFunction(({key,value}) => document.documentElement.getAttribute(key) === value, {key,value});
test('real extension: protection, toggles, dynamic UI, multiple tabs, blur, restart, site scope', async () => {
 const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'amazon-shield-test-')); let ctx;
 try {
  ctx = await chromium.launchPersistentContext(profile, options); await route(ctx);
  const worker = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const page = await ctx.newPage(), second = await ctx.newPage();
  await page.goto('https://www.amazon.co.uk/dp/example'); await second.goto('https://www.amazon.com/dp/example');
  for (const sel of ['#glow-ingress-line1','#glow-ingress-line2','#contextualIngressPtLabel','#nav-link-accountList .nav-line-1','#GLUXAddressList span']) assert.equal(await visibility(page,sel),'hidden',sel);
  assert.equal(await visibility(page,'#nav-link-accountList .nav-line-2'),'visible');
  assert.equal(await visibility(page,'#product-description'),'visible'); await page.locator('#add-to-cart').click();
  await page.evaluate(() => { document.getElementById('contextualIngressPt').remove(); const e=document.createElement('div'); e.id='contextualIngressPtLabel'; e.textContent='Deliver to Another Demo Customer'; document.querySelector('main').append(e); });
  assert.equal(await visibility(page,'#contextualIngressPtLabel'),'hidden');
  const popup=await ctx.newPage(); await popup.goto(`chrome-extension://${id}/popup.html`); await popup.locator('#enabled:enabled').waitFor();
  assert.equal(await popup.locator('#enabled').isChecked(),true);
  await popup.locator('#enabled').uncheck();
  await state(page,'data-amazon-privacy-shield','off'); await state(second,'data-amazon-privacy-shield','off');
  assert.equal(await visibility(page,'#glow-ingress-line1'),'visible'); assert.equal(await visibility(page,'#GLUXAddressList span'),'visible');
  await page.reload(); await state(page,'data-amazon-privacy-shield','off'); assert.equal(await visibility(page,'#glow-ingress-line2'),'visible');
  assert.equal(await worker.evaluate(() => chrome.action.getBadgeText({})),'OFF');
  await popup.locator('#enabled:enabled').waitFor(); await popup.locator('#enabled').check(); await popup.locator('#style:enabled').waitFor(); await popup.locator('#style').selectOption('blur');
  await state(page,'data-amazon-privacy-style','blur');
  assert.equal(await page.locator('#glow-ingress-line1').evaluate(el=>getComputedStyle(el).filter),'blur(9px)');
  assert.equal(await page.locator('#glow-ingress-line1').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  await popup.locator('#style:enabled').waitFor(); await popup.locator('#style').selectOption('hide'); await state(page,'data-amazon-privacy-style','hide');
  assert.equal(await visibility(page,'#glow-ingress-line1'),'hidden');
  await popup.reload(); await popup.locator('#enabled:enabled').waitFor(); assert.equal(await popup.locator('#style').inputValue(),'hide');
  assert.equal(await worker.evaluate(() => chrome.action.getBadgeText({})),'ON');
  const unrelated=await ctx.newPage(); await unrelated.goto('https://example.org/'); assert.equal(await visibility(unrelated,'#glow-ingress-line1'),'visible'); assert.equal(await unrelated.locator('html').getAttribute('data-amazon-privacy-shield'),null);
  if(process.env.SHIELD_DEMO_DIR){await fs.mkdir(process.env.SHIELD_DEMO_DIR,{recursive:true}); await page.screenshot({path:path.join(process.env.SHIELD_DEMO_DIR,'protected.png')}); await popup.locator('body').screenshot({path:path.join(process.env.SHIELD_DEMO_DIR,'popup.png')});}
  await ctx.close(); ctx=null; ctx=await chromium.launchPersistentContext(profile,options); await route(ctx);
  const reopened=await ctx.newPage(); await reopened.goto('https://www.amazon.co.uk/'); assert.equal(await visibility(reopened,'#glow-ingress-line1'),'hidden');
 } finally {if(ctx)await ctx.close(); await fs.rm(profile,{recursive:true,force:true});}
});
test('manifest is least-privilege and installable files exist', async () => {
 const manifest=JSON.parse(await fs.readFile(path.join(extension,'manifest.json')));
 assert.equal(manifest.manifest_version,3); assert.deepEqual(manifest.permissions,['storage']); assert.equal(manifest.content_scripts[0].run_at,'document_start');
 assert.ok(manifest.content_scripts[0].matches.includes('https://*.amazon.co.uk/*'));
 for(const f of [...manifest.content_scripts[0].css,...manifest.content_scripts[0].js,manifest.background.service_worker,manifest.action.default_popup,...Object.values(manifest.icons)]) assert.ok((await fs.stat(path.join(extension,f))).isFile(),f);
});
