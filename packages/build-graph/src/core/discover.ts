import { Effect, FileSystem, Path } from "effect"

export type DiscoveredMarkdownFile = {
  readonly absolutePath: string
  readonly relativePath: string
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

const isMarkdownFile = (path: Path.Path, filePath: string) =>
  path.extname(filePath).toLowerCase() === ".md"

const normalizeRelativePath = (path: Path.Path, rootDirectory: string, filePath: string) =>
  path.normalize(path.relative(rootDirectory, filePath)).split(path.sep).join("/")

const collectMarkdownFiles = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  rootDirectory: string,
  directory: string,
): Effect.Effect<Array<DiscoveredMarkdownFile>, unknown> =>
  Effect.gen(function* () {
    const entries = yield* fs.readDirectory(directory)
    const sortedEntries = [...entries].sort(compareStrings)
    const discoveredFiles: Array<DiscoveredMarkdownFile> = []

    for (const entry of sortedEntries) {
      const absolutePath = path.join(directory, entry)
      const stat = yield* fs.stat(absolutePath)

      if (stat.type === "Directory") {
        const nestedFiles = yield* collectMarkdownFiles(fs, path, rootDirectory, absolutePath)
        discoveredFiles.push(...nestedFiles)
        continue
      }

      if (stat.type === "File" && isMarkdownFile(path, absolutePath)) {
        discoveredFiles.push({
          absolutePath,
          relativePath: normalizeRelativePath(path, rootDirectory, absolutePath),
        })
      }
    }

    return discoveredFiles
  })

export const discoverMarkdownFiles = (rootDirectory: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const discoveredFiles = yield* collectMarkdownFiles(fs, path, rootDirectory, rootDirectory)

    return [...discoveredFiles].sort((left, right) =>
      compareStrings(left.relativePath, right.relativePath),
    )
  })
