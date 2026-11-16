"use client"

import { Container } from "./Container"
import { Link } from "./NavLink"

const Header = ({ siteName }: { siteName: string }) => {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <Container>
        <div className="flex flex-wrap gap-y-2 justify-between">
          <a href="/" target={"_self"}>
            <div className="font-semibold">{siteName}</div>
          </a>
          <nav
            aria-label="Primary"
            className="flex flex-wrap gap-x-2 gap-y-2 text-sm sm:gap-x-6 sm:text-base"
          >
            {/*<Link href="/essays">Essays</Link>*/}
            <Link href="/projects/">Projects</Link>
            <Link href="/work/">Work</Link>
            <Link href="/garden/">The Garden</Link>
            <Link href="/now/">Now</Link>
            <Link href="/about/">About</Link>
          </nav>
        </div>
      </Container>
    </header>
  )
}

export { Header }
