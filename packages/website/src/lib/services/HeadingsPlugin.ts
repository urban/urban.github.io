import { Effect } from "effect";
import type { Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import { visit } from "unist-util-visit";

export class HeadingsPlugin extends Effect.Service<HeadingsPlugin>()("HeadingsPlugin", {
  succeed: () => (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "h2" || node.tagName === "h3") {
        const id = hastToString(node).toLowerCase().replaceAll(" ", "-");
        node.properties = {
          ...node.properties,
          style: "position:relative",
          id,
        };
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
        ];
      }
    });
  },
}) {}
