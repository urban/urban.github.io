"use client"

import { Effect } from "effect"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import type { GraphThemeSet } from "@urban/graph-view"
import type { GraphVisualizerSelectionChange } from "@urban/graph-view/bootstrap"
import { toRoutePath } from "../lib/note"

const normalizePathname = (pathname: string): string => {
  const trimmedPathname = pathname.trim()
  if (trimmedPathname === "") {
    return "/"
  }

  return trimmedPathname.endsWith("/") && trimmedPathname !== "/"
    ? trimmedPathname.slice(0, -1)
    : trimmedPathname
}

export const resolveGraphSelectionNavigationHref = ({
  selection,
  pathname,
}: {
  selection: GraphVisualizerSelectionChange
  pathname: string
}): string | null => {
  if (selection.type !== "note") {
    return null
  }

  const nextHref =
    selection.slug === undefined
      ? (selection.routePath ?? selection.permalink)
      : toRoutePath(selection.slug)
  if (nextHref === undefined) {
    return null
  }

  return normalizePathname(nextHref) === normalizePathname(pathname) ? null : nextHref
}

type GraphBootProps = {
  readonly themeSet?: GraphThemeSet
  readonly scrollZoomEnabled?: boolean
}

export const GraphBoot = ({ themeSet, scrollZoomEnabled }: GraphBootProps) => {
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
          const bootstrapOptions = {
            onSelectionChange: (selection: GraphVisualizerSelectionChange) => {
              const nextHref = resolveGraphSelectionNavigationHref({
                selection,
                pathname,
              })
              if (nextHref !== null) {
                router.push(nextHref)
              }
            },
            ...(themeSet === undefined ? {} : { themeSet }),
            ...(scrollZoomEnabled === undefined ? {} : { scrollZoomEnabled }),
          }

          dispose = await Effect.runPromise(bootstrapGraphVisualizerEffect(bootstrapOptions))
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
  }, [pathname, router, scrollZoomEnabled, themeSet])

  return null
}
