"""Flatten each static cafe site into a single self-contained artifact file.

Inlines the stylesheet, the script, every SVG image as a data URI, and swaps the
Google Fonts <link> for base64 @font-face rules. Emits body-level content only:
the artifact host supplies the doctype/html/head/body skeleton.
"""
import base64, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fontpack import pack

ROOT = "/home/user/ClaudeCode-Ultimate-3D-Web-Skills"
OUT = "/home/user/ClaudeCode-Ultimate-3D-Web-Skills/artifacts"
os.makedirs(OUT, exist_ok=True)

SITES = [
    ("rustic-cafe", "templates/rustic-cafe", "rukn-alhatab.html"),
    ("modern-cafe", "templates/modern-cafe", "athar.html"),
    ("luxury-cafe", "templates/luxury-cafe", "layali.html"),
    ("catalog", ".", "studio-alkahwa.html"),
]


MIME = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp"}


def data_uri(path: str) -> str:
    mime = MIME[os.path.splitext(path)[1].lower()]
    raw = open(path, "rb").read()
    return f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")


def build(name: str, rel: str, out_name: str) -> None:
    base = os.path.join(ROOT, rel)
    html = open(os.path.join(base, "index.html"), encoding="utf-8").read()

    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()

    # Fonts: pull the real subsets down and inline them.
    link = re.search(r'<link href="(https://fonts\.googleapis\.com[^"]+)" rel="stylesheet">', html)
    font_css = pack(link.group(1)) if link else ""

    css = open(os.path.join(base, "style.css"), encoding="utf-8").read()
    js = open(os.path.join(base, "script.js"), encoding="utf-8").read()

    # Body content only.
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    body = re.sub(r'<script src="script\.js"></script>', "", body)

    # Images -> data URIs (relative paths only; there are no remote ones left).
    def swap(m):
        src = m.group(1)
        if src.startswith(("http", "data:")):
            return m.group(0)
        p = os.path.join(base, src)
        if not os.path.exists(p):
            raise SystemExit(f"missing asset {p}")
        return m.group(0).replace(src, data_uri(p))

    body = re.sub(r'src="([^"]+)"', swap, body)

    # The artifact host owns the <html> element, so the original dir="rtl"/lang
    # never survives. Re-establish direction from CSS and carry lang on a wrapper,
    # otherwise the whole layout mirrors and Arabic punctuation lands wrong.
    doc = f"""<title>{title}</title>
<style>
{font_css}

html {{ direction: rtl; }}

{css}
</style>
<div lang="ar" dir="rtl">
{body.strip()}
</div>
<script>
{js}
</script>
"""
    path = os.path.join(OUT, out_name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(doc)
    print(f"{out_name:26} {len(doc)/1024:8.0f} KB   title={title}")


for name, rel, out_name in SITES:
    build(name, rel, out_name)
