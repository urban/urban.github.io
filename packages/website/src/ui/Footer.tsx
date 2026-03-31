import { Container } from "./Container"
import { BackToTop } from "./BackToTop"
import { ToggleColorScheme } from "./ToggleColorScheme"

function Footer({ siteName }: { siteName: string }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="animate border-t border-black/10 dark:border-white/10">
      <Container>
        <div className="relative">
          <div className="absolute right-0 -top-20">
            <BackToTop />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            &copy; <time dateTime={String(currentYear)}>{currentYear}</time> {siteName}. All rights
            reserved.
          </div>
          <ToggleColorScheme />
        </div>
      </Container>
    </footer>
  )
}

export { Footer }
