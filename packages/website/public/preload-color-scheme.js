;(function preloadColorScheme() {
  const preference = localStorage.getItem("colorScheme")
  const isDark =
    preference === "dark" ||
    ((preference === null || preference === "system") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  if (isDark) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
})()
