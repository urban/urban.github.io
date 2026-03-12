const VAULT_SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type VaultData = {
  readonly slug: string
  readonly permalink: string
  readonly title: string
  readonly description: string
  readonly created: Date
  readonly updated: Date
  readonly aliases: ReadonlyArray<string>
  readonly published: boolean
}

export const normalizeVaultSlug = (permalink: string): string | undefined => {
  const slug = permalink.replace(/^\/+|\/+$/g, "")
  if (slug.length === 0) {
    return undefined
  }

  return VAULT_SLUG_SEGMENT.test(slug) ? slug : undefined
}

export const toVaultRoutePath = (slug: string): string => `/vault/${slug}`

export const humanizeVaultSlug = (slug: string): string =>
  slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")

export const resolveVaultDescription = (
  explicitDescription: string | undefined,
  excerpt: string | undefined,
): string => explicitDescription ?? excerpt ?? ""
