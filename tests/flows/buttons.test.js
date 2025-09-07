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
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Additional wait for dynamic content
        
        // Find all buttons on this page - improved detection with deduplication
        const buttons = await page.$$eval(`
          button:not([disabled]), 
          input[type="button"]:not([disabled]), 
          input[type="submit"]:not([disabled]), 
          input[type="reset"]:not([disabled]),
          a[role="button"]:not([disabled]), 
          [role="button"]:not([disabled]),
          .btn:not([disabled]), 
          .button:not([disabled]),
          [class*="btn"]:not([disabled]),
          [class*="button"]:not([disabled]),
          [onclick]:not([disabled]),
          [data-action]:not([disabled]),
          [data-toggle]:not([disabled]),
          [data-target]:not([disabled])
        `, els => {
          // Deduplicate buttons by finding the actual clickable parent
          const uniqueButtons = new Map();
          
          els.forEach(el => {
            // More comprehensive visibility check
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const isVisible = rect.width > 0 && 
                             rect.height > 0 && 
                             style.display !== 'none' && 
                             style.visibility !== 'hidden' && 
                             style.opacity !== '0' &&
                             el.offsetParent !== null;
            
            if (!isVisible) return;
            
            // Get better text content
            let text = '';
            if (el.textContent) {
              text = el.textContent.trim();
            } else if (el.value) {
              text = el.value.trim();
            } else if (el.getAttribute('aria-label')) {
              text = el.getAttribute('aria-label').trim();
            } else if (el.getAttribute('title')) {
              text = el.getAttribute('title').trim();
            }
            
            if (!text || text.length === 0) return;
            
            // Find the actual clickable element (prefer button, a, or input over div/span)
            let clickableEl = el;
            if (el.tagName === 'SPAN' || el.tagName === 'DIV') {
              // Look for parent button or link
              let parent = el.parentElement;
              while (parent && parent !== document.body) {
                if (parent.tagName === 'BUTTON' || parent.tagName === 'A' || 
                    parent.tagName === 'INPUT' || parent.getAttribute('role') === 'button') {
                  clickableEl = parent;
                  break;
                }
                parent = parent.parentElement;
              }
            }
            
            // Create unique key based on text and position (with tolerance for slight position differences)
            const key = `${text}-${Math.round(rect.x/10)}-${Math.round(rect.y/10)}`;
            
            // Only keep the most clickable version of each button
            if (!uniqueButtons.has(key) || 
                (clickableEl.tagName === 'BUTTON' || clickableEl.tagName === 'A' || clickableEl.tagName === 'INPUT')) {
              
              // Create better selector
              let selector = '';
              if (clickableEl.id) {
                selector = `#${clickableEl.id}`;
              } else if (clickableEl.tagName === 'BUTTON') {
                selector = 'button';
                if (clickableEl.type) {
                  selector += `[type="${clickableEl.type}"]`;
                }
              } else if (clickableEl.tagName === 'A') {
                selector = 'a';
                if (clickableEl.className) {
                  const classes = clickableEl.className.split(' ').filter(c => c.length > 0);
                  if (classes.some(c => c.includes('btn') || c.includes('button'))) {
                    selector = `.${classes.find(c => c.includes('btn') || c.includes('button'))}`;
                  }
                }
              } else if (clickableEl.className) {
                const classes = clickableEl.className.split(' ').filter(c => c.length > 0);
                if (classes.length > 0) {
                  selector = `.${classes[0]}`;
                }
              }
              
              if (!selector) {
                selector = clickableEl.tagName.toLowerCase();
              }
              
              uniqueButtons.set(key, {
                tagName: clickableEl.tagName,
                type: clickableEl.type || null,
                text: text,
                id: clickableEl.id || null,
                className: clickableEl.className || null,
                disabled: clickableEl.disabled || false,
                visible: isVisible,
                role: clickableEl.getAttribute('role') || null,
                onclick: clickableEl.getAttribute('onclick') || null,
                dataAction: clickableEl.getAttribute('data-action') || null,
                selector: selector,
                rect: {
                  width: rect.width,
                  height: rect.height,
                  x: rect.x,
                  y: rect.y
                }
              });
            }
          });
          
          return Array.from(uniqueButtons.values());
        });
        
        // Test clicking on first few buttons (if any) - improved testing
        const clickableButtons = buttons.filter(btn => !btn.disabled && btn.visible).slice(0, 5);
        const buttonTestResults = [];
        
        for (const button of clickableButtons) {
          try {
            // Try multiple click strategies
            let clicked = false;
            let error = null;
            
            // Strategy 1: Try direct click with selector
            try {
              await page.click(button.selector, { timeout: 3000 });
              clicked = true;
            } catch (e1) {
              // Strategy 2: Try clicking by text content
              try {
                await page.click(`text="${button.text}"`, { timeout: 3000 });
                clicked = true;
              } catch (e2) {
                // Strategy 3: Try clicking by role and text
                try {
                  await page.click(`[role="button"]:has-text("${button.text}")`, { timeout: 3000 });
                  clicked = true;
                } catch (e3) {
                  // Strategy 4: Try force click (for elements that might be covered)
                  try {
                    await page.click(button.selector, { force: true, timeout: 3000 });
                    clicked = true;
                  } catch (e4) {
                    error = e4.message;
                  }
                }
              }
            }
            
            if (clicked) {
              // Wait a bit to see if there's any response
              await page.waitForTimeout(500);
              
              buttonTestResults.push({ 
                button: button.text || button.id || 'unnamed', 
                status: 'clicked', 
                selector: button.selector,
                working: true,
                tagName: button.tagName,
                type: button.type
              });
            } else {
              buttonTestResults.push({ 
                button: button.text || button.id || 'unnamed', 
                status: 'failed', 
                selector: button.selector,
                error: error,
                working: false,
                tagName: button.tagName,
                type: button.type
              });
            }
          } catch (err) {
            buttonTestResults.push({ 
              button: button.text || button.id || 'unnamed', 
              status: 'failed', 
              selector: button.selector,
              error: err.message,
              working: false,
              tagName: button.tagName,
              type: button.type
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
