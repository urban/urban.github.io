import { DateTime } from "effect"

const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const WIKI_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g
export const UNRESOLVED_WIKI_LINK_CLASS = "text-sm opacity-75"

export type NoteData = {
  readonly slug: string
  readonly permalink: string
  readonly title: string
  readonly description: string
  readonly createdAt: DateTime.Utc
  readonly updatedAt: DateTime.Utc
  readonly aliases: ReadonlyArray<string>
  readonly published: boolean
}

export type NoteMetadataSeed = {
  readonly slug: string
  readonly permalink: string
  readonly title: string
  readonly explicitDescription: string | undefined
  readonly createdAt: DateTime.Utc
  readonly updatedAt: DateTime.Utc
  readonly aliases: ReadonlyArray<string>
  readonly published: boolean
}

export type PublishedWikiLinkEntry = {
  readonly slug: string
  readonly title: string
  readonly aliases: ReadonlyArray<string>
  readonly relativePath: string
}

export type PublishedWikiLinkLookup = {
  readonly byPath: ReadonlyMap<string, PublishedWikiLinkEntry>
  readonly byFilename: ReadonlyMap<string, PublishedWikiLinkEntry>
  readonly byAlias: ReadonlyMap<string, PublishedWikiLinkEntry>
}

type WikiLinkLabel =
  | {
      readonly _tag: "ImplicitWikiLinkLabel"
      readonly text: string
    }
  | {
      readonly _tag: "ExplicitWikiLinkLabel"
      readonly text: string
    }

type ParsedWikiLink = {
  readonly _tag: "ParsedWikiLink"
  readonly raw: string
  readonly target: string
  readonly label: WikiLinkLabel
}

type WikiLinkSegment =
  | {
      readonly _tag: "TextSegment"
      readonly value: string
    }
  | {
      readonly _tag: "WikiLinkSegment"
      readonly link: ParsedWikiLink
    }

type WikiLinkResolution =
  | {
      readonly _tag: "ResolvedWikiLink"
      readonly link: ParsedWikiLink
      readonly entry: PublishedWikiLinkEntry
    }
  | {
      readonly _tag: "UnresolvedWikiLink"
      readonly link: ParsedWikiLink
    }

type LookupCollision = {
  readonly token: string
  readonly first: PublishedWikiLinkEntry
  readonly second: PublishedWikiLinkEntry
}

class WikiLinkLookupCollisionError extends Error {
  readonly token: string
  readonly first: PublishedWikiLinkEntry
  readonly second: PublishedWikiLinkEntry

  constructor(message: string, { token, first, second }: LookupCollision) {
    super(message)
    this.token = token
    this.first = first
    this.second = second
  }
}

export class WikiLinkPathCollisionError extends WikiLinkLookupCollisionError {
  constructor({ token, first, second }: LookupCollision) {
    super(
      `Duplicate path token "${token}" for "${first.slug}" (${first.title}) and "${second.slug}" (${second.title})`,
      { token, first, second },
    )
    this.name = "WikiLinkPathCollisionError"
  }
}

export class WikiLinkFilenameCollisionError extends WikiLinkLookupCollisionError {
  constructor({ token, first, second }: LookupCollision) {
    super(
      `Duplicate filename token "${token}" for "${first.slug}" (${first.title}) and "${second.slug}" (${second.title})`,
      { token, first, second },
    )
    this.name = "WikiLinkFilenameCollisionError"
  }
}

export class WikiLinkAliasCollisionError extends WikiLinkLookupCollisionError {
  readonly alias: string

  constructor({ token, first, second }: LookupCollision) {
    super(
      `Duplicate alias "${token}" for "${first.slug}" (${first.title}) and "${second.slug}" (${second.title})`,
      { token, first, second },
    )
    this.name = "WikiLinkAliasCollisionError"
    this.alias = token
  }
}

export const normalizeSlug = (permalink: string): string | undefined => {
  const slug = permalink.replace(/^\/+|\/+$/g, "")
  if (slug.length === 0) {
    return undefined
  }

  return SLUG_SEGMENT.test(slug) ? slug : undefined
}

export const toRoutePath = (slug: string): string =>
  slug === "index" ? "/garden" : `/garden/${slug}`

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const escapeMarkdownLinkLabel = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]")

const normalizeWikiPathToken = (value: string): string | undefined => {
  const token = value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/")
    .toLowerCase()

  return token.length === 0 ? undefined : token
}

const normalizeWikiAliasToken = (value: string): string | undefined => {
  const token = value.trim().toLowerCase()
  return token.length === 0 ? undefined : token
}

const getBasename = (normalizedPath: string): string => {
  const segments = normalizedPath.split("/")
  return segments[segments.length - 1] ?? ""
}

const removeMarkdownExtension = (value: string): string =>
  value.toLowerCase().endsWith(".md") ? value.slice(0, -".md".length) : value

const setLookupEntry = (
  lookup: Map<string, PublishedWikiLinkEntry>,
  token: string,
  entry: PublishedWikiLinkEntry,
  onCollision: (collision: LookupCollision) => Error,
): void => {
  const existing = lookup.get(token)

  if (existing === undefined || existing.slug === entry.slug) {
    lookup.set(token, entry)
    return
  }

  throw onCollision({
    token,
    first: existing,
    second: entry,
  })
}

const parseWikiLink = (raw: string, rawReference: string): ParsedWikiLink => {
  const labelSeparatorIndex = rawReference.indexOf("|")

  if (labelSeparatorIndex === -1) {
    const target = rawReference.trim()
    return {
      _tag: "ParsedWikiLink",
      raw,
      target,
      label: {
        _tag: "ImplicitWikiLinkLabel",
        text: target,
      },
    }
  }

  const target = rawReference.slice(0, labelSeparatorIndex).trim()
  const label = rawReference.slice(labelSeparatorIndex + 1).trim()

  return {
    _tag: "ParsedWikiLink",
    raw,
    target,
    label: {
      _tag: "ExplicitWikiLinkLabel",
      text: label,
    },
  }
}

const getWikiLinkVisibleText = (link: ParsedWikiLink): string => link.label.text

const parseWikiLinkSegments = (source: string): ReadonlyArray<WikiLinkSegment> => {
  const segments: WikiLinkSegment[] = []
  let cursor = 0

  for (const match of source.matchAll(WIKI_LINK_PATTERN)) {
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
      link: parseWikiLink(rawMatch, rawTarget),
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

export const buildPublishedWikiLinkLookup = (
  entries: ReadonlyArray<PublishedWikiLinkEntry>,
): PublishedWikiLinkLookup => {
  const byPath = new Map<string, PublishedWikiLinkEntry>()
  const byFilename = new Map<string, PublishedWikiLinkEntry>()
  const byAlias = new Map<string, PublishedWikiLinkEntry>()

  for (const entry of entries) {
    const pathTokens = new Set<string>()
    const relativePathToken = normalizeWikiPathToken(entry.relativePath)

    if (relativePathToken !== undefined) {
      pathTokens.add(relativePathToken)

      const relativePathWithoutExtension = removeMarkdownExtension(relativePathToken)
      if (relativePathWithoutExtension !== relativePathToken) {
        pathTokens.add(relativePathWithoutExtension)
      }

      const filenameToken = getBasename(relativePathToken)
      if (filenameToken.length > 0) {
        const filenameTokens = new Set<string>([filenameToken])
        const filenameWithoutExtension = removeMarkdownExtension(filenameToken)
        if (filenameWithoutExtension !== filenameToken) {
          filenameTokens.add(filenameWithoutExtension)
        }

        for (const token of filenameTokens) {
          setLookupEntry(
            byFilename,
            token,
            entry,
            (collision) => new WikiLinkFilenameCollisionError(collision),
          )
        }
      }
    }

    const slugToken = normalizeWikiPathToken(entry.slug)
    if (slugToken !== undefined) {
      pathTokens.add(slugToken)
    }

    const routePathToken = normalizeWikiPathToken(toRoutePath(entry.slug))
    if (routePathToken !== undefined) {
      pathTokens.add(routePathToken)
    }

    for (const token of pathTokens) {
      setLookupEntry(byPath, token, entry, (collision) => new WikiLinkPathCollisionError(collision))
    }

    const aliasTokens = new Set<string>()
    for (const alias of entry.aliases) {
      const aliasToken = normalizeWikiAliasToken(alias)

      if (aliasToken === undefined || aliasTokens.has(aliasToken)) {
        continue
      }

      aliasTokens.add(aliasToken)
      setLookupEntry(
        byAlias,
        aliasToken,
        entry,
        (collision) => new WikiLinkAliasCollisionError(collision),
      )
    }
  }

  return {
    byPath,
    byFilename,
    byAlias,
  }
}

const resolveWikiLink = (
  link: ParsedWikiLink,
  lookup: PublishedWikiLinkLookup,
): WikiLinkResolution => {
  const pathTarget = normalizeWikiPathToken(link.target)

  if (pathTarget !== undefined) {
    const pathEntry = lookup.byPath.get(pathTarget)
    if (pathEntry !== undefined) {
      return {
        _tag: "ResolvedWikiLink",
        link,
        entry: pathEntry,
      }
    }

    const filenameTarget = getBasename(pathTarget)
    if (filenameTarget.length > 0) {
      const filenameEntry = lookup.byFilename.get(filenameTarget)
      if (filenameEntry !== undefined) {
        return {
          _tag: "ResolvedWikiLink",
          link,
          entry: filenameEntry,
        }
      }
    }
  }

  const aliasTarget = normalizeWikiAliasToken(link.target)
  if (aliasTarget !== undefined) {
    const aliasEntry = lookup.byAlias.get(aliasTarget)
    if (aliasEntry !== undefined) {
      return {
        _tag: "ResolvedWikiLink",
        link,
        entry: aliasEntry,
      }
    }
  }

  return {
    _tag: "UnresolvedWikiLink",
    link,
  }
}

export const rewriteWikiLinksToHtml = (source: string, lookup: PublishedWikiLinkLookup): string =>
  parseWikiLinkSegments(source)
    .map((segment) => {
      if (segment._tag === "TextSegment") {
        return segment.value
      }

      const resolution = resolveWikiLink(segment.link, lookup)

      if (resolution._tag === "UnresolvedWikiLink") {
        return `<span class="${escapeHtml(UNRESOLVED_WIKI_LINK_CLASS)}">${escapeHtml(getWikiLinkVisibleText(resolution.link))}</span>`
      }

      const visibleText =
        resolution.link.label._tag === "ExplicitWikiLinkLabel"
          ? resolution.link.label.text
          : resolution.entry.title

      return `<a href="${escapeHtml(toRoutePath(resolution.entry.slug))}">${escapeHtml(visibleText)}</a>`
    })
    .join("")

export const preprocessVaultMarkdownSource = (
  source: string,
  lookup: PublishedWikiLinkLookup,
): string =>
  parseWikiLinkSegments(source)
    .map((segment) => {
      if (segment._tag === "TextSegment") {
        return segment.value
      }

      const resolution = resolveWikiLink(segment.link, lookup)

      if (resolution._tag === "UnresolvedWikiLink") {
        return `<span className="${escapeHtml(UNRESOLVED_WIKI_LINK_CLASS)}">${escapeHtml(getWikiLinkVisibleText(resolution.link))}</span>`
      }

      const visibleText =
        resolution.link.label._tag === "ExplicitWikiLinkLabel"
          ? resolution.link.label.text
          : resolution.entry.title

      return `[${escapeMarkdownLinkLabel(visibleText)}](${toRoutePath(resolution.entry.slug)})`
    })
    .join("")

export const humanizeSlug = (slug: string): string =>
  slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")

export const resolveDescription = (
  explicitDescription: string | undefined,
  excerpt: string | undefined,
): string => explicitDescription ?? excerpt ?? ""

export const finalizeData = (
  metadata: NoteMetadataSeed,
  excerpt: string | undefined,
): NoteData => ({
  slug: metadata.slug,
  permalink: metadata.permalink,
  title: metadata.title,
  description: resolveDescription(metadata.explicitDescription, excerpt),
  createdAt: metadata.createdAt,
  updatedAt: metadata.updatedAt,
  aliases: metadata.aliases,
  published: metadata.published,
})
