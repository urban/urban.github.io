import type { ReactNode, AnchorHTMLAttributes } from "react"
import { clsx } from "@/lib/utils"
import { isLinkSelected } from "./linkSelection"

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }

const Link = ({ children, href, ...rest }: Props) => {
  const hrefKind =
    href.startsWith("http://") || href.startsWith("https://") ? "external" : "internal"
  const selected =
    hrefKind === "internal" &&
    typeof window !== "undefined" &&
    isLinkSelected(window.location.pathname, href)
  return (
    <a
      href={href}
      target={hrefKind === "external" ? "_blank" : undefined}
      rel={hrefKind === "external" ? "noreferrer noopener" : undefined}
      aria-current={selected ? "page" : undefined}
      className={clsx("nav-link", selected && "selected")}
      {...rest}
    >
      <span>{children}</span>
    </a>
  )
}

export { Link }
