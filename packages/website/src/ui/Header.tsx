import type { SectionVisibility } from "../lib/sections"
import { Container } from "./Container"
import { Link } from "./NavLink"
import { isLinkSelected } from "./NavLink/linkSelection"

const Header = ({
  siteName,
  pathname,
  sections,
}: {
  siteName: string
  pathname: string
  sections: SectionVisibility
}) => {
  return (
    <header className="site-header">
      <Container>
        <div className="site-header-content">
          <a className="site-wordmark" href="/">
            <img src="/uf-logo.svg" alt="" aria-hidden="true" />
            <span>{siteName}</span>
          </a>
          {(sections.now || sections.garden) && (
            <nav aria-label="Primary" className="site-navigation">
              {sections.now && (
                <Link
                  href="/now/"
                  variant="navigation"
                  aria-current={isLinkSelected(pathname, "/now/") ? "page" : undefined}
                >
                  Now
                </Link>
              )}
              {sections.garden && (
                <Link
                  href="/garden/"
                  variant="navigation"
                  aria-current={isLinkSelected(pathname, "/garden/") ? "page" : undefined}
                >
                  The Garden
                </Link>
              )}
            </nav>
          )}
        </div>
      </Container>
    </header>
  )
}

export { Header }
