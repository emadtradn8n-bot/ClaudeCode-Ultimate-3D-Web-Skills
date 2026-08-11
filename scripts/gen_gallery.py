import math, os, random

W, H = 800, 1200
OUT = "/home/user/ClaudeCode-Ultimate-3D-Web-Skills/sites/public/prmpt"
os.makedirs(OUT, exist_ok=True)

# Ten archive studies. Each is a draped-cloth abstraction in a restrained
# palette so the gallery reads as one collection, not ten unrelated pictures.
PALETTES = [
    ("#1a1c20", "#05060a", "#e8eef6", "#7e8898"),
    ("#2a2420", "#0a0806", "#f4e8d8", "#9a8a76"),
    ("#161a1e", "#04060b", "#dfe8f2", "#6f7d90"),
    ("#242024", "#08060a", "#efe6ee", "#8c8090"),
    ("#1e2220", "#050807", "#e4efe8", "#76887e"),
    ("#282420", "#090705", "#f6ecdc", "#a09076"),
    ("#181c22", "#04060c", "#e2eaf4", "#727f94"),
    ("#221e1c", "#070505", "#f0e6de", "#948478"),
    ("#1c2024", "#05070b", "#e6eef8", "#78869a"),
    ("#262022", "#080608", "#f2e8ec", "#968690"),
]


def drape(rng, w, h, x, width, bow, freq, phase):
    """One fold: a closed path tracing down the left edge and back up the right."""
    n = 26
    left, right = [], []
    for j in range(n + 1):
        u = j / n
        wob = math.sin(u * math.pi * freq + phase) * bow * w
        taper = 0.35 + 0.65 * math.sin(u * math.pi)
        lx = x * w + wob
        left.append((lx, u * h))
        right.append((lx + width * w * taper, u * h))
    pts = left + right[::-1]
    d = "M %.1f %.1f " % pts[0]
    for p in pts[1:]:
        d += "L %.1f %.1f " % p
    return d + "Z"


def build(i):
    rng = random.Random(1000 + i * 37)
    base, deep, light, mid = PALETTES[i]
    folds = []
    count = rng.randint(9, 15)
    for k in range(count):
        x = 0.02 + (k / max(1, count - 1)) * 0.9 + rng.uniform(-0.03, 0.03)
        folds.append(
            {
                "d": drape(
                    rng, W, H, x,
                    rng.uniform(0.03, 0.13),
                    rng.uniform(-0.09, 0.09),
                    rng.uniform(0.8, 2.4),
                    rng.uniform(0, 6.28),
                ),
                "o": round(rng.uniform(0.12, 0.62), 3),
                "c": light if rng.random() > 0.32 else mid,
            }
        )

    lx = rng.uniform(0.25, 0.75)
    ly = rng.uniform(0.2, 0.55)

    paths = "\n".join(
        '    <path d="%s" fill="url(#f%d)" opacity="%s"/>' % (f["d"], n, f["o"])
        for n, f in enumerate(folds)
    )
    grads = "\n".join(
        '    <linearGradient id="f%d" x1="0" y1="0" x2="1" y2="0">'
        '<stop offset="0" stop-color="%s" stop-opacity="0"/>'
        '<stop offset="0.42" stop-color="%s" stop-opacity="0.95"/>'
        '<stop offset="0.78" stop-color="%s" stop-opacity="0.45"/>'
        '<stop offset="1" stop-color="%s" stop-opacity="0"/></linearGradient>'
        % (n, f["c"], f["c"], f["c"], f["c"])
        for n, f in enumerate(folds)
    )

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{base}"/>
      <stop offset="1" stop-color="{deep}"/>
    </linearGradient>
    <radialGradient id="key" cx="{lx:.3f}" cy="{ly:.3f}" r="0.72">
      <stop offset="0" stop-color="{light}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="{light}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.62"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="{i * 13}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
{grads}
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <g>
{paths}
  </g>
  <rect width="{W}" height="{H}" fill="url(#key)"/>
  <rect width="{W}" height="{H}" fill="url(#vig)"/>
  <rect width="{W}" height="{H}" filter="url(#grain)" opacity="0.11" style="mix-blend-mode:overlay"/>
  <text x="28" y="{H - 28}" font-family="'Inter Tight', Inter, sans-serif" font-size="19"
        font-weight="500" letter-spacing="1.6" fill="{light}" opacity="0.5">ARCHIVE {i + 1:03d}</text>
</svg>'''


for i in range(10):
    with open(os.path.join(OUT, "archive-%02d.svg" % (i + 1)), "w", encoding="utf-8") as f:
        f.write(build(i))

print("wrote 10 archive studies to", OUT)
