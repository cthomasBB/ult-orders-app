# ULT Orders — Design System v1

The single source of truth for visual design. Every screen imports from `constants/theme.ts`. No hardcoded hex values, font names, or spacing numbers anywhere in the app.

---

## 1. Design Thesis

**ULT Orders looks like a food magazine, not a directory.**

Yelp, DoorDash, and every review app share one visual logic: dense, bright, information-packed, everything competing. Cards crammed with stars, prices, distances, hours, badges. The design says *scan this list*.

ULT Orders says *look at this one thing*. Dark field, generous space, one hero image, one order, one person's name attached to it. The design should feel closer to a record sleeve or a fashion editorial than a listings page.

**Three rules that follow from this:**

1. **One focal point per screen.** If two elements compete for attention, one is wrong.
2. **Space is the luxury signal.** Cramped is cheap. When in doubt, remove something rather than shrink it.
3. **Color is meaning, not decoration.** Every non-neutral color in this system means something specific. If a color appears without meaning, delete it.

---

## 2. Color

### Foundation

Dark mode first. The base field is a warm near-black — never pure `#000000`, which reads as cheap OLED default rather than a designed choice.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0D0C0B` | App background. Warm black. |
| `surface` | `#1A1817` | Cards, sheets, elevated panels. |
| `surfaceRaised` | `#252220` | Modals, pickers, anything above a card. |
| `border` | `#302C29` | Hairline dividers. Never heavier than 1px. |
| `cream` | `#F5F0E8` | Primary text on dark. Also inverted card backgrounds. |
| `creamMuted` | `#A8A199` | Secondary text, labels, metadata. |
| `creamFaint` | `#6B655E` | Disabled, placeholder, tertiary. |

### Semantic accents

These four carry meaning. Used sparingly against the dark field, they read as intentional. Used everywhere, they read as noise — which is the current app's problem.

| Token | Hex | Meaning | Where it appears |
|---|---|---|---|
| `gold` | `#C9A84C` | Status, rank, emphasis | Ring levels, Tastemaker marks, the italic in the wordmark, Hidden Gem / Fan Favorite |
| `ember` | `#C8472B` | Primary action | Post button, primary CTAs. **One per screen, maximum.** |
| `sage` | `#5E9670` | Saved | Save button active state, save counts |
| `purple` | `#8368C4` | Tried it | Verified Tried It badge and confirmations |

**Note:** `sage` and `purple` are lightened from the original `#4A7C59` and `#6B4FA0`. The originals were tuned for a light background and fail contrast on `#0D0C0B`. Keep the originals on hand only if a light surface is ever introduced.

### Usage discipline

- **Gold is for status, never for actions.** A gold button implies "press me"; gold should imply "this is earned."
- **Ember is rationed.** One primary action per screen. A second ember element means the hierarchy is wrong.
- **Sage and purple never appear as backgrounds.** Icon, text, and thin outline only. They're state indicators, not surfaces.
- **No gradients.** Flat fields only. Gradients are the fastest way to look like a 2019 startup template.

---

## 3. Typography

### Faces

| Role | Face | Use |
|---|---|---|
| Display | **Cormorant Garamond** | Headlines, order titles, restaurant names, hero copy. Weights 400 / 600. Italic is a deliberate accent, not a default. |
| UI | **DM Sans** | All interface text — buttons, labels, body, metadata, navigation. Weights 400 / 500 / 700. |

**The signature move:** the wordmark pairs `ULT` (DM Sans, 700, wide letterspacing, uppercase) with `Orders` (Cormorant Garamond, italic, 400). That sans/serif-italic contrast is the brand's core gesture and should recur throughout the app wherever a title needs weight — a sans eyebrow above a serif headline.

### Scale

| Token | Size / Line | Face | Use |
|---|---|---|---|
| `display` | 40 / 44 | Cormorant 600 | Hero moments only. One per screen at most. |
| `title` | 28 / 32 | Cormorant 600 | Screen titles, order names |
| `heading` | 22 / 28 | Cormorant 600 | Card titles, section heads |
| `bodyLarge` | 17 / 26 | DM Sans 400 | Primary reading text |
| `body` | 15 / 22 | DM Sans 400 | Default UI text |
| `label` | 13 / 18 | DM Sans 500 | Buttons, tabs, form labels |
| `eyebrow` | 11 / 14 | DM Sans 700 | Uppercase, letterSpacing 1.2. Section labels above headlines. |
| `caption` | 12 / 16 | DM Sans 400 | Metadata, counts, timestamps |

### Rules

- **Eyebrows are structural, not decorative.** An eyebrow labels what follows ("SIGNATURE DECK", "NEAR YOU"). If it doesn't classify the content beneath it, remove it.
- **Never set Cormorant below 20px.** It's a display face; at small sizes it turns to mush.
- **Never set DM Sans above 20px.** Large sans is where the app starts looking like every other app.
- **Numbers are always DM Sans.** Counts, prices, stats. Cormorant's numerals are inconsistent in width and make stat rows jitter.

---

## 4. Space & Layout

8pt base grid. Every margin, padding, and gap is a multiple of 4.

| Token | Value |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 16 |
| `lg` | 24 |
| `xl` | 40 |
| `xxl` | 64 |

**Screen padding:** `lg` (24) horizontal. This is wider than typical app padding and it's deliberate — the extra margin is what makes the layout read as editorial rather than dense.

**Section rhythm:** `xl` (40) between major sections. `md` (16) within a group.

### Radius

| Token | Value | Use |
|---|---|---|
| `sharp` | 0 | Media, hero images, full-bleed elements |
| `soft` | 10 | Cards, thumbnails |
| `pill` | 999 | Chips, toggles, small status badges |

Media is square-cornered. Chrome is rounded. This contrast keeps food photography feeling like printed imagery rather than a UI element.

### Elevation

**No drop shadows.** Depth is expressed through surface value (`bg` → `surface` → `surfaceRaised`) and hairline borders. Shadows on a dark field produce muddy gray halos and are a reliable tell of an unconsidered design.

---

## 5. Photography

Food imagery is the product. It gets treated like editorial photography.

- **Full-bleed or square-cornered.** No rounded corners on primary media.
- **Dark, moody, high-contrast.** Warm shadows. Never bright, flat, overhead-lit stock photography.
- **One image dominates.** A grid of equal thumbnails is a directory. One large image with supporting elements is a magazine.
- **Overlay for text legibility:** a bottom-anchored linear scrim from `transparent` to `rgba(13,12,11,0.85)`. Never a flat gray box.

---

## 6. What This System Forbids

These exist to prevent drift back toward the look we're leaving.

- ❌ **Star ratings.** Ever. Anywhere. Aggregated stranger opinion is the mechanic ULT Orders replaces. Use save counts, Verified Tried It counts, or creator attribution.
- ❌ **Rounded corners on food photography.**
- ❌ **Drop shadows.**
- ❌ **Gradient buttons or gradient backgrounds.**
- ❌ **More than one ember element per screen.**
- ❌ **Emoji as UI iconography.** (Acceptable in user-generated content only.)
- ❌ **Dense multi-attribute cards** (price + distance + hours + rating + category on one card). That's a listings row. Pick the two that matter.
- ❌ **Pure black `#000000` or pure white `#FFFFFF`.**

---

## 7. Component Specs

### Button — Primary
`ember` fill, `cream` text, `label` type, `pill` radius, 48px height, `lg` horizontal padding. One per screen.

### Button — Secondary
Transparent fill, 1px `border`, `cream` text, otherwise identical to primary.

### Save button
Outline `sage` when inactive; `sage` fill with `bg` icon when active. Count sits beside it in `caption` / `creamMuted`.

### Tried It badge
`purple` outline, `pill` radius, `caption` type, `purple` text. Never filled — it's a confirmation, not an action.

### Order card
Full-bleed square-cornered image → `md` gap → restaurant name in `eyebrow` / `creamMuted` → order title in `heading` / `cream` → creator attribution + save count in `caption`.

Note the hierarchy: the restaurant is context, the **order** is the subject. This inverts every competitor, where the restaurant is the headline. That inversion is the product thesis expressed as layout.

### Deck card
Same as order card plus a `gold` hairline border and a small `gold` position marker (1–5). The Deck is the only place position numbering appears, because there position genuinely carries meaning.

---

## 8. Motion

- **Standard transition:** 220ms, ease-out.
- **Screen transitions:** horizontal slide, no fade.
- **Save / Tried It:** a single 1.15× scale pulse over 180ms. No confetti, no bounce, no particles.
- **List entry:** stagger children by 40ms on first mount only, never on refetch.
- **Respect reduced motion.** Check the system setting and disable non-essential animation.

Motion should feel like weight and precision, not playfulness. If an animation draws attention to itself, it's wrong.

---

## 9. Implementation

1. Build `constants/theme.ts` exporting `Colors`, `Type`, `Space`, `Radius`, `Motion`.
2. Load Cormorant Garamond and DM Sans via `expo-font` (or `@expo-google-fonts`), gate render on `fontsLoaded`.
3. Refactor screens one at a time. Do not attempt a global find-and-replace.
4. Delete each old style constant as its last consumer is migrated — never leave both systems live.

**Screen order** (each is independently shippable and testable):
1. Order detail — the highest-value single screen, and the best proof the direction works
2. Feed cards — highest volume, sets the app's overall texture
3. Profile / Deck — the identity surface, and the best screenshot for marketing
4. Create flow — the most complex; do it last, with the patterns already settled
5. Auth / onboarding — first impression, but lowest iteration cost

---

## 10. The Test

Before shipping any screen, ask: **would a food creator screenshot this and post it?**

If the answer is no, the screen isn't done. That's not vanity — organic sharing by creators is the distribution model, and a screen nobody wants to share is a screen that doesn't work.
