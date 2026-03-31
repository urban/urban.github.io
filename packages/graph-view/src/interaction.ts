import * as PIXI from "pixi.js"
import {
  GRAPH_CONFIG,
  POINTER_DOWN_EVENT,
  POINTER_MOVE_EVENT,
  WHEEL_EVENT,
  clamp,
  onPointerRelease,
  toGlobalPoint,
  type AppAction,
  type Disposer,
  type GraphNode,
  type NodeId,
  type NodeSpriteController,
  type Point,
} from "./shared"

function addStagePointerHandlers({
  stage,
  world,
  dispatch,
}: {
  stage: PIXI.Container
  world: PIXI.Container
  dispatch: (action: AppAction) => void
}): Disposer {
  const onPointerDown = (event: PIXI.FederatedPointerEvent) => {
    dispatch({
      type: "pointer/stage-down",
      global: toGlobalPoint(event),
      world: { x: world.x, y: world.y },
    })
  }

  const onPointerMove = (event: PIXI.FederatedPointerEvent) => {
    dispatch({ type: "pointer/move", global: toGlobalPoint(event) })
  }

  const onRelease = () => {
    dispatch({ type: "pointer/release" })
  }

  stage.on(POINTER_DOWN_EVENT, onPointerDown)
  stage.on(POINTER_MOVE_EVENT, onPointerMove)
  const releaseDisposer = onPointerRelease(stage, onRelease)

  return () => {
    releaseDisposer()
    stage.off(POINTER_DOWN_EVENT, onPointerDown)
    stage.off(POINTER_MOVE_EVENT, onPointerMove)
  }
}

function addNodePointerHandlers({
  nodes,
  nodeSprites,
  dispatch,
}: {
  nodes: readonly GraphNode[]
  nodeSprites: ReadonlyMap<NodeId, NodeSpriteController>
  dispatch: (action: AppAction) => void
}): Disposer {
  const disposers: Disposer[] = []

  for (const node of nodes) {
    const nodeSprite = nodeSprites.get(node.id)
    if (!nodeSprite) continue

    const disposeOver = nodeSprite.onPointerOver(() => {
      dispatch({ type: "pointer/node-over", nodeId: node.id })
    })
    const disposeOut = nodeSprite.onPointerOut(() => {
      dispatch({ type: "pointer/node-out", nodeId: node.id })
    })
    const disposeDown = nodeSprite.onPointerDown((event: PIXI.FederatedPointerEvent) => {
      event.stopPropagation()
      dispatch({ type: "pointer/node-down", nodeId: node.id, global: toGlobalPoint(event) })
    })

    disposers.push(disposeOver, disposeOut, disposeDown)
  }

  return () => {
    for (let index = disposers.length - 1; index >= 0; index -= 1) {
      disposers[index]?.()
    }
  }
}

export function getCanvasPointerPosition({
  canvas,
  clientX,
  clientY,
}: {
  canvas: HTMLCanvasElement
  clientX: number
  clientY: number
}): Point {
  const rect = canvas.getBoundingClientRect()
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

export function scaleWorldAroundAnchor({
  worldX,
  worldY,
  currentScale,
  nextScale,
  anchor,
}: {
  worldX: number
  worldY: number
  currentScale: number
  nextScale: number
  anchor: Point
}): Point {
  if (currentScale === nextScale) {
    return { x: worldX, y: worldY }
  }

  const scaleRatio = nextScale / currentScale
  return {
    x: anchor.x - (anchor.x - worldX) * scaleRatio,
    y: anchor.y - (anchor.y - worldY) * scaleRatio,
  }
}

export function applyWorldZoom({
  world,
  nextScale,
  anchor,
}: {
  world: PIXI.Container
  nextScale: number
  anchor: Point
}): boolean {
  const currentScale = world.scale.x
  const clampedScale = clamp(nextScale, GRAPH_CONFIG.zoom.min, GRAPH_CONFIG.zoom.max)
  if (clampedScale === currentScale) {
    return false
  }

  const nextWorldPosition = scaleWorldAroundAnchor({
    worldX: world.x,
    worldY: world.y,
    currentScale,
    nextScale: clampedScale,
    anchor,
  })

  world.scale.set(clampedScale)
  world.position.set(nextWorldPosition.x, nextWorldPosition.y)
  return true
}

export type PointerInteractionBinding = {
  dispose: Disposer
  setScrollZoomEnabled: (enabled: boolean) => void
  zoomByFactor: (zoomFactor: number, anchor: Point) => boolean
}

export function bindPointerInteractions({
  app,
  world,
  nodes,
  nodeSprites,
  dispatch,
  onZoom,
  scrollZoomEnabled = true,
}: {
  app: PIXI.Application
  world: PIXI.Container
  nodes: readonly GraphNode[]
  nodeSprites: ReadonlyMap<NodeId, NodeSpriteController>
  dispatch: (action: AppAction) => void
  onZoom: () => void
  scrollZoomEnabled?: boolean
}): PointerInteractionBinding {
  app.stage.eventMode = "static"
  app.stage.hitArea = app.screen
  if (!(app.canvas instanceof HTMLCanvasElement)) {
    throw new Error("Expected PIXI canvas to be HTMLCanvasElement")
  }

  let isScrollZoomEnabled = scrollZoomEnabled

  const zoomByFactor = (zoomFactor: number, anchor: Point) => {
    const didZoom = applyWorldZoom({
      world,
      nextScale: world.scale.x * zoomFactor,
      anchor,
    })
    if (didZoom) {
      onZoom()
    }
    return didZoom
  }

  const onWheel = (event: WheelEvent) => {
    if (!isScrollZoomEnabled) {
      return
    }

    event.preventDefault()
    zoomByFactor(
      event.deltaY < 0 ? 1.1 : 0.9,
      getCanvasPointerPosition({
        canvas: app.canvas,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    )
  }

  const disposeStage = addStagePointerHandlers({ stage: app.stage, world, dispatch })
  const disposeNodes = addNodePointerHandlers({ nodes, nodeSprites, dispatch })
  app.canvas.addEventListener(WHEEL_EVENT, onWheel, { passive: false })

  return {
    dispose: () => {
      app.canvas.removeEventListener(WHEEL_EVENT, onWheel)
      disposeNodes()
      disposeStage()
    },
    setScrollZoomEnabled: (enabled) => {
      isScrollZoomEnabled = enabled
    },
    zoomByFactor,
  }
}
