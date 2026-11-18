// Renders the AeroMind reel frame by frame (deterministic, no dropped frames).
// Usage, from the repo root, with a static server running (python3 -m http.server 8000):
//   node tools/reel/capture.js wide     frames-wide
//   node tools/reel/capture.js portrait frames-portrait
// Then encode (see tools/reel/README.md).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [, , kind = 'wide', dir = 'frames', base = 'http://localhost:8000'] = process.argv;
  const portrait = kind === 'portrait';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: portrait ? 1080 : 1920, height: portrait ? 1920 : 1080 } });
  await page.goto(`${base}/tools/reel/reel.html${portrait ? '?v=portrait' : ''}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.READY);
  fs.mkdirSync(dir, { recursive: true });
  const frames = Math.round(21.5 * 30);
  for (let i = 0; i < frames; i++) {
    const data = await page.evaluate((t) => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.92); }, i / 30);
    fs.writeFileSync(`${dir}/f_${String(i).padStart(4, '0')}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
  }
  await browser.close();
})();
