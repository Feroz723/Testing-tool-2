export const defaultThresholds = {
  maxRequests: 200,
  maxTransferKB: 4000,
  maxDomDepth: 60,
  maxImagesWithoutAlt: 0,
  minLighthousePerformance: 60,
  minAccessibility: 70
};

export function applyThresholds(result, thresholds = defaultThresholds) {
  const t = { ...defaultThresholds, ...thresholds };
  const fails = [];

  if (result.puppeteer.requestCount > t.maxRequests) fails.push({ key: 'maxRequests', actual: result.puppeteer.requestCount, limit: t.maxRequests });
  if (result.puppeteer.transferKB > t.maxTransferKB) fails.push({ key: 'maxTransferKB', actual: result.puppeteer.transferKB, limit: t.maxTransferKB });
  if (result.puppeteer.domDepth > t.maxDomDepth) fails.push({ key: 'maxDomDepth', actual: result.puppeteer.domDepth, limit: t.maxDomDepth });
  if (result.puppeteer.imagesWithoutAlt > t.maxImagesWithoutAlt) fails.push({ key: 'maxImagesWithoutAlt', actual: result.puppeteer.imagesWithoutAlt, limit: t.maxImagesWithoutAlt });

  if ((result.lighthouse?.scores?.performance ?? 0) < t.minLighthousePerformance) {
    fails.push({ key: 'minLighthousePerformance', actual: result.lighthouse?.scores?.performance ?? 0, limit: t.minLighthousePerformance });
  }
  if ((result.lighthouse?.scores?.accessibility ?? 0) < t.minAccessibility) {
    fails.push({ key: 'minAccessibility', actual: result.lighthouse?.scores?.accessibility ?? 0, limit: t.minAccessibility });
  }

  return {
    url: result.url,
    passed: fails.length === 0,
    fails
  };
}
