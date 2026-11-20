import { Container } from "./Container"
import { ToggleColorScheme } from "./ToggleColorScheme"

function Footer({ siteName }: { siteName: string }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer-content">
          <div>
            &copy; <time dateTime={String(currentYear)}>{currentYear}</time> {siteName}
          </div>
          <div className="site-footer-controls">
            <ToggleColorScheme />
          </div>
        </div>
      </Container>
    </footer>
  )
}

export { Footer }
