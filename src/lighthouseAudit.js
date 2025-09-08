import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer';

export async function lighthouseAudit(url) {
  // Always use Puppeteer’s bundled Chromium in cloud/CI (Render, GitHub Actions)
  const chromePath = puppeteer.executablePath();

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

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: [
      'performance',
      'accessibility',
      'best-practices',
      'seo',
      'pwa'
    ],
    port: chrome.port
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  const lhr = runnerResult.lhr;

  return {
    scores: {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100),
      pwa: Math.round((lhr.categories.pwa?.score || 0) * 100)
    },
    timings: {
      firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue || null,
      speedIndex: lhr.audits['speed-index']?.numericValue || null,
      largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue || null,
      timeToInteractive: lhr.audits['interactive']?.numericValue || null,
      totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || null,
      cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue || null
    }
  };
}
