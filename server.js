import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runFlowsForUrl } from './src/flowsRunner.js';
import { auditAll } from './src/audit.js';
import { generateHtmlReport } from './src/reportGenerator.js';
import { formatToSimpleResults, formatAsString, formatAsJSON } from './src/simpleResultFormatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Don't serve static files from public - we're using inline HTML

// Serve the main web interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Test Runner</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
        }
        
        .form-group input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .examples {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .examples h3 {
            color: #333;
            margin-bottom: 15px;
        }
        
        .examples ul {
            list-style: none;
            padding: 0;
        }
        
        .examples li {
            padding: 5px 0;
            color: #666;
        }
        
        .examples li:before {
            content: "🌐 ";
            margin-right: 8px;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #dc3545;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Website Testing Tool</h1>
            <p>Lighthouse + Pa11y + Playwright E2E Tests</p>
        </div>
        
        <form id="testForm" action="/run-tests" method="POST">
            <div class="form-group">
                <label for="url">Website URL:</label>
                <input 
                    type="url" 
                    id="url" 
                    name="url" 
                    placeholder="https://example.com" 
                    required
                    value="https://example.com"
                >
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="simple" name="simple" value="true">
                    Simple Output Format (Test Name + Pass/Fail)
                </label>
            </div>
            
            <div class="form-group" id="formatGroup" style="display: none;">
                <label for="format">Output Format:</label>
                <select id="format" name="format">
                    <option value="string">Readable Text</option>
                    <option value="json">JSON</option>
                </select>
            </div>
            
            <button type="submit" class="btn" id="submitBtn">
                🚀 Run Full Test Suite
            </button>
        </form>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Running full test suite (Lighthouse + Pa11y + E2E)... This may take a few minutes.</p>
        </div>
        
        <div class="examples">
            <h3>Example URLs:</h3>
            <ul>
                <li>https://n227.enkonix.online/</li>
                <li>https://example.com</li>
                <li>https://httpbin.org</li>
            </ul>
        </div>
    </div>
    
    <script>
        document.getElementById('testForm').addEventListener('submit', function(e) {
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Running Tests...';
            loading.style.display = 'block';
        });
        
        // Show/hide format options based on simple checkbox
        document.getElementById('simple').addEventListener('change', function(e) {
            const formatGroup = document.getElementById('formatGroup');
            formatGroup.style.display = e.target.checked ? 'block' : 'none';
        });
    </script>
</body>
</html>
  `);
});

// Handle test execution
app.post('/run-tests', async (req, res) => {
  console.log('📥 POST /run-tests received:', req.body);
  
  const { url, simple, format } = req.body;
  
  if (!url) {
    console.log('❌ No URL provided');
    return res.status(400).send(`
      <div style="padding: 20px; text-align: center;">
        <h2>Error: URL is required</h2>
        <a href="/" style="color: #667eea;">← Back to form</a>
      </div>
    `);
  }
  
  try {
    console.log(`🧪 Running full test suite for: ${url}`);
    
    // Run the full test suite (Lighthouse + Pa11y + E2E)
    const results = await auditAll([url], {});
    console.log('📊 Test results:', JSON.stringify(results, null, 2));
    
    // Generate enhanced HTML report
    generateHtmlReport(results);
    console.log('📄 Enhanced HTML report generated');
    
    console.log(`✅ Full test suite completed for: ${url}`);
    
    // Handle simple format output
    if (simple) {
      const simpleResults = formatToSimpleResults(results);
      if (format === 'json') {
        return res.json(simpleResults);
      } else {
        return res.send(`<pre>${formatAsString(simpleResults)}</pre>`);
      }
    }
    
    // Redirect to report
    res.redirect('/report');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).send(`
      <div style="padding: 20px; text-align: center;">
        <h2>Test Execution Failed</h2>
        <div class="error" style="margin: 20px 0; text-align: left; background: #f8d7da; padding: 15px; border-radius: 5px;">
          <strong>Error:</strong> ${error.message || 'Unknown error occurred'}<br>
          <strong>Stack:</strong> ${error.stack || 'No stack trace available'}
        </div>
        <a href="/" style="color: #667eea;">← Back to form</a>
      </div>
    `);
  }
});

// Serve the generated report
app.get('/report', (req, res) => {
  const reportPath = path.join(__dirname, 'report.html');
  
  // Check if report exists
  if (fs.existsSync(reportPath)) {
    res.sendFile(reportPath);
  } else {
    res.status(404).send(`
      <div style="padding: 20px; text-align: center;">
        <h2>Report Not Found</h2>
        <p>No test report available. Please run tests first.</p>
        <a href="/" style="color: #667eea;">← Run Tests</a>
      </div>
    `);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 E2E Test Runner web interface running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

export default app;