import { expect, test } from "bun:test"
import { renderMarkdownFromSnapshot } from "../src/core/render-markdown"
import type { GraphSnapshot } from "../src/domain/schema"

const emptySnapshot: GraphSnapshot = {
  nodes: [],
  edges: [],
  diagnostics: [],
}

test("renders the baseline graph markdown wrapper", () => {
  const markdown = renderMarkdownFromSnapshot(emptySnapshot)

  expect(markdown).toBe("## Graph\n\n```mermaid\ngraph LR\n```\n")
})
