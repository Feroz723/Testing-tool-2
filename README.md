# Mini Lab Tools Pro

A modern, extensible website testing tool inspired by YellowLabTools — built with **Puppeteer**, **Lighthouse**, and **pa11y**. It includes:

- CLI & REST API
- Puppeteer metrics (requests, transfer size, DOM depth, script/style counts, images without `alt`, etc.)
- Lighthouse performance/a11y/SEO/best‑practices/PWA categories
- pa11y accessibility report
- Thresholds engine (fail conditions)
- Simple dashboard UI using Chart.js
- Dockerfile
- GitHub Actions CI example

> Note: Running Lighthouse/pa11y requires a Chromium/Chrome environment. `puppeteer` installs a bundled Chromium by default. Lighthouse will attempt to use it or your local Chrome.

## Quick Start

```bash
npm install
npm start
# open http://localhost:3000
```

### CLI

```bash
node cli.js --url=https://example.com --save
# or multiple URLs (comma‑separated)
node cli.js --url=https://example.com,https://web.dev --save
```

### API

- `POST /api/audit` – Body: `{ "url": "https://example.com", "thresholds": { ... } }`
- `GET /api/results` – All saved results
- `GET /api/results/:id` – A single saved run

### Thresholds (defaults)

```jsonc
{
  "maxRequests": 200,
  "maxTransferKB": 4000,
  "maxDomDepth": 60,
  "minLighthousePerformance": 60,
  "minAccessibility": 70
}
```

You can override thresholds in the body of `POST /api/audit` or via CLI flag `--thresholds=path/to/json`.

## Docker

```bash
docker build -t mini-lab-tools-pro .
docker run -p 3000:3000 mini-lab-tools-pro
```

## GitHub Actions

A sample workflow is in `.github/workflows/ci.yml`. It runs the CLI on `https://example.com` and uploads the JSON artifact.

## License

MIT


## E2E Functional Tests (Playwright)

This project now includes Playwright-based functional tests (tests/flows/*.test.js). Run with:

```
npm run e2e
# or
node cli.js --url=https://example.com --flows --save
```
