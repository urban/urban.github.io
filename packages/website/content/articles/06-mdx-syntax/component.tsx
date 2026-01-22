export default () => {
  return (
    <button
      onClick={() => alert(`You clicked the button!`)}
      className="p-2 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300 ease-in-out"
    >
      Relative Button
    </button>
  )
}
