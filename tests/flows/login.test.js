export default async function loginFlow(page, baseUrl) {
  const results = [];
  const loginFormsFound = [];
  
  // Start from homepage
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  
  // Check if there's a login form on the homepage
  const homepageLoginCheck = await page.$$eval('form', forms => 
    forms.map(form => {
      const emailInput = form.querySelector('input[type="email"], input[name*="email"], input[name*="username"]');
      const passwordInput = form.querySelector('input[type="password"], input[name*="password"]');
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      
      return {
        hasEmailField: !!emailInput,
        hasPasswordField: !!passwordInput,
        hasSubmitButton: !!submitButton,
        isLoginForm: !!(emailInput && passwordInput),
        formAction: form.action || null,
        formMethod: form.method || 'get'
      };
    })
  );
  
  if (homepageLoginCheck.length > 0) {
    const loginForm = homepageLoginCheck.find(form => form.isLoginForm);
    if (loginForm) {
      loginFormsFound.push({
        url: baseUrl,
        page: 'Homepage',
        formFound: true,
        hasEmailField: loginForm.hasEmailField,
        hasPasswordField: loginForm.hasPasswordField,
        hasSubmitButton: loginForm.hasSubmitButton,
        formAction: loginForm.formAction,
        formMethod: loginForm.formMethod
      });
    }
  }
  
  // Try common login paths only if no form found on homepage
  if (loginFormsFound.length === 0) {
    const candidates = ['/login','/signin','/account/login','/user/login'];
    
    for (const p of candidates) {
      const url = new URL(p, baseUrl).href;
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        if (!res) { 
          results.push({ url, status: 'no-response', formFound: false }); 
          continue; 
        }
        
        const status = res.status ? res.status() : null;
        if (status && status >= 400) { 
          results.push({ url, status, formFound: false }); 
          continue; 
        }
        
        // Check for login form on this page
        const formCheck = await page.$$eval('form', forms => 
          forms.map(form => {
            const emailInput = form.querySelector('input[type="email"], input[name*="email"], input[name*="username"]');
            const passwordInput = form.querySelector('input[type="password"], input[name*="password"]');
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
            
            return {
              hasEmailField: !!emailInput,
              hasPasswordField: !!passwordInput,
              hasSubmitButton: !!submitButton,
              isLoginForm: !!(emailInput && passwordInput),
              formAction: form.action || null,
              formMethod: form.method || 'get'
            };
          })
        );
        
        const loginForm = formCheck.find(form => form.isLoginForm);
        if (loginForm) {
          loginFormsFound.push({
            url: url,
            page: p,
            formFound: true,
            hasEmailField: loginForm.hasEmailField,
            hasPasswordField: loginForm.hasPasswordField,
            hasSubmitButton: loginForm.hasSubmitButton,
            formAction: loginForm.formAction,
            formMethod: loginForm.formMethod
          });
          results.push({ url, status: status || 'ok', formFound: true, note: 'login-form-found' });
        } else {
          results.push({ url, status: status || 'ok', formFound: false, note: 'no-login-form' });
        }
      } catch (err) {
        results.push({ url, error: err.message, formFound: false });
      }
    }
  }
  
  return { 
    tried: results.length, 
    results: results,
    loginFormsFound: loginFormsFound,
    summary: {
      totalPagesChecked: results.length,
      loginFormsFound: loginFormsFound.length,
      hasLoginOnHomepage: loginFormsFound.some(form => form.page === 'Homepage'),
      loginPages: loginFormsFound.map(form => form.page)
    }
  };
}
