const normalizePath = (value: string): string => {
  const pathname = value.split(/[?#]/u)[0] ?? "/"

  if (pathname === "/") {
    return pathname
  }

  const normalizedPath = pathname.replace(/\/+$/u, "")

  return normalizedPath === "" ? "/" : normalizedPath
}

const isLinkSelected = (pathname: string, href: string): boolean => {
  const currentPath = normalizePath(pathname)
  const targetPath = normalizePath(href)

  if (targetPath === "/") {
    return currentPath === targetPath
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

export { isLinkSelected }
