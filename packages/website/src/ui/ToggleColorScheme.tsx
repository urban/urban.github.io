"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr"
import { useCallback, useEffect, useState } from "react"
import { Button } from "./Button"

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
    // Force a style flush before restoring transitions.
    void window.getComputedStyle(css).opacity
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
  const [selected, setSelected] = useState<ColorScheme>("system")
  useEffect(() => {
    const saved = localStorage.getItem("colorScheme")
    setSelected(saved === "light" || saved === "dark" ? saved : "system")
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (localStorage.colorScheme === "system" || !localStorage.colorScheme) {
        toggleColorScheme(event.matches)
      }
    }
    media.addEventListener("change", handleMediaChange)

    return () => {
      media.removeEventListener("change", handleMediaChange)
    }
  }, [])

  const handleSelectColorScheme = useCallback((colorScheme: ColorScheme) => {
    localStorage.setItem("colorScheme", colorScheme)
    setSelected(colorScheme)
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
    <div className="theme-switcher" role="group" aria-label="Color theme">
      <Button
        variant="ghost"
        id="light-theme-button"
        aria-label="Light theme"
        aria-pressed={selected === "light"}
        onClick={() => handleSelectColorScheme("light")}
      >
        <SunIcon size={21} aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        id="dark-theme-button"
        aria-label="Dark theme"
        aria-pressed={selected === "dark"}
        onClick={() => handleSelectColorScheme("dark")}
      >
        <MoonIcon size={21} aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        id="system-theme-button"
        aria-label="System theme"
        aria-pressed={selected === "system"}
        onClick={() => handleSelectColorScheme("system")}
      >
        <MonitorIcon size={21} aria-hidden="true" />
      </Button>
    </div>
  )
}

export { ToggleColorScheme }
