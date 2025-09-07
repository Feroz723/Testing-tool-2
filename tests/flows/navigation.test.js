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
        
        // Check for navigation elements on this page - improved for WordPress and modern sites
        const navigationData = await page.$$eval(`
          header, .header, .site-header, .main-header, .top-header,
          nav, .nav, .navigation, .main-nav, .primary-nav, .menu,
          .navbar, .nav-menu, .main-menu, .primary-menu,
          .wp-block-navigation, .wp-block-site-title, .wp-block-site-tagline,
          .elementor-nav-menu, .elementor-menu, .elementor-navbar,
          .wpr-menu, .wpr-nav, .wpr-header,
          footer, .footer, .site-footer, .main-footer, .bottom-footer,
          .wp-block-group, .wp-block-columns, .wp-block-column,
          .elementor-section, .elementor-widget, .elementor-container,
          .quick-links, .footer-links, .bottom-links, .site-links
        `, elements => {
          const headerNav = { found: false, links: [] };
          const footerNav = { found: false, links: [] };
          
          elements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            const className = el.className.toLowerCase();
            const id = el.id ? el.id.toLowerCase() : '';
            
            // Determine if this is a header or footer element
            const isHeader = tagName === 'header' || 
                           className.includes('header') || 
                           className.includes('nav') || 
                           className.includes('menu') ||
                           className.includes('navbar') ||
                           className.includes('elementor-nav') ||
                           className.includes('wp-block-navigation') ||
                           id.includes('header') || 
                           id.includes('nav') || 
                           id.includes('menu');
                           
            const isFooter = tagName === 'footer' || 
                           className.includes('footer') || 
                           className.includes('bottom') ||
                           className.includes('site-footer') ||
                           className.includes('main-footer') ||
                           className.includes('quick-links') ||
                           className.includes('footer-links') ||
                           className.includes('bottom-links') ||
                           className.includes('site-links') ||
                           id.includes('footer') ||
                           id.includes('bottom') ||
                           id.includes('quick-links');
            
            // Find all links in this element
            const links = Array.from(el.querySelectorAll('a')).map(a => ({
              text: a.textContent?.trim() || '',
              href: a.href,
              working: true
            })).filter(link => link.text && link.href);
            
            // Assign to appropriate navigation
            if (isHeader && links.length > 0) {
              headerNav.found = true;
              headerNav.links = [...headerNav.links, ...links];
            }
            
            if (isFooter && links.length > 0) {
              footerNav.found = true;
              footerNav.links = [...footerNav.links, ...links];
            }
          });
          
          // Remove duplicate links
          const uniqueHeaderLinks = [...new Map(headerNav.links.map(link => [link.href, link])).values()];
          const uniqueFooterLinks = [...new Map(footerNav.links.map(link => [link.href, link])).values()];
          
          // Fallback: If no footer found, look for links in the bottom 30% of the page
          if (!footerNav.found) {
            const pageHeight = document.body.scrollHeight;
            const bottomThreshold = pageHeight * 0.7; // Bottom 30% of page
            
            const allLinks = Array.from(document.querySelectorAll('a'));
            const bottomLinks = allLinks.filter(link => {
              const rect = link.getBoundingClientRect();
              const elementTop = window.pageYOffset + rect.top;
              return elementTop > bottomThreshold && link.textContent?.trim();
            }).map(link => ({
              text: link.textContent?.trim() || '',
              href: link.href,
              working: true
            })).filter(link => link.text && link.href);
            
            if (bottomLinks.length > 0) {
              footerNav.found = true;
              footerNav.links = [...new Map(bottomLinks.map(link => [link.href, link])).values()];
            }
          }
          
          return {
            headerNav: {
              found: headerNav.found,
              links: uniqueHeaderLinks
            },
            footerNav: {
              found: footerNav.found,
              links: footerNav.found ? [...new Map(footerNav.links.map(link => [link.href, link])).values()] : []
            }
          };
        });
        
        pagesChecked.push({
          url: link.href,
          title: title,
          status: status,
          linkText: link.text,
          headerNav: navigationData.headerNav,
          footerNav: navigationData.footerNav
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

