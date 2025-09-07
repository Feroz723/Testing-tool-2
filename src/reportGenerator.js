import fs from 'fs';
import path from 'path';
import { generateEnhancedHtmlReport } from './enhancedReportGenerator.js';
import { generateYellowLabStyleReport } from './yellowlabStyleReport.js';

/**
 * Enhanced HTML Report Generator for Website Testing Tool
 * 
 * This file generates comprehensive HTML reports including:
 * - Lighthouse performance, SEO, accessibility, best practices scores
 * - Pa11y accessibility audit results with WCAG issues
 * - E2E test results (forms, login, navigation, buttons)
 * - Screenshots for failed tests
 * - Chart.js pie chart for pass/fail visualization
 * - Download functionality for the report
 * 
 * Customization points are clearly marked with comments
 */

/**
 * Generates a comprehensive HTML report from test results
 * @param {Object} results - Combined test results object
 * @param {string} outputPath - Path where to save the HTML report (default: report.html in project root)
 */
export function generateHtmlReport(results, outputPath = 'report.html') {
  // Use the YellowLab-style report generator for professional analysis
  generateYellowLabStyleReport(results, outputPath);
}

/**
 * Calculate comprehensive summary statistics from all test results
 * @param {Object} results - Combined test results object
 * @returns {Object} Summary with counts, scores, and metrics
 */
function calculateComprehensiveSummary(results) {
  // Handle audit results structure - get first result if it's an audit
  const firstResult = results.results && results.results[0] ? results.results[0] : results;
  
  // E2E Test Summary
  const e2eRuns = firstResult.flows ? firstResult.flows.runs : (results.runs || []);
  const e2eTotal = e2eRuns.length;
  const e2ePassed = e2eRuns.filter(r => r.status === 'passed').length;
  const e2eFailed = e2eRuns.filter(r => r.status === 'failed').length;
  const e2eSkipped = e2eRuns.filter(r => r.status === 'skipped').length;
  
  // Calculate total duration for E2E tests
  const e2eTotalDuration = e2eRuns.reduce((sum, run) => {
    return sum + (run.duration || 0);
  }, 0);
  
  // Lighthouse Summary (if available)
  const lighthouse = firstResult.lighthouse || {};
  const lighthouseScores = lighthouse.scores || {};
  
  // Pa11y Summary (if available)
  const pa11y = firstResult.pa11y || {};
  const pa11yIssues = pa11y.issueCount || 0;
  const pa11yExamples = pa11y.examples || [];
  
  return {
    // E2E Test metrics
    e2e: {
      total: e2eTotal,
      passed: e2ePassed,
      failed: e2eFailed,
      skipped: e2eSkipped,
      totalDuration: Math.round(e2eTotalDuration)
    },
    // Lighthouse metrics
    lighthouse: {
      performance: lighthouseScores.performance || 0,
      accessibility: lighthouseScores.accessibility || 0,
      bestPractices: lighthouseScores.bestPractices || 0,
      seo: lighthouseScores.seo || 0,
      pwa: lighthouseScores.pwa || 0
    },
    // Pa11y metrics
    pa11y: {
      issueCount: pa11yIssues,
      examples: pa11yExamples
    },
    // Overall metrics
    overall: {
      totalTests: e2eTotal,
      passedTests: e2ePassed,
      failedTests: e2eFailed,
      passRate: e2eTotal > 0 ? Math.round((e2ePassed / e2eTotal) * 100) : 0
    }
  };
}

/**
 * Generate the complete enhanced HTML content with all features
 * @param {Object} results - Combined test results object
 * @param {Object} summary - Summary statistics
 * @returns {string} Complete HTML content
 */
function generateEnhancedHtmlContent(results, summary) {
  const timestamp = new Date().toLocaleString();
  // Handle both direct results and audit results structure
  const firstResult = results.results && results.results[0] ? results.results[0] : results;
  const testUrl = results.url || firstResult.url || 'Unknown URL';
  const e2eRuns = firstResult.flows ? firstResult.flows.runs : (results.runs || []);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Testing Report - ${testUrl}</title>
    
    <!-- Chart.js CDN for pie chart visualization -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <style>
        /* ===== MAIN STYLING - Customize colors and layout here ===== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header .test-url {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        
        .header .timestamp {
            opacity: 0.8;
            font-size: 1em;
        }
        
        /* ===== SUMMARY CARDS - Customize card colors and layout here ===== */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 5px solid;
        }
        
        .summary-card.total { border-left-color: #6c757d; }
        .summary-card.passed { border-left-color: #28a745; }
        .summary-card.failed { border-left-color: #dc3545; }
        .summary-card.performance { border-left-color: #007bff; }
        .summary-card.accessibility { border-left-color: #ffc107; }
        .summary-card.seo { border-left-color: #17a2b8; }
        .summary-card.issues { border-left-color: #dc3545; }
        
        .summary-card h3 {
            font-size: 2.5em;
            margin-bottom: 5px;
        }
        
        .summary-card.passed h3 { color: #28a745; }
        .summary-card.failed h3 { color: #dc3545; }
        .summary-card.performance h3 { color: #007bff; }
        .summary-card.accessibility h3 { color: #ffc107; }
        .summary-card.seo h3 { color: #17a2b8; }
        .summary-card.issues h3 { color: #dc3545; }
        
        .summary-card p {
            color: #666;
            font-weight: 500;
        }
        
        /* ===== CHART SECTION - Customize chart styling here ===== */
        .chart-section {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        
        .chart-container {
            max-width: 400px;
            margin: 0 auto;
        }
        
        /* ===== RESULTS SECTIONS - Customize section styling here ===== */
        .results-section {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .results-section h2 {
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        
        /* ===== LIGHTHOUSE SCORES - Customize score display here ===== */
        .lighthouse-scores {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .score-card {
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            background: #f8f9fa;
        }
        
        .score-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .score-good { color: #28a745; }
        .score-warning { color: #ffc107; }
        .score-bad { color: #dc3545; }
        
        /* ===== PA11Y ISSUES - Customize accessibility issue display here ===== */
        .pa11y-issue {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
        }
        
        .pa11y-issue h4 {
            color: #721c24;
            margin-bottom: 8px;
        }
        
        .pa11y-issue .code {
            font-family: 'Courier New', monospace;
            background: #e2e3e5;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        
        /* ===== E2E TEST TABLE - Customize table styling here ===== */
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .results-table th,
        .results-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        .results-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #555;
        }
        
        .results-table tr:hover {
            background-color: #f8f9fa;
        }
        
        /* ===== STATUS BADGES - Customize status colors here ===== */
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status.passed {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status.failed {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .status.skipped {
            background-color: #fff3cd;
            color: #856404;
        }
        
        /* ===== COLLAPSIBLE SECTIONS - Customize expand/collapse behavior here ===== */
        .collapsible {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            margin-top: 10px;
        }
        
        .collapsible-header {
            padding: 15px;
            cursor: pointer;
            background-color: #e9ecef;
            border-bottom: 1px solid #dee2e6;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .collapsible-header:hover {
            background-color: #dee2e6;
        }
        
        .collapsible-content {
            padding: 15px;
            display: none;
            background-color: white;
        }
        
        .collapsible-content.active {
            display: block;
        }
        
        .toggle-icon {
            transition: transform 0.3s ease;
        }
        
        .toggle-icon.rotated {
            transform: rotate(180deg);
        }
        
        /* ===== SCREENSHOTS - Customize screenshot display here ===== */
        .screenshot {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-top: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* ===== DOWNLOAD BUTTON - Customize download button styling here ===== */
        .download-section {
            text-align: center;
            margin: 30px 0;
        }
        
        .download-btn {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3);
        }
        
        /* ===== ERROR MESSAGES - Customize error display here ===== */
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            border-left: 4px solid #dc3545;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            margin-top: 10px;
        }
        
        .result-details {
            background-color: #e7f3ff;
            padding: 10px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
            margin-top: 10px;
        }
        
        /* ===== RESPONSIVE DESIGN - Customize mobile layout here ===== */
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
            }
            
            .lighthouse-scores {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .results-table {
                font-size: 0.9em;
            }
            
            .results-table th,
            .results-table td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- ===== HEADER SECTION ===== -->
        <div class="header">
            <h1>🧪 Website Testing Report</h1>
            <div class="test-url">Tested URL: ${escapeHtml(testUrl)}</div>
            <div class="timestamp">Generated on ${timestamp}</div>
        </div>
        
        <!-- ===== SUMMARY CARDS ===== -->
        <div class="summary-grid">
            <div class="summary-card total">
                <h3>${summary.e2e.total}</h3>
                <p>Total E2E Tests</p>
            </div>
            <div class="summary-card passed">
                <h3>${summary.e2e.passed}</h3>
                <p>Passed Tests</p>
            </div>
            <div class="summary-card failed">
                <h3>${summary.e2e.failed}</h3>
                <p>Failed Tests</p>
            </div>
            <div class="summary-card performance">
                <h3>${summary.lighthouse.performance}</h3>
                <p>Performance Score</p>
            </div>
            <div class="summary-card accessibility">
                <h3>${summary.lighthouse.accessibility}</h3>
                <p>Accessibility Score</p>
            </div>
            <div class="summary-card seo">
                <h3>${summary.lighthouse.seo}</h3>
                <p>SEO Score</p>
            </div>
            <div class="summary-card issues">
                <h3>${summary.pa11y.issueCount}</h3>
                <p>Accessibility Issues</p>
            </div>
        </div>
        
        <!-- ===== PIE CHART SECTION ===== -->
        <div class="chart-section">
            <h2>📊 Test Results Overview</h2>
            <div class="chart-container">
                <canvas id="resultsChart" width="400" height="400"></canvas>
            </div>
        </div>
        
        <!-- ===== LIGHTHOUSE RESULTS ===== -->
        ${generateLighthouseSection(firstResult.lighthouse)}
        
        <!-- ===== PA11Y ACCESSIBILITY RESULTS ===== -->
        ${generatePa11ySection(firstResult.pa11y)}
        
        <!-- ===== E2E TEST RESULTS ===== -->
        <div class="results-section">
            <h2>🧪 E2E Test Results</h2>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Test File</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateE2ETestRows(e2eRuns)}
                </tbody>
            </table>
        </div>
        
        <!-- ===== DOWNLOAD SECTION ===== -->
        <div class="download-section">
            <a href="#" class="download-btn" id="downloadBtn" download="report.html">
                📥 Download Report
            </a>
        </div>
    </div>
    
    <script>
        // ===== CHART.JS PIE CHART - Customize chart colors and behavior here =====
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('resultsChart').getContext('2d');
            const passed = ${summary.e2e.passed};
            const failed = ${summary.e2e.failed};
            const skipped = ${summary.e2e.skipped};
            
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'],
                    datasets: [{
                        data: [passed, failed, skipped],
                        backgroundColor: [
                            '#28a745',  // Green for passed
                            '#dc3545',  // Red for failed
                            '#ffc107'   // Yellow for skipped
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        });
        
        // ===== COLLAPSIBLE FUNCTIONALITY - Customize behavior here =====
        document.addEventListener('DOMContentLoaded', function() {
            const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
            
            collapsibleHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    const icon = this.querySelector('.toggle-icon');
                    
                    if (content.classList.contains('active')) {
                        content.classList.remove('active');
                        icon.classList.remove('rotated');
                    } else {
                        content.classList.add('active');
                        icon.classList.add('rotated');
                    }
                });
            });
        });
        
        // ===== DOWNLOAD FUNCTIONALITY - Customize download behavior here =====
        document.addEventListener('DOMContentLoaded', function() {
            const downloadBtn = document.getElementById('downloadBtn');
            
            downloadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the current HTML content
                const htmlContent = document.documentElement.outerHTML;
                
                // Create a blob and download
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                
                // Create a temporary link and trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = 'website-test-report.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            });
        });
    </script>
</body>
</html>`;
}

/**
 * Generate Lighthouse results section
 * @param {Object} lighthouse - Lighthouse results object
 * @returns {string} HTML content for Lighthouse section
 */
function generateLighthouseSection(lighthouse) {
  if (!lighthouse || !lighthouse.scores) {
    return `
      <div class="results-section">
        <h2>⚡ Lighthouse Performance Audit</h2>
        <p style="color: #666; text-align: center; padding: 20px;">No Lighthouse data available</p>
      </div>
    `;
  }
  
  const scores = lighthouse.scores;
  const timings = lighthouse.timings || {};
  
  return `
    <div class="results-section">
      <h2>⚡ Lighthouse Performance Audit</h2>
      
      <div class="lighthouse-scores">
        <div class="score-card">
          <div class="score-value ${getScoreClass(scores.performance)}">${scores.performance}</div>
          <div>Performance</div>
        </div>
        <div class="score-card">
          <div class="score-value ${getScoreClass(scores.accessibility)}">${scores.accessibility}</div>
          <div>Accessibility</div>
        </div>
        <div class="score-card">
          <div class="score-value ${getScoreClass(scores.bestPractices)}">${scores.bestPractices}</div>
          <div>Best Practices</div>
        </div>
        <div class="score-card">
          <div class="score-value ${getScoreClass(scores.seo)}">${scores.seo}</div>
          <div>SEO</div>
        </div>
        <div class="score-card">
          <div class="score-value ${getScoreClass(scores.pwa)}">${scores.pwa}</div>
          <div>PWA</div>
        </div>
      </div>
      
      ${Object.keys(timings).length > 0 ? `
        <div class="collapsible">
          <div class="collapsible-header">
            <span>View Performance Timings</span>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="collapsible-content">
            <div class="result-details">
              <pre>${JSON.stringify(timings, null, 2)}</pre>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate Pa11y accessibility results section
 * @param {Object} pa11y - Pa11y results object
 * @returns {string} HTML content for Pa11y section
 */
function generatePa11ySection(pa11y) {
  if (!pa11y || !pa11y.examples || pa11y.examples.length === 0) {
    return `
      <div class="results-section">
        <h2>♿ Accessibility Audit (Pa11y)</h2>
        <p style="color: #28a745; text-align: center; padding: 20px;">✅ No accessibility issues found!</p>
      </div>
    `;
  }
  
  const issues = pa11y.examples.map(issue => `
    <div class="pa11y-issue">
      <h4>${escapeHtml(issue.message)}</h4>
      <p><strong>Code:</strong> <span class="code">${escapeHtml(issue.code)}</span></p>
      <p><strong>Selector:</strong> <code>${escapeHtml(issue.selector)}</code></p>
      ${issue.context ? `<p><strong>Context:</strong> <code>${escapeHtml(issue.context)}</code></p>` : ''}
    </div>
  `).join('');
  
  return `
    <div class="results-section">
      <h2>♿ Accessibility Audit (Pa11y)</h2>
      <p><strong>Total Issues Found:</strong> ${pa11y.issueCount}</p>
      ${issues}
    </div>
  `;
}

/**
 * Generate E2E test table rows
 * @param {Array} runs - Array of E2E test runs
 * @returns {string} HTML table rows
 */
function generateE2ETestRows(runs) {
  if (runs.length === 0) {
    return '<tr><td colspan="4" style="text-align: center; color: #666;">No E2E test results found</td></tr>';
  }
  
  return runs.map(run => {
    const statusIcon = getStatusIcon(run.status);
    const statusClass = run.status;
    const duration = run.duration ? `${run.duration}ms` : 'N/A';
    
    // Generate details content
    const detailsContent = generateE2EDetailsContent(run);
    
    return `
      <tr>
        <td><strong>${run.file}</strong></td>
        <td><span class="status ${statusClass}">${statusIcon} ${run.status}</span></td>
        <td>${duration}</td>
        <td>${detailsContent}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Generate details content for E2E test results
 * @param {Object} run - Individual E2E test run result
 * @returns {string} HTML content for details
 */
function generateE2EDetailsContent(run) {
  let content = '';
  
  // Add error message if failed
  if (run.status === 'failed' && run.error) {
    content += `<div class="error-message">${escapeHtml(run.error)}</div>`;
  }
  
  // Add screenshot if available
  if (run.screenshot) {
    content += `<img src="${run.screenshot}" alt="Screenshot of failed test" class="screenshot">`;
  }
  
  // Add result details if available
  if (run.result && typeof run.result === 'object') {
    content += `<div class="collapsible">
      <div class="collapsible-header">
        <span>View Test Details</span>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="result-details">
          <pre>${escapeHtml(JSON.stringify(run.result, null, 2))}</pre>
        </div>
      </div>
    </div>`;
  }
  
  return content || '<span style="color: #666;">No additional details</span>';
}

/**
 * Get CSS class for score based on value
 * @param {number} score - Score value (0-100)
 * @returns {string} CSS class name
 */
function getScoreClass(score) {
  if (score >= 90) return 'score-good';
  if (score >= 50) return 'score-warning';
  return 'score-bad';
}

/**
 * Get status icon for test result
 * @param {string} status - Test status
 * @returns {string} Status icon
 */
function getStatusIcon(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'skipped': return '⏭️';
    default: return '❓';
  }
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}