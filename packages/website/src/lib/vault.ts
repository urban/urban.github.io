const VAULT_SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const VAULT_WIKI_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g

export type VaultData = {
  readonly slug: string
  readonly permalink: string
  readonly title: string
  readonly description: string
  readonly created: Date
  readonly updated: Date
  readonly aliases: ReadonlyArray<string>
  readonly published: boolean
}

export type PublishedVaultWikiLinkEntry = {
  readonly slug: string
  readonly title: string
}

type ParsedVaultWikiLink = {
  readonly _tag: "ParsedVaultWikiLink"
  readonly raw: string
  readonly target: string
}

type VaultWikiLinkSegment =
  | {
      readonly _tag: "TextSegment"
      readonly value: string
    }
  | {
      readonly _tag: "WikiLinkSegment"
      readonly link: ParsedVaultWikiLink
    }

type VaultWikiLinkResolution =
  | {
      readonly _tag: "ResolvedVaultWikiLink"
      readonly link: ParsedVaultWikiLink
      readonly entry: PublishedVaultWikiLinkEntry
    }
  | {
      readonly _tag: "UnresolvedVaultWikiLink"
      readonly link: ParsedVaultWikiLink
    }

export const normalizeVaultSlug = (permalink: string): string | undefined => {
  const slug = permalink.replace(/^\/+|\/+$/g, "")
  if (slug.length === 0) {
    return undefined
  }

  return VAULT_SLUG_SEGMENT.test(slug) ? slug : undefined
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const parseVaultWikiLinkSegments = (source: string): ReadonlyArray<VaultWikiLinkSegment> => {
  const segments: VaultWikiLinkSegment[] = []
  let cursor = 0

  for (const match of source.matchAll(VAULT_WIKI_LINK_PATTERN)) {
    const [rawMatch, rawTarget] = match
    const matchIndex = match.index

    if (matchIndex === undefined) {
      continue
    }

    if (matchIndex > cursor) {
      segments.push({
        _tag: "TextSegment",
        value: source.slice(cursor, matchIndex),
      })
    }

    segments.push({
      _tag: "WikiLinkSegment",
      link: {
        _tag: "ParsedVaultWikiLink",
        raw: rawMatch,
        target: rawTarget,
      },
    })

    cursor = matchIndex + rawMatch.length
  }

  if (cursor < source.length) {
    segments.push({
      _tag: "TextSegment",
      value: source.slice(cursor),
    })
  }

  return segments
}

export const buildPublishedVaultWikiLinkLookup = (
  entries: ReadonlyArray<PublishedVaultWikiLinkEntry>,
): ReadonlyMap<string, PublishedVaultWikiLinkEntry> =>
  new Map(entries.map((entry) => [entry.slug, entry] as const))

const resolveVaultWikiLink = (
  link: ParsedVaultWikiLink,
  lookup: ReadonlyMap<string, PublishedVaultWikiLinkEntry>,
): VaultWikiLinkResolution => {
  const targetSlug = normalizeVaultSlug(link.target)

  if (targetSlug === undefined) {
    return {
      _tag: "UnresolvedVaultWikiLink",
      link,
    }
  }

  const entry = lookup.get(targetSlug)

  if (entry === undefined) {
    return {
      _tag: "UnresolvedVaultWikiLink",
      link,
    }
  }

  return {
    _tag: "ResolvedVaultWikiLink",
    link,
    entry,
  }
}

export const rewriteVaultWikiLinksToHtml = (
  source: string,
  lookup: ReadonlyMap<string, PublishedVaultWikiLinkEntry>,
): string =>
  parseVaultWikiLinkSegments(source)
    .map((segment) => {
      if (segment._tag === "TextSegment") {
        return segment.value
      }

      const resolution = resolveVaultWikiLink(segment.link, lookup)

      if (resolution._tag === "UnresolvedVaultWikiLink") {
        return resolution.link.raw
      }

      return `<a href="${escapeHtml(toVaultRoutePath(resolution.entry.slug))}">${escapeHtml(resolution.entry.title)}</a>`
    })
    .join("")

export const toVaultRoutePath = (slug: string): string => `/vault/${slug}`

export const humanizeVaultSlug = (slug: string): string =>
  slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")

export const resolveVaultDescription = (
  explicitDescription: string | undefined,
  excerpt: string | undefined,
): string => explicitDescription ?? excerpt ?? ""
