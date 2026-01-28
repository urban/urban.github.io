;(function preloadColorScheme() {
  const isDark =
    localStorage.colorScheme === "dark" ||
    (!("colorScheme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)

  if (isDark) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
})()
