# M99Game brand system

Authoritative reference for **spacing**, **typography**, **border radius**, **buttons**, and **section structure**. Pages stay consistent by reusing tokens and component classes only—no one-off magic numbers in HTML or page CSS unless documented here.

## Source of truth (DRY)

| Concern | Where it lives |
|--------|----------------|
| Colors, spacing scale, radii, fonts | [`css/tokens.css`](css/tokens.css) (`:root`) |
| Sections, buttons, cards, grids, chrome | [`css/components.css`](css/components.css) |
| Global base typography | [`css/base.css`](css/base.css) |

**Rules**

- Prefer **semantic classes** (`.section`, `.btn`, `.feature-card`) over inline styles.
- New layouts belong in **`components.css`** (or a small imported sheet) as reusable blocks/modifiers, not scattered per-page rules.
- If you need a new size or radius, **add a token** in `tokens.css` and document it below—do not sprinkle raw `px`/`rem`.

---

## Spacing hierarchy (order of use)

Use this ladder inside components: **tighter steps for related items; larger steps between ideas.**

| Step | Token | Approx. rem | Role |
|:----:|--------|-------------|------|
| 1 | `--space-xs` | 0.35rem | Eyebrow → title, micro gutters inside chips |
| 2 | `--space-sm` | 0.75rem | Title → subtitle, compact vertical stacks |
| 3 | `--space-md` | 1.25rem | Default padding, grid gaps, header spacing |
| 4 | `--space-lg` | 2rem | Paragraph / block separation, `.flow-gap-top` |
| 5 | `--space-xl` | 3.5rem | Rare—only for strong separation between unrelated regions |

### Section rhythm (vertical, page-level)

These sit **above** the `--space-*` ladder: they control how **whole sections** breathe, not inner copy.

| Token | Role |
|-------|------|
| `--section-pad-y` | Default section bottom (and stacked section) padding |
| `--section-pad-y-first` | First section under the header—extra top air |
| `--section-pad-y-tight` | Dense sections—pair with `.section--tight` |
| `--stack-pull` | Top padding for non-first sections—nested rhythm between siblings |
| `--max` (1180px) | Max content width—always wrap primary content in `.container` |

**Utility:** `.flow-gap-top` = `margin-top: var(--space-lg)` for the next block inside a section.

---

## Typography hierarchy (largest → smallest)

**Families:** `--font-display` (Sora) for headings and brand moments; `--font-sans` (DM Sans) for body and UI.

| Level | Typical element | Size / clamp | Face | Notes |
|:-----:|-----------------|--------------|------|-------|
| 1 | Hero headline (`.hero__title`) | `clamp(2rem, 5vw, 3.25rem)` | display | Strongest on the page |
| 2 | Section title (`.section__title`) | `clamp(1.75rem, 4vw, 2.5rem)` | display | Major section breaks |
| 3 | Stat number (`.stat-pill__num`) | `1.75rem` | display | Numeric emphasis |
| 4 | Logo wordmark (`.logo`) | `1.35rem` | display | Nav brand |
| 5 | Card title (`.feature-card h3`) | `1.15rem` | sans | In-card hierarchy |
| 6 | Lead / hero & section lead (`.hero__subtitle`, `.section__lead`) | `1.1rem` | sans | Muted color, ~55–62ch max width |
| 7 | Body / default (`body`) | `1.05rem` | sans | Reading default in `base.css` |
| 8 | UI primary actions (`.btn`) | `0.9rem` | sans | Bold |
| 9 | Nav links (`.nav__link`) | `0.9rem` | sans | Semibold |
| 10 | Header CTA (`.header__cta`) | `0.85rem` | sans | Bold, uppercase, tracked |
| 11 | Disclaimers (`.lobby-disclaimer`) | `0.85rem` | sans | Secondary reading |
| 12 | Badge (`.hero__badge`), stat label (`.stat-pill__label`) | `0.8rem` | sans | Chips / metadata |
| 13 | Eyebrow (`.section__eyebrow`) | `0.75rem` | sans | Uppercase, tracked, accent |

Keep comfortable line length on leads using existing `max-width` on `.section__lead` and `.hero__subtitle`.

---

## Border radius hierarchy

All radii map to tokens unless a documented exception applies.

| Token | Value | Surfaces |
|-------|-------|----------|
| `--radius-sm` | 6px | Compact controls: nav pills, mobile menu rows, icon button (`.mobile-toggle`), text-like taps |
| `--radius-md` | 12px | **Standard buttons** (`.btn`, `.header__cta`), nested plates (`.feature-card__icon`), thumbnails, `.hero-infographic`, `.game-placeholder` |
| `--radius-lg` | 20px | **Cards and panels** (`.feature-card`, `.stat-pill`), elevated blocks |
| `--radius-xl` | 28px | Large hero imagery (`.hero-banner-img`) when full-width |
| Pill (`999px`) | — | Badges and chips only (`.hero__badge`) |

**Rule:** Same component type → same radius. Do not use `--radius-lg` on `.btn` or `--radius-sm` on `.feature-card` without updating this doc.

**Known exception:** `.logo__mark` uses `10px` in CSS for the small square mark—treat as asset chrome, not a second button radius.

---

## Buttons and clickable chrome (hierarchy + radius)

### Content CTAs (in hero and sections)

Use **`.btn`** + one modifier. Shared: `min-height: 44px`, padding `0.85rem 1.5rem`, **`border-radius: var(--radius-md)`**, `font-size: 0.9rem`, bold.

| Priority | Classes | Visual | Use when |
|:--------:|---------|--------|----------|
| 1 | `.btn.btn--primary` | Gradient + glow | Single main action on the block |
| 2 | `.btn.btn--gold` | Alternate strong gradient | Secondary emphasis, still a commitment |
| 3 | `.btn.btn--ghost` | Outline, transparent | Low-friction or alternate path |

Do not fork button padding, radius, or min-height per page—add a **modifier** on `.btn` if a new variant is truly needed.

### Header promotional CTA

**`.header__cta`** is the sticky-nav conversion control: same **`--radius-md`** as `.btn`, but **smaller type** (`0.85rem`), **uppercase**, and **letter-spacing** for density. It is not a fourth semantic “button tier” in content—it is **chrome**. In-page content should still use `.btn` variants.

### Other tappable UI (radius at a glance)

| Element | Radius |
|---------|--------|
| `.nav__link` | `--radius-sm` |
| `.mobile-menu__link` | `--radius-sm` |
| `.mobile-toggle` | `--radius-sm` |
| `.btn`, `.header__cta` | `--radius-md` |

---

## Modular sections (DRY checklist)

**Skeleton every time**

1. **Outer:** `<section class="section [modifiers]">` as a direct child of `#main-content` so `#main-content > .section` rhythm applies.
2. **Inner:** `.container` for horizontal bounds and side padding.
3. **Content order:** `.section__eyebrow` → `.section__title` → `.section__lead` → grids/cards/lists; use `.flow-gap-top` before unrelated sub-blocks.

**Modifiers (reuse, don’t reinvent)**

- `.section--tight` — `--section-pad-y-tight` for dense bands.
- `.section--tight-lede` — tightens space after `.section__eyebrow`.

**Grids:** `.card-grid`, `.card-grid--2`, `.card-grid--3` before custom grids.

**Adding something new:** extend `components.css` with a **block** (e.g. `.promo-band`) and optional **`--modifier`**s; mirror tokens only. Document notable additions in this file.

---

## Code reference (jump points)

| Topic | File | Hint |
|-------|------|------|
| Tokens | [`css/tokens.css`](css/tokens.css) | `:root` block |
| Body type | [`css/base.css`](css/base.css) | `body` |
| Section stack, titles, `.flow-gap-top` | [`css/components.css`](css/components.css) | `#main-content > .section`, `.section__*` |
| Hero, badge pill | [`css/components.css`](css/components.css) | `.hero__*` |
| `.btn` + variants, header CTA, nav | [`css/components.css`](css/components.css) | `.btn`, `.header__cta`, `.nav__link` |

Line numbers drift; search by class name when in doubt.
