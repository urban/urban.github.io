import type { ReactNode, AnchorHTMLAttributes } from "react"
import { clsx } from "../../lib/utils"

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode
  href: string
  variant?: "text" | "navigation" | "subtle"
  showExternalIcon?: boolean
}

const Link = ({
  children,
  href,
  variant = "text",
  showExternalIcon = false,
  className,
  ...rest
}: Props) => {
  const hrefKind =
    href.startsWith("http://") || href.startsWith("https://") ? "external" : "internal"
  return (
    <a
      href={href}
      target={hrefKind === "external" ? "_blank" : undefined}
      rel={hrefKind === "external" ? "noreferrer noopener" : undefined}
      className={clsx("site-link", className)}
      data-variant={variant}
      {...rest}
    >
      {children}
      {showExternalIcon && (
        <span className="site-link-icon" aria-hidden="true">
          ↗
        </span>
      )}
    </a>
  )
}

export { Link }
