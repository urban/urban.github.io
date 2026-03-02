import type { GraphSnapshot } from "@urban/build-graph/src/domain/schema"
import { renderMermaidFromSnapshot } from "./render-mermaid"

export const renderMarkdownFromSnapshot = (snapshot: GraphSnapshot): string =>
  ["## Graph", "", "```mermaid", renderMermaidFromSnapshot(snapshot), "```", ""].join("\n")
