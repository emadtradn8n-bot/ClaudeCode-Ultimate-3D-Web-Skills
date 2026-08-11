"""Flatten each single-bundle React build into one self-contained artifact file.

The artifact CSP blocks every fetch, so the JS chunk, the CSS, the woff2 faces and
the /public SVGs (referenced as string literals inside the bundle) are all inlined
as data URIs. Emits body-level content; the host supplies the page skeleton.
"""
import base64, os, re

SITES = "/home/user/ClaudeCode-Ultimate-3D-Web-Skills/sites"
BUILD = os.path.join(SITES, "dist-artifact")
PUBLIC = os.path.join(SITES, "public")
OUT = "/home/user/ClaudeCode-Ultimate-3D-Web-Skills/artifacts"
os.makedirs(OUT, exist_ok=True)

PAGES = [("novaai", "novaai.html"), ("nexum", "nexum.html"), ("prmpt", "prmpt.html")]
MIME = {".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2"}


def data_uri(path: str) -> str:
    mime = MIME[os.path.splitext(path)[1].lower()]
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode("ascii")


def inline_font_css() -> str:
    d = os.path.join(PUBLIC, "fonts")
    css = open(os.path.join(d, "fonts.css"), encoding="utf-8").read()
    for f in sorted(os.listdir(d)):
        if f.endswith(".woff2"):
            css = css.replace("/fonts/" + f, data_uri(os.path.join(d, f)))
    return css


def swap_asset_paths(text: str) -> str:
    def repl(m):
        rel = m.group(0)
        p = os.path.join(PUBLIC, rel.lstrip("/"))
        return data_uri(p) if os.path.exists(p) else rel

    return re.sub(r"/(?:novaai|nexum|prmpt)/[A-Za-z0-9_-]+\.svg", repl, text)


FONT_CSS = inline_font_css()


def build(page: str, out_name: str) -> None:
    base = os.path.join(BUILD, page)
    html = open(os.path.join(base, page, "index.html"), encoding="utf-8").read()
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()

    js = open(os.path.join(base, "app.js"), encoding="utf-8").read()
    css = open(os.path.join(base, "app.css"), encoding="utf-8").read()

    leftover = re.findall(r'from\s*"(/[^"]+)"', js)
    if leftover:
        raise SystemExit(f"{page}: unresolved chunk imports {leftover[:3]}")

    js = swap_asset_paths(js)
    css = swap_asset_paths(css)

    doc = f"""<title>{title}</title>
<style>
{FONT_CSS}

html, body {{ margin: 0; padding: 0; }}

{css}
</style>
<div id="root"></div>
<script type="module">
{js}
</script>
"""
    open(os.path.join(OUT, out_name), "w", encoding="utf-8").write(doc)
    print(f"{out_name:14} {len(doc)/1024:8.0f} KB   title={title}")


for page, out_name in PAGES:
    build(page, out_name)
