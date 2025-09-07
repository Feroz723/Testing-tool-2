import fs from 'fs';
import path from 'path';

/**
 * Enhanced HTML Report Generator with Detailed Test Information
 * 
 * Features:
 * - Detailed page-by-page analysis
 * - Button detection and analysis
 * - Navigation structure analysis
 * - Form analysis with field details
 * - Interactive charts and animations
 * - Beautiful modern UI with dark/light mode
 * - Export functionality
 */

export function generateEnhancedHtmlReport(results, outputPath = 'report.html') {
  const summary = calculateDetailedSummary(results);
  const html = generateDetailedHtmlContent(results, summary);
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`📊 Enhanced detailed HTML report generated: ${outputPath}`);
}

function calculateDetailedSummary(results) {
  const firstResult = results.results && results.results[0] ? results.results[0] : results;
  const e2eRuns = firstResult.flows ? firstResult.flows.runs : (results.runs || []);
  
  // Extract detailed metrics from each test
  let totalButtons = 0;
  let workingButtons = 0;
  let totalLinks = 0;
  let workingLinks = 0;
  let totalForms = 0;
  let contactForms = 0;
  let loginForms = 0;
  let totalPages = 0;
  
  e2eRuns.forEach(run => {
    if (run.result) {
      // Buttons test
      if (run.file === 'buttons.test.js' && run.result.pagesChecked) {
        run.result.pagesChecked.forEach(page => {
          totalButtons += page.buttonsFound || 0;
          workingButtons += page.buttonResults?.filter(btn => btn.working).length || 0;
          totalPages++;
        });
      }
      
      // Navigation test
      if (run.file === 'navigation.test.js' && run.result.results) {
        run.result.results.forEach(result => {
          if (result.working) workingLinks++;
          totalLinks++;
        });
      }
      
      // Contact forms test
      if (run.file === 'form-contact.test.js' && run.result.results) {
        run.result.results.forEach(result => {
          totalForms += result.formsFound || 0;
          contactForms += result.contactFormsFound || 0;
        });
      }
      
      // Login forms test
      if (run.file === 'login.test.js' && run.result.loginFormsFound) {
        loginForms += run.result.loginFormsFound.length;
      }
    }
  });
  
  return {
    e2e: {
      total: e2eRuns.length,
      passed: e2eRuns.filter(r => r.status === 'passed').length,
      failed: e2eRuns.filter(r => r.status === 'failed').length,
      skipped: e2eRuns.filter(r => r.status === 'skipped').length
    },
    lighthouse: firstResult.lighthouse?.scores || {},
    pa11y: {
      issueCount: firstResult.pa11y?.issueCount || 0,
      examples: firstResult.pa11y?.examples || []
    },
    detailed: {
      totalButtons,
      workingButtons,
      brokenButtons: totalButtons - workingButtons,
      totalLinks,
      workingLinks,
      brokenLinks: totalLinks - workingLinks,
      totalForms,
      contactForms,
      loginForms,
      totalPages
    }
  };
}

function generateDetailedHtmlContent(results, summary) {
  const timestamp = new Date().toLocaleString();
  const firstResult = results.results && results.results[0] ? results.results[0] : results;
  const testUrl = results.url || firstResult.url || 'Unknown URL';
  const e2eRuns = firstResult.flows ? firstResult.flows.runs : (results.runs || []);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detailed Website Testing Report - ${escapeHtml(testUrl)}</title>
    
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <style>
        :root {
            --primary-color: #667eea;
            --secondary-color: #764ba2;
            --success-color: #28a745;
            --danger-color: #dc3545;
            --warning-color: #ffc107;
            --info-color: #17a2b8;
            --light-color: #f8f9fa;
            --dark-color: #343a40;
            --border-radius: 12px;
            --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--dark-color);
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 40px;
            border-radius: var(--border-radius);
            margin-bottom: 30px;
            box-shadow: var(--box-shadow);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .header .test-url {
            font-size: 1.3em;
            opacity: 0.9;
            margin-bottom: 10px;
            word-break: break-all;
        }
        
        .header .timestamp {
            opacity: 0.8;
            font-size: 1.1em;
        }
        
        /* Theme Toggle */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            box-shadow: var(--box-shadow);
            cursor: pointer;
            z-index: 1000;
            transition: var(--transition);
        }
        
        .theme-toggle:hover {
            transform: scale(1.1);
        }
        
        /* Summary Cards */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .summary-card {
            background: white;
            padding: 30px;
            border-radius: var(--border-radius);
            text-align: center;
            box-shadow: var(--box-shadow);
            border-left: 6px solid;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }
        
        .summary-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            transform: scaleX(0);
            transition: var(--transition);
        }
        
        .summary-card:hover::before {
            transform: scaleX(1);
        }
        
        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .summary-card.total { border-left-color: #6c757d; }
        .summary-card.passed { border-left-color: var(--success-color); }
        .summary-card.failed { border-left-color: var(--danger-color); }
        .summary-card.buttons { border-left-color: var(--info-color); }
        .summary-card.links { border-left-color: var(--warning-color); }
        .summary-card.forms { border-left-color: #6f42c1; }
        .summary-card.pages { border-left-color: #e83e8c; }
        
        .summary-card h3 {
            font-size: 3em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .summary-card.passed h3 { color: var(--success-color); }
        .summary-card.failed h3 { color: var(--danger-color); }
        .summary-card.buttons h3 { color: var(--info-color); }
        .summary-card.links h3 { color: var(--warning-color); }
        .summary-card.forms h3 { color: #6f42c1; }
        .summary-card.pages h3 { color: #e83e8c; }
        
        .summary-card p {
            color: #666;
            font-weight: 500;
            font-size: 1.1em;
        }
        
        .summary-card .icon {
            font-size: 2em;
            margin-bottom: 15px;
            opacity: 0.7;
        }
        
        /* Charts Section */
        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .chart-container {
            background: white;
            border-radius: var(--border-radius);
            padding: 30px;
            box-shadow: var(--box-shadow);
            text-align: center;
        }
        
        .chart-container h3 {
            margin-bottom: 20px;
            color: var(--dark-color);
            font-size: 1.5em;
        }
        
        .chart-wrapper {
            position: relative;
            height: 300px;
            margin: 0 auto;
        }
        
        /* Detailed Sections */
        .detailed-section {
            background: white;
            border-radius: var(--border-radius);
            padding: 30px;
            box-shadow: var(--box-shadow);
            margin-bottom: 30px;
        }
        
        .detailed-section h2 {
            margin-bottom: 25px;
            color: var(--dark-color);
            font-size: 2em;
            border-bottom: 3px solid var(--primary-color);
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        /* Page Analysis */
        .page-analysis {
            display: grid;
            gap: 20px;
        }
        
        .page-card {
            border: 2px solid #e9ecef;
            border-radius: var(--border-radius);
            padding: 25px;
            transition: var(--transition);
        }
        
        .page-card:hover {
            border-color: var(--primary-color);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .page-title {
            font-size: 1.3em;
            font-weight: 600;
            color: var(--dark-color);
            word-break: break-all;
        }
        
        .page-url {
            color: var(--primary-color);
            text-decoration: none;
            font-size: 0.9em;
        }
        
        .page-url:hover {
            text-decoration: underline;
        }
        
        .page-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .metric {
            text-align: center;
            padding: 15px;
            background: var(--light-color);
            border-radius: 8px;
            border-left: 4px solid var(--primary-color);
        }
        
        .metric-value {
            font-size: 1.8em;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        .metric-label {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        
        /* Button Analysis */
        .button-list {
            display: grid;
            gap: 10px;
            margin-top: 15px;
        }
        
        .button-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: var(--light-color);
            border-radius: 6px;
            border-left: 4px solid var(--success-color);
        }
        
        .button-item.broken {
            border-left-color: var(--danger-color);
        }
        
        .button-text {
            flex: 1;
            font-weight: 500;
        }
        
        .button-type {
            background: var(--primary-color);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
        }
        
        /* Navigation Analysis */
        .nav-section {
            margin-top: 15px;
        }
        
        .nav-type {
            margin-bottom: 15px;
        }
        
        .nav-type h4 {
            color: var(--dark-color);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .nav-links {
            display: grid;
            gap: 8px;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: var(--light-color);
            border-radius: 6px;
            border-left: 3px solid var(--success-color);
        }
        
        .nav-link.broken {
            border-left-color: var(--danger-color);
        }
        
        /* Form Analysis */
        .form-analysis {
            margin-top: 15px;
        }
        
        .form-item {
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: var(--transition);
        }
        
        .form-item:hover {
            border-color: var(--primary-color);
        }
        
        .form-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .form-type {
            background: var(--primary-color);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
        
        .form-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .field-item {
            padding: 8px 12px;
            background: var(--light-color);
            border-radius: 6px;
            font-size: 0.9em;
        }
        
        /* Collapsible */
        .collapsible {
            margin-top: 15px;
        }
        
        .collapsible-header {
            background: var(--light-color);
            padding: 15px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: var(--transition);
        }
        
        .collapsible-header:hover {
            background: #e9ecef;
        }
        
        .collapsible-content {
            padding: 20px;
            background: white;
            border-radius: 0 0 8px 8px;
            display: none;
            border: 1px solid #e9ecef;
            border-top: none;
        }
        
        .collapsible-content.active {
            display: block;
        }
        
        .toggle-icon {
            transition: var(--transition);
        }
        
        .toggle-icon.rotated {
            transform: rotate(180deg);
        }
        
        /* Status badges */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .status-badge.passed {
            background: #d4edda;
            color: #155724;
        }
        
        .status-badge.failed {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-badge.working {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .status-badge.broken {
            background: #f8d7da;
            color: #721c24;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
            }
            
            .charts-section {
                grid-template-columns: 1fr;
            }
            
            .page-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .page-metrics {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        /* Dark mode */
        body.dark-mode {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: #ecf0f1;
        }
        
        body.dark-mode .summary-card,
        body.dark-mode .chart-container,
        body.dark-mode .detailed-section,
        body.dark-mode .page-card,
        body.dark-mode .form-item {
            background: #34495e;
            color: #ecf0f1;
        }
        
        body.dark-mode .metric {
            background: #2c3e50;
        }
        
        body.dark-mode .button-item,
        body.dark-mode .nav-link,
        body.dark-mode .field-item {
            background: #2c3e50;
        }
        
        body.dark-mode .collapsible-header {
            background: #2c3e50;
        }
        
        body.dark-mode .collapsible-content {
            background: #34495e;
            border-color: #2c3e50;
        }
    </style>
</head>
<body>
    <button class="theme-toggle" onclick="toggleTheme()">
        <i class="fas fa-moon"></i>
    </button>
    
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <h1><i class="fas fa-chart-line"></i> Detailed Website Analysis</h1>
                <div class="test-url"><i class="fas fa-globe"></i> ${escapeHtml(testUrl)}</div>
                <div class="timestamp"><i class="fas fa-clock"></i> Generated on ${timestamp}</div>
            </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="summary-grid">
            <div class="summary-card total">
                <div class="icon"><i class="fas fa-vial"></i></div>
                <h3>${summary.e2e.total}</h3>
                <p>Total Tests</p>
            </div>
            <div class="summary-card passed">
                <div class="icon"><i class="fas fa-check-circle"></i></div>
                <h3>${summary.e2e.passed}</h3>
                <p>Passed Tests</p>
            </div>
            <div class="summary-card failed">
                <div class="icon"><i class="fas fa-times-circle"></i></div>
                <h3>${summary.e2e.failed}</h3>
                <p>Failed Tests</p>
            </div>
            <div class="summary-card buttons">
                <div class="icon"><i class="fas fa-mouse-pointer"></i></div>
                <h3>${summary.detailed.totalButtons}</h3>
                <p>Buttons Found</p>
            </div>
            <div class="summary-card links">
                <div class="icon"><i class="fas fa-link"></i></div>
                <h3>${summary.detailed.totalLinks}</h3>
                <p>Links Checked</p>
            </div>
            <div class="summary-card forms">
                <div class="icon"><i class="fas fa-wpforms"></i></div>
                <h3>${summary.detailed.totalForms}</h3>
                <p>Forms Found</p>
            </div>
            <div class="summary-card pages">
                <div class="icon"><i class="fas fa-file-alt"></i></div>
                <h3>${summary.detailed.totalPages}</h3>
                <p>Pages Analyzed</p>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="charts-section">
            <div class="chart-container">
                <h3><i class="fas fa-chart-pie"></i> Test Results</h3>
                <div class="chart-wrapper">
                    <canvas id="testResultsChart"></canvas>
                </div>
            </div>
            <div class="chart-container">
                <h3><i class="fas fa-chart-bar"></i> Button Analysis</h3>
                <div class="chart-wrapper">
                    <canvas id="buttonAnalysisChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Detailed Analysis -->
        ${generateDetailedAnalysis(e2eRuns)}
        
        <!-- Lighthouse Results -->
        ${generateLighthouseSection(firstResult.lighthouse)}
        
        <!-- Pa11y Results -->
        ${generatePa11ySection(firstResult.pa11y)}
    </div>
    
    <script>
        // Theme toggle
        function toggleTheme() {
            document.body.classList.toggle('dark-mode');
            const icon = document.querySelector('.theme-toggle i');
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
        }
        
        // Charts
        document.addEventListener('DOMContentLoaded', function() {
            // Test Results Chart
            const testCtx = document.getElementById('testResultsChart').getContext('2d');
            new Chart(testCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'],
                    datasets: [{
                        data: [${summary.e2e.passed}, ${summary.e2e.failed}, ${summary.e2e.skipped}],
                        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
            
            // Button Analysis Chart
            const buttonCtx = document.getElementById('buttonAnalysisChart').getContext('2d');
            new Chart(buttonCtx, {
                type: 'bar',
                data: {
                    labels: ['Working', 'Broken'],
                    datasets: [{
                        data: [${summary.detailed.workingButtons}, ${summary.detailed.brokenButtons}],
                        backgroundColor: ['#28a745', '#dc3545'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
        
        // Collapsible functionality
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
    </script>
</body>
</html>`;
}

function generateDetailedAnalysis(e2eRuns) {
  let html = '';
  
  // Group results by test type
  const buttonsTest = e2eRuns.find(r => r.file === 'buttons.test.js');
  const navigationTest = e2eRuns.find(r => r.file === 'navigation.test.js');
  const contactFormTest = e2eRuns.find(r => r.file === 'form-contact.test.js');
  const loginTest = e2eRuns.find(r => r.file === 'login.test.js');
  
  // Button Analysis
  if (buttonsTest && buttonsTest.result && buttonsTest.result.pagesChecked) {
    html += `
      <div class="detailed-section">
        <h2><i class="fas fa-mouse-pointer"></i> Button Analysis</h2>
        <div class="page-analysis">
    `;
    
    buttonsTest.result.pagesChecked.forEach(page => {
      html += `
        <div class="page-card">
          <div class="page-header">
            <div class="page-title">${escapeHtml(page.title || 'Untitled Page')}</div>
            <a href="${escapeHtml(page.url)}" class="page-url" target="_blank">
              <i class="fas fa-external-link-alt"></i> ${escapeHtml(page.url)}
            </a>
          </div>
          
          <div class="page-metrics">
            <div class="metric">
              <div class="metric-value">${page.buttonsFound || 0}</div>
              <div class="metric-label">Total Buttons</div>
            </div>
            <div class="metric">
              <div class="metric-value">${page.buttonsTested || 0}</div>
              <div class="metric-label">Tested</div>
            </div>
            <div class="metric">
              <div class="metric-value">${page.buttonResults?.filter(btn => btn.working).length || 0}</div>
              <div class="metric-label">Working</div>
            </div>
            <div class="metric">
              <div class="metric-value">${page.buttonResults?.filter(btn => !btn.working).length || 0}</div>
              <div class="metric-label">Broken</div>
            </div>
          </div>
          
          ${page.buttonResults && page.buttonResults.length > 0 ? `
            <div class="collapsible">
              <div class="collapsible-header">
                <span><i class="fas fa-list"></i> Button Details</span>
                <i class="fas fa-chevron-down toggle-icon"></i>
              </div>
              <div class="collapsible-content">
                <div class="button-list">
                  ${page.buttonResults.map(button => `
                    <div class="button-item ${button.working ? '' : 'broken'}">
                      <span class="status-badge ${button.working ? 'working' : 'broken'}">
                        <i class="fas fa-${button.working ? 'check' : 'times'}"></i>
                        ${button.working ? 'Working' : 'Broken'}
                      </span>
                      <span class="button-text">${escapeHtml(button.button || 'Unnamed Button')}</span>
                      <span class="button-type">${escapeHtml(button.selector || 'unknown')}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  // Navigation Analysis
  if (navigationTest && navigationTest.result && navigationTest.result.pagesChecked) {
    html += `
      <div class="detailed-section">
        <h2><i class="fas fa-sitemap"></i> Navigation Analysis</h2>
        <div class="page-analysis">
    `;
    
    navigationTest.result.pagesChecked.forEach(page => {
      html += `
        <div class="page-card">
          <div class="page-header">
            <div class="page-title">${escapeHtml(page.title || 'Untitled Page')}</div>
            <a href="${escapeHtml(page.url)}" class="page-url" target="_blank">
              <i class="fas fa-external-link-alt"></i> ${escapeHtml(page.url)}
            </a>
          </div>
          
          <div class="nav-section">
            <div class="nav-type">
              <h4><i class="fas fa-header"></i> Header Navigation</h4>
              ${page.headerNav && page.headerNav.found ? `
                <div class="nav-links">
                  ${page.headerNav.links.map(link => `
                    <div class="nav-link">
                      <span class="status-badge working">
                        <i class="fas fa-check"></i> Working
                      </span>
                      <span>${escapeHtml(link.text || 'Unnamed Link')}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p style="color: #666;">No header navigation found</p>'}
            </div>
            
            <div class="nav-type">
              <h4><i class="fas fa-footer"></i> Footer Navigation</h4>
              ${page.footerNav && page.footerNav.found ? `
                <div class="nav-links">
                  ${page.footerNav.links.map(link => `
                    <div class="nav-link">
                      <span class="status-badge working">
                        <i class="fas fa-check"></i> Working
                      </span>
                      <span>${escapeHtml(link.text || 'Unnamed Link')}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p style="color: #666;">No footer navigation found</p>'}
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  // Form Analysis
  if (contactFormTest && contactFormTest.result && contactFormTest.result.contactFormsFound) {
    html += `
      <div class="detailed-section">
        <h2><i class="fas fa-wpforms"></i> Form Analysis</h2>
        <div class="page-analysis">
    `;
    
    contactFormTest.result.contactFormsFound.forEach(formData => {
      html += `
        <div class="page-card">
          <div class="page-header">
            <div class="page-title">${escapeHtml(formData.title || 'Untitled Page')}</div>
            <a href="${escapeHtml(formData.url)}" class="page-url" target="_blank">
              <i class="fas fa-external-link-alt"></i> ${escapeHtml(formData.url)}
            </a>
          </div>
          
          <div class="form-analysis">
            <div class="form-item">
              <div class="form-header">
                <span class="form-type">Contact Form</span>
                <span class="status-badge passed">
                  <i class="fas fa-check"></i> Valid Contact Form
                </span>
              </div>
              
              <div class="form-fields">
                ${formData.forms.map(form => 
                  form.fields.map(field => `
                    <div class="field-item">
                      <strong>${escapeHtml(field.name || field.type || 'Unknown')}</strong>
                      ${field.placeholder ? `<br><small>${escapeHtml(field.placeholder)}</small>` : ''}
                    </div>
                  `).join('')
                ).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  return html;
}

function generateLighthouseSection(lighthouse) {
  if (!lighthouse || !lighthouse.scores) {
    return `
      <div class="detailed-section">
        <h2><i class="fas fa-tachometer-alt"></i> Lighthouse Performance</h2>
        <p style="color: #666; text-align: center; padding: 20px;">No Lighthouse data available</p>
      </div>
    `;
  }
  
  const scores = lighthouse.scores;
  
  return `
    <div class="detailed-section">
      <h2><i class="fas fa-tachometer-alt"></i> Lighthouse Performance</h2>
      
      <div class="page-metrics">
        <div class="metric">
          <div class="metric-value ${getScoreClass(scores.performance)}">${scores.performance}</div>
          <div class="metric-label">Performance</div>
        </div>
        <div class="metric">
          <div class="metric-value ${getScoreClass(scores.accessibility)}">${scores.accessibility}</div>
          <div class="metric-label">Accessibility</div>
        </div>
        <div class="metric">
          <div class="metric-value ${getScoreClass(scores.bestPractices)}">${scores.bestPractices}</div>
          <div class="metric-label">Best Practices</div>
        </div>
        <div class="metric">
          <div class="metric-value ${getScoreClass(scores.seo)}">${scores.seo}</div>
          <div class="metric-label">SEO</div>
        </div>
      </div>
    </div>
  `;
}

function generatePa11ySection(pa11y) {
  if (!pa11y || !pa11y.examples || pa11y.examples.length === 0) {
    return `
      <div class="detailed-section">
        <h2><i class="fas fa-universal-access"></i> Accessibility Audit</h2>
        <p style="color: #28a745; text-align: center; padding: 20px;">
          <i class="fas fa-check-circle"></i> No accessibility issues found!
        </p>
      </div>
    `;
  }
  
  const issues = pa11y.examples.map(issue => `
    <div class="form-item">
      <div class="form-header">
        <span class="form-type">${escapeHtml(issue.code)}</span>
        <span class="status-badge failed">
          <i class="fas fa-exclamation-triangle"></i> Issue
        </span>
      </div>
      <p><strong>Message:</strong> ${escapeHtml(issue.message)}</p>
      <p><strong>Selector:</strong> <code>${escapeHtml(issue.selector)}</code></p>
      ${issue.context ? `<p><strong>Context:</strong> <code>${escapeHtml(issue.context)}</code></p>` : ''}
    </div>
  `).join('');
  
  return `
    <div class="detailed-section">
      <h2><i class="fas fa-universal-access"></i> Accessibility Audit</h2>
      <p><strong>Total Issues Found:</strong> ${pa11y.issueCount}</p>
      ${issues}
    </div>
  `;
}

function getScoreClass(score) {
  if (score >= 90) return 'score-good';
  if (score >= 50) return 'score-warning';
  return 'score-bad';
}

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
