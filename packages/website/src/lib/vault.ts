import { DateTime } from "effect"

const VAULT_SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const VAULT_WIKI_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g
export const UNRESOLVED_VAULT_WIKI_LINK_CLASS = "text-sm opacity-75"

export type VaultData = {
  readonly slug: string
  readonly permalink: string
  readonly title: string
  readonly description: string
  readonly createdAt: DateTime.Utc
  readonly updatedAt: DateTime.Utc
  readonly aliases: ReadonlyArray<string>
  readonly published: boolean
}

export type VaultMetadataSeed = {
  readonly slug: string
  readonly permalink: string
  readonly title: string
  readonly explicitDescription: string | undefined
  readonly createdAt: DateTime.Utc
  readonly updatedAt: DateTime.Utc
  readonly aliases: ReadonlyArray<string>
  readonly published: boolean
}

export type PublishedVaultWikiLinkEntry = {
  readonly slug: string
  readonly title: string
  readonly aliases: ReadonlyArray<string>
}

type VaultWikiLinkLabel =
  | {
      readonly _tag: "ImplicitVaultWikiLinkLabel"
      readonly text: string
    }
  | {
      readonly _tag: "ExplicitVaultWikiLinkLabel"
      readonly text: string
    }

type ParsedVaultWikiLink = {
  readonly _tag: "ParsedVaultWikiLink"
  readonly raw: string
  readonly target: string
  readonly label: VaultWikiLinkLabel
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

type VaultWikiLinkLookupSource =
  | {
      readonly _tag: "CanonicalVaultWikiLinkLookupSource"
      readonly entry: PublishedVaultWikiLinkEntry
    }
  | {
      readonly _tag: "AliasVaultWikiLinkLookupSource"
      readonly entry: PublishedVaultWikiLinkEntry
    }

export class VaultWikiLinkAliasCollisionError extends Error {
  readonly alias: string
  readonly first: PublishedVaultWikiLinkEntry
  readonly second: PublishedVaultWikiLinkEntry

  constructor({
    alias,
    first,
    second,
  }: {
    readonly alias: string
    readonly first: PublishedVaultWikiLinkEntry
    readonly second: PublishedVaultWikiLinkEntry
  }) {
    super(
      `Duplicate vault alias "${alias}" for "${first.slug}" (${first.title}) and "${second.slug}" (${second.title})`,
    )
    this.name = "VaultWikiLinkAliasCollisionError"
    this.alias = alias
    this.first = first
    this.second = second
  }
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

const escapeMarkdownLinkLabel = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]")

const normalizeVaultWikiLookupToken = (value: string): string | undefined => {
  const token = value.trim().replace(/\s+/g, " ").toLowerCase()
  return token.length === 0 ? undefined : token
}

const parseVaultWikiLink = (raw: string, rawReference: string): ParsedVaultWikiLink => {
  const labelSeparatorIndex = rawReference.indexOf("|")

  if (labelSeparatorIndex === -1) {
    const target = rawReference.trim()
    return {
      _tag: "ParsedVaultWikiLink",
      raw,
      target,
      label: {
        _tag: "ImplicitVaultWikiLinkLabel",
        text: target,
      },
    }
  }

  const target = rawReference.slice(0, labelSeparatorIndex).trim()
  const label = rawReference.slice(labelSeparatorIndex + 1).trim()

  return {
    _tag: "ParsedVaultWikiLink",
    raw,
    target,
    label: {
      _tag: "ExplicitVaultWikiLinkLabel",
      text: label,
    },
  }
}

const getVaultWikiLinkVisibleText = (link: ParsedVaultWikiLink): string => link.label.text

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
      link: parseVaultWikiLink(rawMatch, rawTarget),
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
): ReadonlyMap<string, PublishedVaultWikiLinkEntry> => {
  const lookup = new Map<string, VaultWikiLinkLookupSource>()

  for (const entry of entries) {
    const canonicalToken = normalizeVaultWikiLookupToken(entry.slug)

    if (canonicalToken !== undefined) {
      lookup.set(canonicalToken, {
        _tag: "CanonicalVaultWikiLinkLookupSource",
        entry,
      })
    }
  }

  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const aliasToken = normalizeVaultWikiLookupToken(alias)

      if (aliasToken === undefined) {
        continue
      }

      const existing = lookup.get(aliasToken)

      if (existing === undefined) {
        lookup.set(aliasToken, {
          _tag: "AliasVaultWikiLinkLookupSource",
          entry,
        })
        continue
      }

      if (existing.entry.slug === entry.slug) {
        continue
      }

      if (existing._tag === "CanonicalVaultWikiLinkLookupSource") {
        continue
      }

      throw new VaultWikiLinkAliasCollisionError({
        alias,
        first: existing.entry,
        second: entry,
      })
    }
  }

  const resolvedLookup = new Map<string, PublishedVaultWikiLinkEntry>()

  for (const [token, source] of lookup) {
    resolvedLookup.set(token, source.entry)
  }

  return resolvedLookup
}

const resolveVaultWikiLink = (
  link: ParsedVaultWikiLink,
  lookup: ReadonlyMap<string, PublishedVaultWikiLinkEntry>,
): VaultWikiLinkResolution => {
  const targetSlug = normalizeVaultWikiLookupToken(link.target)

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
        return `<span class="${escapeHtml(UNRESOLVED_VAULT_WIKI_LINK_CLASS)}">${escapeHtml(getVaultWikiLinkVisibleText(resolution.link))}</span>`
      }

      const visibleText =
        resolution.link.label._tag === "ExplicitVaultWikiLinkLabel"
          ? resolution.link.label.text
          : resolution.entry.title

      return `<a href="${escapeHtml(toVaultRoutePath(resolution.entry.slug))}">${escapeHtml(visibleText)}</a>`
    })
    .join("")

export const preprocessVaultMarkdownSource = (
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
        return `<span className="${escapeHtml(UNRESOLVED_VAULT_WIKI_LINK_CLASS)}">${escapeHtml(getVaultWikiLinkVisibleText(resolution.link))}</span>`
      }

      const visibleText =
        resolution.link.label._tag === "ExplicitVaultWikiLinkLabel"
          ? resolution.link.label.text
          : resolution.entry.title

      return `[${escapeMarkdownLinkLabel(visibleText)}](${toVaultRoutePath(resolution.entry.slug)})`
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

export const finalizeVaultData = (
  metadata: VaultMetadataSeed,
  excerpt: string | undefined,
): VaultData => ({
  slug: metadata.slug,
  permalink: metadata.permalink,
  title: metadata.title,
  description: resolveVaultDescription(metadata.explicitDescription, excerpt),
  createdAt: metadata.createdAt,
  updatedAt: metadata.updatedAt,
  aliases: metadata.aliases,
  published: metadata.published,
})
