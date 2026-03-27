"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import type { GraphVisualizerSelectionChange } from "@urban/graph-view/bootstrap"

const normalizePathname = (pathname: string): string => {
  const trimmedPathname = pathname.trim()
  if (trimmedPathname === "") {
    return "/"
  }

  return trimmedPathname.endsWith("/") && trimmedPathname !== "/"
    ? trimmedPathname.slice(0, -1)
    : trimmedPathname
}

export const resolveVaultGraphSelectionNavigationHref = ({
  selection,
  pathname,
}: {
  selection: GraphVisualizerSelectionChange
  pathname: string
}): string | null => {
  if (selection.type !== "note") {
    return null
  }

  const nextHref = selection.routePath ?? selection.permalink
  if (nextHref === undefined) {
    return null
  }

  return normalizePathname(nextHref) === normalizePathname(pathname) ? null : nextHref
}

export const VaultGraphBoot = () => {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let disposed = false
    let dispose: (() => void) | undefined

    void import("@urban/graph-view/bootstrap").then(async ({ bootstrapGraphVisualizer }) => {
      if (disposed) {
        return
      }

      dispose = await bootstrapGraphVisualizer({
        onSelectionChange: (selection) => {
          const nextHref = resolveVaultGraphSelectionNavigationHref({
            selection,
            pathname,
          })
          if (nextHref !== null) {
            router.push(nextHref)
          }
        },
      })
    })

    return () => {
      disposed = true
      dispose?.()
    }
  }, [pathname, router])

  return null
}
