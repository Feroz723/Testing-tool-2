import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

export async function lighthouseAudit(url) {
  // Launch bundled Chromium with Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-zygote',
      '--single-process',
      '--remote-debugging-port=9222'
    ]
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: 9222 // connect Lighthouse to Puppeteer's debugging port
  };

  const runnerResult = await lighthouse(url, options);
  const lhr = runnerResult.lhr;

  await browser.close();

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
