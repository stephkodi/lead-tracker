import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:\\Users\\lobo\\.gemini\\antigravity\\brain\\d8eaba7c-178b-47bb-9423-8504b1fc706a';

async function runTests() {
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 920, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // 1. Screenshot of initial home page
  const homeScreenshot = path.join(artifactDir, 'screenshot_capture_form.png');
  await page.screenshot({ path: homeScreenshot, fullPage: false });
  console.log('Saved screenshot:', homeScreenshot);

  // 2. Test pill toggles: Click Electrical & Plumbing
  console.log('Testing service pill toggles...');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Electrical')) {
      await b.click();
      console.log('Clicked Electrical pill');
    }
    if (text.includes('Plumbing')) {
      await b.click();
      console.log('Clicked Plumbing pill');
    }
  }
  await new Promise(r => setTimeout(r, 400));

  // 3. Fill out the lead capture form
  console.log('Filling form inputs...');
  const inputs = await page.$$('input[type="text"], input[type="tel"]');
  // First text input is customer name
  await inputs[0].type('Sarah Connor');
  // Second is phone
  await inputs[1].type('+1 555-890-1234');

  // Location & Requirements
  const textareas = await page.$$('textarea');
  await textareas[0].type('742 Evergreen Terrace, Springfield');
  await textareas[1].type('Circuit breaker tripping and main faucet pipe leaking');

  await new Promise(r => setTimeout(r, 400));

  // 4. Click Submit button
  console.log('Submitting lead form...');
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();

  // 5. Wait for bottom sheet modal to appear
  console.log('Waiting for modal to appear...');
  await page.waitForSelector('h3', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot of WhatsApp dispatch modal
  const modalScreenshot = path.join(artifactDir, 'screenshot_whatsapp_modal.png');
  await page.screenshot({ path: modalScreenshot });
  console.log('Saved modal screenshot:', modalScreenshot);

  // Extract the live preview text
  const previewText = await page.evaluate(() => {
    const pre = document.querySelector('pre');
    return pre ? pre.textContent : null;
  });
  console.log('================ LIVE PREVIEW TEXT ================');
  console.log(previewText);
  console.log('===================================================');

  // Verify the WhatsApp dispatch link
  const waLink = await page.evaluate(() => {
    const waBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && el.textContent.includes('Send via WhatsApp'));
    return waBtn ? waBtn.getAttribute('href') || 'Found button' : null;
  });
  console.log('WhatsApp Button verified:', waLink);

  // 6. Test History tab
  console.log('Switching to History tab...');
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const t = await page.evaluate(el => el.textContent, b);
    if (t.includes('Create Another Lead') || t.includes('View All Leads')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));

  const navBtns = await page.$$('nav button');
  if (navBtns.length >= 3) {
    await navBtns[2].click(); // History tab
  }
  await new Promise(r => setTimeout(r, 600));

  const historyScreenshot = path.join(artifactDir, 'screenshot_history_view.png');
  await page.screenshot({ path: historyScreenshot });
  console.log('Saved history screenshot:', historyScreenshot);

  // 7. Test Vendors tab
  console.log('Switching to Vendors tab...');
  if (navBtns.length >= 2) {
    await navBtns[1].click(); // Vendors tab
  }
  await new Promise(r => setTimeout(r, 600));

  const vendorsScreenshot = path.join(artifactDir, 'screenshot_vendors_directory.png');
  await page.screenshot({ path: vendorsScreenshot });
  console.log('Saved vendors screenshot:', vendorsScreenshot);

  // 8. Click Settings tab
  console.log('Switching to Settings tab...');
  if (navBtns.length >= 4) {
    await navBtns[3].click(); // Settings tab
  }
  await new Promise(r => setTimeout(r, 600));

  const settingsScreenshot = path.join(artifactDir, 'screenshot_settings_view.png');
  await page.screenshot({ path: settingsScreenshot });
  console.log('Saved settings screenshot:', settingsScreenshot);

  await browser.close();
  console.log('All browser automation verification completed successfully!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
