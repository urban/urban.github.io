import type { Disposer } from "./shared"

export interface Lifecycle {
  add: (disposer: Disposer) => void
  dispose: () => void
}

export function createLifecycle(): Lifecycle {
  const disposers: Disposer[] = []
  let disposed = false

  return {
    add: (disposer) => {
      if (disposed) {
        disposer()
        return
      }
      disposers.push(disposer)
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      for (let index = disposers.length - 1; index >= 0; index -= 1) {
        disposers[index]?.()
      }
      disposers.length = 0
    },
  }
}
