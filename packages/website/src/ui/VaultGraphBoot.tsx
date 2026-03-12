"use client"

import { useEffect } from "react"

export const VaultGraphBoot = () => {
  useEffect(() => {
    let disposed = false
    let dispose: (() => void) | undefined

    void import("@urban/graph-visualizer-2/bootstrap").then(
      async ({ bootstrapGraphVisualizer }) => {
        if (disposed) {
          return
        }

        dispose = await bootstrapGraphVisualizer()
      },
    )

    return () => {
      disposed = true
      dispose?.()
    }
  }, [])

  return null
}
