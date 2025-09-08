import fs from 'fs';
import path from 'path';

/**
 * YellowLab Tools Style Report Generator
 * 
 * Features:
 * - Clean, professional design similar to YellowLab Tools
 * - Detailed performance metrics
 * - Interactive charts and visualizations
 * - Comprehensive element analysis
 * - Modern UI with smooth animations
 */

export function generateYellowLabStyleReport(results, outputPath = 'report.html') {
  const summary = calculateYellowLabSummary(results);
  const html = generateYellowLabHtmlContent(results, summary);
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`📊 YellowLab-style report generated: ${outputPath}`);
}

function calculateYellowLabSummary(results) {
  const firstResult = results.results && results.results[0] ? results.results[0] : results;
  const e2eRuns = Array.isArray(firstResult?.flows?.runs)
    ? firstResult.flows.runs
    : (Array.isArray(results?.runs) ? results.runs : []);
  
  // Extract detailed metrics
  let totalButtons = 0;
  let workingButtons = 0;
  let totalLinks = 0;
  let workingLinks = 0;
  let totalForms = 0;
  let contactForms = 0;
  let totalPages = 0;
  let performanceScore = 0;
  let accessibilityScore = 0;
  let seoScore = 0;
  
  // Lighthouse scores
  if (firstResult.lighthouse?.scores) {
    performanceScore = firstResult.lighthouse.scores.performance || 0;
    accessibilityScore = firstResult.lighthouse.scores.accessibility || 0;
    seoScore = firstResult.lighthouse.scores.seo || 0;
  }
  
  // E2E metrics
  e2eRuns.forEach(run => {
    if (run.result) {
      if (run.file === 'buttons.test.js' && run.result.pagesChecked) {
        run.result.pagesChecked.forEach(page => {
          totalButtons += page.buttonsFound || 0;
          workingButtons += page.buttonResults?.filter(btn => btn.working).length || 0;
          totalPages++;
        });
      }
      
      if (run.file === 'navigation.test.js' && run.result.results) {
        run.result.results.forEach(result => {
          if (result.working) workingLinks++;
          totalLinks++;
        });
      }
      
      if (run.file === 'form-contact.test.js' && run.result.results) {
        run.result.results.forEach(result => {
          totalForms += result.formsFound || 0;
          contactForms += result.contactFormsFound || 0;
        });
      }
    }
  });
  
  return {
    performance: {
      score: performanceScore,
      grade: getGrade(performanceScore)
    },
    accessibility: {
      score: accessibilityScore,
      grade: getGrade(accessibilityScore)
    },
    seo: {
      score: seoScore,
      grade: getGrade(seoScore)
    },
    elements: {
      buttons: {
        total: totalButtons,
        working: workingButtons,
        broken: totalButtons - workingButtons,
        successRate: totalButtons > 0 ? Math.round((workingButtons / totalButtons) * 100) : 100
      },
      links: {
        total: totalLinks,
        working: workingLinks,
        broken: totalLinks - workingLinks,
        successRate: totalLinks > 0 ? Math.round((workingLinks / totalLinks) * 100) : 100
      },
      forms: {
        total: totalForms,
        contact: contactForms,
        other: totalForms - contactForms
      }
    },
    pages: {
      total: totalPages
    }
  };
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateYellowLabHtmlContent(results, summary) {
  const timestamp = new Date().toLocaleString();
  const firstResult = results.results && results.results[0] ? results.results[0] : results;
  const testUrl = results.url || firstResult.url || 'Unknown URL';
  const e2eRuns = Array.isArray(firstResult?.flows?.runs)
    ? firstResult.flows.runs
    : (Array.isArray(results?.runs) ? results.runs : []);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Analysis Report - ${escapeHtml(testUrl)}</title>
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <style>
        :root {
            --primary: #2c3e50;
            --secondary: #3498db;
            --success: #27ae60;
            --warning: #f39c12;
            --danger: #e74c3c;
            --light: #ecf0f1;
            --dark: #2c3e50;
            --border-radius: 8px;
            --shadow: 0 2px 10px rgba(0,0,0,0.1);
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
            color: var(--dark);
            background: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
            padding: 40px;
            border-radius: var(--border-radius);
            margin-bottom: 30px;
            text-align: center;
            box-shadow: var(--shadow);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header .url {
            font-size: 1.2em;
            opacity: 0.9;
            word-break: break-all;
        }
        
        .header .timestamp {
            margin-top: 10px;
            opacity: 0.8;
        }
        
        /* Score Cards */
        .scores-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .score-card {
            background: white;
            padding: 30px;
            border-radius: var(--border-radius);
            text-align: center;
            box-shadow: var(--shadow);
            transition: var(--transition);
            border-left: 4px solid;
        }
        
        .score-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        
        .score-card.performance { border-left-color: var(--secondary); }
        .score-card.accessibility { border-left-color: var(--success); }
        .score-card.seo { border-left-color: var(--warning); }
        
        .score-value {
            font-size: 3em;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .score-card.performance .score-value { color: var(--secondary); }
        .score-card.accessibility .score-value { color: var(--success); }
        .score-card.seo .score-value { color: var(--warning); }
        
        .score-grade {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .score-label {
            color: #666;
            font-size: 1.1em;
            font-weight: 500;
        }
        
        /* Elements Analysis */
        .elements-section {
            background: white;
            border-radius: var(--border-radius);
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: var(--shadow);
        }
        
        .section-title {
            font-size: 1.8em;
            margin-bottom: 25px;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .elements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .element-card {
            background: var(--light);
            padding: 25px;
            border-radius: var(--border-radius);
            text-align: center;
            transition: var(--transition);
        }
        
        .element-card:hover {
            background: #d5dbdb;
        }
        
        .element-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
        }
        
        .element-icon.buttons { color: var(--secondary); }
        .element-icon.links { color: var(--success); }
        .element-icon.forms { color: var(--warning); }
        
        .element-title {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--dark);
        }
        
        .element-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 15px;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.5em;
            font-weight: 700;
            color: var(--dark);
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #666;
        }
        
        .success-rate {
            background: var(--success);
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
            margin-top: 10px;
            display: inline-block;
        }
        
        /* Charts */
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
            box-shadow: var(--shadow);
        }
        
        .chart-title {
            font-size: 1.3em;
            margin-bottom: 20px;
            color: var(--dark);
            text-align: center;
        }
        
        .chart-wrapper {
            position: relative;
            height: 300px;
        }
        
        /* Detailed Analysis */
        .detailed-section {
            background: white;
            border-radius: var(--border-radius);
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: var(--shadow);
        }
        
        .page-analysis {
            display: grid;
            gap: 20px;
        }
        
        .page-card {
            border: 1px solid #e9ecef;
            border-radius: var(--border-radius);
            padding: 20px;
            transition: var(--transition);
        }
        
        .page-card:hover {
            border-color: var(--secondary);
            box-shadow: 0 2px 10px rgba(52, 152, 219, 0.1);
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .page-title {
            font-size: 1.2em;
            font-weight: 600;
            color: var(--dark);
        }
        
        .page-url {
            color: var(--secondary);
            text-decoration: none;
            font-size: 0.9em;
        }
        
        .page-url:hover {
            text-decoration: underline;
        }
        
        .page-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .metric {
            text-align: center;
            padding: 15px;
            background: var(--light);
            border-radius: var(--border-radius);
        }
        
        .metric-value {
            font-size: 1.5em;
            font-weight: 700;
            color: var(--secondary);
        }
        
        .metric-label {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        
        /* Button Analysis */
        .button-analysis {
            margin-top: 15px;
        }
        
        .button-list {
            display: grid;
            gap: 10px;
        }
        
        .button-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px;
            background: var(--light);
            border-radius: var(--border-radius);
            border-left: 4px solid var(--success);
        }
        
        .button-item.broken {
            border-left-color: var(--danger);
        }
        
        .button-status {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
        }
        
        .button-status.working {
            background: #d4edda;
            color: #155724;
        }
        
        .button-status.broken {
            background: #f8d7da;
            color: #721c24;
        }
        
        .button-text {
            flex: 1;
            font-weight: 500;
        }
        
        .button-type {
            background: var(--secondary);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
        }
        
        /* Collapsible */
        .collapsible {
            margin-top: 15px;
        }
        
        .collapsible-header {
            background: var(--light);
            padding: 15px;
            border-radius: var(--border-radius);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: var(--transition);
        }
        
        .collapsible-header:hover {
            background: #d5dbdb;
        }
        
        .collapsible-content {
            padding: 20px;
            background: white;
            border-radius: 0 0 var(--border-radius) var(--border-radius);
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
        
        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .scores-grid {
                grid-template-columns: 1fr;
            }
            
            .elements-grid {
                grid-template-columns: 1fr;
            }
            
            .charts-section {
                grid-template-columns: 1fr;
            }
            
            .page-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1><i class="fas fa-chart-line"></i> Website Analysis Report</h1>
            <div class="url">${escapeHtml(testUrl)}</div>
            <div class="timestamp">Generated on ${timestamp}</div>
        </div>
        
        <!-- Performance Scores -->
        <div class="scores-grid">
            <div class="score-card performance">
                <div class="score-value">${summary.performance.score}</div>
                <div class="score-grade">${summary.performance.grade}</div>
                <div class="score-label">Performance</div>
            </div>
            <div class="score-card accessibility">
                <div class="score-value">${summary.accessibility.score}</div>
                <div class="score-grade">${summary.accessibility.grade}</div>
                <div class="score-label">Accessibility</div>
            </div>
            <div class="score-card seo">
                <div class="score-value">${summary.seo.score}</div>
                <div class="score-grade">${summary.seo.grade}</div>
                <div class="score-label">SEO</div>
            </div>
        </div>
        
        <!-- Elements Analysis -->
        <div class="elements-section">
            <h2 class="section-title">
                <i class="fas fa-cogs"></i> Elements Analysis
            </h2>
            <div class="elements-grid">
                <div class="element-card">
                    <div class="element-icon buttons"><i class="fas fa-mouse-pointer"></i></div>
                    <div class="element-title">Buttons</div>
                    <div class="element-stats">
                        <div class="stat">
                            <div class="stat-value">${summary.elements.buttons.total}</div>
                            <div class="stat-label">Total</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${summary.elements.buttons.working}</div>
                            <div class="stat-label">Working</div>
                        </div>
                    </div>
                    <div class="success-rate">${summary.elements.buttons.successRate}% Success</div>
                </div>
                
                <div class="element-card">
                    <div class="element-icon links"><i class="fas fa-link"></i></div>
                    <div class="element-title">Links</div>
                    <div class="element-stats">
                        <div class="stat">
                            <div class="stat-value">${summary.elements.links.total}</div>
                            <div class="stat-label">Total</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${summary.elements.links.working}</div>
                            <div class="stat-label">Working</div>
                        </div>
                    </div>
                    <div class="success-rate">${summary.elements.links.successRate}% Success</div>
                </div>
                
                <div class="element-card">
                    <div class="element-icon forms"><i class="fas fa-wpforms"></i></div>
                    <div class="element-title">Forms</div>
                    <div class="element-stats">
                        <div class="stat">
                            <div class="stat-value">${summary.elements.forms.total}</div>
                            <div class="stat-label">Total</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${summary.elements.forms.contact}</div>
                            <div class="stat-label">Contact</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="charts-section">
            <div class="chart-container">
                <h3 class="chart-title">Performance Scores</h3>
                <div class="chart-wrapper">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>
            <div class="chart-container">
                <h3 class="chart-title">Button Analysis</h3>
                <div class="chart-wrapper">
                    <canvas id="buttonChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Detailed Analysis -->
        ${generateDetailedAnalysis(e2eRuns)}
        
        <!-- Navigation Analysis -->
        ${generateNavigationAnalysis(e2eRuns)}
    </div>
    
    <script>
        // Charts
        document.addEventListener('DOMContentLoaded', function() {
            // Performance Chart
            const perfCtx = document.getElementById('performanceChart').getContext('2d');
            new Chart(perfCtx, {
                type: 'radar',
                data: {
                    labels: ['Performance', 'Accessibility', 'SEO'],
                    datasets: [{
                        label: 'Scores',
                        data: [${summary.performance.score}, ${summary.accessibility.score}, ${summary.seo.score}],
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(52, 152, 219, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            
            // Button Chart
            const buttonCtx = document.getElementById('buttonChart').getContext('2d');
            new Chart(buttonCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Working', 'Broken'],
                    datasets: [{
                        data: [${summary.elements.buttons.working}, ${summary.elements.buttons.broken}],
                        backgroundColor: ['#27ae60', '#e74c3c'],
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
  
  // Button Analysis
  const buttonsTest = e2eRuns.find(r => r.file === 'buttons.test.js');
  if (buttonsTest && buttonsTest.result && buttonsTest.result.pagesChecked) {
    html += `
      <div class="detailed-section">
        <h2 class="section-title">
          <i class="fas fa-mouse-pointer"></i> Button Analysis
        </h2>
        <div class="page-analysis">
    `;
    
    buttonsTest.result.pagesChecked.forEach(page => {
      html += `
        <div class="page-card">
          <div class="page-header">
            <div class="page-title">${escapeHtml(page.title || 'Untitled Page')}</div>
            <a href="${escapeHtml(page.url)}" class="page-url" target="_blank">
              <i class="fas fa-external-link-alt"></i> View Page
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
              <div class="metric-label">Issues</div>
            </div>
          </div>
          
          ${page.buttonResults && page.buttonResults.length > 0 ? `
            <div class="collapsible">
              <div class="collapsible-header">
                <span><i class="fas fa-list"></i> Button Details</span>
                <i class="fas fa-chevron-down toggle-icon"></i>
              </div>
              <div class="collapsible-content">
                <div class="button-analysis">
                  <div class="button-list">
                    ${page.buttonResults.map(button => `
                      <div class="button-item ${button.working ? '' : 'broken'}">
                        <span class="button-status ${button.working ? 'working' : 'broken'}">
                          <i class="fas fa-${button.working ? 'check' : 'times'}"></i>
                          ${button.working ? 'Working' : 'Issue'}
                        </span>
                        <span class="button-text">${escapeHtml(button.button || 'Unnamed Button')}</span>
                        <span class="button-type">${escapeHtml(button.tagName || 'unknown')}</span>
                      </div>
                    `).join('')}
                  </div>
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
  
  return html;
}

function generateNavigationAnalysis(e2eRuns) {
  let html = '';
  
  // Navigation Analysis
  const navigationTest = e2eRuns.find(r => r.file === 'navigation.test.js');
  if (navigationTest && navigationTest.result && navigationTest.result.pagesChecked) {
    html += `
      <div class="detailed-section">
        <h2 class="section-title">
          <i class="fas fa-sitemap"></i> Navigation Analysis
        </h2>
        <div class="page-analysis">
    `;
    
    navigationTest.result.pagesChecked.forEach(page => {
      html += `
        <div class="page-card">
          <div class="page-header">
            <div class="page-title">${escapeHtml(page.title || 'Untitled Page')}</div>
            <a href="${escapeHtml(page.url)}" class="page-url" target="_blank">
              <i class="fas fa-external-link-alt"></i> View Page
            </a>
          </div>
          
          <div class="page-metrics">
            <div class="metric">
              <div class="metric-value">${page.headerNav?.links?.length || 0}</div>
              <div class="metric-label">Header Links</div>
            </div>
            <div class="metric">
              <div class="metric-value">${page.footerNav?.links?.length || 0}</div>
              <div class="metric-label">Footer Links</div>
            </div>
            <div class="metric">
              <div class="metric-value">${page.headerNav?.found ? 'Yes' : 'No'}</div>
              <div class="metric-label">Header Nav</div>
            </div>
            <div class="metric">
              <div class="metric-value">${page.footerNav?.found ? 'Yes' : 'No'}</div>
              <div class="metric-label">Footer Nav</div>
            </div>
          </div>
          
          ${page.headerNav && page.headerNav.found ? `
            <div class="collapsible">
              <div class="collapsible-header">
                <span><i class="fas fa-header"></i> Header Navigation</span>
                <i class="fas fa-chevron-down toggle-icon"></i>
              </div>
              <div class="collapsible-content">
                <div class="button-analysis">
                  <div class="button-list">
                    ${page.headerNav.links.map(link => `
                      <div class="button-item">
                        <span class="button-status working">
                          <i class="fas fa-check"></i> Working
                        </span>
                        <span class="button-text">${escapeHtml(link.text || 'Unnamed Link')}</span>
                        <span class="button-type">${escapeHtml(link.href || 'unknown')}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${page.footerNav && page.footerNav.found ? `
            <div class="collapsible">
              <div class="collapsible-header">
                <span><i class="fas fa-footer"></i> Footer Navigation</span>
                <i class="fas fa-chevron-down toggle-icon"></i>
              </div>
              <div class="collapsible-content">
                <div class="button-analysis">
                  <div class="button-list">
                    ${page.footerNav.links.map(link => `
                      <div class="button-item">
                        <span class="button-status working">
                          <i class="fas fa-check"></i> Working
                        </span>
                        <span class="button-text">${escapeHtml(link.text || 'Unnamed Link')}</span>
                        <span class="button-type">${escapeHtml(link.href || 'unknown')}</span>
                      </div>
                    `).join('')}
                  </div>
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
  
  return html;
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
