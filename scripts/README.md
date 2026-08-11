# Build scripts

## Artifact bundling

Every site can be flattened into a single self-contained HTML file — no external
requests at all — for publishing as an Artifact. That constraint is why fonts,
images and scripts all end up inlined as data URIs.

```bash
# 1. Static cafe sites -> artifacts/*.html
python3 scripts/build_cafe_artifacts.py

# 2. React sites: build each page as one bundle, then inline
cd sites
for p in novaai nexum prmpt; do PAGE=$p npx vite build --config vite.artifact.config.ts; done
cd ..
python3 scripts/build_react_artifacts.py
```

Output lands in `artifacts/` (gitignored — it is generated, and each file is
0.3–1.8 MB of base64).

Two things the bundler has to handle that are easy to miss:

- **Direction.** The Artifact host owns the `<html>` element, so the cafe sites'
  `dir="rtl"` never survives. `build_cafe_artifacts.py` re-establishes it with a
  `html { direction: rtl }` rule plus a `lang="ar" dir="rtl"` wrapper; without
  both, the layout mirrors and Arabic punctuation lands on the wrong side.
- **Asset paths in JS.** Anything referenced as a runtime-built string (a template
  literal) is invisible to the inliner. Asset lists in the React sources are
  written out literally for this reason.

## Asset generation

`gen_gallery.py` regenerates the ten prmpt archive studies in
`sites/public/prmpt/`. `fontpack.py` downloads Google Fonts subsets (latin,
latin-ext, arabic) and emits `@font-face` rules with base64 woff2; it is imported
by the cafe bundler and can also be run directly with a Google Fonts CSS URL.
