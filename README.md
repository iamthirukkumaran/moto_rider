# MotoRiders — marketing site

A single-page site for **MotoRiders**, a group-ride app for two-wheeler riders.
Plan the trip, share one six-letter code, and see your whole crew live on one map
with turn-by-turn voice navigation.

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
| `app.js` | Theme switching, scroll reveal, the live rider map, SOS countdown, FAQ accordion |

All artwork is drawn in CSS and inline SVG — there are no image files.

## What's on the page

Hero with a live group-ride map, the four ways group rides fall apart, an
eleven-card feature bento (planning, invites, live map, navigation, alerts, SOS,
break detection, trip and team reports, garage, theme), a five-step walkthrough,
FAQ, privacy and support.

The hero map is not a screenshot: five riders move along one shared route past
tea, fuel and food stops, each coloured by status — leading, riding, falling
behind, on a break. Positions are sampled from the SVG path with
`getPointAtLength` and driven by `requestAnimationFrame`, which pauses when the
map scrolls out of view, when the tab is hidden, or under reduced motion.

## Design notes

- **Type:** Inter, tightened to `-0.045em` on the display sizes.
- **Palette:** amber accent on a near-black base, with semantic colours for rider
  status (leading, riding, falling behind, off route, on a break, arrived).
- **Theme:** follows the system by default, with a three-way Auto / Light / Dark
  control that persists — mirroring the app's own behaviour.
- **Motion:** strong custom curves (`cubic-bezier(0.23, 1, 0.32, 1)` for entrances,
  `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement). Press feedback stays
  under 160ms; UI motion stays under 300ms.
- **Accessibility:** `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-contrast` are all handled, every hover is gated behind
  `(hover: hover) and (pointer: fine)`, and the page reads fine with JavaScript off.

## Still to do

- The store buttons are `#` placeholders, and the badges are custom-drawn rather
  than Apple's and Google's official assets — swap those in before launch.
- Figures inside the mock screens (312 km, 7h 12m, trip code BLRGOA) are
  illustrative product UI, not real data.
