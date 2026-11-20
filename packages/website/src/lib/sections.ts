export type SectionVisibility = {
  readonly now: boolean
  readonly garden: boolean
}

// Enable each section here when it is ready for production.
const productionSections: SectionVisibility = {
  now: false,
  garden: false,
}

export const getSectionVisibility = (development: boolean): SectionVisibility => ({
  now: development || productionSections.now,
  garden: development || productionSections.garden,
})

export const isContentAssetEnabled = (
  relativePath: string,
  sections: SectionVisibility,
): boolean => {
  const collection = relativePath.replaceAll("\\", "/").split("/")[0]
  if (collection === "now") return sections.now
  if (collection === "vault") return sections.garden
  return true
}
