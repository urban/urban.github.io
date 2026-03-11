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

export const basename = (normalizedPath: string): string => {
  const segments = normalizedPath.split("/")
  return segments[segments.length - 1] ?? ""
}

export const removeMarkdownExtension = (value: string): string =>
  value.toLowerCase().endsWith(".md") ? value.slice(0, -".md".length) : value

export const normalizeRoutePrefix = (value: string | undefined): string => {
  if (value === undefined) {
    return ""
  }

  const normalized = normalizePathLike(value)
  return normalized.length === 0 ? "" : `/${normalized}`
}

export const joinRoutePath = (prefix: string, slug: string): string =>
  prefix.length === 0 ? `/${slug}` : `${prefix}/${slug}`
