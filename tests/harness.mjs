// Shared test harness: static server + browser + page helpers.
// No package.json needed: resolves `playwright` (local dev) or `playwright-core` (CI).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function loadPlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try { return require(name); } catch { /* try next */ }
  }
  throw new Error('Install playwright or playwright-core to run the browser tests');
}

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

export function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    server,
    url: `http://127.0.0.1:${server.address().port}/`,
  })));
}

export async function launch() {
  const { chromium } = loadPlaywright();
  const opts = { args: ['--no-sandbox'] };
  if (process.env.CHROME_PATH) opts.executablePath = process.env.CHROME_PATH;
  return chromium.launch(opts);
}

/**
 * Opens the site with the boot loader skipped and instrumentation installed:
 *  - window.__raf counts requestAnimationFrame registrations per callback name
 *  - window.__cspViolations collects CSP/Trusted Types violations
 *  - errors[] collects page errors and console errors
 * Google Fonts are blocked so tests are hermetic and fast.
 */
export async function openSite(browser, url, {
  width = 1440, height = 900, theme = 'dark', reducedMotion = 'no-preference', boot = false,
} = {}) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    // Fonts are deliberately aborted below; their load failures are not site errors.
    if (m.type() === 'error' && !/fonts\.g/.test(m.text() + (m.location()?.url || ''))) errors.push('console: ' + m.text());
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(({ theme, boot }) => {
    if (!boot) sessionStorage.setItem('portfolio-root-booted', '1');
    localStorage.setItem('cosmic-theme', theme);
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', e => window.__cspViolations.push(e.violatedDirective + ' ' + e.blockedURI));
    const raf = window.requestAnimationFrame.bind(window);
    window.__raf = new Map();
    window.requestAnimationFrame = cb => {
      const key = cb.name || 'anonymous';
      window.__raf.set(key, (window.__raf.get(key) || 0) + 1);
      return raf(cb);
    };
  }, { theme, boot });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  return { page, context, errors };
}

/** Scrolls so `selector` is at the top of the viewport and lets scroll-driven state settle. */
export async function scrollToSection(page, selector, settle = 500) {
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    scrollTo(0, el.getBoundingClientRect().top + scrollY);
  }, selector);
  await page.waitForTimeout(settle);
}

/** Names of rAF loops that re-registered during a window of `ms`. */
export async function activeLoops(page, ms = 700) {
  await page.evaluate(() => window.__raf.clear());
  await page.waitForTimeout(ms);
  return page.evaluate(() => Object.fromEntries(window.__raf));
}

/** Forces every scroll/intersection-driven reveal into its final state. */
export async function settleReveals(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
    document.querySelectorAll('.scene-kinetic').forEach(e => { e.classList.remove('scene-await'); e.classList.add('scene-live'); });
  });
  await page.waitForTimeout(1100);
}
