import { expect, test } from "bun:test"
import { getSectionVisibility, isContentAssetEnabled } from "./sections"

test("development enables both unfinished sections while production omits both", () => {
  expect(getSectionVisibility(true)).toEqual({ now: true, garden: true })
  expect(getSectionVisibility(false)).toEqual({ now: false, garden: false })
})

test("section assets follow the same independent visibility as their routes", () => {
  for (const sections of [
    { now: true, garden: true },
    { now: true, garden: false },
    { now: false, garden: true },
    { now: false, garden: false },
  ]) {
    expect(isContentAssetEnabled("now/2026-11/reader.png", sections)).toBe(sections.now)
    expect(isContentAssetEnabled("vault/diagram.png", sections)).toBe(sections.garden)
    expect(isContentAssetEnabled("now\\2026-11\\reader.png", sections)).toBe(sections.now)
    expect(isContentAssetEnabled("projects/reader/cover.png", sections)).toBe(true)
    expect(isContentAssetEnabled("essays/an-essay/cover.png", sections)).toBe(true)
  }
})
