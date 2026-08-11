# PRATIKSHYA FASHON — Atelier Design System

The visual language of the PRATIKSHYA FASHON landing page, extracted into reusable
tokens and components.

This system was **derived from the approved landing page, not designed alongside it**.
Every colour, size, tracking value and duration documented here already appeared in the
page before the system existed. Nothing was invented, adjusted or "improved" during
extraction — the page after the refactor renders the same DOM it rendered before.

This document describes only what is actually implemented in `src/design-system/`.

---

## Contents

1. [Brand principles](#1-brand-principles)
2. [Colour](#2-colour)
3. [Typography](#3-typography)
4. [Spacing and rhythm](#4-spacing-and-rhythm)
5. [Layout](#5-layout)
6. [Components](#6-components)
7. [Image system](#7-image-system)
8. [Motion](#8-motion)
9. [Responsive behaviour](#9-responsive-behaviour)
10. [Accessibility](#10-accessibility)
11. [Usage rules](#11-usage-rules)
12. [Restrictions](#12-restrictions)

---

## 1. Brand principles

**Atelier, not marketplace.** The page reads like a fashion editorial: generous
whitespace, large quiet headlines, imagery given room. Density is the enemy.

Five rules the system enforces:

| Principle | How it shows up |
| --- | --- |
| **Editorial restraint** | Headlines are always `font-light`. There is no bold weight anywhere. |
| **One accent** | Terracotta `#8a3e22` is the only accent on light surfaces; gold `#c9a44c` replaces it on dark ones. |
| **Square geometry** | Nothing is rounded. No card, button, badge or image has a corner radius. |
| **Italic as emphasis** | A single italic word in a headline is the only emphasis device. |
| **Quiet motion** | Content fades up once. Images breathe on hover. Nothing loops or bounces. |

---

## 2. Colour

Defined in `src/design-system/tokens.js`, mirrored as Tailwind theme variables in
`src/index.css` so each is available as a utility (`bg-canvas`, `text-ink`, `border-mist`).

### Surfaces

| Token | Hex | Utility | Role |
| --- | --- | --- | --- |
| `canvas` | `#f7f4f0` | `bg-canvas` | Page background |
| `canvasDeep` | `#efeae3` | `to-canvas-deep` | End of the soft canvas gradient |
| `surface` | `#f0ebe6` | `bg-surface` | Plate behind product imagery |
| `ivory` | `#fdf8f3` | `text-ivory` | Foreground on dark and accent surfaces |

### Ink

| Token | Hex | Utility | Role |
| --- | --- | --- | --- |
| `ink` | `#2a2015` | `bg-ink` / `text-ink` | Headings, dark sections, primary button |
| `graphite` | `#555555` | `text-graphite` | Long-form body copy on light |
| `taupe` | `#777777` | `text-taupe` | Secondary and meta copy on light |
| `cocoa` | `#6a4e38` | `text-cocoa` | Hero body copy |
| `brass` | `#8a6e4a` | `text-brass` | Navigation links |

### Accents

| Token | Hex | Utility | Role |
| --- | --- | --- | --- |
| `accent` | `#8a3e22` | `text-accent` | The brand terracotta |
| `accentDeep` | `#5a2a18` | `to-accent-deep` | Terracotta gradient end |
| `gold` | `#c9a44c` | `text-gold` | The accent on dark surfaces |
| `blush` | `#e8d5c4` | `text-blush` | Campaign subtitle on terracotta |
| `blushDeep` | `#e8c8b8` | `text-blush-deep` | Campaign body on terracotta |

### Lines and neutrals

| Token | Hex | Utility | Role |
| --- | --- | --- | --- |
| `pearl` | `#dddddd` | `border-pearl` | Light borders, captions over imagery |
| `mist` | `#ddd8cf` | `border-mist` | Navigation hairline |
| `inkLine` | `#3a2a1e` | `border-ink-line` | Hairline inside dark sections |
| `ash` | `#aaaaaa` | `text-ash` | Secondary copy on dark, struck-through price |
| `ashDeep` | `#666666` | `text-ash-deep` | Footer legal copy |

### Surface tones

`tones` holds the four section treatments in use:

```js
tones.canvas  // inherits the page canvas
tones.fade    // bg-gradient-to-b from-canvas to-canvas-deep
tones.ink     // bg-ink text-ivory
tones.accent  // bg-gradient-to-r from-accent to-accent-deep text-ivory
```

---

## 3. Typography

Two families, loaded in `index.html`, defined in `src/design-system/typography.js`.

| Role | Family | Utility | Used for |
| --- | --- | --- | --- |
| Display | Cormorant Garamond | `font-display` | Every headline, product name |
| UI | Instrument Sans | `font-ui` | Eyebrows, navigation, body, meta, prices |

`font-display` is set on `<body>`, so **serif is the default** — an element with no font
utility renders in Cormorant. Sans is opt-in via `font-ui`. This matters when reading the
tokens: `eyebrow.label` and `eyebrow.labelDisplay` differ only in whether they carry
`font-ui`, and picking the wrong one silently changes the typeface.

### Display scale

All display styles are `font-light tracking-tight`.

| Token | Scale |
| --- | --- |
| `display.hero` | `text-6xl md:text-[9rem] lg:text-[11rem]`, `leading-[0.82]` |
| `display.campaign` | `text-4xl md:text-7xl lg:text-8xl` |
| `display.manifesto` | `text-4xl md:text-6xl lg:text-8xl` |
| `display.editorial` | `text-4xl md:text-6xl lg:text-7xl` |
| `display.feature` | `text-3xl md:text-6xl lg:text-7xl` |
| `display.section` | `text-4xl md:text-7xl` |
| `display.subsection` | `text-3xl md:text-5xl` |

### Heading scale

| Token | Scale | Used for |
| --- | --- | --- |
| `heading.xl` | `text-3xl md:text-5xl` | Panel headline beside an image |
| `heading.lg` | `text-3xl md:text-4xl` | Editorial article title |
| `heading.md` | `text-2xl md:text-4xl` | Caption headline over imagery |
| `heading.sm` | `text-xl md:text-3xl` | Campaign sub-headline |
| `heading.product` | `text-base md:text-lg` | Product name |
| `heading.footer` | `text-xl` | Footer brand mark |

### Eyebrows and navigation

Uppercase, `text-[10px]`, distinguished by tracking — the wider the tracking, the higher
in the hierarchy.

| Token | Tracking | Serif? |
| --- | --- | --- |
| `eyebrow.hero` | `0.4em` | no |
| `eyebrow.section` | `.3em` | no |
| `eyebrow.editorial` | `.25em` | no |
| `eyebrow.label` | `.2em` | no |
| `eyebrow.labelDisplay` | `.2em` | **yes** |
| `eyebrow.caption` | `.3em`, `text-xs` | no |
| `nav.link` | `0.15em` | no |
| `nav.brand` | `text-xl md:text-2xl font-light tracking-tight` | yes |

### Body copy

| Token | Style |
| --- | --- |
| `body.lead` | `text-sm md:text-base leading-relaxed` |
| `body.base` | `text-sm` |
| `body.editorial` | `text-sm leading-[1.8]` |
| `body.story` | `text-sm md:text-base leading-[1.9]` |
| `body.serif` | `text-sm leading-[1.85]` — **serif** |
| `body.caption` | `text-xs` |
| `body.captionDisplay` | `text-xs` — **serif** |
| `body.micro` | `text-[10px]` |

### Commerce

```js
price.row       // flex items-center gap-3 font-ui text-xs
price.current   // text-ink font-medium
price.original  // text-ash line-through
price.discount  // text-accent
badge           // text-[9px] uppercase tracking-widest
```

---

## 4. Spacing and rhythm

From `src/design-system/spacing.js`.

### Vertical rhythm

| Token | Padding | Used by |
| --- | --- | --- |
| `rhythm.spacious` | `py-32 md:py-48` | Flagship sections (Saree Edit, Celebration Edit, Our Story) |
| `rhythm.default` | `py-24 md:py-36` | Dark collection band, product grid, campaign band |
| `rhythm.compact` | `py-24 md:py-32` | Fabric story panel |

### Gutter

`pagePadding` is `px-6 md:px-12` — the single horizontal gutter, applied by
`AtelierSection`. Never hand-roll a different one.

### Gaps

```js
gap.tiles    // gap-6 md:gap-8    image and product grids
gap.columns  // gap-12 md:gap-20  two-column editorial
gap.footer   // gap-10
gap.chips    // gap-2
```

### Header

```js
header.height  // h-16 md:h-20
header.offset  // pt-20  — hero offset clearing the fixed nav
```

---

## 5. Layout

Four measures, all centred:

| Token | Width | Used for |
| --- | --- | --- |
| `container.prose` | `max-w-3xl` | Campaign copy |
| `container.narrow` | `max-w-5xl` | Brand story |
| `container.content` | `max-w-6xl` | Nav bar, hero, fabric panel |
| `container.wide` | `max-w-7xl` | Section grids, footer |

Grids:

```js
grid.tiles     // grid md:grid-cols-3        fabric tiles
grid.pair      // grid md:grid-cols-2        editorial pairs, wide tiles
grid.products  // grid grid-cols-2 md:grid-cols-4   product grid
grid.footer    // grid md:grid-cols-4
```

Note `grid.products` is the only grid that stays multi-column on mobile — two product
cards sit side by side at 375px by design.

---

## 6. Components

Nine components in `src/design-system/components/`, all exported from
`src/design-system/index.js`.

### Layout

**`Container`** — centred measure column. Props: `width` (`prose` | `narrow` | `content` |
`wide`), `padded`.

**`AtelierSection`** — the section primitive: vertical rhythm + gutter + measure in one.

```jsx
<AtelierSection id="women" rhythm="spacious" width="wide">…</AtelierSection>
<AtelierSection tone="ink" rhythm="default" width="wide" contained="inner">…</AtelierSection>
```

Props: `tone` (`canvas` | `fade` | `ink` | `accent`), `rhythm`, `width`, `contained`,
`backdrop`, `center`, `as`.

`contained` decides where the measure sits: `"self"` puts `max-w-*` on the section itself
(correct on the page canvas), `"inner"` wraps children in a `Container` so a painted tone
bleeds full-width while content stays measured. Getting this wrong is the usual cause of a
dark band that stops short of the viewport edge.

### Typography

**`EditorialHeading`** — eyebrow + headline + rule + standfirst as one block.

```jsx
<EditorialHeading
  eyebrow="Women's Collection"
  size="section"
  rule
  spacing="section"
>
  The <Accent>Saree</Accent> Edit
</EditorialHeading>
```

Props: `eyebrow`, `eyebrowVariant`, `eyebrowTone`, `size`, `as`, `rule`, `ruleWidth`,
`ruleTone`, `rulePlacement`, `description`, `descriptionClassName`, `spacing`.

When given no `className` the component renders its slots directly into the parent rather
than wrapping them in a `<div>` — an unstyled wrapper would otherwise collapse the block
into a single flex or grid item.

**`Accent`** — the italic accent word. `<Accent>Saree</Accent>`, or `tone="gold"` on dark.

**`Rule`** — the decorative hairline. Props: `width` (`short` | `long`), `tone`.

### Actions

**`AtelierButton`** — variants `primary` (ink → terracotta), `inverse` (ivory on
terracotta), `outline` (hairline chip), `toggle` (active/inactive fabric selector); sizes
`md`, `lg`, `chip`, `micro`. Renders `<a>` when given `href`, otherwise `<button>` with an
explicit `type`.

```jsx
<AtelierButton href="#women" icon={ArrowRight}>Explore Women's Edit</AtelierButton>
<AtelierButton variant="toggle" size="micro" active={isActive}>Silk</AtelierButton>
```

**`AtelierBadge`** — the `text-[9px]` uppercase marker. Tones `accent`, `ink`, `gold`. The
badge does not position itself; the caller supplies placement.

### Media and commerce

**`MediaFrame`** — aspect-clipped image plate wrapping `PratikshyaImage`.

```jsx
<MediaFrame image={imageRef("hero")} alt="…" aspect="portrait" zoom="strong" overlay="imageBottom">
  <figcaption className="absolute bottom-6 left-6">…</figcaption>
</MediaFrame>
```

Props: `image`, `hoverImage`, `alt`, `aspect`, `zoom`, `overlay`, `surface`, `elevated`,
`priority`, `objectPosition`, `children`.

**`ProductCard`** — the editorial product tile. Image plate, name, price. Everything else
is optional and **off by default**, which is what keeps it from becoming a marketplace card.

```jsx
<ProductCard product={product} href="#collections" />
<ProductCard product={product} showCategory showDiscount onWishlist={save} wishlistIcon={Heart} />
```

| Prop | Default | Effect |
| --- | --- | --- |
| `product` | — | `{ name, category, price, originalPrice, label, image, hoverImage, inStock }` |
| `href` | `"#"` | Card is a single link |
| `showCategory` | `false` | Category eyebrow above the name |
| `showOriginalPrice` | `true` | Struck-through price (hidden below `sm`) |
| `showDiscount` | `false` | Computed "N% off" |
| `showBadge` | `true` | Renders `product.label` |
| `showAvailability` | `false` | "Sold out" scrim when `inStock` is false |
| `onWishlist` / `isWishlisted` / `wishlistIcon` | — | Wishlist control |

Helpers `formatPrice` and `discountPercent` are exported alongside it.

### Evaluated and deliberately not built

`Card`, `Image`, `LoadingState`, `EmptyState`, `ErrorState`, the form primitives (`Input`,
`Select`, `Textarea`, `Checkbox`, `Radio`, `Label`) and the overlay primitives (`Modal`,
`Drawer`, `Dropdown`, `Tooltip`) were each considered and **not shipped**:

- `Card` and `Image` would only have wrapped `MediaFrame` and `PratikshyaImage`.
- The state components have no caller — the landing page renders static data, and
  `PratikshyaImage` already handles its own loading and error fallback.
- Forms and overlays belong to the shop, cart, checkout and account features, which are
  out of scope. Building them now would ship untested, unused code and freeze API
  decisions before there is a real use case.

They should be added when a real caller appears, not before.

---

## 7. Image system

The Phase 1 image architecture is unchanged and remains mandatory.

**Every image resolves through the manifest.** `src/data/pratikshyaImageManifest.js` is the
only place image URLs are allowed to live. Components take a manifest reference:

```jsx
import { imageRef } from "@/data/pratikshyaImageManifest";
<MediaFrame image={imageRef("saree.silk")} alt="Silk saree detail" aspect="portrait" />
```

**`PratikshyaImage`** (`src/components/PratikshyaImage.jsx`) handles loading, decoding,
error fallback and the hover cross-fade. `MediaFrame` wraps it and adds the aspect box,
overlay, surface plate and zoom, so a caller never sets those by hand.

Standardised treatments:

| Concern | Token | Value |
| --- | --- | --- |
| Aspect — portrait tiles | `aspects.portrait` | `aspect-[4/5]` |
| Aspect — product cards | `aspects.product` | `aspect-[3/4]` |
| Aspect — editorial | `aspects.landscape` | `aspect-[4/3]` |
| Aspect — wide tiles | `aspects.panorama` | `aspect-[4/3] md:aspect-[16/10]` |
| Fit | `imageTreatment.cover` | `w-full h-full object-cover` |
| Position | prop | `center` unless overridden |
| Caption scrim | `overlays.imageBottom` | `from-black/50 to-transparent` |
| Hover zoom | `zoom.soft` / `zoom.strong` | `scale-[1.04]` / `scale-[1.05]`, `duration-700` |

`alt` is required by every image-bearing component. Decorative overlays and rules are
marked `aria-hidden`.

---

## 8. Motion

From `src/design-system/motion.js`. Two Framer Motion patterns and a small set of CSS
transitions — that is the entire motion vocabulary.

| Pattern | Hook | Distance | Duration |
| --- | --- | --- | --- |
| Scroll reveal (fires once) | `useReveal(distance, seconds)` | 20 / 25px | 0.6s |
| Mount entrance (hero) | `useEnter(distance, seconds)` | 30px | 1.2s |

```jsx
const reveal = useReveal(distance.medium);
<motion.article {...reveal}>…</motion.article>
```

CSS transitions: `transition.colors`, `transition.all`, `transition.crossfade`
(`duration-500`), `transition.image` (`duration-700`).

**Reduced motion is handled at two levels.** `useReveal` and `useEnter` read
`useReducedMotion()` and return static, zero-duration props — content appears immediately
and fully opaque, never stuck at `opacity: 0`. `src/index.css` additionally collapses all
CSS animation and transition durations under `prefers-reduced-motion: reduce`.

Prefer the hooks over the raw `fadeUp` / `enter` factories, which do not check the
preference.

---

## 9. Responsive behaviour

One breakpoint carries nearly the whole layout: **`md` (768px)**. `lg` refines large
headlines, `sm` guards the price row, `xl` appears once.

| Element | Mobile | `md` and up |
| --- | --- | --- |
| Gutter | `px-6` | `px-12` |
| Nav | Brand only, links hidden | Links visible, `h-20` |
| Hero headline | `text-6xl` | `9rem`, `11rem` at `lg` |
| Fabric tiles | 1 column | 3 columns |
| Editorial pairs | 1 column | 2 columns |
| Product grid | **2 columns** | 4 columns |
| Footer | 1 column | 4 columns |
| Rhythm | `py-24` / `py-32` | `py-32` / `py-36` / `py-48` |

Verified at 1440, 1280, 1024, 834, 768, 430, 390 and 375px. Content width is
`min(viewport, 1280) − 2 × gutter`; the narrowest product card is ~151px at 375px, and the
struck-through original price is `hidden sm:inline` so it drops out before it can crowd
that column.

The system contains **no fixed pixel widths, no `vw` units and no negative margins**, which
is what keeps it free of horizontal overflow; `overflow-x: hidden` on `body` is a
belt-and-braces guard, not the mechanism.

---

## 10. Accessibility

- **Landmarks** — `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` are used
  semantically; headings descend in order.
- **Alt text** — required on every image-bearing component; decorative overlays, scrims
  and rules carry `aria-hidden="true"`.
- **Buttons** — always an explicit `type`, so a button can never submit a form by accident.
- **Toggles** — `AtelierButton variant="toggle"` exposes `aria-pressed`.
- **Wishlist** — labelled per product ("Save Silk Saree to wishlist") and exposes
  `aria-pressed`, so the control is distinguishable in a list.
- **Reduced motion** — honoured by the hooks and by a global CSS rule.
- **Focus** — the browser default focus ring is intentionally left intact.

Known gap: contrast. `text-taupe` (#777) and `text-ash` (#aaa) at `text-xs` and
`text-[10px]` sit below WCAG AA for body text. These values come from the approved Phase 1
page and were preserved deliberately — changing them is a design decision, not a
refactoring one, and should be raised as its own change.

---

## 11. Usage rules

**Import from the barrel.**

```jsx
import { AtelierSection, EditorialHeading, Accent, colors } from "@/design-system";
```

**Compose sections from the primitives** rather than re-implementing padding:

```jsx
<AtelierSection id="bridal" rhythm="spacious" width="wide">
  <EditorialHeading eyebrow="Bridal + Wedding" size="feature" rule>
    The <Accent>Celebration</Accent> Edit
  </EditorialHeading>
  <div className={cn(grid.pair, gap.columns)}>…</div>
</AtelierSection>
```

1. Use semantic colour utilities (`text-ink`), never raw hex.
2. Take type from the scales; don't hand-write `text-[13px]`.
3. Route every image through the manifest and `MediaFrame` / `PratikshyaImage`.
4. Use `useReveal` / `useEnter` for animation.
5. If a value is missing, add it to the token file — don't inline a one-off.

---

## 12. Restrictions

**Visual identity is fixed.**

- No new colours. The palette is closed.
- No third typeface, and no weight above `font-light` for headlines.
- No rounded corners, anywhere.
- No new shadows beyond `shadows.editorial`.
- No new animation patterns; no looping, bouncing or parallax.
- No accent other than terracotta on light and gold on dark.

**Engineering.**

- Stack is React + Vite + JSX + Tailwind + Framer Motion + Lucide. **No TypeScript.**
- No new dependencies without a clear need.
- No component without a real caller.
- No image URL outside the manifest.
- No duplicate implementations of anything the system already provides.

**Out of scope** — shop, product detail, cart, checkout, payment, customer accounts,
employee and admin portals, inventory, AI features, backend, database and authentication
all belong to later phases. The system deliberately stops at the presentation layer.
