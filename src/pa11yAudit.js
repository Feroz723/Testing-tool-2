import pa11y from 'pa11y';

export async function pa11yAudit(url) {
  try {
    const res = await pa11y(url, { standard: 'WCAG2AA', timeout: 120000 });
    const issues = res.issues || [];
    return {
      issueCount: issues.length,
      examples: issues.slice(0, 10).map(i => ({
        code: i.code, message: i.message, selector: i.selector, context: i.context
      }))
    };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}
