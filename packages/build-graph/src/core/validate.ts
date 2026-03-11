import { Effect, Option, Result, Schema } from "effect"
import matter from "gray-matter"
import {
  type BuildGraphOptions,
  NoteFrontmatterSchema,
  RawNoteFrontmatterSchema,
  normalizeRawNoteFrontmatter,
  type NoteFrontmatter,
} from "../domain/schema"
import { compareStrings, joinRoutePath, normalizeRoutePrefix } from "./helpers"

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

export type MarkdownSourceFile = {
  readonly relativePath: string
  readonly source: string
  readonly absolutePath?: string
}

export type ValidatedMarkdownFile = {
  readonly relativePath: string
  readonly sourceRelativePath: string
  readonly absolutePath?: string
  readonly body: string
  readonly frontmatter: NoteFrontmatter
  readonly slug: string
  readonly routePath: string
  readonly nodeId: string
  readonly label: string
}

type FrontmatterParseOutcome =
  | {
      readonly _tag: "diagnostic"
      readonly diagnostic: FrontmatterValidationDiagnostic
    }
  | {
      readonly _tag: "validated"
      readonly validatedFile: ValidatedMarkdownFile
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

export class BuildGraphInvalidCanonicalPermalinkError extends Schema.TaggedErrorClass<BuildGraphInvalidCanonicalPermalinkError>()(
  "BuildGraphInvalidCanonicalPermalinkError",
  {
    message: Schema.String,
    diagnostics: Schema.Array(FrontmatterValidationDiagnosticSchema),
  },
) {}

const decodeRawFrontmatter = Schema.decodeUnknownSync(RawNoteFrontmatterSchema)
const decodeNoteFrontmatter = Schema.decodeUnknownSync(NoteFrontmatterSchema)
const CANONICAL_PERMALINK_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const defaultBuildGraphOptions: Required<BuildGraphOptions> = {
  identityStrategy: "source-path",
  routePrefix: "",
}

const normalizeBuildGraphOptions = (
  options: BuildGraphOptions | undefined,
): Required<BuildGraphOptions> => ({
  identityStrategy: options?.identityStrategy ?? defaultBuildGraphOptions.identityStrategy,
  routePrefix: normalizeRoutePrefix(options?.routePrefix),
})

const stripInlineComment = (value: string): string => value.replace(/\s+#.*$/, "").trim()

const capitalizeWord = (value: string): string => {
  const first = value[0]
  if (first === undefined) {
    return value
  }

  return `${first.toUpperCase()}${value.slice(1)}`
}

const humanizeLabel = (value: string): string => {
  const normalized = value
    .trim()
    .split(/[-_\s]+/)
    .filter((segment) => segment.length > 0)
    .map(capitalizeWord)
    .join(" ")

  return normalized.length > 0 ? normalized : value
}

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

const validateCanonicalPermalinkSegment = (
  relativePath: string,
  frontmatter: NoteFrontmatter,
): FrontmatterValidationDiagnostic | undefined => {
  if (CANONICAL_PERMALINK_SEGMENT.test(frontmatter.permalink)) {
    return undefined
  }

  return {
    relativePath,
    message:
      `Invalid canonical permalink slug "${frontmatter.permalink}". ` +
      'Expected kebab-case slug segment like "harness-loop" with no slash separators.',
  }
}

const labelFromValidatedNote = (
  relativePath: string,
  frontmatter: NoteFrontmatter,
  slug: string,
): string => {
  if (frontmatter.title !== undefined) {
    return frontmatter.title
  }

  if (slug.length > 0) {
    return humanizeLabel(slug)
  }

  const normalizedRelativePath = relativePath.replaceAll("\\", "/")
  const segments = normalizedRelativePath.split("/")
  const lastSegment = segments[segments.length - 1] ?? normalizedRelativePath
  const basename = lastSegment.toLowerCase().endsWith(".md")
    ? lastSegment.slice(0, -3)
    : lastSegment
  return humanizeLabel(basename)
}

const validateMarkdownSource = Effect.fn("buildGraph.validateMarkdownSource")(function* (
  file: MarkdownSourceFile,
  options: Required<BuildGraphOptions>,
): Effect.fn.Return<FrontmatterParseOutcome> {
  const parsedResult = yield* Effect.try({
    try: () => matter(file.source),
    catch: toErrorMessage,
  }).pipe(Effect.result)

  if (Result.isFailure(parsedResult)) {
    return {
      _tag: "diagnostic",
      diagnostic: {
        relativePath: file.relativePath,
        message: Option.getOrThrow(Result.getFailure(parsedResult)),
      },
    }
  }

  const parsedFile = Option.getOrThrow(Result.getSuccess(parsedResult))
  const frontmatterResult = yield* Effect.try({
    try: () => validateFrontmatter(parsedFile.data, parsedFile.matter),
    catch: toErrorMessage,
  }).pipe(Effect.result)

  if (Result.isFailure(frontmatterResult)) {
    return {
      _tag: "diagnostic",
      diagnostic: {
        relativePath: file.relativePath,
        message: Option.getOrThrow(Result.getFailure(frontmatterResult)),
      },
    }
  }

  const frontmatter = Option.getOrThrow(Result.getSuccess(frontmatterResult))
  if (options.identityStrategy === "canonical-route") {
    const canonicalPermalinkDiagnostic = validateCanonicalPermalinkSegment(
      file.relativePath,
      frontmatter,
    )
    if (canonicalPermalinkDiagnostic !== undefined) {
      return {
        _tag: "diagnostic",
        diagnostic: canonicalPermalinkDiagnostic,
      }
    }
  }

  const slug =
    options.identityStrategy === "canonical-route"
      ? frontmatter.permalink
      : (frontmatter.permalink
          .replace(/^\/+|\/+$/g, "")
          .split("/")
          .filter(Boolean)
          .pop() ?? frontmatter.permalink)
  const routePath =
    options.identityStrategy === "canonical-route"
      ? joinRoutePath(options.routePrefix, slug)
      : frontmatter.permalink
  return {
    _tag: "validated",
    validatedFile: {
      ...(file.absolutePath === undefined ? {} : { absolutePath: file.absolutePath }),
      relativePath: file.relativePath,
      sourceRelativePath: file.relativePath,
      body: parsedFile.content,
      frontmatter,
      slug,
      routePath,
      nodeId: options.identityStrategy === "canonical-route" ? routePath : file.relativePath,
      label: labelFromValidatedNote(file.relativePath, frontmatter, slug),
    },
  }
})

export const validateMarkdownSources = Effect.fn("buildGraph.validateMarkdownSources")(function* (
  markdownFiles: ReadonlyArray<MarkdownSourceFile>,
  options?: BuildGraphOptions,
) {
  const normalizedOptions = normalizeBuildGraphOptions(options)
  const diagnostics: Array<FrontmatterValidationDiagnostic> = []
  const validatedFiles: Array<ValidatedMarkdownFile> = []

  const outcomes = yield* Effect.forEach(markdownFiles, (file) =>
    validateMarkdownSource(file, normalizedOptions),
  )
  for (const outcome of outcomes) {
    if (outcome._tag === "diagnostic") {
      diagnostics.push(outcome.diagnostic)
      continue
    }
    validatedFiles.push(outcome.validatedFile)
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
