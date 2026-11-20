# Now updates

Add each update as `<slug>/index.md` or `<slug>/index.mdx`, with images beside it.
The `/now/` page renders entries newest first by `createdAt`. Each month has a
stable anchor, for example `/now/#2026-11`.

Required frontmatter: `title`, `description`, `createdAt`, `updatedAt`, and
`published`. Use `published: false` while editing: drafts appear in the development
server with a Draft label and are omitted from production builds. Set it to `true`
when the update is ready for inclusion in the built site.

Use relative image paths such as `./reader.png`. The existing asset-copy step runs
before development and builds. After adding or replacing an image while the dev
server is already running, run `pnpm --filter @apps/personal-website copy-assets`.

Keep article prose, headings, captions, and editing prompts in the content file.
The Astro page owns the month heading, date, and draft label.

The November stub covers work through November 20, 2026. Its first-person
motivations are proposed framing for Urban to review. Captions distinguish
design previews from the running local Stack website.
