import type { GraphSnapshot } from "../domain/schema"
import { renderMermaidFromSnapshot } from "./render-mermaid"

export const renderMarkdownFromSnapshot = (snapshot: GraphSnapshot): string =>
  ["## Graph", "", "```mermaid", renderMermaidFromSnapshot(snapshot), "```", ""].join("\n")
