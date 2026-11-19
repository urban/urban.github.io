import type { JSX as ReactJSX } from "react"
import type { MDXComponents } from "mdx/types"
import { clsx } from "../lib/utils"

type HrefKind = "internal" | "external-web" | "other"

const getHrefKind = (href: string): HrefKind => {
  if (href.startsWith("/") || href.startsWith("#") || href.startsWith("?")) {
    return "internal"
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return "external-web"
  }

  return "other"
}

type Props = Omit<ReactJSX.IntrinsicElements["a"], "href"> & {
  href: string
}

const MdxLink = ({ href, children, className, ...rest }: Props) => {
  const hrefKind = getHrefKind(href)

  return (
    <a className={clsx("styled-link", className)} href={href} {...rest}>
      <span>
        {children}
        {hrefKind === "external-web" && <span className="external-link" aria-hidden="true" />}
      </span>
    </a>
  )
}

const MdxPre = ({ className, children, style, ...rest }: ReactJSX.IntrinsicElements["pre"]) => {
  return (
    <div className="mdx-code-block">
      <pre className={className} style={style} {...rest}>
        {children}
      </pre>
    </div>
  )
}

const MdxComponents = {
  a: MdxLink,
  pre: MdxPre,
} satisfies MDXComponents

export { MdxComponents }
