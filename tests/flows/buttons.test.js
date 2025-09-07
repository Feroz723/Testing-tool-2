export default async function buttonsFlow(page, baseUrl) {
  const results = [];
  const pagesChecked = [];
  
  // Get the base URL origin for filtering internal links
  const baseUrlObj = new URL(baseUrl);
  const baseOrigin = baseUrlObj.origin;
  
  // Start from homepage
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  
  // Collect all internal links to check buttons on each page
  const anchors = await page.$$eval('a[href]', (els, baseOrigin) => els.map(a => ({
    href: a.href,
    text: a.textContent?.trim() || ''
  })).filter(a => a.href && a.href.startsWith(baseOrigin)), baseOrigin);
  
  // Remove duplicates and limit to reasonable number
  const uniqueLinks = [...new Map(anchors.map(link => [link.href, link])).values()].slice(0, 8);
  
  for (const link of uniqueLinks) {
    try {
      const res = await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = res.status ? res.status() : null;
      
      if (status && status >= 200 && status < 400) {
        const title = await page.title();
        
        // Find all buttons on this page
        const buttons = await page.$$eval('button, input[type="button"], input[type="submit"], a[role="button"], .btn, .button', els => 
          els.map(el => ({
            tagName: el.tagName,
            type: el.type || null,
            text: el.textContent?.trim() || el.value || '',
            id: el.id || null,
            className: el.className || null,
            disabled: el.disabled || false,
            visible: el.offsetParent !== null,
            selector: el.id ? `#${el.id}` : el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase()
          }))
        );
        
        // Test clicking on first few buttons (if any)
        const clickableButtons = buttons.filter(btn => !btn.disabled && btn.visible).slice(0, 3);
        const buttonTestResults = [];
        
        for (const button of clickableButtons) {
          try {
            await page.click(button.selector, { timeout: 5000 });
            await page.waitForTimeout(1000);
            
            buttonTestResults.push({ 
              button: button.text || button.id || 'unnamed', 
              status: 'clicked', 
              selector: button.selector,
              working: true
            });
          } catch (err) {
            buttonTestResults.push({ 
              button: button.text || button.id || 'unnamed', 
              status: 'failed', 
              selector: button.selector,
              error: err.message,
              working: false
            });
          }
        }
        
        pagesChecked.push({
          url: link.href,
          title: title,
          status: status,
          linkText: link.text,
          buttonsFound: buttons.length,
          buttonsTested: clickableButtons.length,
          buttonResults: buttonTestResults
        });
      }
    } catch (err) {
      // Page failed to load
    }
  }
  
  return { 
    pagesChecked: pagesChecked,
    summary: {
      totalPages: pagesChecked.length,
      totalButtonsFound: pagesChecked.reduce((sum, page) => sum + page.buttonsFound, 0),
      totalButtonsTested: pagesChecked.reduce((sum, page) => sum + page.buttonsTested, 0),
      workingButtons: pagesChecked.reduce((sum, page) => 
        sum + page.buttonResults.filter(btn => btn.working).length, 0),
      brokenButtons: pagesChecked.reduce((sum, page) => 
        sum + page.buttonResults.filter(btn => !btn.working).length, 0)
    }
  };
}
