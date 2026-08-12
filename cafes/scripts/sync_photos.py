"""Bind uploaded photographs to slots, for every cafe in the workspace.

Each cafe keeps its photos in public/photos/<cafe>/ and its slot registry in
src/<cafe>/assets.ts. This walks all of them, matches files to slots by
filename stem, and rewrites each MANIFEST block. Slots without a file keep
rendering their labelled "awaiting photo" plate.

    python3 cafes/scripts/sync_photos.py            # all cafes
    python3 cafes/scripts/sync_photos.py nasma      # just one

Filenames must match the slot ids, e.g. `cappuccino.jpg`, `hero.webp`.
Extension and letter case do not matter.
"""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def cafes() -> list[str]:
    src = os.path.join(ROOT, "src")
    return sorted(
        d
        for d in os.listdir(src)
        if os.path.isfile(os.path.join(src, d, "assets.ts"))
    )


def slot_ids(assets: str) -> list[str]:
    block = re.search(r"export const SLOTS[^{]*\{(.*?)\n\};", open(assets, encoding="utf-8").read(), re.S)
    if not block:
        sys.exit(f"could not find SLOTS in {assets}")
    return re.findall(r'^\s*"?([A-Za-z0-9_-]+)"?\s*:', block.group(1), re.M)


def sync(cafe: str) -> tuple[int, int]:
    assets = os.path.join(ROOT, "src", cafe, "assets.ts")
    photos = os.path.join(ROOT, "public", "photos", cafe)
    os.makedirs(photos, exist_ok=True)

    known = slot_ids(assets)
    found: dict[str, str] = {}
    unmatched: list[str] = []

    for name in sorted(os.listdir(photos)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in EXTS:
            continue
        key = stem.lower().strip()
        if key in known:
            found[key] = f"/photos/{cafe}/{name}"
        else:
            unmatched.append(name)

    entries = "\n".join(f'  "{k}": "{found[k]}",' for k in known if k in found)
    body = (
        f"export const MANIFEST: Record<string, string> = {{\n{entries}\n}};"
        if entries
        else "export const MANIFEST: Record<string, string> = {};"
    )

    src = open(assets, encoding="utf-8").read()
    src, n = re.subn(
        r"export const MANIFEST: Record<string, string> = \{.*?\};", body, src, flags=re.S
    )
    if n != 1:
        sys.exit(f"could not rewrite MANIFEST in {assets}")
    open(assets, "w", encoding="utf-8").write(src)

    print(f"\n{cafe}: bound {len(found)}/{len(known)}")
    for m in (k for k in known if k not in found):
        print("   awaiting:", m)
    for u in unmatched:
        print("   ignored (no matching slot):", u)

    return len(found), len(known)


def main() -> None:
    targets = sys.argv[1:] or cafes()
    total_found = total_known = 0
    for cafe in targets:
        f, k = sync(cafe)
        total_found += f
        total_known += k
    print(f"\ntotal: {total_found}/{total_known} slots have a photo")


if __name__ == "__main__":
    main()
