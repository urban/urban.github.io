import { Schema } from "effect"
import type { ParsedWikilink } from "./parse"
import { compareStrings, normalizePathLike } from "./helpers"
import type { ValidatedMarkdownFile } from "./validate"

const MARKDOWN_EXTENSION = ".md"

export type WikilinkResolverV1Index = {
  readonly byPath: ReadonlyMap<string, ReadonlyArray<ValidatedMarkdownFile>>
  readonly byFilename: ReadonlyMap<string, ReadonlyArray<ValidatedMarkdownFile>>
  readonly byAlias: ReadonlyMap<string, ReadonlyArray<ValidatedMarkdownFile>>
}

export type WikilinkResolutionV1 = {
  readonly strategy: "path" | "filename" | "alias" | "unresolved"
  readonly candidates: ReadonlyArray<ValidatedMarkdownFile>
}

const AmbiguousWikilinkResolutionDiagnosticSchema = Schema.Struct({
  sourceRelativePath: Schema.String,
  rawWikilink: Schema.String,
  target: Schema.String,
  strategy: Schema.Union([
    Schema.Literal("path"),
    Schema.Literal("filename"),
    Schema.Literal("alias"),
  ]),
  candidateRelativePaths: Schema.Array(Schema.String),
})

export type AmbiguousWikilinkResolutionDiagnostic = Schema.Schema.Type<
  typeof AmbiguousWikilinkResolutionDiagnosticSchema
>

export class BuildGraphAmbiguousWikilinkResolutionError extends Schema.TaggedErrorClass<BuildGraphAmbiguousWikilinkResolutionError>()(
  "BuildGraphAmbiguousWikilinkResolutionError",
  {
    message: Schema.String,
    diagnostics: Schema.Array(AmbiguousWikilinkResolutionDiagnosticSchema),
  },
) {}

export type ParsedWikilinkWithSource = ParsedWikilink & {
  readonly sourceRelativePath: string
}

export type WikilinkResolutionSummaryV1 = {
  readonly resolvedCount: number
  readonly ambiguousDiagnostics: ReadonlyArray<AmbiguousWikilinkResolutionDiagnostic>
}

const normalizeAlias = (value: string): string => value.trim().toLowerCase()

const normalizeAlias = (value: string): string => value.trim().toLowerCase()

const removeMarkdownExtension = (value: string) =>
  value.endsWith(MARKDOWN_EXTENSION) ? value.slice(0, -MARKDOWN_EXTENSION.length) : value

const basename = (normalizedPath: string) => {
  const segments = normalizedPath.split("/")
  return segments[segments.length - 1] ?? ""
}

const addCandidate = (
  index: Map<string, Array<ValidatedMarkdownFile>>,
  key: string,
  note: ValidatedMarkdownFile,
) => {
  const existing = index.get(key)
  if (existing === undefined) {
    index.set(key, [note])
    return
  }

  existing.push(note)
}

const sortCandidateMap = (
  index: Map<string, Array<ValidatedMarkdownFile>>,
): ReadonlyMap<string, ReadonlyArray<ValidatedMarkdownFile>> =>
  new Map(
    [...index.entries()].map(([key, candidates]) => [
      key,
      [...candidates].sort((left, right) => compareStrings(left.relativePath, right.relativePath)),
    ]),
  )

export const buildWikilinkResolverV1Index = (
  notes: ReadonlyArray<ValidatedMarkdownFile>,
): WikilinkResolverV1Index => {
  const sortedNotes = [...notes].sort((left, right) =>
    compareStrings(left.relativePath, right.relativePath),
  )
  const byPath = new Map<string, Array<ValidatedMarkdownFile>>()
  const byFilename = new Map<string, Array<ValidatedMarkdownFile>>()
  const byAlias = new Map<string, Array<ValidatedMarkdownFile>>()

  for (const note of sortedNotes) {
    const normalizedRelativePath = normalizePathLike(note.relativePath)
    if (normalizedRelativePath.length === 0) {
      continue
    }

    addCandidate(byPath, normalizedRelativePath, note)
    const relativePathWithoutExtension = removeMarkdownExtension(normalizedRelativePath)
    if (relativePathWithoutExtension !== normalizedRelativePath) {
      addCandidate(byPath, relativePathWithoutExtension, note)
    }

    const normalizedFilename = basename(normalizedRelativePath)
    if (normalizedFilename.length === 0) {
      continue
    }

    addCandidate(byFilename, normalizedFilename, note)
    const filenameWithoutExtension = removeMarkdownExtension(normalizedFilename)
    if (filenameWithoutExtension !== normalizedFilename) {
      addCandidate(byFilename, filenameWithoutExtension, note)
    }

    const normalizedAliases = new Set<string>()
    for (const alias of note.frontmatter.aliases) {
      const normalizedAlias = normalizeAlias(alias)
      if (normalizedAlias.length === 0 || normalizedAliases.has(normalizedAlias)) {
        continue
      }

      normalizedAliases.add(normalizedAlias)
      addCandidate(byAlias, normalizedAlias, note)
    }
  }

  return {
    byPath: sortCandidateMap(byPath),
    byFilename: sortCandidateMap(byFilename),
    byAlias: sortCandidateMap(byAlias),
  }
}

const noMatch: ReadonlyArray<ValidatedMarkdownFile> = []

export const resolveWikilinkTargetV1 = (
  index: WikilinkResolverV1Index,
  target: string,
): WikilinkResolutionV1 => {
  const normalizedTarget = normalizePathLike(target)
  if (normalizedTarget.length === 0) {
    return { strategy: "unresolved", candidates: noMatch }
  }

  const pathCandidates = index.byPath.get(normalizedTarget)
  if (pathCandidates !== undefined && pathCandidates.length > 0) {
    return {
      strategy: "path",
      candidates: pathCandidates,
    }
  }

  const normalizedFilename = basename(normalizedTarget)
  if (normalizedFilename.length === 0) {
    return { strategy: "unresolved", candidates: noMatch }
  }

  const filenameCandidates = index.byFilename.get(normalizedFilename)
  if (filenameCandidates !== undefined && filenameCandidates.length > 0) {
    return {
      strategy: "filename",
      candidates: filenameCandidates,
    }
  }

  const aliasCandidates = index.byAlias.get(normalizeAlias(target))
  if (aliasCandidates !== undefined && aliasCandidates.length > 0) {
    return {
      strategy: "alias",
      candidates: aliasCandidates,
    }
  }

  return { strategy: "unresolved", candidates: noMatch }
}

export const summarizeWikilinkResolutionsV1 = (
  index: WikilinkResolverV1Index,
  wikilinks: ReadonlyArray<ParsedWikilinkWithSource>,
): WikilinkResolutionSummaryV1 => {
  let resolvedCount = 0
  const ambiguousDiagnostics: Array<AmbiguousWikilinkResolutionDiagnostic> = []

  for (const wikilink of wikilinks) {
    const resolution = resolveWikilinkTargetV1(index, wikilink.target)

    if (resolution.candidates.length === 1) {
      resolvedCount += 1
    }

    if (resolution.strategy === "unresolved" || resolution.candidates.length <= 1) {
      continue
    }

    ambiguousDiagnostics.push({
      sourceRelativePath: wikilink.sourceRelativePath,
      rawWikilink: wikilink.raw,
      target: wikilink.target,
      strategy: resolution.strategy,
      candidateRelativePaths: resolution.candidates.map((candidate) => candidate.relativePath),
    })
  }

  return {
    resolvedCount,
    ambiguousDiagnostics,
  }
}

export const formatAmbiguousWikilinkResolutionDiagnostics = (
  diagnostics: ReadonlyArray<AmbiguousWikilinkResolutionDiagnostic>,
): string =>
  [
    `Ambiguous wikilink resolution failed for ${diagnostics.length} wikilink(s):`,
    ...diagnostics.map(
      ({ sourceRelativePath, rawWikilink, strategy, candidateRelativePaths }) =>
        `- ${sourceRelativePath}: ${rawWikilink} matched ${candidateRelativePaths.length} candidates via ${strategy}: ${candidateRelativePaths.map((relativePath) => `"${relativePath}"`).join(", ")}`,
    ),
  ].join("\n")
