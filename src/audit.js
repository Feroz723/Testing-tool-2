import { puppeteerAudit } from './puppeteerAudit.js';
import { lighthouseAudit } from './lighthouseAudit.js';
import { pa11yAudit } from './pa11yAudit.js';
import { applyThresholds, defaultThresholds } from './thresholds.js';
import { nanoid } from './utils.js';
import { runFlowsForUrl } from './flowsRunner.js';

export async function auditAll(urls, thresholdsOverride = {}) {
  const id = nanoid();
  const startedAt = new Date().toISOString();
  const results = [];

  for (const url of urls) {
    const [pp, lh, p11y] = await Promise.all([
      puppeteerAudit(url),
      lighthouseAudit(url),
      pa11yAudit(url)
    ]);

    // run E2E flows (Playwright)
    let flows = { runs: [], note: 'no flows run' };
    try {
      flows = await runFlowsForUrl(url);
    } catch (err) {
      flows = { error: err.message || String(err) };
    }

    const combined = {
      url,
      puppeteer: pp,
      lighthouse: lh,
      pa11y: p11y,
      flows
    };
    results.push(combined);
  }

  const thresholds = { ...defaultThresholds, ...thresholdsOverride };
  const verdicts = results.map(r => applyThresholds(r, thresholds));

  return {
    id,
    startedAt,
    finishedAt: new Date().toISOString(),
    thresholds,
    results,
    verdicts
  };
}
