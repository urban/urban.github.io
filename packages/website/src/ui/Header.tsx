import { Container } from "./Container"
import { Link } from "./NavLink"
import { isLinkSelected } from "./NavLink/linkSelection"

const Header = ({ siteName, pathname }: { siteName: string; pathname: string }) => {
  return (
    <header className="site-header">
      <Container>
        <div className="site-header-content">
          <a className="site-wordmark" href="/">
            {siteName}
          </a>
          <nav aria-label="Primary" className="site-navigation">
            <Link
              href="/now/"
              variant="navigation"
              aria-current={isLinkSelected(pathname, "/now/") ? "page" : undefined}
            >
              Now
            </Link>
            <Link
              href="/garden/"
              variant="navigation"
              aria-current={isLinkSelected(pathname, "/garden/") ? "page" : undefined}
            >
              The Garden
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  )
}

export { Header }
