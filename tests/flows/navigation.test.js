export default async function navigationFlow(page, baseUrl) {
  const results = [];
  const pagesChecked = [];
  
  // Get the base URL origin for filtering internal links
  const baseUrlObj = new URL(baseUrl);
  const baseOrigin = baseUrlObj.origin;
  
  // Start from homepage
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  
  // Collect all internal links from homepage
  const anchors = await page.$$eval('a[href]', (els, baseOrigin) => els.map(a => ({
    href: a.href,
    text: a.textContent?.trim() || '',
    selector: a.className || a.id || 'unnamed-link'
  })).filter(a => a.href && a.href.startsWith(baseOrigin)), baseOrigin);
  
  // Remove duplicates and limit to reasonable number
  const uniqueLinks = [...new Map(anchors.map(link => [link.href, link])).values()].slice(0, 15);
  
  for (const link of uniqueLinks) {
    try {
      const res = await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = res.status ? res.status() : null;
      
      // Check if page loaded successfully
      if (status && status >= 200 && status < 400) {
        // Get page title
        const title = await page.title();
        
        // Check for navigation elements on this page
        const headerNav = await page.$$eval('header nav, .header nav, nav', navs => 
          navs.map(nav => ({
            found: true,
            links: Array.from(nav.querySelectorAll('a')).map(a => ({
              text: a.textContent?.trim() || '',
              href: a.href,
              working: true // Assume working if we can find it
            }))
          }))
        );
        
        const footerNav = await page.$$eval('footer nav, .footer nav', navs => 
          navs.map(nav => ({
            found: true,
            links: Array.from(nav.querySelectorAll('a')).map(a => ({
              text: a.textContent?.trim() || '',
              href: a.href,
              working: true
            }))
          }))
        );
        
        pagesChecked.push({
          url: link.href,
          title: title,
          status: status,
          linkText: link.text,
          headerNav: headerNav.length > 0 ? headerNav[0] : { found: false, links: [] },
          footerNav: footerNav.length > 0 ? footerNav[0] : { found: false, links: [] }
        });
      }
      
      results.push({ 
        href: link.href, 
        text: link.text,
        status: status,
        working: status && status >= 200 && status < 400
      });
    } catch (err) {
      results.push({ 
        href: link.href, 
        text: link.text,
        error: err.message,
        working: false
      });
    }
  }
  
  return { 
    checked: uniqueLinks.length, 
    results: results,
    pagesChecked: pagesChecked,
    summary: {
      totalLinks: uniqueLinks.length,
      workingLinks: results.filter(r => r.working).length,
      brokenLinks: results.filter(r => !r.working).length,
      pagesWithHeaderNav: pagesChecked.filter(p => p.headerNav.found).length,
      pagesWithFooterNav: pagesChecked.filter(p => p.footerNav.found).length
    }
  };
}

