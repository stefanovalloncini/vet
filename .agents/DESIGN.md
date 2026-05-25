# DESIGN — Vet

Color, type, spacing, motion, components. Source of truth: `packages/web/src/index.css` (oklch tokens). This file documents the choices and the rules.

## Color

OKLCH everywhere. Chroma low at the extremes. Every neutral is tinted toward the brand hue (240 = cool gray-blue), chroma 0.003 to 0.012. Pure `#000`/`#fff` are banned.

### Strategy

**Restrained.** Tinted neutrals carry 90% of the surface. The teal accent appears in primary CTAs, focus rings, links, and the active state of nav items. Total accent coverage stays under 10% of any given screen.

### Light theme tokens

| Token | Value | Use |
|---|---|---|
| `--color-background` | `oklch(98% 0.003 240)` | Page background |
| `--color-surface` | `oklch(100% 0 0)` | Cards, dialogs, inputs |
| `--color-surface-muted` | `oklch(96% 0.004 240)` | Secondary surface (hover, segmented controls, disabled inputs) |
| `--color-border` | `oklch(91% 0.005 240)` | Default borders |
| `--color-border-strong` | `oklch(78% 0.008 240)` | Hover / focus border |
| `--color-text` | `oklch(22% 0.012 240)` | Body text |
| `--color-text-muted` | `oklch(46% 0.010 240)` | Labels, secondary copy |
| `--color-text-subtle` | `oklch(62% 0.008 240)` | Placeholder, helper text |
| `--color-accent` | `oklch(50% 0.10 195)` | Primary CTA, link, focus |
| `--color-accent-hover` | `oklch(42% 0.11 195)` | Primary CTA hover |
| `--color-accent-soft` | `oklch(95% 0.022 195)` | Subtle accent bg (active states, selected items) |
| `--color-accent-soft-hover` | `oklch(92% 0.030 195)` | Hover on accent-soft surfaces |
| `--color-danger` | `oklch(50% 0.18 25)` | Destructive, errors |
| `--color-success` | `oklch(50% 0.12 150)` | Saved, paid, healthy |
| `--color-warning` | `oklch(72% 0.16 75)` | Expiring, attention |
| `--color-overlay` | `oklch(20% 0.012 240 / 0.45)` | Dialog backdrop |

Dark theme mirrors with shifted lightness; see `index.css`.

### Color rules

- Accent on accent-soft is allowed (link on subtle bg). Accent on white is the primary pairing.
- Never set borders to neutral grays from outside this palette.
- Status (`success`, `danger`, `warning`) used at full chroma only for icons, dots, and badge fills. As background, mix with white (10% opacity).
- No gradients. No background-clip:text.

## Typography

Family: **IBM Plex Sans** for everything. IBM Plex Mono only for IDs, totals, code-like values that benefit from tabular numerals. No third font.

### Scale

| Step | Size | Line-height | Use |
|---|---|---|---|
| `xs` | 12px | 1.4 | Caption, helper, badge |
| `sm` | 14px | 1.5 | Secondary body, table cells, form labels |
| `base` | 16px | 1.55 | Body text, primary inputs |
| `lg` | 18px | 1.45 | Subhead, important field labels |
| `xl` | 22px | 1.35 | Section heading |
| `2xl` | 28px | 1.25 | Page heading |
| `3xl` | 36px | 1.15 | Hero (rare) |

Ratio between adjacent steps stays at 1.15 to 1.27.

### Weights

Three only: **400** (body), **500** (labels, badge text, button labels), **600** (headings, totals, emphasis). No 700+. No italic for emphasis (only for foreign words / titles, if ever).

### Italian rules

- Date: `gg/mm/aaaa` o `gg mese aaaa` (`23 maggio 2026`). Mai `2026-05-23` in UI.
- Decimali con virgola: `1,5 ore`, `45,00 EUR`.
- Numeri tabellari sempre con `tabular-nums` (totali, importi, contatori).
- Mesi e giorni in italiano, prima lettera minuscola dentro al testo (`lunedi 23 maggio`).

## Spacing

Base scale: `4, 8, 12, 16, 24, 32, 48, 64`. Tailwind defaults work (`1, 2, 3, 4, 6, 8, 12, 16`).

Rules:

- Card internal padding: `12` (sm), `16` (md, default), `24` (lg, marketing or empty states).
- Form field gap: `12` between fields, `24` between groups.
- Touch targets: minimum height `44px` (`h-11` in Tailwind). Applies to buttons, inputs, select, list rows.
- Page horizontal padding: `16` on mobile, `24` on tablet, `32+` on desktop.

## Radius

- `4px` (`rounded-sm`): badges, chips
- `8px` (`rounded-lg`): inputs, small buttons
- `12px` (`rounded-xl`): primary buttons, cards
- `16px` (`rounded-2xl`): large cards, dialogs

No fully-rounded pills outside of small status badges. Avatars stay circular.

## Elevation

One soft shadow, used sparingly. Defined as `0 1px 2px oklch(20% 0.012 240 / 0.06), 0 4px 12px oklch(20% 0.012 240 / 0.04)`. Cards default flat (border only), elevate only when stacked (dialogs, popovers, dragged items).

## Motion

Existing tokens stay: `--motion-press` (90ms), `--motion-fast` (140ms), `--motion-base` (200ms), `--motion-layout` (280ms). Easings: `--ease-out-quart`, `--ease-out-quint`, `--ease-out-expo`. No bounce. No elastic. No spring.

Rules:

- Press feedback: `scale(0.97)` for 90ms on tap. Default for all buttons.
- Hover transition: `140ms` on color/border. Never on layout.
- Modal/dialog enter: `240ms` ease-out-expo, scale 0.98 to 1.
- Skip animation entirely if `prefers-reduced-motion`.

## Interaction states

Every interactive element has four states. Define all four or it's incomplete.

| State | Recipe |
|---|---|
| Default | Resting. Border `--color-border` or bg `--color-accent`. |
| Hover | Border `--color-border-strong` (secondary), bg `--color-accent-hover` (primary), bg `--color-surface-muted` (ghost). 140ms. |
| Focus-visible | Outline `2px solid --color-accent` with `outline-offset: 2px`. Same for all focusable elements. Never custom blue. Never browser default. |
| Active (pressed) | `scale(0.97)` for `--motion-press`. |
| Disabled | `opacity: 0.5`, `cursor: not-allowed`, no hover/active transforms. |

## Component patterns

### Button

Variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm` (36px), `md` (44px), `lg` (52px).

- `primary`: `--color-accent` bg, white text. CTA on form, "Salva".
- `secondary`: `--color-surface` bg, `--color-border` outline, `--color-text`. "Indietro", "Esporta".
- `ghost`: transparent bg, `--color-text-muted` text. "Annulla", optional action.
- `danger`: `--color-danger` bg, white text. "Elimina", "Revoca".

One primary per view. Two if the view splits a form between two destinations (rare). Ghost for cancel.

### TextField / NumberField

- Height 44px (`md`).
- Label above (`text-xs`, uppercase, tracking-wider, weight 500, color `--color-text-muted`). The screenshotted black-arrow bug is **NumberField with native spinners**. NumberField MUST hide native spinners on all engines and render custom +/- stepper buttons, brand-teal on hover/focus, never black.
- Error message below in `--color-danger`, 12px. Role `alert`.
- Helper text below in `--color-text-subtle`, 12px.

### Select

Native `<select>` styled. Custom chevron SVG via background-image (data-uri). No popover.

### Card

`--color-surface` bg, `--color-border` border, radius 12, padding md by default. Flat. Nested cards forbidden.

### Badge

Variants: `success` (verde, "Saldato"), `danger` (rosso, "Non saldato"), `warning` (amber, "Da emettere"), `neutral`, `accent`. Optional `dot` prop renders only a colored circle (used in lists).

### Dialog

Centered card on desktop (max-w-md by default). Bottom sheet on mobile (`<sm` breakpoint): rests on the bottom safe area, slides up. Backdrop `--color-overlay`. Focus trap; ESC closes; click outside closes.

### Toolbar

Horizontal flex container. Default gap `12`. Wraps on overflow. Used for filter rows, page-header right side, tab segments.

## Forbidden patterns

- Side-stripe borders ( `border-left: 4px solid red` on cards).
- Gradient text.
- Glassmorphism (`backdrop-blur` beyond the dialog backdrop).
- The hero-metric template (big number + small label as the dominant element of a page).
- Identical grid cards (icon-title-text repeated 6 times).
- Modal-on-modal.
- Em dashes in copy. Periods, colons, parens are enough.
- Black or pure-white. Use the tinted neutrals.
- Native `<input type="number">` spinners visible. Always hide and replace.

## Italian copy patterns

- Empty state: short noun phrase, then optional CTA. "Nessuna attivita. Aggiungi la prima."
- Confirm destructive: "Eliminare definitivamente l'attivita?" + descriptive subtitle + "Elimina" / "Annulla".
- Loading: "Caricamento..." with spinner; never "Loading", never "Please wait".
- Errors: subject-first. "Tariffa fuori limite", "Sessione scaduta", "Connessione assente".
