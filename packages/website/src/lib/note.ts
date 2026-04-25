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

type WikiLinkLookupSource =
  | {
      readonly _tag: "CanonicalWikiLinkLookupSource"
      readonly entry: PublishedWikiLinkEntry
    }
  | {
      readonly _tag: "AliasWikiLinkLookupSource"
      readonly entry: PublishedWikiLinkEntry
    }

export class WikiLinkAliasCollisionError extends Error {
  readonly alias: string
  readonly first: PublishedWikiLinkEntry
  readonly second: PublishedWikiLinkEntry

  constructor({
    alias,
    first,
    second,
  }: {
    readonly alias: string
    readonly first: PublishedWikiLinkEntry
    readonly second: PublishedWikiLinkEntry
  }) {
    super(
      `Duplicate alias "${alias}" for "${first.slug}" (${first.title}) and "${second.slug}" (${second.title})`,
    )
    this.name = "WikiLinkAliasCollisionError"
    this.alias = alias
    this.first = first
    this.second = second
  }
}

export const normalizeSlug = (permalink: string): string | undefined => {
  const slug = permalink.replace(/^\/+|\/+$/g, "")
  if (slug.length === 0) {
    return undefined
  }

  return SLUG_SEGMENT.test(slug) ? slug : undefined
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const escapeMarkdownLinkLabel = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]")

const normalizeWikiLookupToken = (value: string): string | undefined => {
  const token = value.trim().replace(/\s+/g, " ").toLowerCase()
  return token.length === 0 ? undefined : token
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
): ReadonlyMap<string, PublishedWikiLinkEntry> => {
  const lookup = new Map<string, WikiLinkLookupSource>()

  for (const entry of entries) {
    const canonicalToken = normalizeWikiLookupToken(entry.slug)

    if (canonicalToken !== undefined) {
      lookup.set(canonicalToken, {
        _tag: "CanonicalWikiLinkLookupSource",
        entry,
      })
    }
  }

  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const aliasToken = normalizeWikiLookupToken(alias)

      if (aliasToken === undefined) {
        continue
      }

      const existing = lookup.get(aliasToken)

      if (existing === undefined) {
        lookup.set(aliasToken, {
          _tag: "AliasWikiLinkLookupSource",
          entry,
        })
        continue
      }

      if (existing.entry.slug === entry.slug) {
        continue
      }

      if (existing._tag === "CanonicalWikiLinkLookupSource") {
        continue
      }

      throw new WikiLinkAliasCollisionError({
        alias,
        first: existing.entry,
        second: entry,
      })
    }
  }

  const resolvedLookup = new Map<string, PublishedWikiLinkEntry>()

  for (const [token, source] of lookup) {
    resolvedLookup.set(token, source.entry)
  }

  return resolvedLookup
}

const resolveWikiLink = (
  link: ParsedWikiLink,
  lookup: ReadonlyMap<string, PublishedWikiLinkEntry>,
): WikiLinkResolution => {
  const targetSlug = normalizeWikiLookupToken(link.target)

  if (targetSlug === undefined) {
    return {
      _tag: "UnresolvedWikiLink",
      link,
    }
  }

  const entry = lookup.get(targetSlug)

  if (entry === undefined) {
    return {
      _tag: "UnresolvedWikiLink",
      link,
    }
  }

  return {
    _tag: "ResolvedWikiLink",
    link,
    entry,
  }
}

export const rewriteWikiLinksToHtml = (
  source: string,
  lookup: ReadonlyMap<string, PublishedWikiLinkEntry>,
): string =>
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
  lookup: ReadonlyMap<string, PublishedWikiLinkEntry>,
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

export const toRoutePath = (slug: string): string =>
  slug === "index" ? "/garden" : `/garden/${slug}`

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
