'use client'

import { useEffect, useRef } from 'react'

type Node = {
  px: number
  py: number
  vx: number
  vy: number
  r: number
  glowPhase: number
  movePhase: number
  _x: number
  _y: number
}

/**
 * Animated recreation of the original HRMD background artwork.
 *
 * Reference (public/Branding/hrmd-background.png, 1672x941):
 * - Soft diagonal pastel gradient.
 *   - Upper-right: softer lavender/pink concentration.
 *   - Center: softer blue/cyan.
 *   - Lower-left: softer minty-cyan.
 * - Coarse low-poly white network scattered across the frame.
 *   - Denser toward the center, sparser toward the edges.
 *   - Lines are thin, pastel-tinted white (≈ rgb(224,241,252) at mid opacity).
 * - Nodes are small, near-white pastel glows.
 * - Soft bokeh-like glow highlights scattered in the upper area.
 *
 * The gradient is the primary background. The network is drawn on top of it.
 * Nodes drift gently (amplitude ~8-14px), lines follow the nodes, and glow
 * varies on a 3-5s cycle. There are no cursor-reactive effects — this is
 * purely decorative ambient motion, shared by the landing page and the admin
 * login panel.
 */
export function NetworkBackground({
  className,
  nodeCount = 60,
}: {
  className?: string
  nodeCount?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let nodes: Node[] = []
    let width = 1
    let height = 1
    let raf = 0
    let animating = false
    let observer: ResizeObserver | null = null

    // Pastel network palette sampled from the reference artwork (soft warm white).
    const LINE_BASE = { r: 236, g: 240, b: 248 }
    const NODE_BASE = { r: 244, g: 245, b: 250 }

    const grad = { x0: 0, y0: 0, x1: 1, y1: 1 }

    /** Soft diagonal pastel gradient, closer to the reference color distribution. */
    const drawGradient = () => {
      // Diagonal pastel gradient matched to the reference artwork:
      // lower-left stronger lavender/pink, center soft blue/cyan, upper-right cooler pink.
      const g = ctx.createLinearGradient(0, 0, width, height)
      g.addColorStop(0.00, '#f6e0f1')
      g.addColorStop(0.14, '#f0dcf0')
      g.addColorStop(0.28, '#e6e6f5')
      g.addColorStop(0.44, '#dae3f1')
      g.addColorStop(0.60, '#dde9f0')
      g.addColorStop(0.76, '#f0e8ef')
      g.addColorStop(0.88, '#f5edf1')
      g.addColorStop(1.00, '#f9eef3')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, width, height)
    }

    const seed = (count: number) => {
      const next: Node[] = []
      for (let i = 0; i < count; i += 1) {
        // Place more nodes toward the center to mirror reference density.
        const angle = Math.random() * Math.PI * 2
        const radius = Math.pow(Math.random(), 0.7) * 0.46
        const cx = 0.5 + Math.cos(angle) * radius
        const cy = 0.5 + Math.sin(angle) * radius
        const px = Math.max(0.04, Math.min(0.96, cx))
        const py = Math.max(0.04, Math.min(0.96, cy))
        next.push({
          px,
          py,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 0.9 + Math.random() * 1.2,
          glowPhase: Math.random() * Math.PI * 2,
          movePhase: Math.random() * Math.PI * 2,
          _x: px,
          _y: py,
        })
      }
      nodes = next
    }

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed(Math.max(22, Math.min(nodeCount, Math.round(width * height / 22_000))))
    }

    const driftAmplitude = 11
    const driftSpeed = 0.00095 // slightly faster than before
    const glowSpeed = 0.0021

    const move = (now: number, node: Node) => {
      const e = Math.sin(now * driftSpeed + node.movePhase) * 0.6 +
        Math.sin(now * driftSpeed * 0.55 + node.movePhase * 1.6) * 0.4
      // Keep drift bounded and gentle.
      const dx = node.vx * e * driftAmplitude
      const dy = node.vy * e * driftAmplitude
      return {
        x: node.px + dx,
        y: node.py + dy,
      }
    }

    const glow = (now: number, phase: number) => 0.5 + 0.5 * Math.sin(now * glowSpeed + phase)

    const draw = (now: number) => {
      drawGradient()

      // Update node positions.
      for (const node of nodes) {
        const p = move(now, node)
        node._x = p.x
        node._y = p.y
      }

      // Connection lines: connect nearby stable neighbors; denser toward center.
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j]

          const dStable = Math.hypot(a.px - b.px, a.py - b.py)
          if (dStable > 0.30) continue

          // Distance-based cutoff so edge connections are sparse; center stays denser.
          const edgeFactor = 1 - Math.hypot(a.px - 0.5, a.py - 0.5) * 0.85 -
            Math.hypot(b.px - 0.5, b.py - 0.5) * 0.85
          if (edgeFactor < 0) continue

          const strength = (1 - dStable / 0.30) * (0.6 + 0.4 * edgeFactor)
          const gA = glow(now, a.glowPhase)
          const gB = glow(now, b.glowPhase)
          const glowAdd = Math.pow((gA + gB) * 0.5, 2) * 0.18
          const alpha = Math.min(0.30, strength * 0.18 + glowAdd)

          const lr = Math.round(LINE_BASE.r * (0.85 + 0.15 * gA))
          const lg = Math.round(LINE_BASE.g * (0.85 + 0.15 * gA))
          const lb = Math.round(LINE_BASE.b * (0.85 + 0.15 * gA))
          ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha.toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a._x * width, a._y * height)
          ctx.lineTo(b._x * width, b._y * height)
          ctx.stroke()
        }
      }

      // Glowing nodes.
      for (const node of nodes) {
        const g = glow(now, node.glowPhase)
        const baseAlpha = 0.5
        const glowAdd = Math.pow(g, 2) * 0.5
        const alpha = Math.min(1, baseAlpha + glowAdd)
        const nr = Math.round(NODE_BASE.r * (0.92 + 0.08 * g))
        const ng = Math.round(NODE_BASE.g * (0.92 + 0.08 * g))
        const nb = Math.round(NODE_BASE.b * (0.92 + 0.08 * g))
        const rad = node.r + g * 0.8
        ctx.fillStyle = `rgba(${nr},${ng},${nb},${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(node._x * width, node._y * height, Math.max(0.4, rad), 0, Math.PI * 2)
        ctx.fill()
      }

      // Soft bokeh-style glow highlights clustered toward the upper area (reference look).
      const count = Math.min(34, Math.round(width * height / 38_000))
      for (let i = 0; i < count; i += 1) {
        const t = (i + 0.5) / count
        const angle = t * Math.PI * 2 + now * 0.00005
        const rad = 0.34 + 0.10 * Math.sin(t * 13 + now * 0.0004)
        const cx = 0.5 + Math.cos(angle) * rad
        const cy = 0.30 + Math.sin(angle) * rad * 0.5 - 0.08
        if (cx < 0 || cx > 1 || cy < 0 || cy > 1) continue
        const g = glow(now, i * 1.3)
        const gam = Math.min(0.55, 0.10 + g * 0.26)
        const radius = Math.max(34, width * 0.19 * (0.6 + 0.4 * g))
        const grd = ctx.createRadialGradient(
          cx * width, cy * height, 0,
          cx * width, cy * height, radius,
        )
        grd.addColorStop(0, `rgba(255,250,245,${gam.toFixed(3)})`)
        grd.addColorStop(1, 'rgba(255,250,245,0)')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, width, height)
      }
    }

    const tick = (now: number) => {
      draw(now)
      raf = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      if (!animating) return
      animating = false
      window.cancelAnimationFrame(raf)
    }

    const start = () => {
      if (animating || motionQuery.matches) return
      animating = true
      raf = window.requestAnimationFrame(tick)
    }

    const drawStatic = () => {
      drawGradient()
      // Draw one frozen frame so reduced-motion users still see the network.
      const now = performance.now()
      for (const node of nodes) {
        const p = move(now, node)
        node._x = p.x
        node._y = p.y
      }
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j]
          const dStable = Math.hypot(a.px - b.px, a.py - b.py)
          if (dStable > 0.28) continue
          const edgeFactor = 1 - Math.hypot(a.px - 0.5, a.py - 0.5) * 0.9 -
            Math.hypot(b.px - 0.5, b.py - 0.5) * 0.9
          if (edgeFactor < 0) continue
          const strength = (1 - dStable / 0.28) * (0.55 + 0.45 * edgeFactor)
          const alpha = Math.min(0.28, strength * 0.16)
          const lr = Math.round(LINE_BASE.r * 0.95)
          const lg = Math.round(LINE_BASE.g * 0.95)
          const lb = Math.round(LINE_BASE.b * 0.95)
          ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha.toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a._x * width, a._y * height)
          ctx.lineTo(b._x * width, b._y * height)
          ctx.stroke()
        }
      }
      for (const node of nodes) {
        const alpha = 0.6
        ctx.fillStyle = `rgba(${NODE_BASE.r},${NODE_BASE.g},${NODE_BASE.b},${alpha})`
        ctx.beginPath()
        ctx.arc(node._x * width, node._y * height, node.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    measure()
    if (motionQuery.matches) {
      drawGradient()
      // Need node positions for a static frame.
      for (const node of nodes) {
        const p = move(performance.now(), node)
        node._x = p.x
        node._y = p.y
      }
      drawStatic()
    } else {
      draw(performance.now())
      start()
    }

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measure()
        if (motionQuery.matches) drawStatic()
        else draw(performance.now())
      })
      observer.observe(canvas)
    }

    const onVisibilityChange = () => {
      if (document.hidden) stop()
      else start()
    }
    const onMotionChange = () => {
      if (motionQuery.matches) stop()
      else start()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    motionQuery.addEventListener('change', onMotionChange)

    return () => {
      stop()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      motionQuery.removeEventListener('change', onMotionChange)
    }
  }, [nodeCount])

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />
}
