import type { JSX as ReactJSX } from "react"
import type { MDXComponents } from "mdx/types"
import NextLink from "next/link"
import type { ComponentProps } from "react"
import { clsx, cn } from "../lib/utils"

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

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: string
}

const MdxLink = ({ href, children, className, ...rest }: Props) => {
  const hrefKind = getHrefKind(href)

  return (
    <NextLink className={clsx("styled-link", className)} href={href} {...rest}>
      <span>
        {children}
        {hrefKind === "external-web" && <span className="external-link" />}
      </span>
    </NextLink>
  )
}

const MdxPre = ({ className, children, style, ...rest }: ReactJSX.IntrinsicElements["pre"]) => {
  return (
    <div className="my-6">
      <div
        className="rounded-lg overflow-hidden border border-black/10 dark:border-white/25 bg-white dark:!bg-(--shiki-dark-bg)"
        style={style}
      >
        <div className="text-sm leading-relaxed w-full max-h-96 overflow-y-auto m-0 overflow-x-auto">
          <pre className={cn(className, "!my-0")} style={style} {...rest}>
            {children}
          </pre>
        </div>
      </div>
    </div>
  )
}

const MdxComponents = {
  a: MdxLink,
  pre: MdxPre,
} satisfies MDXComponents

export { MdxComponents }
