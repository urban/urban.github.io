import { Effect, FileSystem, Option, Result, Schema } from "effect"
import matter from "gray-matter"
import {
  NoteFrontmatterSchema,
  RawNoteFrontmatterSchema,
  normalizeRawNoteFrontmatter,
  type NoteFrontmatter,
} from "../domain/schema"
import type { DiscoveredMarkdownFile } from "./discover"
import { compareStrings } from "./helpers"

const FrontmatterValidationDiagnosticSchema = Schema.Struct({
  relativePath: Schema.String,
  message: Schema.String,
})

export type FrontmatterValidationDiagnostic = Schema.Schema.Type<
  typeof FrontmatterValidationDiagnosticSchema
>

const DuplicatePermalinkDiagnosticSchema = Schema.Struct({
  permalink: Schema.String,
  relativePaths: Schema.Array(Schema.String),
})

export type DuplicatePermalinkDiagnostic = Schema.Schema.Type<
  typeof DuplicatePermalinkDiagnosticSchema
>

export type ValidatedMarkdownFile = DiscoveredMarkdownFile & {
  readonly body: string
  readonly frontmatter: NoteFrontmatter
}

export class BuildGraphFrontmatterValidationError extends Schema.TaggedErrorClass<BuildGraphFrontmatterValidationError>()(
  "BuildGraphFrontmatterValidationError",
  {
    message: Schema.String,
    diagnostics: Schema.Array(FrontmatterValidationDiagnosticSchema),
  },
) {}

export class BuildGraphDuplicatePermalinkError extends Schema.TaggedErrorClass<BuildGraphDuplicatePermalinkError>()(
  "BuildGraphDuplicatePermalinkError",
  {
    message: Schema.String,
    diagnostics: Schema.Array(DuplicatePermalinkDiagnosticSchema),
  },
) {}

const decodeRawFrontmatter = Schema.decodeUnknownSync(RawNoteFrontmatterSchema)
const decodeNoteFrontmatter = Schema.decodeUnknownSync(NoteFrontmatterSchema)

const stripInlineComment = (value: string): string => value.replace(/\s+#.*$/, "").trim()

const stripOuterQuotes = (value: string): string => {
  if (value.length < 2) {
    return value
  }

  const first = value[0]
  const last = value[value.length - 1]
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }

  return value
}

const extractFrontmatterDateLiteral = (
  rawFrontmatter: string | undefined,
  key: "created" | "updated",
): string | undefined => {
  if (rawFrontmatter === undefined) {
    return undefined
  }

  const pattern = new RegExp(`^\\s*${key}\\s*:\\s*(.+?)\\s*$`, "m")
  const match = pattern.exec(rawFrontmatter)
  if (match === null) {
    return undefined
  }

  return stripOuterQuotes(stripInlineComment(match[1].trim()))
}

const normalizeDateValue = (value: unknown, literal: string | undefined): unknown => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return value
  }

  return literal ?? value.toISOString().slice(0, 10)
}

const normalizeDateFields = (frontmatter: unknown, rawFrontmatter?: string): unknown => {
  if (frontmatter === null || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return frontmatter
  }

  const createdLiteral = extractFrontmatterDateLiteral(rawFrontmatter, "created")
  const updatedLiteral = extractFrontmatterDateLiteral(rawFrontmatter, "updated")
  const value = frontmatter as Record<string, unknown>
  return {
    ...value,
    created: normalizeDateValue(value.created, createdLiteral),
    updated: normalizeDateValue(value.updated, updatedLiteral),
  }
}

const toErrorMessage = (error: unknown) =>
  (error instanceof Error ? error.message : String(error))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")

const formatFrontmatterDiagnostics = (
  diagnostics: ReadonlyArray<FrontmatterValidationDiagnostic>,
): string =>
  [
    `Frontmatter validation failed for ${diagnostics.length} file(s):`,
    ...diagnostics.map(({ relativePath, message }) => `- ${relativePath}: ${message}`),
  ].join("\n")

const collectDuplicatePermalinkDiagnostics = (
  validatedFiles: ReadonlyArray<ValidatedMarkdownFile>,
): Array<DuplicatePermalinkDiagnostic> => {
  const relativePathsByPermalink = new Map<string, Array<string>>()

  for (const file of validatedFiles) {
    const existing = relativePathsByPermalink.get(file.frontmatter.permalink)
    if (existing === undefined) {
      relativePathsByPermalink.set(file.frontmatter.permalink, [file.relativePath])
      continue
    }

    existing.push(file.relativePath)
  }

  return [...relativePathsByPermalink.entries()]
    .filter(([, relativePaths]) => relativePaths.length > 1)
    .map(([permalink, relativePaths]) => ({
      permalink,
      relativePaths: [...relativePaths].sort(compareStrings),
    }))
    .sort((left, right) => compareStrings(left.permalink, right.permalink))
}

const formatDuplicatePermalinkDiagnostics = (
  diagnostics: ReadonlyArray<DuplicatePermalinkDiagnostic>,
): string =>
  [
    `Duplicate permalink validation failed for ${diagnostics.length} permalink group(s):`,
    ...diagnostics.map(
      ({ permalink, relativePaths }) =>
        `- ${permalink}: ${relativePaths.map((relativePath) => `"${relativePath}"`).join(", ")}`,
    ),
  ].join("\n")

const validateFrontmatter = (frontmatter: unknown, rawFrontmatter?: string): NoteFrontmatter =>
  decodeNoteFrontmatter(
    normalizeRawNoteFrontmatter(
      decodeRawFrontmatter(normalizeDateFields(frontmatter, rawFrontmatter)),
    ),
  )

export const validateDiscoveredMarkdownFiles = Effect.fn(
  "buildGraph.validateDiscoveredMarkdownFiles",
)(function* (markdownFiles: ReadonlyArray<DiscoveredMarkdownFile>) {
  const fs = yield* FileSystem.FileSystem
  const diagnostics: Array<FrontmatterValidationDiagnostic> = []
  const validatedFiles: Array<ValidatedMarkdownFile> = []

  for (const file of markdownFiles) {
    const source = yield* fs.readFileString(file.absolutePath)
    const parsedResult = yield* Effect.try({
      try: () => matter(source),
      catch: toErrorMessage,
    }).pipe(Effect.result)

    if (Result.isFailure(parsedResult)) {
      diagnostics.push({
        relativePath: file.relativePath,
        message: Option.getOrThrow(Result.getFailure(parsedResult)),
      })
      continue
    }

    const parsedFile = Option.getOrThrow(Result.getSuccess(parsedResult))
    const frontmatterResult = yield* Effect.try({
      try: () => validateFrontmatter(parsedFile.data, parsedFile.matter),
      catch: toErrorMessage,
    }).pipe(Effect.result)

    if (Result.isFailure(frontmatterResult)) {
      diagnostics.push({
        relativePath: file.relativePath,
        message: Option.getOrThrow(Result.getFailure(frontmatterResult)),
      })
      continue
    }

    const frontmatter = Option.getOrThrow(Result.getSuccess(frontmatterResult))
    validatedFiles.push({
      ...file,
      body: parsedFile.content,
      frontmatter,
    })
  }

  if (diagnostics.length > 0) {
    return yield* new BuildGraphFrontmatterValidationError({
      message: formatFrontmatterDiagnostics(diagnostics),
      diagnostics,
    })
  }

  const duplicatePermalinkDiagnostics = collectDuplicatePermalinkDiagnostics(validatedFiles)
  if (duplicatePermalinkDiagnostics.length > 0) {
    return yield* new BuildGraphDuplicatePermalinkError({
      message: formatDuplicatePermalinkDiagnostics(duplicatePermalinkDiagnostics),
      diagnostics: duplicatePermalinkDiagnostics,
    })
  }

  return validatedFiles
})
