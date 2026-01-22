import { Container } from "./Container"
import { BackToTop } from "./BackToTop"
import { ToggleColorScheme } from "./ToggleColorScheme"

function Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="animate">
      <Container>
        <div className="relative">
          <div className="absolute right-0 -top-20">
            <BackToTop />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            &copy; 2025 {`|`} {siteName}
          </div>
          <ToggleColorScheme />
        </div>
      </Container>
    </footer>
  )
}

export { Footer }
