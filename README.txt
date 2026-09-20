CCYPS Design Toolkit

Pages
- pattern.html — Bộ tạo họa tiết
- logo.html — Bộ tạo logo
- index.html — opens the pattern generator

Logo assets
- All six SVG logo assets use vector paths only.
- No wordmark font loading is required in exported logo assets.
- PNG files are rasterized directly from those same SVG paths with transparent backgrounds.
- Wordmark: lowercase Alexandria 900 outlines.
- One-line lockup: 32px symbol height, exactly 48px between the symbol box and wordmark.
- The wordmark text is: climate conscious young professionals society.

UI
- Both tools share the same header, navigation, 380px control rail, section system, typography and white workspace.
- Navigation switches directly between the two generators.
- Mobile stacks the preview/workspace above controls.
- Copy PNG requires browser clipboard permission and a secure context such as HTTPS. GitHub Pages satisfies the secure-context requirement.

Canonical asset update:
- The supplied one-line and two-line black SVG iterations are now the source of truth, copied without geometric modification.
- White SVGs are exact geometry clones with fill changed only from black to white.
- PNGs are rasterized from those exact SVGs.
- Preview loads the canonical SVG assets directly; CSS adds no logo/text gap or line spacing.
