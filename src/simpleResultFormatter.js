/**
 * Convert complex test results to simple test name + pass/fail format
 * @param {Object} results - Complex test results from auditAll
 * @returns {Array} Simple array of {testName, status} objects
 */
export function formatToSimpleResults(results) {
  const simpleResults = [];
  
  // Handle different result structures
  if (results.results && Array.isArray(results.results)) {
    // Full audit results structure
    for (const result of results.results) {
      const url = result.url || 'Unknown URL';
      
      // Add Lighthouse tests
      if (result.lighthouse && result.lighthouse.scores) {
        const scores = result.lighthouse.scores;
        simpleResults.push({
          testName: `Lighthouse Performance (${url})`,
          status: scores.performance >= 90 ? 'PASSED' : 'FAILED'
        });
        simpleResults.push({
          testName: `Lighthouse Accessibility (${url})`,
          status: scores.accessibility >= 90 ? 'PASSED' : 'FAILED'
        });
        simpleResults.push({
          testName: `Lighthouse Best Practices (${url})`,
          status: scores.bestPractices >= 90 ? 'PASSED' : 'FAILED'
        });
        simpleResults.push({
          testName: `Lighthouse SEO (${url})`,
          status: scores.seo >= 90 ? 'PASSED' : 'FAILED'
        });
      }
      
      // Add Pa11y tests
      if (result.pa11y) {
        simpleResults.push({
          testName: `Pa11y Accessibility (${url})`,
          status: (result.pa11y.issueCount || 0) === 0 ? 'PASSED' : 'FAILED'
        });
      }
      
      // Add E2E Flow tests
      if (result.flows && result.flows.runs) {
        for (const run of result.flows.runs) {
          const testName = run.file ? run.file.replace('.test.js', '').replace('-', ' ').toUpperCase() : 'Unknown E2E Test';
          simpleResults.push({
            testName: `${testName} (${url})`,
            status: run.status === 'passed' ? 'PASSED' : 'FAILED'
          });
        }
      }
    }
  } else if (results.runs && Array.isArray(results.runs)) {
    // E2E flows only structure
    for (const run of results.runs) {
      const testName = run.file ? run.file.replace('.test.js', '').replace('-', ' ').toUpperCase() : 'Unknown E2E Test';
      simpleResults.push({
        testName: testName,
        status: run.status === 'passed' ? 'PASSED' : 'FAILED'
      });
    }
  }
  
  return simpleResults;
}

/**
 * Format simple results as a readable string
 * @param {Array} simpleResults - Array of {testName, status} objects
 * @returns {string} Formatted string output
 */
export function formatAsString(simpleResults) {
  if (simpleResults.length === 0) {
    return 'No test results found.';
  }
  
  let output = 'TEST RESULTS:\n';
  output += '='.repeat(50) + '\n';
  
  for (const result of simpleResults) {
    const statusIcon = result.status === 'PASSED' ? '✅' : '❌';
    output += `${statusIcon} ${result.testName}: ${result.status}\n`;
  }
  
  // Add summary
  const passed = simpleResults.filter(r => r.status === 'PASSED').length;
  const failed = simpleResults.filter(r => r.status === 'FAILED').length;
  const total = simpleResults.length;
  
  output += '\n' + '='.repeat(50) + '\n';
  output += `SUMMARY: ${passed}/${total} tests passed (${failed} failed)\n`;
  
  return output;
}

/**
 * Format simple results as JSON
 * @param {Array} simpleResults - Array of {testName, status} objects
 * @returns {string} JSON string
 */
export function formatAsJSON(simpleResults) {
  return JSON.stringify(simpleResults, null, 2);
}
