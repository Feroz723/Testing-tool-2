import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runFlowsForUrl(url, flowsDir = path.join(__dirname, '..', 'tests', 'flows')) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const results = [];

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // load flow files
  if (!fs.existsSync(flowsDir)) {
    await browser.close();
    return { runs: [], note: 'no flows directory' };
  }

  const files = fs.readdirSync(flowsDir).filter(f => f.endsWith('.test.js') || f.endsWith('.mjs') || f.endsWith('.js'));
  for (const file of files) {
    const p = path.join(flowsDir, file);
    try {
      // dynamic import - convert to file:// URL
      const mod = await import('file://' + p);
      const flow = mod.default || mod.run || mod;
      if (typeof flow !== 'function') {
        results.push({ file, status: 'skipped', error: 'no default function exported' });
        continue;
      }
      // Each flow receives (page, url)
      const start = Date.now();
      await page.goto(url, { waitUntil: 'networkidle' , timeout: 120000});
      const res = await flow(page, url);
      const duration = Date.now() - start;
      results.push({ file, status: 'passed', result: res || true, duration });
    } catch (err) {
      // Capture screenshot for failed tests
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(screenshotsDir, `${file}-${timestamp}.png`);
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch (screenshotErr) {
        console.log('Failed to capture screenshot:', screenshotErr.message);
      }
      
      results.push({ 
        file, 
        status: 'failed', 
        error: (err && err.message) ? err.message : String(err),
        screenshot: fs.existsSync(screenshotPath) ? `screenshots/${path.basename(screenshotPath)}` : null
      });
    }
  }

  await page.close();
  await context.close();
  await browser.close();
  return { runs: results };
}
