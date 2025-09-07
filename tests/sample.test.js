// Placeholder for any custom rule tests you want to run with Puppeteer directly.
// This project uses programmatic audits instead, but you can extend it.
module.exports = [
  {
    name: 'placeholder',
    fn: async ({ page, url }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return { ok: true };
    }
  }
];
