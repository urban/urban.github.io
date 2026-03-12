import { Layer, ServiceMap } from "effect"
import { visit } from "unist-util-visit"
import type { VFile } from "vfile"

type MarkdownNode = {
  readonly type: string
  readonly value?: string
  readonly alt?: string
  readonly children?: ReadonlyArray<MarkdownNode>
}

type MarkdownRoot = {
  readonly type: string
  readonly children?: ReadonlyArray<MarkdownNode>
}

const paragraphTextFromNode = (node: MarkdownNode): string => {
  switch (node.type) {
    case "text":
    case "inlineCode":
      return node.value?.trim() ?? ""
    case "image":
      return node.alt?.trim() ?? ""
    default:
      return (node.children ?? [])
        .map(paragraphTextFromNode)
        .filter((segment) => segment.length > 0)
        .join(" ")
        .trim()
  }
}

export class DescriptionExcerptPlugin extends ServiceMap.Service<
  DescriptionExcerptPlugin,
  () => (tree: MarkdownRoot, file: VFile) => void
>()("DescriptionExcerptPlugin") {
  static readonly layer = Layer.sync(DescriptionExcerptPlugin, () => {
    const program = () => (tree: MarkdownRoot, file: VFile) => {
      let excerpt: string | undefined

      visit(tree, "paragraph", (node: MarkdownNode) => {
        if (excerpt !== undefined) {
          return
        }

        const text = paragraphTextFromNode(node).replace(/\s+/g, " ").trim()
        if (text.length > 0) {
          excerpt = text
          file.data.descriptionExcerpt = excerpt
        }
      })
    }

    return DescriptionExcerptPlugin.of(program)
  })
}
