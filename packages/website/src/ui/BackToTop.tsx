"use client"

import { type MouseEventHandler, useCallback, useEffect } from "react"

const BackToTop = () => {
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 0) {
        document.documentElement.classList.add("scrolled")
      } else {
        document.documentElement.classList.remove("scrolled")
      }
    }

    document.addEventListener("scroll", onScroll)
    return () => {
      document.removeEventListener("scroll", onScroll)
    }
  }, [])

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => {
    event.preventDefault()
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [])

  return (
    <button
      className="relative group w-fit flex pl-8 pr-3 py-1.5 flex-nowrap rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors duration-300 ease-in-out"
      onClick={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="absolute top-1/2 left-2 -translate-y-1/2 size-4 stroke-2 fill-none stroke-current rotate-90"
      >
        <line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
          className="translate-x-2 group-hover:translate-x-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"
        />
        <polyline
          points="12 5 5 12 12 19"
          className="translate-x-1 group-hover:translate-x-0 transition-transform duration-300 ease-in-out"
        />
      </svg>
      <div className="text-sm">Back to top</div>
    </button>
  )
}

export { BackToTop }
