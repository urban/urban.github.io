import { expect, test } from "bun:test"
import { parseWikilinks } from "../src/core/parse"

test("parses supported wikilink forms", () => {
  const links = parseWikilinks("Use [[target]] and [[folder/note|Display Text]] in content.")

  expect(links).toEqual([
    {
      raw: "[[target]]",
      target: "target",
      displayText: undefined,
    },
    {
      raw: "[[folder/note|Display Text]]",
      target: "folder/note",
      displayText: "Display Text",
    },
  ])
})

test("parses links in source order and trims target and display text", () => {
  const links = parseWikilinks("[[  first/path  |  First Label  ]][[second]]")

  expect(links).toEqual([
    {
      raw: "[[  first/path  |  First Label  ]]",
      target: "first/path",
      displayText: "First Label",
    },
    {
      raw: "[[second]]",
      target: "second",
      displayText: undefined,
    },
  ])
})

test("ignores unsupported or malformed link-like sequences", () => {
  const links = parseWikilinks(
    "ignore ![[embedded]] [[|missing-target]] [[missing-display|]] [[too|many|pipes]] [[valid]]",
  )

  expect(links).toEqual([
    {
      raw: "[[valid]]",
      target: "valid",
      displayText: undefined,
    },
  ])
})
