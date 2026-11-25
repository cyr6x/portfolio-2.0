// Whitebox test suite for the portfolio.
// Run: node --test tests/
// These tests deliberately reach into implementation details (global case data,
// named animation loops, pseudo-elements, computed palette, CSP) so regressions in
// the cascade or the JS controllers fail loudly instead of only looking "a bit off".
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, startServer, launch, openSite, scrollToSection, activeLoops, settleReveals } from './harness.mjs';

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const html = read('index.html');
const scripts = { 'app.js': read('app.js'), 'refine.js': read('refine.js') };
const css = { 'styles.css': read('styles.css'), 'refine.css': read('refine.css') };

let server, url, browser;
before(async () => { ({ server, url } = await startServer()); browser = await launch(); });
after(async () => { await browser?.close(); server?.close(); });

/* ------------------------------------------------------------------ */
/* In-page audit helpers (passed to page.evaluate; CSP does not apply). */

// Returns visible text elements with their contrast ratio and font size.
function textAudit() {
  const toRgba = c => {
    if (!c || c === 'transparent') return [0, 0, 0, 0];
    const srgb = c.match(/^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/);
    if (srgb) return [srgb[1] * 255, srgb[2] * 255, srgb[3] * 255, srgb[4] === undefined ? 1 : +srgb[4]];
    const m = c.match(/[\d.]+/g).map(Number);
    return [m[0], m[1], m[2], m[3] === undefined ? 1 : m[3]];
  };
  const over = (top, bottom) => {
    const a = top[3] + bottom[3] * (1 - top[3]);
    if (!a) return [0, 0, 0, 0];
    return [0, 1, 2].map(i => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a).concat(a);
  };
  const lum = ([r, g, b]) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const base = toRgba(getComputedStyle(document.body).backgroundColor);
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!['SCRIPT', 'STYLE', 'CANVAS'].includes(el.tagName) &&
        [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (s.visibility !== 'visible' || !r.width || !r.height) continue;
      if (el.closest('#root-loader,.skip-link,dialog:not([open])')) continue;
      let opacity = 1, chain = [];
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const ns = getComputedStyle(n);
        opacity *= +ns.opacity;
        chain.push(toRgba(ns.backgroundColor));
      }
      if (opacity < 0.98) continue; // mid-transition / scroll-choreographed; judged in its settled state elsewhere
      let bg = base;
      for (const layer of chain.reverse()) bg = over(layer, bg);
      const fg = over(toRgba(s.color), bg);
      const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      const size = parseFloat(s.fontSize);
      const large = size >= 24 || (size >= 18.66 && +s.fontWeight >= 700);
      out.push({
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
        cls: (el.className?.toString?.() || el.tagName).split(' ')[0],
        decorative: Boolean(el.closest('[aria-hidden="true"]')),
        ratio: +((l1 + 0.05) / (l2 + 0.05)).toFixed(2),
        need: large ? 3 : 4.5,
        size,
      });
    }
  }
  return out;
}

// Returns chromatic colors on visible elements whose hue falls outside the accent family.
function paletteAudit(hueRange) {
  const toHsl = c => {
    const srgb = c.match(/^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/);
    const m = srgb ? [srgb[1] * 255, srgb[2] * 255, srgb[3] * 255, srgb[4] ?? 1].map(Number) : (c.match(/[\d.]+/g) || []).map(Number);
    if (m.length < 3) return null;
    const [r, g, b] = m.map(v => v / 255), a = m[3] ?? 1;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return { h: 0, s: 0, l, a };
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = (max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    return { h: (h + 360) % 360, s, l, a };
  };
  const offenders = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (s.visibility !== 'visible' || s.display === 'none' || !r.width || +s.opacity < 0.05) continue;
    if (el.closest('.theme-orbit')) continue; // deliberate exception: the amber "sun" glyph in the theme toggle
    const props = [['color', s.color], ['background', s.backgroundColor]];
    if (parseFloat(s.borderTopWidth) > 0) props.push(['border', s.borderTopColor]);
    for (const [prop, value] of props) {
      const hsl = toHsl(value);
      if (!hsl || hsl.a < 0.12 || hsl.s < 0.3 || hsl.l < 0.12 || hsl.l > 0.92) continue;
      if (hsl.h < hueRange[0] || hsl.h > hueRange[1]) {
        offenders.set(`${prop}:${value}`, (el.className?.toString?.() || el.tagName).split(' ')[0]);
      }
    }
  }
  return [...offenders].map(([k, v]) => `${v} ${k}`);
}

/* ------------------------------------------------------------------ */
describe('static: security posture', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || '';

  test('CSP is restrictive and enforces Trusted Types', () => {
    for (const d of ["default-src 'none'", "base-uri 'none'", "object-src 'none'", "script-src 'self'",
      "connect-src 'none'", "form-action 'none'", 'upgrade-insecure-requests', "require-trusted-types-for 'script'"]) {
      assert.ok(csp.includes(d), `CSP missing: ${d}`);
    }
    assert.ok(!/unsafe-(inline|eval)/.test(csp), 'CSP must not allow unsafe-inline/unsafe-eval');
  });

  test('JS has no HTML-string DOM sinks (innerHTML, insertAdjacentHTML, document.write)', () => {
    for (const [file, src] of Object.entries(scripts)) {
      assert.ok(!/\.(inner|outer)HTML\s*=|insertAdjacentHTML|document\.write/.test(src), `${file} uses an HTML sink`);
      assert.ok(!/\beval\s*\(|new Function\s*\(/.test(src), `${file} uses eval/Function`);
    }
  });

  test('no inline scripts, inline handlers or forms in HTML', () => {
    assert.ok(!/<script[^>]*>\s*[^<\s]/i.test(html), 'inline script');
    assert.ok(!/\son[a-z]+\s*=/i.test(html), 'inline event handler');
    assert.ok(!/<form/i.test(html), 'unexpected form');
  });

  test('external links are HTTPS and isolate the opener (HTML and JS-rendered)', () => {
    for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/gi) || []) {
      const rel = (tag.match(/rel="([^"]*)"/i)?.[1] || '').split(/\s+/);
      assert.ok(rel.includes('noopener') && rel.includes('noreferrer'), tag);
    }
    for (const href of html.match(/href="https?:[^"]+"/gi) || []) assert.ok(href.startsWith('href="https://'), href);
    for (const repo of scripts['app.js'].match(/repo:'[^']+'/g) || []) assert.ok(repo.startsWith("repo:'https://github.com/"), repo);
  });

  test('accent colour is defined once as a token, not scattered as literals', () => {
    const literal = /47\s*,\s*111\s*,\s*175|#2f6faf/gi;
    for (const [file, src] of Object.entries(css)) {
      const hits = (src.match(literal) || []).length;
      assert.ok(hits <= 2, `${file} hard-codes the accent ${hits} times; use var(--accent-rgb)`);
    }
    for (const [file, src] of Object.entries(scripts)) {
      assert.equal((src.match(literal) || []).length, 0, `${file} hard-codes the accent; read it from CSS`);
    }
  });
});

/* ------------------------------------------------------------------ */
describe('runtime: correctness', () => {
  test('no runtime errors or CSP violations across a full scroll in both themes', async () => {
    for (const theme of ['dark', 'light']) {
      const { page, context, errors } = await openSite(browser, url, { theme });
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 700) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(40); }
      await page.locator('.case-open').first().evaluate(el => el.click()); // card may be translated off-viewport by the horizontal track
      const csp = await page.evaluate(() => window.__cspViolations);
      assert.deepEqual(errors, [], theme);
      assert.deepEqual(csp, [], theme);
      await context.close();
    }
  });

  test('case data and case triggers are one-to-one, and the dialog shows the data it was given', async () => {
    const { page, context } = await openSite(browser, url);
    const { domKeys, dataKeys } = await page.evaluate(() => ({
      domKeys: [...new Set([...document.querySelectorAll('[data-case]')].map(e => e.dataset.case))].sort(),
      // eslint-disable-next-line no-undef
      dataKeys: Object.keys(caseFiles).sort(),
    }));
    assert.deepEqual(domKeys, dataKeys, 'every trigger needs data and every data entry needs a trigger');
    for (const key of domKeys) {
      const trigger = page.locator(`[data-case="${key}"] .case-open, .lab-row[data-case="${key}"]`).first();
      await trigger.evaluate(el => el.click());
      const [shown, expected, open] = await page.evaluate(k => [
        document.querySelector('#dialog-body h2')?.textContent,
        // eslint-disable-next-line no-undef
        caseFiles[k].title,
        document.querySelector('#case-dialog').open,
      ], key);
      assert.ok(open, `${key} dialog opens`);
      assert.equal(shown, expected, `${key} renders its own data (no shadow override)`);
      await page.keyboard.press('Escape');
    }
    await context.close();
  });

  test('case renderer treats data as text, never markup', async () => {
    const { page, context } = await openSite(browser, url);
    const result = await page.evaluate(() => {
      const payload = '<img src=x id=pwn>';
      // eslint-disable-next-line no-undef
      caseFiles.__probe = { title: payload, lede: payload, role: payload, method: payload, evidence: [payload], learning: payload, next: payload, repo: 'javascript:alert(1)' };
      // eslint-disable-next-line no-undef
      openCase('__probe');
      const link = document.querySelector('#dialog-body a');
      return {
        injected: Boolean(document.querySelector('#dialog-body img')),
        title: document.querySelector('#dialog-body h2').textContent,
        href: link ? link.getAttribute('href') : null,
      };
    });
    assert.equal(result.injected, false, 'markup in data must not become DOM');
    assert.equal(result.title, '<img src=x id=pwn>');
    assert.ok(!result.href || result.href.startsWith('https://'), 'non-https repo links are dropped');
    await context.close();
  });

  test('dialog closes on Escape and returns focus to its trigger', async () => {
    const { page, context } = await openSite(browser, url);
    await scrollToSection(page, '#investigations');
    const trigger = page.locator('#investigations .case-open').first();
    await trigger.focus();
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('#case-dialog').evaluate(d => d.open));
    await page.keyboard.press('Escape');
    assert.ok(!(await page.locator('#case-dialog').evaluate(d => d.open)));
    assert.ok(await trigger.evaluate(el => el === document.activeElement), 'focus returns to trigger');
    await context.close();
  });

  test('boot loader can be dismissed with Escape even after other keys were pressed', async () => {
    const { page, context } = await openSite(browser, url, { boot: true });
    await page.keyboard.press('Shift');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
    assert.match(await page.locator('#root-loader').getAttribute('class'), /is-leaving/);
    await context.close();
  });

  test('theme toggle updates state, ARIA and persistence', async () => {
    const { page, context } = await openSite(browser, url, { theme: 'dark' });
    await page.locator('#theme-toggle').click();
    const state = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      pressed: document.querySelector('#theme-toggle').getAttribute('aria-pressed'),
      stored: localStorage.getItem('cosmic-theme'),
      meta: document.querySelector('meta[name="theme-color"]').content,
    }));
    assert.deepEqual(state, { theme: 'light', pressed: 'true', stored: 'light', meta: '#edf3f7' });
    await context.close();
  });

  test('contact reveal shows both values and exposes expanded state', async () => {
    const { page, context } = await openSite(browser, url);
    await scrollToSection(page, '#contact');
    for (const kind of ['email', 'phone']) {
      const btn = page.locator(`[data-contact="${kind}"]`);
      await btn.evaluate(el => el.click());
      assert.equal(await btn.getAttribute('aria-expanded'), 'true');
      assert.equal(await btn.locator('.contact-value-stack span').count(), 2);
    }
    await context.close();
  });
});

/* ------------------------------------------------------------------ */
describe('runtime: animation discipline', () => {
  test('off-screen canvases and orbit controllers stop their rAF loops', async () => {
    const { page, context } = await openSite(browser, url);
    const atTop = await activeLoops(page);
    assert.ok(atTop.drawBrainGalaxy, 'hero galaxy animates while visible');
    await scrollToSection(page, '#arsenal');
    const mid = await activeLoops(page);
    for (const name of ['drawBrainGalaxy', 'orbitFrame', 'drawContactGalaxy']) {
      assert.ok(!mid[name], `${name} still running while its section is off-screen: ${JSON.stringify(mid)}`);
    }
    await context.close();
  });

  test('hidden tab runs no animation loops', async () => {
    const { page, context } = await openSite(browser, url);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(100);
    assert.deepEqual(await activeLoops(page), {});
    await context.close();
  });

  test('scrolling never rewrites inline styles on <html> (forces full-document style recalc)', async () => {
    const { page, context } = await openSite(browser, url);
    const writes = await page.evaluate(async () => {
      let n = 0;
      new MutationObserver(m => { n += m.length; }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
      for (let y = 0; y < 6000; y += 150) {
        scrollTo(0, y);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      return n;
    });
    assert.equal(writes, 0);
    await context.close();
  });

  test('transitions animate compositor-friendly properties only', async () => {
    const { page, context } = await openSite(browser, url);
    const bad = await page.evaluate(() => {
      const layout = /^(all|width|height|top|left|right|bottom|inset|margin.*|padding.*|letter-spacing|font-size)$/;
      const found = new Set();
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        const props = s.transitionProperty.split(',').map(p => p.trim());
        const durations = s.transitionDuration.split(',').map(parseFloat);
        props.forEach((p, i) => {
          if (layout.test(p) && (durations[i % durations.length] || 0) > 0) found.add(`${(el.id ? '#' + el.id : '.' + (el.className?.toString?.().split(' ')[0] || el.tagName))}:${p}`);
        });
      }
      return [...found];
    });
    assert.deepEqual(bad, []);
    await context.close();
  });

  test('reduced motion: no infinite animations, no loops, all content fully visible', async () => {
    const { page, context } = await openSite(browser, url, { reducedMotion: 'reduce' });
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
      infinite: document.getAnimations().filter(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length,
    }));
    assert.equal(state.infinite, 0, 'infinite CSS animations under reduced motion');
    assert.deepEqual(await activeLoops(page), {}, 'rAF loops under reduced motion');
    for (const sel of ['#about', '#arsenal', '#roadmap', '#contact']) {
      await scrollToSection(page, sel, 200);
      const faint = await page.evaluate(s => [...document.querySelectorAll(`${s} h1, ${s} h2, ${s} .reveal`)]
        .filter(e => +getComputedStyle(e).opacity < 0.99).map(e => e.className), sel);
      assert.deepEqual(faint, [], `${sel} content not fully visible`);
    }
    await context.close();
  });
});

/* ------------------------------------------------------------------ */
describe('runtime: layout, spacing and legibility', () => {
  test('section kickers and headings share a left edge', async () => {
    const { page, context } = await openSite(browser, url);
    await settleReveals(page);
    const off = await page.evaluate(() => [...document.querySelectorAll('section')].map(s => {
      const k = s.querySelector('.section-kicker'), h = s.querySelector('h1, h2');
      if (!k || !h || getComputedStyle(k.parentElement).textAlign === 'center') return null;
      const dx = Math.round(h.getBoundingClientRect().left - k.getBoundingClientRect().left);
      return Math.abs(dx) > 2 ? `${s.id}: heading ${dx}px from kicker` : null;
    }).filter(Boolean));
    assert.deepEqual(off, []);
    await context.close();
  });

  test('content sections use one vertical spacing scale', async () => {
    for (const width of [1440, 390]) {
      const { page, context } = await openSite(browser, url, { width, height: 900 });
      const pads = await page.evaluate(() => ['#about', '#investigations', '#archive', '#arsenal', '#roadmap']
        .map(s => { const c = getComputedStyle(document.querySelector(s)); return `${c.paddingTop}/${c.paddingBottom}`; }));
      assert.equal(new Set(pads).size, 1, `${width}px section padding drifts: ${pads.join(', ')}`);
      const top = parseFloat(pads[0]);
      assert.ok(top <= (width > 820 ? 136 : 96), `${width}px section padding ${top}px is excessive`);
      await context.close();
    }
  });

  test('desktop inline nav has no panel; the mobile dropdown does (both themes)', async () => {
    for (const theme of ['dark', 'light']) {
      const desk = await openSite(browser, url, { theme, width: 1440 });
      const deskBg = await desk.page.evaluate(() => getComputedStyle(document.querySelector('#nav-links')).backgroundColor);
      assert.equal(deskBg, 'rgba(0, 0, 0, 0)', `${theme} desktop nav paints a panel`);
      await desk.context.close();
      const mob = await openSite(browser, url, { theme, width: 390 });
      await mob.page.locator('#menu').click();
      const mobBg = await mob.page.evaluate(() => getComputedStyle(document.querySelector('#nav-links')).backgroundColor);
      assert.notEqual(mobBg, 'rgba(0, 0, 0, 0)', `${theme} mobile dropdown has no panel`);
      await mob.context.close();
    }
  });

  test('skill cards share one silhouette and decorations stay inside the card', async () => {
    const { page, context } = await openSite(browser, url);
    const cards = await page.evaluate(() => [...document.querySelectorAll('.skill-card')].map(c => {
      const b = getComputedStyle(c, '::before');
      return { radius: getComputedStyle(c).borderRadius, before: b.content !== 'none' ? { top: parseFloat(b.top), right: parseFloat(b.right) } : null };
    }));
    assert.equal(new Set(cards.map(c => c.radius)).size, 1, cards.map(c => c.radius).join(' | '));
    for (const c of cards) if (c.before) assert.ok(c.before.top >= 0 && c.before.right >= 0, 'decoration pokes outside card');
    await context.close();
  });

  test('no horizontal overflow and no unclipped content past the viewport', async () => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      const { page, context } = await openSite(browser, url, { width, height: 860 });
      const res = await page.evaluate(() => {
        const clipped = el => { for (let n = el.parentElement; n; n = n.parentElement) { const o = getComputedStyle(n); if (/hidden|clip/.test(o.overflowX) || /hidden|clip/.test(o.overflow)) return true; } return false; };
        const spill = [...document.querySelectorAll('main *')].filter(el => {
          if (el.closest('[aria-hidden="true"]')) return false;
          const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          return r.width && s.visibility === 'visible' && +s.opacity > 0.05 && (r.left < -1 || r.right > innerWidth + 1) && !clipped(el);
        }).slice(0, 5).map(el => el.className.toString().split(' ')[0]);
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, spill };
      });
      assert.ok(res.overflow <= 1, `${width}px page overflows by ${res.overflow}px`);
      assert.deepEqual(res.spill, [], `${width}px elements spill past viewport`);
      await context.close();
    }
  });

  test('desktop contact orbit never covers the CONNECT title and stays on screen', async () => {
    const { page, context } = await openSite(browser, url, { width: 1440, height: 900 });
    await page.evaluate(() => {
      const card = document.querySelector('.contact-card');
      scrollTo(0, card.getBoundingClientRect().top + scrollY - (innerHeight - card.offsetHeight) / 2);
    });
    const hits = new Set();
    for (let i = 0; i < 24; i++) {
      await page.waitForTimeout(120);
      (await page.evaluate(() => {
        const t = document.querySelector('.contact-title').getBoundingClientRect();
        const cx = t.left + t.width / 2, cy = t.top + t.height / 2, radius = Math.min(t.width, t.height) / 2;
        return [...document.querySelectorAll('.contact-side .pill')].flatMap(p => {
          const r = p.getBoundingClientRect();
          const nx = Math.max(r.left, Math.min(cx, r.right)), ny = Math.max(r.top, Math.min(cy, r.bottom));
          const label = p.textContent.trim().split(/\s/)[0];
          const issues = [];
          if (Math.hypot(nx - cx, ny - cy) < radius + 8) issues.push(`${label} overlaps title`);
          if (r.top < 64 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) issues.push(`${label} off-screen`);
          return issues;
        });
      })).forEach(h => hits.add(h));
    }
    assert.deepEqual([...hits], []);
    await context.close();
  });

  for (const theme of ['dark', 'light']) {
    test(`text meets WCAG AA contrast and minimum size (${theme})`, async () => {
      const { page, context } = await openSite(browser, url, { theme });
      await settleReveals(page);
      // Scroll-choreographed content (e.g. cards in the horizontal track) is only fully opaque at
      // certain positions, so audit at every section plus several stops through the project track.
      const stops = await page.evaluate(() => {
        const work = document.querySelector('#work');
        const workTop = work.getBoundingClientRect().top + scrollY; // offsetTop is relative to .projects-chapter
        const track = [0.2, 0.45, 0.7, 0.95].map(f => workTop + f * (work.offsetHeight - innerHeight));
        const sections = [...document.querySelectorAll('main section')].map(s => s.getBoundingClientRect().top + scrollY);
        return [0, ...track, ...sections];
      });
      const items = [];
      for (const y of stops) {
        await page.evaluate(top => scrollTo(0, top), y);
        await page.waitForTimeout(250);
        items.push(...await page.evaluate(textAudit));
      }
      // Decorative (aria-hidden) text is exempt from AA, but if it is drawn it must still be legible (3:1).
      const lowContrast = items.filter(i => i.ratio < (i.decorative ? 3 : i.need)).map(i => `${i.cls} "${i.text}" ${i.ratio}<${i.decorative ? 3 : i.need}`);
      const tiny = items.filter(i => i.size < (i.decorative ? 9 : 11)).map(i => `${i.cls} "${i.text}" ${i.size}px`);
      assert.deepEqual([...new Set(lowContrast)].slice(0, 20), [], 'low contrast');
      assert.deepEqual([...new Set(tiny)].slice(0, 20), [], 'text too small');
      await context.close();
    });

    test(`every chromatic colour belongs to the blue accent family (${theme})`, async () => {
      const { page, context } = await openSite(browser, url, { theme });
      await settleReveals(page);
      const offenders = await page.evaluate(paletteAudit, [195, 228]);
      assert.deepEqual(offenders, []);
      await context.close();
    });
  }
});

/* ------------------------------------------------------------------ */
describe('runtime: accessibility', () => {
  test('nothing focusable is hidden from assistive technology', async () => {
    const { page, context } = await openSite(browser, url);
    const leaks = await page.evaluate(() => [...document.querySelectorAll('[aria-hidden="true"] :is(a[href],button,input,[tabindex]:not([tabindex="-1"]))')]
      // checkVisibility() accounts for display:none ancestors (a child's own computed display does not)
      .filter(el => el.checkVisibility({ visibilityProperty: true }) && !el.closest('[inert]'))
      .map(el => el.textContent.trim()));
    assert.deepEqual(leaks, []);
    await context.close();
  });

  test('interactive controls have accessible names and images have alt text', async () => {
    const { page, context } = await openSite(browser, url);
    const missing = await page.evaluate(() => [
      ...[...document.querySelectorAll('a[href],button')].filter(el => !(el.getAttribute('aria-label') || el.textContent.trim())).map(el => el.outerHTML.slice(0, 60)),
      ...[...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => i.src),
    ]);
    assert.deepEqual(missing, []);
    await context.close();
  });
});
