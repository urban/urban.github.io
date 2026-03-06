import * as PIXI from "pixi.js"
import {
  GRAPH_CONFIG,
  POINTER_DOWN_EVENT,
  POINTER_OUT_EVENT,
  POINTER_OVER_EVENT,
  clamp,
  type GraphNode,
  type GraphRenderModel,
  type NodeId,
  type NodeSpriteController,
  type NodeState,
} from "./shared"

function applyNodeVariant(sprite: PIXI.Graphics, nodeState: NodeState) {
  const variant = GRAPH_CONFIG.node.variants[nodeState]
  sprite.clear()
  sprite.circle(0, 0, GRAPH_CONFIG.node.radius).fill(variant.fill)
  sprite
    .circle(0, 0, GRAPH_CONFIG.node.radius)
    .stroke({ width: variant.strokeWidth, color: variant.stroke, alpha: 1 })
  sprite.scale.set(variant.scale)
  sprite.alpha = variant.alpha
}

function createNodeSprite(): NodeSpriteController {
  const sprite = new PIXI.Graphics()
  applyNodeVariant(sprite, "default")
  sprite.eventMode = "static"
  sprite.cursor = "pointer"

  const controller: NodeSpriteController = {
    sprite,
    state: "default",
    setState: (nodeState) => {
      if (controller.state === nodeState) return
      controller.state = nodeState
      applyNodeVariant(sprite, nodeState)
    },
    setPosition: (x, y) => sprite.position.set(x, y),
    onPointerDown: (onDown) => {
      sprite.on(POINTER_DOWN_EVENT, onDown)
      return () => {
        sprite.off(POINTER_DOWN_EVENT, onDown)
      }
    },
    onPointerOver: (onOver) => {
      sprite.on(POINTER_OVER_EVENT, onOver)
      return () => {
        sprite.off(POINTER_OVER_EVENT, onOver)
      }
    },
    onPointerOut: (onOut) => {
      sprite.on(POINTER_OUT_EVENT, onOut)
      return () => {
        sprite.off(POINTER_OUT_EVENT, onOut)
      }
    },
  }

  return controller
}

function createNodeLabel(nodeLabel: string) {
  const label = new PIXI.Text({
    text: nodeLabel,
    style: {
      ...GRAPH_CONFIG.label.style,
    },
  })
  label.eventMode = "none"
  label.anchor.set(0.5, 0)
  label.roundPixels = true
  label.visible = false
  return label
}

export async function createPixiApp(containerSelector: string) {
  const app = new PIXI.Application()
  await app.init({
    resizeTo: window,
    antialias: true,
    backgroundAlpha: GRAPH_CONFIG.view.backgroundAlpha,
    backgroundColor: GRAPH_CONFIG.view.backgroundColor,
  })

  const root = document.querySelector<HTMLElement>(containerSelector)
  if (!root) throw new Error(`Missing container element: ${containerSelector}`)
  if (!(app.canvas instanceof HTMLCanvasElement)) {
    throw new Error("Expected PIXI canvas to be HTMLCanvasElement")
  }

  root.appendChild(app.canvas)
  return app
}

export function createWorld(app: PIXI.Application) {
  const world = new PIXI.Container()
  const edgeGraphics = new PIXI.Graphics()
  const nodeLayer = new PIXI.Container()
  const labelLayer = new PIXI.Container()

  world.sortableChildren = true
  edgeGraphics.zIndex = 0
  nodeLayer.zIndex = 1
  labelLayer.zIndex = 2
  world.addChild(edgeGraphics, nodeLayer, labelLayer)
  app.stage.addChild(world)

  return { world, edgeGraphics, nodeLayer, labelLayer }
}

type LabelAnimationState = {
  baseX: number
  baseY: number
  currentOffset: number
  targetOffset: number
  baseAlpha: number
  currentVisibility: number
  targetVisibility: number
}

export function createGraphRenderer({
  nodes,
  nodeLayer,
  labelLayer,
  edgeGraphics,
  ticker,
}: {
  nodes: readonly GraphNode[]
  nodeLayer: PIXI.Container
  labelLayer: PIXI.Container
  edgeGraphics: PIXI.Graphics
  ticker: PIXI.Ticker
}) {
  const nodeSprites = new Map<NodeId, NodeSpriteController>()
  const nodeLabels = new Map<NodeId, PIXI.Text>()
  const labelAnimationByNodeId = new Map<NodeId, LabelAnimationState>()
  const visibleNodeIds = new Set<NodeId>()
  const visibleLabelIds = new Set<NodeId>()

  for (const node of nodes) {
    const nodeSprite = createNodeSprite()
    const nodeLabel = createNodeLabel(node.label)
    nodeLayer.addChild(nodeSprite.sprite)
    labelLayer.addChild(nodeLabel)
    nodeSprites.set(node.id, nodeSprite)
    nodeLabels.set(node.id, nodeLabel)
    labelAnimationByNodeId.set(node.id, {
      baseX: 0,
      baseY: 0,
      currentOffset: 0,
      targetOffset: 0,
      baseAlpha: 0,
      currentVisibility: GRAPH_CONFIG.label.variants.default.alpha,
      targetVisibility: GRAPH_CONFIG.label.variants.default.alpha,
    })
  }

  const animateLabels = () => {
    const deltaSeconds = ticker.deltaMS / 1000
    const interpolation = 1 - Math.exp(-GRAPH_CONFIG.label.hoverAnimationSpeed * deltaSeconds)
    for (const [nodeId, animation] of labelAnimationByNodeId) {
      const labelSprite = nodeLabels.get(nodeId)
      if (!labelSprite || !labelSprite.visible) continue
      const offsetDelta = animation.targetOffset - animation.currentOffset
      if (Math.abs(offsetDelta) <= 0.01) {
        animation.currentOffset = animation.targetOffset
      } else {
        animation.currentOffset += offsetDelta * interpolation
      }
      const visibilityDelta = animation.targetVisibility - animation.currentVisibility
      if (Math.abs(visibilityDelta) <= 0.01) {
        animation.currentVisibility = animation.targetVisibility
      } else {
        animation.currentVisibility += visibilityDelta * interpolation
      }
      labelSprite.position.set(animation.baseX, animation.baseY + animation.currentOffset)
      labelSprite.alpha = animation.baseAlpha * animation.currentVisibility
    }
  }

  ticker.add(animateLabels)

  const render = ({
    nodes: renderNodes,
    edges: renderEdges,
    labels: renderLabels,
  }: GraphRenderModel) => {
    const devicePixelRatio = window.devicePixelRatio || 1
    const parentScale = edgeGraphics.parent?.scale.x
    const worldScale = typeof parentScale === "number" && parentScale > 0 ? parentScale : 1
    const labelResolution = Math.max(1, devicePixelRatio * worldScale)
    const labelFadeZoomRange = GRAPH_CONFIG.label.fadeStartZoom - GRAPH_CONFIG.zoom.min
    const labelZoomAlphaLinear =
      labelFadeZoomRange > 0
        ? clamp((worldScale - GRAPH_CONFIG.zoom.min) / labelFadeZoomRange, 0, 1)
        : worldScale >= GRAPH_CONFIG.label.fadeStartZoom
          ? 1
          : 0
    const labelZoomAlpha = Math.pow(labelZoomAlphaLinear, GRAPH_CONFIG.label.fadeExponent)

    visibleNodeIds.clear()
    for (const node of renderNodes) {
      const nodeSprite = nodeSprites.get(node.id)
      if (!nodeSprite) continue
      visibleNodeIds.add(node.id)
      if (!nodeSprite.sprite.visible) nodeSprite.sprite.visible = true
      nodeSprite.setState(node.visual)
      if (node.position) nodeSprite.setPosition(node.position.x, node.position.y)
    }

    edgeGraphics.clear()
    for (const edge of renderEdges) {
      const variant = GRAPH_CONFIG.edge.variants[edge.visual]
      edgeGraphics.moveTo(edge.source.x, edge.source.y)
      edgeGraphics.lineTo(edge.target.x, edge.target.y)
      edgeGraphics.stroke({
        width: variant.width / worldScale,
        color: variant.color,
        alpha: variant.alpha,
      })
    }

    visibleLabelIds.clear()
    for (const label of renderLabels) {
      const labelSprite = nodeLabels.get(label.id)
      if (!labelSprite) continue
      visibleLabelIds.add(label.id)
      if (!labelSprite.visible) labelSprite.visible = true
      if (labelSprite.resolution !== labelResolution) labelSprite.resolution = labelResolution
      const animation = labelAnimationByNodeId.get(label.id)
      const variant = GRAPH_CONFIG.label.variants[label.state]
      const baseAlpha = labelZoomAlpha
      const targetVisibility = variant.alpha
      if (labelSprite.tint !== variant.tint) labelSprite.tint = variant.tint
      if (animation) {
        animation.baseX = label.x
        animation.baseY = label.y
        animation.targetOffset = label.isHovered ? GRAPH_CONFIG.label.hoverOffset : 0
        animation.baseAlpha = baseAlpha
        animation.targetVisibility = targetVisibility
        labelSprite.position.set(animation.baseX, animation.baseY + animation.currentOffset)
        labelSprite.alpha = animation.baseAlpha * animation.currentVisibility
      } else {
        labelSprite.position.set(label.x, label.y)
        labelSprite.alpha = baseAlpha * targetVisibility
      }
    }

    for (const [nodeId, labelSprite] of nodeLabels) {
      if (visibleLabelIds.has(nodeId)) continue
      if (labelSprite.visible) labelSprite.visible = false
    }

    for (const [nodeId, nodeSprite] of nodeSprites) {
      if (visibleNodeIds.has(nodeId)) continue
      if (nodeSprite.sprite.visible) nodeSprite.sprite.visible = false
    }
  }

  return {
    nodeSprites,
    render,
    dispose: () => {
      ticker.remove(animateLabels)
      for (const nodeSprite of nodeSprites.values()) {
        nodeSprite.sprite.removeAllListeners()
      }
      for (const labelSprite of nodeLabels.values()) {
        labelSprite.destroy()
      }
      for (const nodeSprite of nodeSprites.values()) {
        nodeSprite.sprite.destroy()
      }
    },
  }
}
