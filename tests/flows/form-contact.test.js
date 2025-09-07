export default async function contactFormFlow(page, baseUrl) {
  const results = [];
  const contactFormsFound = [];
  
  // Get the base URL origin for filtering internal links
  const baseUrlObj = new URL(baseUrl);
  const baseOrigin = baseUrlObj.origin;
  
  // Start from homepage
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  
  // Collect all internal links to check for contact forms on each page
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
        
        // Look for contact forms on this page
        const forms = await page.$$eval('form', fs => fs.map(f => {
          const fields = Array.from(f.querySelectorAll('input,textarea,select')).map(i => ({
            name: i.name || i.id || null, 
            type: i.type || null,
            placeholder: i.placeholder || null
          }));
          
          // Check if this looks like a contact form
          const hasNameField = fields.some(field => 
            field.name && (field.name.toLowerCase().includes('name') || field.name.toLowerCase().includes('fullname'))
          );
          const hasEmailField = fields.some(field => 
            field.type === 'email' || (field.name && field.name.toLowerCase().includes('email'))
          );
          const hasMessageField = fields.some(field => 
            field.name && (field.name.toLowerCase().includes('message') || field.name.toLowerCase().includes('comment'))
          );
          
          return {
            id: f.id || null,
            name: f.name || null,
            action: f.action || null,
            method: f.method || null,
            fields: fields,
            isContactForm: hasNameField && hasEmailField && hasMessageField,
            hasNameField: hasNameField,
            hasEmailField: hasEmailField,
            hasMessageField: hasMessageField
          };
        }));
        
        const contactForms = forms.filter(form => form.isContactForm);
        
        if (contactForms.length > 0) {
          contactFormsFound.push({
            url: link.href,
            title: title,
            linkText: link.text,
            formsFound: contactForms.length,
            forms: contactForms.map(form => ({
              id: form.id,
              name: form.name,
              action: form.action,
              method: form.method,
              fields: form.fields
            }))
          });
        }
        
        results.push({
          url: link.href,
          title: title,
          linkText: link.text,
          status: status,
          formsFound: forms.length,
          contactFormsFound: contactForms.length
        });
      }
    } catch (err) {
      results.push({
        url: link.href,
        linkText: link.text,
        error: err.message,
        formsFound: 0,
        contactFormsFound: 0
      });
    }
  }
  
  return { 
    results: results,
    contactFormsFound: contactFormsFound,
    summary: {
      totalPagesChecked: results.length,
      totalFormsFound: results.reduce((sum, page) => sum + page.formsFound, 0),
      contactFormsFound: contactFormsFound.length,
      pagesWithContactForms: contactFormsFound.map(form => form.linkText || form.title)
    }
  };
}
