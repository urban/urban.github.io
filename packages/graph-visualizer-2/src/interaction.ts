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

function addWheelZoomHandler({
  canvas,
  world,
  onZoom,
}: {
  canvas: HTMLCanvasElement
  world: PIXI.Container
  onZoom: () => void
}): Disposer {
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9
    const newScale = clamp(world.scale.x * zoomFactor, GRAPH_CONFIG.zoom.min, GRAPH_CONFIG.zoom.max)
    const mouse = new PIXI.Point(event.clientX, event.clientY)
    const mouseLocalBeforeScale = world.toLocal(mouse)
    world.scale.set(newScale)
    const mouseLocalAfterScale = world.toLocal(mouse)
    world.x += (mouseLocalAfterScale.x - mouseLocalBeforeScale.x) * world.scale.x
    world.y += (mouseLocalAfterScale.y - mouseLocalBeforeScale.y) * world.scale.y
    onZoom()
  }

  canvas.addEventListener(WHEEL_EVENT, onWheel, { passive: false })

  return () => {
    canvas.removeEventListener(WHEEL_EVENT, onWheel)
  }
}

export function bindPointerInteractions({
  app,
  world,
  nodes,
  nodeSprites,
  dispatch,
  onZoom,
}: {
  app: PIXI.Application
  world: PIXI.Container
  nodes: readonly GraphNode[]
  nodeSprites: ReadonlyMap<NodeId, NodeSpriteController>
  dispatch: (action: AppAction) => void
  onZoom: () => void
}): Disposer {
  app.stage.eventMode = "static"
  app.stage.hitArea = app.screen
  if (!(app.canvas instanceof HTMLCanvasElement)) {
    throw new Error("Expected PIXI canvas to be HTMLCanvasElement")
  }

  const disposeStage = addStagePointerHandlers({ stage: app.stage, world, dispatch })
  const disposeNodes = addNodePointerHandlers({ nodes, nodeSprites, dispatch })
  const disposeWheel = addWheelZoomHandler({ canvas: app.canvas, world, onZoom })

  return () => {
    disposeWheel()
    disposeNodes()
    disposeStage()
  }
}
