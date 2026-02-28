import { Effect, FileSystem, Path } from "effect"
import { compareStrings } from "./helpers"

export type DiscoveredMarkdownFile = {
  readonly absolutePath: string
  readonly relativePath: string
}

const isMarkdownFile = (path: Path.Path, filePath: string) =>
  path.extname(filePath).toLowerCase() === ".md"

const normalizeAbsolutePath = (path: Path.Path, filePath: string) => path.normalize(filePath)

const isPathWithinRootDirectory = (
  path: Path.Path,
  rootDirectory: string,
  candidatePath: string,
) => {
  const relativePath = path.relative(rootDirectory, candidatePath)

  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
}

const normalizeRelativePath = (path: Path.Path, rootDirectory: string, filePath: string) =>
  path.normalize(path.relative(rootDirectory, filePath)).split(path.sep).join("/")

const collectMarkdownFiles = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  rootDirectory: string,
  directory: string,
  visitedDirectories: Set<string>,
  discoveredAbsolutePaths: Set<string>,
): Effect.Effect<Array<DiscoveredMarkdownFile>, unknown> =>
  Effect.gen(function* () {
    const resolvedDirectory = normalizeAbsolutePath(path, yield* fs.realPath(directory))
    if (
      !isPathWithinRootDirectory(path, rootDirectory, resolvedDirectory) ||
      visitedDirectories.has(resolvedDirectory)
    ) {
      return []
    }

    visitedDirectories.add(resolvedDirectory)

    const entries = yield* fs.readDirectory(resolvedDirectory)
    const sortedEntries = [...entries].sort(compareStrings)
    const discoveredFiles: Array<DiscoveredMarkdownFile> = []

    for (const entry of sortedEntries) {
      const absolutePath = path.join(resolvedDirectory, entry)
      const resolvedPath = normalizeAbsolutePath(path, yield* fs.realPath(absolutePath))
      if (!isPathWithinRootDirectory(path, rootDirectory, resolvedPath)) {
        continue
      }

      const stat = yield* fs.stat(absolutePath)

      if (stat.type === "Directory") {
        const nestedFiles = yield* collectMarkdownFiles(
          fs,
          path,
          rootDirectory,
          resolvedPath,
          visitedDirectories,
          discoveredAbsolutePaths,
        )
        discoveredFiles.push(...nestedFiles)
        continue
      }

      if (
        stat.type === "File" &&
        isMarkdownFile(path, resolvedPath) &&
        !discoveredAbsolutePaths.has(resolvedPath)
      ) {
        discoveredAbsolutePaths.add(resolvedPath)
        discoveredFiles.push({
          absolutePath: resolvedPath,
          relativePath: normalizeRelativePath(path, rootDirectory, resolvedPath),
        })
      }
    }

    return discoveredFiles
  })

export const discoverMarkdownFiles = (rootDirectory: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const resolvedRootDirectory = normalizeAbsolutePath(path, yield* fs.realPath(rootDirectory))
    const discoveredFiles = yield* collectMarkdownFiles(
      fs,
      path,
      resolvedRootDirectory,
      resolvedRootDirectory,
      new Set<string>(),
      new Set<string>(),
    )

    return [...discoveredFiles].sort((left, right) =>
      compareStrings(left.relativePath, right.relativePath),
    )
  })
