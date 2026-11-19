# Site UI

The global design tokens in `styles/theme.css` own the paper, ink, accent, and link colors for both themes. Component styles in `styles/globals.css` use those tokens; `.prose` is opt-in for Markdown content.

Reusable primitives expose constrained visual variants:

- `Heading`: display, page, section, and item. The required heading level controls document structure independently of appearance.
- `Text`: body, label, muted, eyebrow, and lede.
- `Link`: text, navigation, and subtle. Native anchors preserve keyboard navigation, email handling, and external-link behavior.
- `Button`: outline and ghost. Defaults to `type="button"`; all native button attributes remain available.
- `Container`: site and reading widths.
- `ContentCard`: numbered project or dated essay, with a discriminated union requiring the metadata appropriate to each kind.

`Header`, `Footer`, `HomeIntro`, `ContactSection`, and `ProjectList` compose those primitives. Keep one-off details inside their composition rather than exporting another small component. Project lists use three columns from 900px, two from 601–899px, and one at 600px and below.
