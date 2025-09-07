import puppeteer from 'puppeteer';

export async function puppeteerAudit(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

  const metrics = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    const transfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const reqCount = resources.length;

    // DOM depth
    let maxDepth = 0;
    (function dive(node, depth) {
      if (!node) return;
      if (depth > maxDepth) maxDepth = depth;
      Array.from(node.children || []).forEach(c => dive(c, depth + 1));
    })(document.body, 1);

    // images without alt
    const images = Array.from(document.images || []);
    const imagesWithoutAlt = images.filter(img => !(img.hasAttribute('alt') && img.getAttribute('alt').trim().length)).length;

    // inline scripts/styles count
    const scripts = Array.from(document.scripts || []);
    const inlineScripts = scripts.filter(s => !s.src).length;
    const styles = Array.from(document.querySelectorAll('style'));
    const inlineStyleTags = styles.length;

    return {
      title: document.title || '',
      requestCount: reqCount,
      transferKB: +(transfer / 1024).toFixed(2),
      domDepth: maxDepth,
      imageCount: images.length,
      imagesWithoutAlt,
      scriptCount: scripts.length,
      inlineScripts,
      styleTagCount: inlineStyleTags
    };
  });

  // Response time metrics
  const perf = await page.metrics();
  metrics.TaskDuration = perf.TaskDuration;
  metrics.JSHeapUsedSize = perf.JSHeapUsedSize;

  await page.close();
  await browser.close();
  return metrics;
}
