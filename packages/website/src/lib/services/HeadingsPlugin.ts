import { Layer, ServiceMap } from "effect"
import type { Root } from "hast"
import { toString as hastToString } from "hast-util-to-string"
import { visit } from "unist-util-visit"

export class HeadingsPlugin extends ServiceMap.Service<
  HeadingsPlugin,
  () => (tree: Root) => void
>()("HeadingsPlugin") {
  static readonly layer = Layer.sync(HeadingsPlugin, () => {
    const program = () => (tree: Root) => {
      visit(tree, "element", (node) => {
        if (node.tagName === "h2" || node.tagName === "h3") {
          const id = hastToString(node).toLowerCase().replaceAll(" ", "-")
          node.properties = {
            ...node.properties,
            style: "position:relative",
            id,
          }
          node.children = [
            {
              type: "element",
              tagName: "a",
              properties: {
                href: `#${id}`,
                class: "anchor",
                ariaLabel: "Link to self",
              },
              children: [],
            },
            ...node.children,
          ]
        }
      })
    }

    return HeadingsPlugin.of(program)
  })
}
