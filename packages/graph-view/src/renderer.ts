import * as PIXI from "pixi.js"
import {
  GRAPH_CONFIG,
  POINTER_DOWN_EVENT,
  POINTER_OUT_EVENT,
  POINTER_OVER_EVENT,
  clamp,
  type GraphNode,
  type GraphRenderModel,
  type GraphTheme,
  type NodeId,
  type NodeSpriteController,
  type NodeState,
} from "./shared"

function applyNodeVariant(sprite: PIXI.Graphics, nodeState: NodeState, theme: GraphTheme) {
  const variant = theme.node.variants[nodeState]
  sprite.clear()
  sprite.circle(0, 0, GRAPH_CONFIG.node.radius).fill(variant.fill)
  sprite
    .circle(0, 0, GRAPH_CONFIG.node.radius)
    .stroke({ width: variant.strokeWidth, color: variant.stroke, alpha: 1 })
  sprite.alpha = variant.alpha
}

function createNodeSprite(theme: GraphTheme): NodeSpriteController {
  const sprite = new PIXI.Graphics()
  applyNodeVariant(sprite, "default", theme)
  sprite.scale.set(theme.node.scales.default)
  sprite.eventMode = "static"
  sprite.cursor = "pointer"

  const controller: NodeSpriteController = {
    sprite,
    state: "default",
    scaleState: "default",
    targetScale: theme.node.scales.default,
    setState: (nodeState, scaleState, nextTheme) => {
      controller.state = nodeState
      controller.scaleState = scaleState
      controller.targetScale = nextTheme.node.scales[scaleState]
      applyNodeVariant(sprite, nodeState, nextTheme)
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

function createNodeLabel(nodeLabel: string, theme: GraphTheme) {
  const label = new PIXI.Text({
    text: nodeLabel,
    style: {
      ...theme.label.style,
      fill: theme.label.variants.default.fill,
    },
  })
  label.eventMode = "none"
  label.anchor.set(0.5, 0)
  label.roundPixels = true
  label.visible = false
  return label
}

export function applyAppTheme(app: PIXI.Application, theme: GraphTheme) {
  app.renderer.background.color = theme.view.backgroundColor
}

export async function createPixiApp({
  containerSelector,
  theme,
}: {
  containerSelector: string
  theme: GraphTheme
}) {
  const root = document.querySelector<HTMLElement>(containerSelector)
  if (!root) throw new Error(`Missing container element: ${containerSelector}`)

  const app = new PIXI.Application()
  await app.init({
    resizeTo: root,
    antialias: true,
    backgroundColor: theme.view.backgroundColor,
  })

  if (!(app.canvas instanceof HTMLCanvasElement)) {
    throw new Error("Expected PIXI canvas to be HTMLCanvasElement")
  }

  applyAppTheme(app, theme)
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
  nodeY: number
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
  getTheme,
}: {
  nodes: readonly GraphNode[]
  nodeLayer: PIXI.Container
  labelLayer: PIXI.Container
  edgeGraphics: PIXI.Graphics
  ticker: PIXI.Ticker
  getTheme: () => GraphTheme
}) {
  const nodeSprites = new Map<NodeId, NodeSpriteController>()
  const nodeLabels = new Map<NodeId, PIXI.Text>()
  const labelAnimationByNodeId = new Map<NodeId, LabelAnimationState>()
  const visibleNodeIds = new Set<NodeId>()
  const visibleLabelIds = new Set<NodeId>()

  for (const node of nodes) {
    const theme = getTheme()
    const nodeSprite = createNodeSprite(theme)
    const nodeLabel = createNodeLabel(node.label, theme)
    nodeLayer.addChild(nodeSprite.sprite)
    labelLayer.addChild(nodeLabel)
    nodeSprites.set(node.id, nodeSprite)
    nodeLabels.set(node.id, nodeLabel)
    labelAnimationByNodeId.set(node.id, {
      baseX: 0,
      nodeY: 0,
      currentOffset: 0,
      targetOffset: 0,
      baseAlpha: 0,
      currentVisibility: 1,
      targetVisibility: 1,
    })
  }

  const animateVisuals = () => {
    const deltaSeconds = ticker.deltaMS / 1000
    const scaleInterpolation = 1 - Math.exp(-GRAPH_CONFIG.node.scaleAnimationSpeed * deltaSeconds)
    const labelInterpolation = 1 - Math.exp(-GRAPH_CONFIG.label.hoverAnimationSpeed * deltaSeconds)

    for (const nodeSprite of nodeSprites.values()) {
      if (!nodeSprite.sprite.visible) continue
      const currentScale = nodeSprite.sprite.scale.x
      const scaleDelta = nodeSprite.targetScale - currentScale
      if (Math.abs(scaleDelta) <= 0.001) {
        nodeSprite.sprite.scale.set(nodeSprite.targetScale)
      } else {
        const nextScale = currentScale + scaleDelta * scaleInterpolation
        nodeSprite.sprite.scale.set(nextScale)
      }
    }

    for (const [nodeId, animation] of labelAnimationByNodeId) {
      const labelSprite = nodeLabels.get(nodeId)
      if (!labelSprite || !labelSprite.visible) continue
      const offsetDelta = animation.targetOffset - animation.currentOffset
      if (Math.abs(offsetDelta) <= 0.01) {
        animation.currentOffset = animation.targetOffset
      } else {
        animation.currentOffset += offsetDelta * labelInterpolation
      }
      const visibilityDelta = animation.targetVisibility - animation.currentVisibility
      if (Math.abs(visibilityDelta) <= 0.01) {
        animation.currentVisibility = animation.targetVisibility
      } else {
        animation.currentVisibility += visibilityDelta * labelInterpolation
      }
      const nodeSprite = nodeSprites.get(nodeId)
      const nodeScale = nodeSprite?.sprite.scale.x ?? 1
      const labelY =
        animation.nodeY + GRAPH_CONFIG.node.radius * nodeScale + GRAPH_CONFIG.label.offset
      labelSprite.position.set(animation.baseX, labelY + animation.currentOffset)
      labelSprite.alpha = animation.baseAlpha * animation.currentVisibility
    }
  }

  ticker.add(animateVisuals)

  const render = ({
    nodes: renderNodes,
    edges: renderEdges,
    labels: renderLabels,
  }: GraphRenderModel) => {
    const theme = getTheme()
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
      nodeSprite.setState(node.visual, node.scaleState, theme)
      if (node.position) nodeSprite.setPosition(node.position.x, node.position.y)
    }

    edgeGraphics.clear()
    for (const edge of renderEdges) {
      const variant = theme.edge.variants[edge.visual]
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
      const variant = theme.label.variants[label.state]
      labelSprite.style.fill = variant.fill
      const baseAlpha = labelZoomAlpha
      const targetVisibility = variant.alpha
      const labelY =
        label.y +
        GRAPH_CONFIG.node.radius * theme.node.scales[label.scaleState] +
        GRAPH_CONFIG.label.offset
      if (animation) {
        animation.baseX = label.x
        animation.nodeY = label.y
        animation.targetOffset = label.isHovered ? GRAPH_CONFIG.label.hoverOffset : 0
        animation.baseAlpha = baseAlpha
        animation.targetVisibility = targetVisibility
        labelSprite.position.set(animation.baseX, labelY + animation.currentOffset)
        labelSprite.alpha = animation.baseAlpha * animation.currentVisibility
      } else {
        labelSprite.position.set(label.x, labelY)
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
      ticker.remove(animateVisuals)
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
