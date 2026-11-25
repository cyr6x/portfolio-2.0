# UI hardening pass: animation, spacing, palette, security

Status: implemented on `claude/wizardly-planck-wo60lm`. Regression-guarded by `tests/site.test.mjs`.

## Why

The site was built in many additive CSS "final pass" layers (`refine.css` carried 374 `!important`s on top of
a minified `styles.css`). Each layer patched the previous one, so spacing, colour and motion drifted, and several
features from earlier iterations were left half-removed.

## What was wrong (found by debugging, then encoded as failing tests)

| Area | Defect | Fix |
| --- | --- | --- |
| Animation | 4 rAF loops ran forever, even off-screen (hero galaxy, orbits, mesh, cosmos) | Loops run only while visible, in a visible tab, in the theme where their canvas shows |
| Animation | Scroll handler rewrote `--brand` on `<html>` every frame (full-document style recalc; leftover red→blue hue sweep) | Removed |
| Animation | `transition: all` / layout props (`left`, `letter-spacing`, `padding`) on 14 element types | Transitions limited to colour, opacity and transform properties; progress comet uses `scaleX` / `translate` |
| Animation | Light-mode visitors saw dark→light fade on every load | `theme-init.js` sets the theme before first paint; colour transitions only while toggling |
| Animation | Contact pills orbiting over the CONNECT title | Per-frame collision push-out keeps a 22px clearance |
| Animation | Reduced motion left some headings at 35% opacity | Reveals forced visible under `prefers-reduced-motion` |
| Spacing | 18 competing section paddings (158–190px) | One token: `--section-pad` (88–128px desktop, 76px mobile) |
| Spacing | Technical-profile heading 160px right of its kicker | Removed stale centring margin |
| Spacing | Skill cards with four different corner shapes and rings poking out of the top edge | `--card-radius`; ring inside the card |
| Palette | Accent hard-coded 76× in CSS and in canvas JS; green, red and amber leftovers | `--accent-rgb` single source; `--accent-text` per theme for AA text; canvases read the token |
| Palette | Light mode: near-black diagram panels inside light cards; node labels dark-on-black (1.08:1) | Light-theme diagram surfaces |
| Palette | Light mode: desktop nav painted with the mobile dropdown panel | Panel scoped to ≤820px |
| Legibility | Text down to 6.9px | Floor: 11px content, 9px decorative |
| Security | Case dialog rendered data via `innerHTML`; a second copy of the data hijacked clicks in capture phase | One data source; DOM built with `textContent`; repo links must be `https:`; CSP now enforces Trusted Types |
| A11y | Boot loader ignored Enter/Esc if any other key was pressed first (`{once:true}`) | Listener removes itself only after Enter/Esc |
| Deploy | Pages published the whole repo (workflows, docs, unused images) | Explicit `_site` allow-list; deploy gated on the test suite |

110 dead CSS rules (old server-health map, terminal, neural-lock, radar) were removed first, verified pixel-identical
with a deterministic visual diff.

## Tokens

```
--accent-rgb  47 111 175        fills, strokes, glows (both themes)
--accent-text #7aaee2 / #245a91 accent-coloured text, dark / light (AA on each background)
--on-accent   #f7f9fc           text on filled accent controls
--dim         #8a919d / #56636f tertiary text, dark / light
--section-pad clamp(88px,9vw,128px), 76px ≤820px
--card-radius 22px
```

## Tests

`node --test tests/*.test.mjs` (29 tests, ~40s). Whitebox: they read `caseFiles`, call `openCase`, count named
rAF loops, inspect pseudo-elements, walk computed colours for contrast and palette membership, and parse the CSP.
They run in the Full Portfolio Audit workflow (push and PR) and gate the Pages deploy.

## Follow-ups (not done here)

- Dark-mode frame cost is dominated by compositing (two fixed full-screen canvases, grain overlay, backdrop blurs).
  Headless CPU rendering is not representative; profile on a real GPU device before redesigning layers.
- `refine.css` still holds ~370 `!important`s. Further consolidation is now safe to do incrementally behind the tests.
- Google Fonts is the only third-party request; self-hosting would allow `style-src 'self'` / `font-src 'self'`.
- GitHub Pages cannot send response headers, so `frame-ancestors` (clickjacking) cannot be enforced from a meta CSP.
