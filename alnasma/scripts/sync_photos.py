"""Bind uploaded photographs to their slots.

Reads whatever is in alnasma/public/photos/, matches each file to a slot id by
filename stem, and rewrites the MANIFEST block in src/shared/assets.ts. Any slot
without a file keeps rendering its labelled "awaiting photo" plate.

    python3 alnasma/scripts/sync_photos.py

Filenames must match the slot ids in assets.ts, e.g. `cappuccino.jpg`,
`iced-spanish-latte.webp`, `hero.png`. Extension and case do not matter.
"""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PHOTOS = os.path.join(ROOT, "public", "photos")
ASSETS = os.path.join(ROOT, "src", "shared", "assets.ts")

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def slot_ids() -> list[str]:
    src = open(ASSETS, encoding="utf-8").read()
    block = re.search(r"export const SLOTS[^{]*\{(.*?)\n\};", src, re.S)
    if not block:
        sys.exit("could not find SLOTS in assets.ts")
    return re.findall(r'^\s*"?([a-z0-9-]+)"?\s*:', block.group(1), re.M)


def main() -> None:
    os.makedirs(PHOTOS, exist_ok=True)
    known = slot_ids()

    found: dict[str, str] = {}
    unmatched: list[str] = []
    for name in sorted(os.listdir(PHOTOS)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in EXTS:
            continue
        key = stem.lower().strip()
        if key in known:
            found[key] = f"/photos/{name}"
        else:
            unmatched.append(name)

    entries = "\n".join(f'  "{k}": "{found[k]}",' for k in known if k in found)
    body = f"export const MANIFEST: Record<string, string> = {{\n{entries}\n}};" if entries else \
        "export const MANIFEST: Record<string, string> = {};"

    src = open(ASSETS, encoding="utf-8").read()
    src, n = re.subn(
        r"export const MANIFEST: Record<string, string> = \{.*?\};",
        body.replace("\\", "\\\\"),
        src,
        flags=re.S,
    )
    if n != 1:
        sys.exit("could not rewrite MANIFEST block")
    open(ASSETS, "w", encoding="utf-8").write(src)

    missing = [k for k in known if k not in found]
    print(f"bound {len(found)}/{len(known)} slots")
    if unmatched:
        print("\nignored (filename does not match any slot id):")
        for u in unmatched:
            print("  -", u)
    if missing:
        print("\nstill awaiting a photo:")
        for m in missing:
            print("  -", m)


if __name__ == "__main__":
    main()
