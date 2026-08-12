"""Flatten each built cafe into one self-contained HTML file.

The Artifact host blocks every outbound request, so the JS chunk, the CSS, the
base64 font faces and any /public asset are inlined. Output is body-level
content only: the host supplies the doctype/html/head/body skeleton.

    cd cafes
    for p in nasma rumman misk raseef; do
      PAGE=$p npx vite build --config vite.artifact.config.ts
    done
    python3 scripts/build_artifacts.py
"""

import base64
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BUILD = os.path.join(ROOT, "dist-artifact")
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(os.path.dirname(ROOT), "artifacts")

CAFES = ["nasma", "rumman", "misk", "raseef"]
MIME = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2"}


def data_uri(path: str) -> str:
    mime = MIME[os.path.splitext(path)[1].lower()]
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode("ascii")


def inline_assets(text: str) -> str:
    """Rewrite any /photos/... or /favicon.svg reference that exists on disk."""

    def repl(m: re.Match[str]) -> str:
        rel = m.group(0)
        p = os.path.join(PUBLIC, rel.lstrip("/"))
        return data_uri(p) if os.path.isfile(p) else rel

    return re.sub(r"/(?:photos/[A-Za-z0-9_/-]+|favicon)\.(?:svg|png|jpe?g|webp)", repl, text)


def build(cafe: str) -> None:
    base = os.path.join(BUILD, cafe)
    html = open(os.path.join(base, cafe, "index.html"), encoding="utf-8").read()
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()

    js = open(os.path.join(base, "app.js"), encoding="utf-8").read()
    css = open(os.path.join(base, "app.css"), encoding="utf-8").read()

    leftover = re.findall(r'from\s*"(/[^"]+)"', js)
    if leftover:
        sys.exit(f"{cafe}: unresolved chunk imports {leftover[:3]}")

    # Fonts are already base64 inside the per-cafe stylesheet.
    fonts = open(os.path.join(PUBLIC, "fonts", f"{cafe}.css"), encoding="utf-8").read()

    doc = f"""<title>{title}</title>
<style>
{fonts}

/* The host owns <html>, so direction has to be re-established from CSS or the
   whole layout mirrors and Arabic punctuation lands on the wrong side. */
html {{ direction: rtl; }}
html, body {{ margin: 0; padding: 0; }}

{inline_assets(css)}
</style>
<div id="root"></div>
<script type="module">
{inline_assets(js)}
</script>
"""
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{cafe}.html")
    open(path, "w", encoding="utf-8").write(doc)
    print(f"{cafe + '.html':16} {len(doc)/1024:7.0f} KB   {title}")


for c in CAFES:
    build(c)
