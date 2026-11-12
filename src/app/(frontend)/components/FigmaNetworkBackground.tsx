'use client'

import { useEffect, useRef } from 'react'

type Point = {
  x: number
  y: number
  radius?: number
}

const points: Point[] = [
  { x: 356, y: -18 },
  { x: 548, y: 54 },
  { x: 401, y: 187 },
  { x: 500, y: 215 },
  { x: 637, y: 315, radius: 4 },
  { x: 555, y: 356 },
  { x: 575, y: 466, radius: 4 },
  { x: 666, y: 465 },
  { x: 652, y: 495 },
  { x: 431, y: 699 },
  { x: 193, y: 810 },
  { x: 269, y: 842 },
  { x: 418, y: 900 },
  { x: 770, y: 212 },
  { x: 870, y: 246 },
  { x: 958, y: 115 },
  { x: 954, y: 183 },
  { x: 1021, y: 216 },
  { x: 1086, y: 39 },
  { x: 1245, y: 158 },
  { x: 1362, y: 236 },
  { x: 1416, y: 66, radius: 4 },
  { x: 1471, y: 192, radius: 4 },
  { x: 1444, y: 304 },
  { x: 1482, y: 304 },
  { x: 1537, y: 451 },
  { x: 1021, y: 324 },
  { x: 1154, y: 325 },
  { x: 1254, y: 372 },
  { x: 1149, y: 438 },
  { x: 1298, y: 480 },
  { x: 1226, y: 594 },
  { x: 1199, y: 645 },
  { x: 707, y: 366 },
  { x: 984, y: 402 },
  { x: 975, y: 548 },
  { x: 781, y: 609 },
  { x: 882, y: 613 },
  { x: 843, y: 765 },
  { x: 805, y: 816 },
  { x: 757, y: 790 },
  { x: 1067, y: 810 },
  { x: 1185, y: 845, radius: 4 },
  { x: 1519, y: 830 },
  { x: 1534, y: 738 },
  { x: 1434, y: 745 },
  { x: 1553, y: 883 },
  { x: 865, y: 904 },
  { x: 662, y: 920 },
  { x: 1590, y: 313 },
  { x: 1608, y: 597 },
]

const links: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [1, 13],
  [2, 3],
  [2, 4],
  [2, 5],
  [3, 4],
  [3, 5],
  [3, 13],
  [4, 5],
  [4, 6],
  [4, 7],
  [4, 13],
  [4, 14],
  [4, 33],
  [5, 6],
  [5, 7],
  [5, 8],
  [6, 7],
  [6, 8],
  [6, 9],
  [6, 33],
  [6, 36],
  [7, 8],
  [7, 33],
  [8, 9],
  [8, 36],
  [9, 10],
  [9, 11],
  [9, 36],
  [10, 11],
  [10, 12],
  [11, 12],
  [13, 14],
  [13, 15],
  [13, 16],
  [14, 16],
  [14, 17],
  [14, 26],
  [14, 33],
  [14, 34],
  [15, 16],
  [15, 18],
  [16, 17],
  [16, 18],
  [16, 26],
  [17, 18],
  [17, 19],
  [17, 26],
  [17, 27],
  [18, 19],
  [19, 20],
  [19, 21],
  [19, 26],
  [19, 27],
  [20, 21],
  [20, 22],
  [20, 23],
  [20, 27],
  [20, 28],
  [21, 22],
  [22, 23],
  [22, 24],
  [22, 49],
  [23, 24],
  [23, 25],
  [23, 28],
  [24, 25],
  [24, 49],
  [25, 28],
  [25, 30],
  [25, 49],
  [25, 50],
  [26, 27],
  [26, 29],
  [26, 34],
  [26, 35],
  [27, 28],
  [27, 29],
  [28, 29],
  [28, 30],
  [29, 30],
  [29, 32],
  [29, 35],
  [30, 31],
  [30, 32],
  [31, 32],
  [32, 35],
  [32, 42],
  [33, 34],
  [33, 36],
  [34, 35],
  [34, 37],
  [35, 36],
  [35, 37],
  [36, 37],
  [36, 38],
  [36, 40],
  [37, 38],
  [37, 39],
  [38, 39],
  [38, 40],
  [38, 41],
  [39, 40],
  [39, 47],
  [40, 41],
  [40, 48],
  [41, 42],
  [42, 32],
  [42, 35],
  [43, 44],
  [43, 45],
  [43, 46],
  [44, 45],
  [44, 50],
  [45, 46],
  [45, 50],
]

const distantPoints: Point[] = [
  { x: 492, y: 52 },
  { x: 402, y: 321 },
  { x: 734, y: 299 },
  { x: 791, y: 408 },
  { x: 576, y: 593 },
  { x: 635, y: 652 },
  { x: 678, y: 772 },
  { x: 537, y: 866 },
  { x: 899, y: 464 },
  { x: 1012, y: 705 },
  { x: 1131, y: 484 },
  { x: 1140, y: 718 },
  { x: 1347, y: 107 },
  { x: 1426, y: 492 },
  { x: 1456, y: 709 },
  { x: 1572, y: 681 },
]

const distantLinks: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 4],
  [2, 3],
  [2, 8],
  [3, 8],
  [4, 5],
  [4, 7],
  [5, 6],
  [6, 7],
  [6, 9],
  [8, 9],
  [8, 10],
  [9, 11],
  [10, 11],
  [10, 13],
  [12, 13],
  [13, 14],
  [13, 15],
  [14, 15],
]

function drift(index: number, time: number) {
  const speed = 0.0003975 + (index % 5) * 0.000024
  const phase = index * 1.731
  return {
    x: Math.sin(time * speed + phase) * (5 + (index % 4) * 1.4),
    y: Math.cos(time * speed * 0.83 + phase * 0.71) * (4 + (index % 3) * 1.6),
  }
}

export function FigmaNetworkBackground() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lines = [...svg.querySelectorAll<SVGLineElement>('[data-link]')]
    const nodes = [...svg.querySelectorAll<SVGCircleElement>('[data-node]')]
    let frame = 0

    const animate = (time: number) => {
      const moved = points.map((point, index) => {
        const offset = drift(index, time)
        return { x: point.x + offset.x, y: point.y + offset.y }
      })

      lines.forEach((line, index) => {
        const [from, to] = links[index]
        line.setAttribute('x1', String(moved[from].x))
        line.setAttribute('y1', String(moved[from].y))
        line.setAttribute('x2', String(moved[to].x))
        line.setAttribute('y2', String(moved[to].y))
      })

      nodes.forEach((node, index) => {
        node.setAttribute('cx', String(moved[index].x))
        node.setAttribute('cy', String(moved[index].y))
      })

      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="network-background" aria-hidden="true">
      <div className="pastel-wash" />
      <svg
        ref={svgRef}
        className="network-svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <filter id="node-glow" x="-350%" y="-350%" width="800%" height="800%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="soft-focus" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.1" />
          </filter>
          <linearGradient id="line-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity=".5" />
            <stop offset=".48" stopColor="white" stopOpacity=".82" />
            <stop offset="1" stopColor="white" stopOpacity=".62" />
          </linearGradient>
        </defs>

        <g className="distant-network" filter="url(#soft-focus)">
          {distantLinks.map(([from, to], index) => (
            <line
              key={`d-line-${index}`}
              x1={distantPoints[from].x}
              y1={distantPoints[from].y}
              x2={distantPoints[to].x}
              y2={distantPoints[to].y}
            />
          ))}
          {distantPoints.map((point, index) => (
            <circle key={`d-node-${index}`} cx={point.x} cy={point.y} r="4.6" />
          ))}
        </g>

        <g className="primary-lines">
          {links.map(([from, to], index) => (
            <line
              key={`line-${index}`}
              data-link
              x1={points[from].x}
              y1={points[from].y}
              x2={points[to].x}
              y2={points[to].y}
            />
          ))}
        </g>
        <g className="primary-nodes" filter="url(#node-glow)">
          {points.map((point, index) => (
            <circle
              key={`node-${index}`}
              data-node
              cx={point.x}
              cy={point.y}
              r={point.radius ?? 3}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
