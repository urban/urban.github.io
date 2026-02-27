export type ParsedWikilink = {
  readonly raw: string
  readonly target: string
  readonly displayText: string | undefined
}

const WIKILINK_PATTERN = /\[\[([^[\]|]+)(?:\|([^[\]|]+))?\]\]/g

export const parseWikilinks = (markdownBody: string): Array<ParsedWikilink> => {
  const wikilinks: Array<ParsedWikilink> = []

  for (const match of markdownBody.matchAll(WIKILINK_PATTERN)) {
    const index = match.index ?? 0
    if (index > 0 && markdownBody[index - 1] === "!") {
      continue
    }

    const target = match[1]?.trim()
    if (target === undefined || target.length === 0) {
      continue
    }

    const displayText = match[2]?.trim()
    if (match[2] !== undefined && (displayText === undefined || displayText.length === 0)) {
      continue
    }

    wikilinks.push({
      raw: match[0],
      target,
      displayText,
    })
  }

  return wikilinks
}
