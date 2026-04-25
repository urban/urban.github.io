import { expect, test } from "bun:test"
import { isLinkSelected } from "./linkSelection"

test("selects the root link only on the root pathname", () => {
  expect(isLinkSelected("/", "/")).toBe(true)
  expect(isLinkSelected("/about", "/")).toBe(false)
})

test("selects a link when the pathname matches exactly", () => {
  expect(isLinkSelected("/garden", "/garden")).toBe(true)
})

test("selects a link when the pathname is nested beneath its route", () => {
  expect(isLinkSelected("/garden/ai-harness-learning", "/garden")).toBe(true)
})

test("does not select partial segment matches", () => {
  expect(isLinkSelected("/gardened", "/garden")).toBe(false)
})
