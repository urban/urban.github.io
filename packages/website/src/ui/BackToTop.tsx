"use client"

import { ArrowUpIcon } from "@phosphor-icons/react/dist/ssr"
import { Button } from "./Button"

const BackToTop = () => (
  <Button
    onClick={() =>
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      })
    }
  >
    <ArrowUpIcon size={16} aria-hidden="true" />
    Back to top
  </Button>
)

export { BackToTop }
