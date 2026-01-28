"use client"
import { useEffect } from "react"

const PageNavigationAnimation = () => {
  useEffect(() => {
    const animateElements = document.querySelectorAll(".animate")

    animateElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add("show")
      }, index * 150)
    })
  }, [])
  return undefined
}

export { PageNavigationAnimation }
