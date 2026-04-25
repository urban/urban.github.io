"use client"

import NextLink from "next/link"
import { usePathname } from "next/navigation"
import { Container } from "./Container"
import { Link } from "./NavLink"

const Header = ({ siteName }: { siteName: string }) => {
  const pathname = usePathname()
  const homeSelected = pathname !== "/"
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <Container>
        <div className="flex flex-wrap gap-y-2 justify-between">
          <NextLink href="/" target={"_self"} aria-current={homeSelected ? "page" : undefined}>
            <div className="font-semibold">{siteName}</div>
          </NextLink>
          <nav className="flex gap-6">
            {/*<Link href="/essays">Essays</Link>*/}
            <Link href="/projects">Projects</Link>
            <Link href="/garden">The Garden</Link>
            {/*<Link href="/about">About</Link>*/}
          </nav>
        </div>
      </Container>
    </header>
  )
}

export { Header }
