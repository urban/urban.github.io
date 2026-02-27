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

const compareStrings = (left: string, right: string) => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

const normalizePathLike = (value: string): string =>
  value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/")
    .toLowerCase()

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
