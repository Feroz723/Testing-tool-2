import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer';


export async function lighthouseAudit(url) {
  // Ensure a Chromium binary exists in containerized hosts (e.g., Render)
  // Prefer CHROME_PATH if provided; otherwise use Puppeteer's bundled Chromium
  const chromePath = process.env.CHROME_PATH || puppeteer.executablePath();

  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-zygote',
      '--single-process'
    ]
  });

  const options = { logLevel: 'error', output: 'json', onlyCategories: ['performance','accessibility','best-practices','seo','pwa'], port: chrome.port };
  const runnerResult = await lighthouse(url, options);
  const lhr = runnerResult.lhr;
  await chrome.kill();

  const categories = lhr.categories;
  const audits = lhr.audits;

  return {
    scores: {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      pwa: Math.round((categories.pwa?.score || 0) * 100)
    },
    timings: {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue || null,
      speedIndex: audits['speed-index']?.numericValue || null,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || null,
      timeToInteractive: audits['interactive']?.numericValue || null,
      totalBlockingTime: audits['total-blocking-time']?.numericValue || null,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || null
    }
  };
}
