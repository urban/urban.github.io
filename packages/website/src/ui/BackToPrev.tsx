import type { ReactNode } from "react"
import { Link } from "./NavLink"

type Props = { children: ReactNode; href: string }

const BackToPrev = ({ children, href }: Props) => (
  <Link href={href} variant="subtle">
    {children}
  </Link>
)

export { BackToPrev }
