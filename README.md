# MotoRiders — marketing site

A single-page site for **MotoRiders**, a group-ride tracker for two-wheeler
riders. One six-letter code (or its QR) puts a whole crew on one live map, and
every ride recorded — group, solo or the daily commute — adds to the rider's
lifetime distance.

**Live:** https://iamthirukkumaran.github.io/moto_rider/

## Running it

No build step and no dependencies. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The whole page |
| `styles.css` | Tokens, layout, components, responsive and reduced-motion rules |
| `app.js` | Theme, scroll reveal, the live rider map, the create/join switch, the invite QR, the odometer counters, the SOS countdown |

All artwork is drawn in CSS and inline SVG — there are no image files.

## What's on the page

Four beats, in the order a rider meets them:

1. **Hero** — the live group map, and the promise: ride together, count every km.
2. **Start a ride** — a Create / Join switch drives one phone. Create shows the
   six-letter code and the invite QR; Join shows the code entry and keypad.
3. **On the ride** — everyone live on one map, breaks that log themselves, and
   SOS with a three-second hold.
4. **Your profile** — the odometer. Lifetime distance counts up, split into rides,
   km with the crew and km on your own, with solo and group given equal weight.

The hero map is not a screenshot: five riders move along one shared route past
tea, fuel and food stops, each coloured by status — leading, riding, falling
behind, on a break. Positions are sampled from the SVG path with
`getPointAtLength` and driven by `requestAnimationFrame`, which pauses when the
map scrolls out of view, when the tab is hidden, or under reduced motion.

The invite QR is drawn at runtime from a fixed seed. It is decorative — a
plausible module grid so the screen reads as an invite — not a scannable payload.

## Design notes

- **Type:** Inter, tightened to `-0.045em` on the display sizes; JetBrains Mono
  for codes, counters and labels.
- **Palette:** amber accent on a near-black base, with semantic colours for rider
  status (leading, riding, falling behind, on a break).
- **Theme:** follows the system by default; one button toggles and persists.
- **Motion:** strong custom curves (`cubic-bezier(0.23, 1, 0.32, 1)` for entrances,
  `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement). Press feedback stays
  under 160ms; UI motion stays under 300ms.
- **Accessibility:** `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-contrast` are all handled, every hover is gated behind
  `(hover: hover) and (pointer: fine)`, the Create/Join switch is a real tablist
  with arrow-key support, and the page reads fine with JavaScript off.

## Still to do

- The store buttons are `#` placeholders, and the badges are custom-drawn rather
  than Apple's and Google's official assets — swap those in before launch.
- Figures inside the mock screens (12,480 km, 148 km left, trip code BLRGOA) are
  illustrative product UI, not real data.
- No privacy policy page yet; the app stores will want one.
