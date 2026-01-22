"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr"
import { useCallback, useEffect } from "react"

type ColorScheme = "light" | "dark" | "system"

const disableCSSTransitions = () => {
  const css = document.createElement("style")

  // disable transitions when toggling color scheme
  css.appendChild(
    document.createTextNode(
      `* {
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -o-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
        }
      `,
    ),
  )
  document.head.appendChild(css)

  return () => {
    // @ts-expect-error _opacity is declared but it's value is never read.
    const _opacity = window.getComputedStyle(css).opacity
    document.head.removeChild(css)
  }
}

const toggleColorScheme = (isDark: boolean) => {
  const resetTransitions = disableCSSTransitions()

  if (isDark) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }

  resetTransitions()
}

const ToggleColorScheme = () => {
  useEffect(() => {
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (localStorage.colorScheme === "system" || !localStorage.colorScheme) {
        toggleColorScheme(event.matches)
      }
    }
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleMediaChange)

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handleMediaChange)
    }
  }, [])

  const handleSelectColorScheme = useCallback((colorScheme: ColorScheme) => {
    localStorage.setItem("colorScheme", colorScheme)
    switch (colorScheme) {
      case "light":
        toggleColorScheme(false)
        break
      case "dark":
        toggleColorScheme(true)
        break
      case "system":
        toggleColorScheme(window.matchMedia("(prefers-color-scheme: dark)").matches)
        break
    }
  }, [])

  return (
    <div className="flex flex-wrap gap-1 items-center">
      <button
        id="light-theme-button"
        aria-label="Light theme"
        className="group size-8 flex items-center justify-center rounded-full"
        onClick={() => handleSelectColorScheme("light")}
      >
        <SunIcon size={21} />
      </button>
      <button
        id="dark-theme-button"
        aria-label="Dark theme"
        className="group size-8 flex items-center justify-center rounded-full"
        onClick={() => handleSelectColorScheme("dark")}
      >
        <MoonIcon size={21} />
      </button>
      <button
        id="system-theme-button"
        aria-label="System theme"
        className="group size-8 flex items-center justify-center rounded-full"
        onClick={() => handleSelectColorScheme("system")}
      >
        <MonitorIcon size={21} />
      </button>
    </div>
  )
}

export { ToggleColorScheme }
