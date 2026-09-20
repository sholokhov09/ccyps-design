CCYPS Design Toolkit

Pages
- pattern.html — Pattern generator (based on ocean current heatmap)
- logo.html — Logo generator to keep branding consistent
- index.html — Maybe a design system in the future? idk

Logo assets
- All six SVG logo assets use vector paths only.
- No wordmark font loading is required in exported logo assets.
- PNG files are rasterized directly from those same SVG paths with transparent backgrounds.
- Wordmark: lowercase Alexandria 900 outlines.
- One-line lockup: 32px symbol height, exactly 48px between the symbol box and wordmark.
- The wordmark text is: climate conscious young professionals society.

Canonical asset update:
- The supplied one-line and two-line black SVG iterations are now the source of truth, copied without geometric modification.
- White SVGs are exact geometry clones with fill changed only from black to white.
- PNGs are rasterized from those exact SVGs.
- Preview loads the canonical SVG assets directly; CSS adds no logo/text gap or line spacing.

Alexandria 900-normal update:
- Wordmarks rebuilt from alexandria-latin-900-normal.ttf, not from the heavier-looking outlined iteration text.
- User iteration's visual spacing is preserved: one-line 28px visual mark/text gap; two-line 26px visual gap; two-line 15.75px blank row gap.
- Symbol paths remain copied from the user's iteration.
- Black/white SVG geometry is identical; PNGs are generated from those SVGs.
