"""Download Google Fonts subsets and emit @font-face rules with base64 woff2.

Artifacts run under a CSP that blocks every external host, so a linked webfont
would silently fall back. Inlining is the only way the type actually renders.
"""
import base64, os, re, subprocess, sys, hashlib

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

CACHE = "/tmp/fontcache"
os.makedirs(CACHE, exist_ok=True)

# Only these subsets; arabic is needed for the cafe sites, latin for the rest.
WANTED = ("latin", "latin-ext", "arabic")


def fetch(url: str) -> bytes:
    key = os.path.join(CACHE, hashlib.md5(url.encode()).hexdigest())
    if os.path.exists(key) and os.path.getsize(key) > 100:
        return open(key, "rb").read()
    r = subprocess.run(["curl", "-sS", "--max-time", "60", "-A", UA, "-o", key, url])
    if r.returncode != 0:
        raise SystemExit("fetch failed: " + url)
    return open(key, "rb").read()


def pack(css_url: str) -> str:
    css = fetch(css_url).decode("utf-8")
    blocks = re.split(r"(?=/\* )", css)
    out = []
    for b in blocks:
        m = re.match(r"/\* ([a-z0-9-]+) \*/", b.strip())
        if not m or m.group(1) not in WANTED:
            continue
        urls = re.findall(r"url\((https://[^)]+)\)", b)
        for u in urls:
            data = fetch(u)
            b64 = base64.b64encode(data).decode("ascii")
            b = b.replace(u, f"data:font/woff2;base64,{b64}")
        out.append(b.strip())
    return "\n".join(out)


if __name__ == "__main__":
    print(pack(sys.argv[1]))
