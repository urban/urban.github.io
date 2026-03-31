"use client"

import NextLink from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { clsx } from "@/lib/utils"
import { isLinkSelected } from "./linkSelection"

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

type Props = {
  children: ReactNode
  href: string
}

const Link = ({ children, href, ...rest }: Props) => {
  const pathname = usePathname()
  const hrefKind = getHrefKind(href)
  const selected = hrefKind === "internal" && isLinkSelected(pathname, href)

  return (
    <NextLink
      href={href}
      target={hrefKind === "external-web" ? "_blank" : undefined}
      rel={hrefKind === "external-web" ? "noreferrer noopener" : undefined}
      aria-current={selected ? "page" : undefined}
      className={clsx("nav-link", selected && "selected")}
      {...rest}
    >
      <span>{children}</span>
    </NextLink>
  )
}

export { Link }
