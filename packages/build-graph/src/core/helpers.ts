export const compareStrings = (left: string, right: string) => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

export const normalizeCaseFolded = (value: string): string => value.trim().toLowerCase()

export const compareByRelativePath = <T extends { readonly relativePath: string }>(
  left: T,
  right: T,
): number => compareStrings(left.relativePath, right.relativePath)

export const normalizePathLike = (value: string): string =>
  // Keep lightweight manual normalization to preserve current matching semantics exactly.
  value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/")
    .toLowerCase()
