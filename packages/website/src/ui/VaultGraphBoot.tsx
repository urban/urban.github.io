"use client"

import { Effect } from "effect"
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

    void import("@urban/graph-view/bootstrap").then(
      async ({
        GraphThemeDecodeError,
        GraphThemeJsonParseError,
        GraphVisualizerBootstrapError,
        bootstrapGraphVisualizerEffect,
        renderGraphVisualizerBootstrapError,
      }) => {
        if (disposed) {
          return
        }

        try {
          dispose = await Effect.runPromise(
            bootstrapGraphVisualizerEffect({
              onSelectionChange: (selection) => {
                const nextHref = resolveVaultGraphSelectionNavigationHref({
                  selection,
                  pathname,
                })
                if (nextHref !== null) {
                  router.push(nextHref)
                }
              },
            }),
          )
        } catch (error: unknown) {
          if (
            error instanceof GraphThemeJsonParseError ||
            error instanceof GraphThemeDecodeError ||
            error instanceof GraphVisualizerBootstrapError
          ) {
            renderGraphVisualizerBootstrapError({
              documentObject: document,
              error,
            })
            return
          }

          console.error(error)
        }
      },
    )

    return () => {
      disposed = true
      dispose?.()
    }
  }, [pathname, router])

  return null
}
