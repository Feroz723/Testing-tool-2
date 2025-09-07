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
        
        // Wait for forms to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Look for contact forms on this page - improved detection
        const forms = await page.$$eval('form', fs => fs.map(f => {
          const fields = Array.from(f.querySelectorAll('input,textarea,select')).map(i => ({
            name: i.name || i.id || null, 
            type: i.type || null,
            placeholder: i.placeholder || null,
            label: i.labels && i.labels[0] ? i.labels[0].textContent.trim() : null
          }));
          
          // More flexible contact form detection
          const hasNameField = fields.some(field => {
            const name = (field.name || '').toLowerCase();
            const placeholder = (field.placeholder || '').toLowerCase();
            const label = (field.label || '').toLowerCase();
            return name.includes('name') || name.includes('fullname') || name.includes('firstname') ||
                   placeholder.includes('name') || placeholder.includes('full name') ||
                   label.includes('name') || label.includes('full name');
          });
          
          const hasEmailField = fields.some(field => {
            const name = (field.name || '').toLowerCase();
            const placeholder = (field.placeholder || '').toLowerCase();
            const label = (field.label || '').toLowerCase();
            return field.type === 'email' || 
                   name.includes('email') || name.includes('mail') ||
                   placeholder.includes('email') || placeholder.includes('e-mail') ||
                   label.includes('email') || label.includes('e-mail');
          });
          
          const hasMessageField = fields.some(field => {
            const name = (field.name || '').toLowerCase();
            const placeholder = (field.placeholder || '').toLowerCase();
            const label = (field.label || '').toLowerCase();
            return field.type === 'textarea' ||
                   name.includes('message') || name.includes('comment') || name.includes('inquiry') ||
                   name.includes('question') || name.includes('feedback') ||
                   placeholder.includes('message') || placeholder.includes('comment') ||
                   label.includes('message') || label.includes('comment');
          });
          
          // Also check for phone field (common in contact forms)
          const hasPhoneField = fields.some(field => {
            const name = (field.name || '').toLowerCase();
            const placeholder = (field.placeholder || '').toLowerCase();
            const label = (field.label || '').toLowerCase();
            return field.type === 'tel' ||
                   name.includes('phone') || name.includes('mobile') || name.includes('telephone') ||
                   placeholder.includes('phone') || placeholder.includes('mobile') ||
                   label.includes('phone') || label.includes('mobile');
          });
          
          // Contact form if it has at least name + email + (message OR phone)
          const isContactForm = hasNameField && hasEmailField && (hasMessageField || hasPhoneField);
          
          return {
            id: f.id || null,
            name: f.name || null,
            action: f.action || null,
            method: f.method || null,
            fields: fields,
            isContactForm: isContactForm,
            hasNameField: hasNameField,
            hasEmailField: hasEmailField,
            hasMessageField: hasMessageField,
            hasPhoneField: hasPhoneField,
            fieldCount: fields.length
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
