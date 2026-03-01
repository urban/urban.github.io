export const compareStrings = (left: string, right: string) => {
  if (left < right) {
    return -1
  }

  if (left > right) {
    return 1
  }

  return 0
}

export const normalizePathLike = (value: string): string =>
  // Keep lightweight manual normalization to preserve current v1/v2 matching semantics exactly.
  value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/")
    .toLowerCase()
