import { Effect, FileSystem, Option, Result, Schema } from "effect"
import matter from "gray-matter"
import {
  NoteFrontmatterSchema,
  RawNoteFrontmatterSchema,
  normalizeRawNoteFrontmatter,
  type NoteFrontmatter,
} from "../domain/schema"
import type { DiscoveredMarkdownFile } from "./discover"

const FrontmatterValidationDiagnosticSchema = Schema.Struct({
  relativePath: Schema.String,
  message: Schema.String,
})

export type FrontmatterValidationDiagnostic = Schema.Schema.Type<
  typeof FrontmatterValidationDiagnosticSchema
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

const decodeRawFrontmatter = Schema.decodeUnknownSync(RawNoteFrontmatterSchema)
const decodeNoteFrontmatter = Schema.decodeUnknownSync(NoteFrontmatterSchema)

const normalizeDateValue = (value: unknown): unknown =>
  value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString().slice(0, 10) : value

const normalizeDateFields = (frontmatter: unknown): unknown => {
  if (frontmatter === null || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return frontmatter
  }

  const value = frontmatter as Record<string, unknown>
  return {
    ...value,
    created: normalizeDateValue(value.created),
    updated: normalizeDateValue(value.updated),
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

const validateFrontmatter = (frontmatter: unknown): NoteFrontmatter =>
  decodeNoteFrontmatter(
    normalizeRawNoteFrontmatter(decodeRawFrontmatter(normalizeDateFields(frontmatter))),
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
      try: () => validateFrontmatter(parsedFile.data),
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

  return validatedFiles
})
