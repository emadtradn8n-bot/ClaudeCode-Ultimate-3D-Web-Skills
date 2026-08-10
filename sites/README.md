# Three landing builds

React + TypeScript + Vite + Tailwind v4. One workspace, four independent entries,
shared `node_modules`. No router anywhere: each page mounts its own React root.

```
npm install
npm run dev      # http://localhost:5199
npm run build
```

| Route | Page | Motion model |
|---|---|---|
| `/` | index | static list of the three builds |
| `/novaai/` | NOVA_AI | page scroll scrubs a morphing background |
| `/nexum/` | Nexum | single viewport, continuously looping background |
| `/prmpt/` | prmpt | cursor scrubs two takes, then a scroll-driven gallery |

## Backgrounds are procedural, not video

The original briefs pointed at CloudFront `.mp4` files plus `images.higgs.ai` and
`pravatar.cc` assets. None of those hosts are reachable from this environment, so
every background is drawn to a `<canvas>` at runtime instead, and every image is a
generated SVG under `public/`.

That trade is a good fit for what these pages actually needed: two of the three
briefs wanted a video *scrubbed* by scroll or cursor rather than played, and a
deterministic draw function does that natively — no frame cache, no seek latency,
no poster-to-video crossfade, and no network dependency.

`src/shared/` holds the drawing code:

- `field.ts` — deterministic hash/lerp helpers, grain tile, bokeh, mist, vignette,
  DPR-aware canvas sizing (capped at 2).
- `novaScene.ts` — `drawNovaFrame(ctx, w, h, progress)`. Progress `0 → 1` morphs
  hanging white cables with glowing gold tips into a folded mass around a warm
  core, over blue-grey mist. Same input always yields the same frame.
- `nexumScene.ts` — `drawNexumFrame(ctx, w, h, time)`. Looping light trails. Kept
  mid-toned up top so the brief's near-black mobile type stays readable, and shaded
  down toward the bottom where the desktop layout anchors its white type.
- `prmptScene.ts` — `drawPrmptFrame(ctx, w, h, progress, variant)`. Two draped-cloth
  takes: variant 0 cool bone, variant 1 warm ash.

Scroll and cursor mapping is lerped (`+= (target - current) * 0.12`) and frames are
only redrawn when the eased value actually moves, so scrubbing stays smooth without
burning a full redraw per frame.

## Generated assets

- `public/prmpt/archive-01..10.svg` — ten draped-cloth archive studies in one
  restrained palette family, with `feTurbulence` grain.
- `public/novaai/portrait.svg`, `public/nexum/avatar.svg` — abstract figure
  placeholders. Deliberately not photorealistic: these stand in for a real
  co-founder photo and a real customer photo, and inventing a convincing likeness
  for a named person would misrepresent someone. Swap in real photography before
  shipping.
- `public/fonts/` — Inter, Inter Tight, Geist and Silkscreen self-hosted as woff2
  (latin + latin-ext only, ~292 KB). Google Fonts is not reachable from the browser
  here, and self-hosting also removes a render-blocking third-party request.

## Reduced motion

Every scene honours `prefers-reduced-motion`. Nexum paints a single still frame,
prmpt stops alternating takes, and NovaAI stays scroll-driven (it never self-animates).
