# Handoff: PlanMyLoans Website Redesign

## Overview
A redesign of planmyloans.in — a free home loan / EMI / SWP planner. Adds a light/dark theme, glassmorphism visual system, live-calculating quick-estimate sliders, an affiliate CTA (CIBIL/eligibility check via BankBazaar), and three new pages (Guides, About, Contact).

## About the Design Files
The `.dc.html` files in this bundle are **design references built as self-contained HTML prototypes** (using an internal component format — each file is valid standalone HTML you can open in a browser). They are **not production code to copy verbatim**. Your task is to **recreate these designs pixel-for-pixel in the existing planmyloans.in codebase**, using its actual framework/stack and component patterns. If the current stack can't cleanly support a piece of behavior (e.g. backdrop-filter blur), implement the closest equivalent that matches the visual result.

## Fidelity
**High-fidelity.** Every color, spacing value, font, and interaction below is final — implement pixel-perfectly. Colors are given as CSS `oklch()` values; convert to whatever color format your stack needs, but keep the exact lightness/chroma/hue (don't approximate to a "close enough" hex).

## Global Design System

### Typography
- Headings: **Manrope**, weights 600/700/800
- Body: **Source Sans 3**, weights 400/500/600
- Numbers/data (EMI, amounts, table figures): **IBM Plex Mono**, weights 500/600
- Load via Google Fonts: `family=Manrope:wght@600;700;800&family=Source+Sans+3:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600`
- Hero H1: 44px desktop / 34px mobile, weight 800, line-height 1.08, letter-spacing -0.02em
- Section H2: 24px, weight 800, letter-spacing -0.01em
- Body copy: 16-16.5px/1.6, muted color
- Small labels/eyebrows: 11-13px, weight 600-700, uppercase, letter-spacing .05-.06em

### Color tokens (two themes, user-togglable)
All accent/neutral colors share **hue 258-305 (cool blue-violet-teal)** and consistent chroma per role — do not introduce new hues.

**Dark theme:**
- Background: `oklch(17% 0.018 265)`
- Blob/glow accents (background decoration): `oklch(55% 0.15 270 / 32%)`, `oklch(58% 0.14 305 / 26%)`, `oklch(60% 0.12 175 / 24%)`
- Glass card fill: `rgba(255,255,255,0.055)`, border `rgba(255,255,255,0.11)`
- Text: primary `oklch(94% 0.005 270)`, secondary `oklch(84% 0.01 270)`, muted `oklch(70% 0.02 270)`, dim `oklch(58% 0.02 270)`
- Track/divider: `rgba(255,255,255,0.1)` / `rgba(255,255,255,0.08)`
- Accent 1 (indigo): `oklch(66% 0.15 270)` — Accent 2 (teal): `oklch(66% 0.12 175)` — Accent text: `oklch(80% 0.11 270)`
- Warning (SWP depletion): bg `oklch(30% 0.05 55 / 26%)`, border `oklch(58% 0.1 55 / 45%)`, dot `oklch(70% 0.13 60)`, text `oklch(90% 0.03 60)`

**Light theme:**
- Background: `oklch(97% 0.006 258)`
- Blob accents: `oklch(75% 0.11 270 / 38%)`, `oklch(78% 0.1 305 / 32%)`, `oklch(80% 0.1 175 / 34%)`
- Glass card fill: `rgba(255,255,255,0.38)`, border `rgba(255,255,255,0.6)` (deliberately transparent + bright border so the background blobs read through — do not make this more opaque, that was a fixed bug)
- Text: primary `oklch(24% 0.015 258)`, secondary `oklch(38% 0.015 258)`, muted `oklch(48% 0.02 258)`, dim `oklch(58% 0.02 258)`
- Accent 1: `oklch(54% 0.16 270)` — Accent 2: `oklch(52% 0.13 175)` — Accent text: `oklch(46% 0.15 270)`
- Warning: bg `oklch(95% 0.05 60)`, border `oklch(78% 0.1 60)`, text `oklch(38% 0.1 55)`

Theme toggle is a 38×38px rounded-square button in the header (sun/moon represented as a plain filled circle in the mock — replace with a real icon), stored per-session; persist to localStorage in production.

### Glassmorphism recipe (every card)
```css
background: <glassBg>;
backdrop-filter: blur(12-18px) saturate(160%);
border: 1px solid <glassBorder>;
border-radius: 13-20px (14-16px is most common);
```
Background blobs: 3 large (480-560px) blurred circles (blur 95-115px), fixed position behind content, subtle CSS `@keyframes` float animation (20-28s loop, translate ±30px + scale 1.04-1.08), `pointer-events: none`, `z-index: 0` under all content.

### Buttons
- Primary CTA: `linear-gradient(135deg, accent1, accent2)`, white text, weight 700, radius 10-12px, padding ~14px 24px (hero) / 10-12px 18-20px (smaller)
- Secondary: glass chip background + border, primary text color

## Screens

### 1. Calculator / Home (`PlanMyLoans Redesign.dc.html`)
Single scrolling page, `max-width: 1240px` centered, `24px` side padding.

**Header** — sticky, glass pill, logo (32px gradient square + "PlanMyLoans" wordmark) left; nav links (Calculator/Guides/About/Contact) + theme toggle + "Start Planning" CTA right. On mobile (<860px), nav links hide, only theme toggle + CTA remain.

**Hero** — 2-column grid (1.05fr / 0.95fr) desktop, stacks to 1 column <860px.
- Left: eyebrow pill ("Free · No signup · Recalculates live"), H1 with second line as a gradient-text span (`background-image` + `-webkit-background-clip:text` + `-webkit-text-fill-color:transparent` — must include the fill-color fallback or the text disappears), subhead paragraph, two CTA buttons.
- Right: "Quick estimate" glass card containing **three live interactive input rows**:
  - Each row: label + editable number input (62px wide, right-aligned, mono font) + unit suffix, below it a native `<input type="range">` styled with a custom circular thumb (20px, accent-colored, white 3px border) and a **gradient-fill track** built from the current value's percentage (`linear-gradient(90deg, accent1 0%, accent1 X%, track X%, track 100%)`, recomputed on every change).
  - **Loan amount**: range 10L–5Cr, step 1L. Number input shows **Lakhs while < 100L, auto-switches to Cr (step 0.01) at ≥100L (₹1,00,00,000)** — same threshold logic must decide the display unit on typed input too.
  - **Interest rate**: 5%–15%, step 0.1.
  - **Tenure**: 5–30 years, step 1.
  - Below the sliders: Monthly EMI (large mono number, accent color) and Total Interest, computed **live** with the standard EMI formula: `EMI = P·r·(1+r)^n / ((1+r)^n − 1)` where r = monthly rate, n = months. Total interest = EMI×n − P.
  - Below that: a 2-segment horizontal bar (principal % / interest %) that resizes live with the same computation, plus a legend.

**Affiliate banner** — full-width glass card, icon chip + "Not sure you'll qualify for this EMI?" copy + "Check eligibility →" button linking directly to BankBazaar's CIBIL check page (`https://www.bankbazaar.com/cibil-score-check.html`, `target="_blank" rel="noopener noreferrer"`). **No disclosure text under it** (removed per final decision) — this is an affiliate link, not a declared partnership, so keep the CTA itself neutral/generic.

**"4 tailored strategies"** — 4-column grid (2-col on mobile) of glass cards: icon chip, name, one-line description, split ratio in mono text. Cards: Aggressive Growth (10/70/20), Balanced (30/35/35), Conservative (55/25/20), Debt-Free Fast (70/20/10).

**Capital stack** — one glass card: segmented horizontal bar (down payment / MF lumpsum / SWP corpus / loan, 4 fixed widths in the mock: 28.6/14.3/28.6/28.6%) + legend row with values.

**Planner** (`#planner`) — **two layouts, switched by a JS media-query check at 860px (re-check on resize)**, not CSS breakpoints alone, because the input/output arrangement fully restructures:
- **Desktop**: 2-column grid (1fr / 0.82fr). Left: "Your inputs" — 4 glass-card groups (Property & funding / Growth & EMI funding / Loan & prepayment / Tax assumptions), each a label + value row list. Right: sticky (`top: 90px`) outcome panel — 2×3 grid of metric cards (Monthly EMI, Loan payoff, MF corpus after horizon, Interest saved, SWP corpus after horizon [amber warning border], Total wealth after horizon), a warning callout card ("SWP corpus runs dry…"), and a tax-impact list card.
- **Mobile**: outcome metrics + warning + tax card render inline in normal flow (smaller 2-col metric grid). The **input groups move into a bottom sheet**: fixed to viewport bottom, glass panel, drag-handle bar + "Edit inputs ▲/▼" label toggles between collapsed (only handle visible, `translateY(calc(100% - 58px))`) and expanded (`translateY(0)`, scrollable, max-height 78vh) via `transform` transition (.4s cubic-bezier(.2,.8,.2,1)).

**Charts** — 2 glass cards (1.3fr/1fr desktop, stacked mobile): an SVG line chart (3 polylines: MF corpus, SWP corpus, loan balance — the third dashed) and a CSS bar chart (12 stacked bars, principal/interest split per bar, static illustrative percentages in the mock — wire to real amortization data in production).

**Amortization schedule** — glass card, Yearly/Monthly toggle (pill buttons), 4-column table (Period / EMI paid / Principal / Balance).

**Footer** — disclaimer text + contact email link.

### 2. Guides (`Guides.dc.html`)
Same header/footer shell. Hero (eyebrow + H1 + subhead). 3-column grid (list of guide cards: tag chip, title, excerpt, read time — 6 sample entries, content is placeholder copy to be replaced with real articles). Same affiliate banner pattern as home (no disclosure line).

### 3. About (`About.dc.html`)
Same shell, `max-width: 760px` (narrower, editorial reading width). Long-form personal narrative (first-person founder story — copy is final, do not rewrite), then a two-column "What it does / What it doesn't do" glass-card grid, an amber "honesty clause" callout card, and a "Say hello" CTA card linking to Contact.

### 4. Contact (`Contact.dc.html`)
Same shell, `max-width: 900px`. Two-column layout: a message form (Name/Email/Message inputs + submit button — **not wired to a backend in the mock**, needs real submission handling) and a sidebar with email + response-time cards.

## Interactions & Behavior
- Theme toggle: flips all color tokens instantly (no transition needed beyond a `background 0.3s ease` on the base layer already in the CSS).
- All slider/number inputs are two-way bound to the same state value; changing one updates the other and the gradient track fill.
- EMI calculation recomputes on every keystroke/drag — no debounce needed at this scale.
- Bottom sheet (mobile) toggles via tap on its handle; sheet content is independently scrollable.
- Yearly/Monthly toggle swaps the amortization table's row data and column header label.
- Responsive breakpoint: **860px**, checked via `window.innerWidth` on mount + resize listener (not a CSS media query) because layout structure — not just styling — changes.

## Design Tokens Summary
See Color tokens above for exact values. Border radius scale: 6px (inputs) / 9-10px (buttons, small chips) / 13-16px (cards) / 18-22px (large cards, sheet top). Spacing: sections use 8-48px vertical padding depending on hierarchy; card internal padding 14-28px; grid gaps 10-28px.

## Assets
No custom illustrations — logo is a simple gradient rounded-square with a rotated white diamond, built in CSS (no image asset needed). No other imagery.

## Files
- `PlanMyLoans Redesign.dc.html` — calculator/home page (primary, most complex)
- `Guides.dc.html`
- `About.dc.html`
- `Contact.dc.html`

Open any file directly in a browser to see it live — all styling is inline, all interactivity is in a `<script>` block near the bottom of each file.

## Screenshots
See `screenshots/` — 01/02 home hero (dark/light), 03 planner section, 04 Guides, 05 About, 06 Contact. Static references only; the live `.dc.html` files are the source of truth for exact spacing/behavior.
