async function api(path, opts={}){
  const r = await fetch(path, { headers: {'Content-Type':'application/json'}, ...opts });
  return await r.json();
}

const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const historyEl = document.getElementById('history');

async function loadHistory(){
  const res = await api('/api/results');
  if (!res.ok) return;
  historyEl.innerHTML = '';
  for(const run of res.results){
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = \`
      <div><strong>Run</strong> <code>\${run.id}</code> — \${new Date(run.startedAt).toLocaleString()}</div>
      <div>Thresholds: <code>\${JSON.stringify(run.thresholds)}</code></div>
      <div>URLs: \${run.results.map(r=>r.url).join(', ')}</div>
    \`;
    historyEl.appendChild(div);
  }
}

async function runAudit(){
  const url = document.getElementById('url').value.trim();
  if(!url) return alert('Please enter URL(s)');
  let thresholds = undefined;
  const tRaw = document.getElementById('thresholds').value.trim();
  if (tRaw) { try { thresholds = JSON.parse(tRaw); } catch (e) { return alert('Thresholds JSON invalid'); } }

  statusEl.textContent = 'Running...';
  resultsEl.innerHTML = '';
  const res = await api('/api/audit', { method:'POST', body: JSON.stringify({ url, thresholds }) });
  statusEl.textContent = '';
  if (!res.ok) { resultsEl.textContent = 'Error: ' + res.error; return; }
  renderRun(res.run);
  loadHistory();
}

function renderRun(run){
  for(const i in run.results){
    const r = run.results[i];
    const verdict = run.verdicts[i];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = \`
      <h3>\${r.url}</h3>
      <div class="badge \${verdict.passed? 'pass':'fail'}">\${verdict.passed? 'PASSED':'FAILED'}</div>
      <div class="grid" style="margin-top:10px">
        <div class="kv"><span>Requests</span><strong>\${r.puppeteer.requestCount}</strong></div>
        <div class="kv"><span>Transfer KB</span><strong>\${r.puppeteer.transferKB}</strong></div>
        <div class="kv"><span>DOM Depth</span><strong>\${r.puppeteer.domDepth}</strong></div>
        <div class="kv"><span>Images without alt</span><strong>\${r.puppeteer.imagesWithoutAlt}</strong></div>
        <div class="kv"><span>LH Performance</span><strong>\${r.lighthouse.scores.performance}</strong></div>
        <div class="kv"><span>LH Accessibility</span><strong>\${r.lighthouse.scores.accessibility}</strong></div>
        <div class="kv"><span>LH SEO</span><strong>\${r.lighthouse.scores.seo}</strong></div>
        <div class="kv"><span>pa11y issues</span><strong>\${r.pa11y.issueCount ?? (r.pa11y.error || '-')}</strong></div>
      </div>
      <div style="margin-top:12px">
        <canvas id="chart-\${i}" height="160"></canvas>
      </div>
      <details style="margin-top:10px">
        <summary>Raw</summary>
        <pre>\${JSON.stringify(r, null, 2)}</pre>
      </details>
      <details>
        <summary>Threshold failures</summary>
        <pre>\${JSON.stringify(verdict.fails, null, 2)}</pre>
      </details>
    \`;
    resultsEl.appendChild(card);
    const ctx = card.querySelector('canvas').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Req', 'KB', 'DOM', 'LH Perf', 'LH Acc', 'LH SEO'],
        datasets: [{
          label: 'Metrics',
          data: [
            r.puppeteer.requestCount,
            r.puppeteer.transferKB,
            r.puppeteer.domDepth,
            r.lighthouse.scores.performance,
            r.lighthouse.scores.accessibility,
            r.lighthouse.scores.seo
          ]
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }
}

document.getElementById('runBtn').addEventListener('click', runAudit);
loadHistory();
