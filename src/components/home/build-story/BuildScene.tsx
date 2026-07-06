'use client'

/**
 * BuildScene — the Build Story's single continuous scroll-scrubbed SVG.
 *
 * One drawing of the same modular extension as HeroAssembly (identical
 * geometry, palette and 2px white-mortar stroke system — the site reads as
 * one hand), retold slowly across five phase windows of a 0→1 progress
 * MotionValue (each phase owns a fifth, scenes crossfade ~0.03 either side):
 *
 *   1 Concept    0.00–0.20  blueprint: grid, outlines draw, dims, tape arc,
 *                           survey pins drop
 *   2 Design     0.20–0.40  ghost fills at low opacity, door/window slide
 *                           along the wall, swatch chips cycle, roof morphs
 *   3 Build      0.40–0.60  modules slide in from off-canvas and settle with
 *                           overshoot, gantry trolley tracks each landing,
 *                           mortar seams snap on
 *   4 Interior   0.60–0.80  facade dims to a cutaway; plaster wash sweeps,
 *                           downlights glow on one by one, planks lay
 *                           left→right, sockets pop
 *   5 Completion 0.80–1.00  facade returns with glazing, exterior downlights,
 *                           glass shine sweep, the brand tick, soft glow and
 *                           a restrained block confetti
 *
 * Every element is driven by useTransform ranges of the (spring-smoothed)
 * progress value — nothing is time-based; the user owns the animation.
 *
 * Isometric system (viewBox 800×600, same as HeroAssembly):
 *   ground point P(a, b) = (400 + 56a − 56b, 480 − 28a − 28b), height = −y.
 */

import { motion, useTransform, type MotionValue } from 'motion/react'
import { useId } from 'react'
import type { ReactNode } from 'react'

/* ————————————————— Palette (brand tokens only, 16 colours) ————————————————— */

const C = {
  seam: '#ffffff', // white mortar seams (2px)
  glass: '#c9d6de',
  glassSide: '#b7c5cf',
  green: '#96c11f', // brand-500
  greenLight: '#adcf2f', // brand-400
  blueprint: '#c5df5b', // brand-300 — blueprint line work
  ink950: '#1e1f1d',
  ink900: '#2b2b2b',
  ink800: '#333333',
  ink700: '#444546',
  inkPanel: '#3d3e40',
  ink600: '#58595b',
  ink500: '#6d7167',
  ink400: '#8a8e83',
  ink300: '#b0b4a9',
  ink200: '#d3d6cd',
  ink100: '#e8eae4',
} as const

/* ————————————————— Scrub helpers ————————————————— */

type MV = MotionValue<number>
/** [inputs, outputs] keyframe pair over global progress. */
type Range = [number[], number[]]

const HOLD: Range = [[0, 1], [1, 1]]
const STILL: Range = [[0, 1], [0, 0]]

type LayerProps = {
  p: MV
  /** opacity keyframes */
  o?: Range
  /** x-translate keyframes */
  x?: Range
  /** y-translate keyframes */
  y?: Range
  children: ReactNode
}

/** A scroll-scrubbed <g>: opacity / x / y each mapped from global progress. */
function Layer({ p, o = HOLD, x = STILL, y = STILL, children }: LayerProps) {
  const opacity = useTransform(p, o[0], o[1])
  const tx = useTransform(p, x[0], x[1])
  const ty = useTransform(p, y[0], y[1])
  return <motion.g style={{ opacity, x: tx, y: ty }}>{children}</motion.g>
}

type DrawProps = {
  p: MV
  /** [start, end] of the pathLength 0→1 draw */
  range: [number, number]
  d: string
  stroke: string
  width?: number
  /** extra opacity keyframes multiplied on top of the draw fade-in */
  o?: Range
}

/** Self-drawing stroke (pathLength scrub) — the blueprint pen. */
function Draw({ p, range, d, stroke, width = 2, o }: DrawProps) {
  const pathLength = useTransform(p, range, [0, 1])
  const opacity = useTransform(p, o?.[0] ?? [range[0], range[0] + 0.008], o?.[1] ?? [0, 1])
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pathLength, opacity }}
    />
  )
}

/* ————————————————— Static geometry (shared with HeroAssembly) ————————————————— */

// Extension box faces
const FACE_FRONT = '400,480 120,340 120,202 400,342' // a=0 plane (front-left)
const FACE_SIDE = '400,480 568,396 568,258 400,342' // b=0 plane (front-right)
const ROOF_DECK = '400,326 568,242 288,102 120,186'
const ROOF_FASCIA_L = '400,342 120,202 120,186 400,326'
const ROOF_FASCIA_R = '400,342 568,258 568,242 400,326'

// Wall modules (identical to HeroAssembly)
const WALL_GREEN = '400,480 288,424 288,286 400,342'
const WALL_LIME = '288,424 204,382 204,244 288,286'
const WALL_GREY = '204,382 120,340 120,202 204,244'
const WALL_SIDE_A = '400,480 484,438 484,300 400,342'
const WALL_SIDE_B = '484,438 568,396 568,258 484,300'

// Slab
const SLAB_FRONT_L = '400,505 98,354 98,340 400,491'
const SLAB_FRONT_R = '400,505 590,410 590,396 400,491'
const SLAB_TOP = '400,491 590,396 288,245 98,340'

// Existing house silhouette
const HOUSE_L = '120,340 14,287 14,107 120,160'
const HOUSE_R = '120,340 288,256 288,76 120,160'
const HOUSE_ROOF = '120,160 14,107 182,23 288,76'
const HOUSE_WINDOW = '92,236 47,214 47,154 92,176'

// Interior (seen through the dimmed front face during phase 4)
const INNER_WALL = '568,396 288,256 288,118 568,258' // inner face of the a=3 wall
const FLOOR_PLANKS: string[] = [
  // laid left→right (high b → low b), parallelograms on the slab plane
  '120,340 288,256 335,279 167,363',
  '167,363 335,279 381,303 213,387',
  '213,387 381,303 428,326 260,410',
  '260,410 428,326 475,349 307,433',
  '307,433 475,349 521,373 353,457',
  '353,457 521,373 568,396 400,480',
]
// Wall-washer downlights across the inner wall (b = 4 → 1), placed below the
// lifted roof line so each glow-on reads clearly
const INNER_LIGHTS: [number, number][] = [
  [344, 204],
  [400, 232],
  [456, 260],
  [512, 288],
]

// Survey pins land on the slab's three visible corners
const PINS: [number, number][] = [
  [98, 340],
  [288, 245],
  [590, 396],
]

// Design-phase swatch chips (screen-space, top-left)
const SWATCHES = [C.green, C.greenLight, C.ink600, C.glass]

// Confetti of angled blocks (≤12, restrained)
const CONFETTI: { x: number; y: number; fill: string; r: number }[] = [
  { x: 168, y: 96, fill: C.green, r: -14 },
  { x: 258, y: 62, fill: C.ink200, r: 10 },
  { x: 356, y: 84, fill: C.greenLight, r: -8 },
  { x: 452, y: 58, fill: C.seam, r: 14 },
  { x: 546, y: 92, fill: C.green, r: -12 },
  { x: 634, y: 70, fill: C.blueprint, r: 8 },
  { x: 210, y: 148, fill: C.seam, r: 12 },
  { x: 480, y: 132, fill: C.ink200, r: -10 },
  { x: 590, y: 158, fill: C.greenLight, r: 12 },
  { x: 682, y: 128, fill: C.green, r: -8 },
]

// Gantry trolley tracks each module landing during the build phase
const GANTRY_T = [0.42, 0.445, 0.465, 0.49, 0.51, 0.535, 0.555]
const GANTRY_X = [540, 340, 470, 250, 500, 180, 390]
const GANTRY_HOOK = [150, 300, 210, 330, 240, 350, 170]

/* ————————————————— Sub-scenes ————————————————— */

/** One survey pin: pole, head, brand flag — drops in with a tiny settle. */
function SurveyPin({ p, at, range }: { p: MV; at: [number, number]; range: [number, number] }) {
  const [x, y] = at
  const [a, b] = range
  return (
    <Layer p={p} o={[[a, a + 0.012], [0, 1]]} y={[[a, b - 0.006, b], [-34, 3, 0]]}>
      <line x1={x} y1={y} x2={x} y2={y - 22} stroke={C.seam} strokeWidth="2" strokeLinecap="round" />
      <circle cx={x} cy={y - 24} r="3.5" fill={C.seam} />
      <polygon points={`${x},${y - 24} ${x + 16},${y - 20} ${x},${y - 15}`} fill={C.green} />
    </Layer>
  )
}

/** One interior wall-washer: lamp, glow, cone down the wall, floor pool. */
function WallWasher({
  p,
  at,
  range,
}: {
  p: MV
  at: [number, number]
  range: [number, number]
}) {
  const [x, y] = at
  return (
    <Layer p={p} o={[[range[0], range[1]], [0, 1]]}>
      <polygon
        points={`${x - 3},${y + 4} ${x + 3},${y + 4} ${x + 15},${y + 80} ${x - 15},${y + 80}`}
        fill={C.ink100}
        opacity="0.12"
      />
      <circle cx={x} cy={y} r="8" fill={C.greenLight} opacity="0.3" />
      <circle cx={x} cy={y} r="2.5" fill={C.seam} />
      <ellipse cx={x - 34} cy={y + 148} rx="26" ry="9" fill={C.ink100} opacity="0.08" />
    </Layer>
  )
}

/** One flooring plank laying into place. */
function Plank({ p, points, i }: { p: MV; points: string; i: number }) {
  const a = 0.652 + i * 0.017
  const b = a + 0.026
  return (
    <Layer p={p} o={[[a, b], [0, 1]]} y={[[a, b], [-12, 0]]}>
      <polygon
        points={points}
        fill={i % 2 === 0 ? C.ink200 : C.ink100}
        stroke={C.ink300}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </Layer>
  )
}

/* ————————————————— The scene ————————————————— */

export type BuildSceneProps = {
  /** Global scroll progress 0→1 across the whole Build Story track. */
  progress: MV
  /** Accessible name override — e.g. a per-phase label for the
   *  reduced-motion static frames. */
  label?: string
  className?: string
}

export function BuildScene({ progress, label, className }: BuildSceneProps) {
  const p = progress
  const uid = useId()

  // Phase-4 "step inside" — a gentle push-in on the whole drawing.
  const zoom = useTransform(p, [0.6, 0.65, 0.78, 0.83], [1, 1.05, 1.05, 1])

  // Design-phase selector stepping across the swatch chips.
  const swatchX = useTransform(
    p,
    [0.255, 0.272, 0.278, 0.295, 0.301, 0.318, 0.324, 0.34],
    [0, 0, 52, 52, 104, 104, 156, 156],
  )

  // Build-phase gantry trolley + hook cable.
  const trolleyX = useTransform(p, GANTRY_T, GANTRY_X)
  const hookY = useTransform(p, GANTRY_T, GANTRY_HOOK)

  // Interior plaster wash sweeping across the inner wall (clip width).
  const plasterW = useTransform(p, [0.625, 0.7], [0, 292])

  // Completion glass-shine sweep across the glazed bay.
  const shineX = useTransform(p, [0.86, 0.93], [-26, 26])

  return (
    <svg
      viewBox="0 0 800 600"
      role="img"
      aria-label={
        label ??
        'Continuous illustration of a modular extension moving from blueprint concept through design, factory build and interior fit-out to completion'
      }
      className={className ?? 'h-auto w-full'}
    >
      <title>The EazyBase build, phase by phase</title>

      <defs>
        <pattern id={`${uid}-grid`} width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M44 0H0V44" fill="none" stroke={C.seam} strokeWidth="1" opacity="0.07" />
        </pattern>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.32" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-plaster`}>
          <motion.rect x="288" y="100" width={plasterW} height="310" />
        </clipPath>
      </defs>

      {/* ————— Blueprint grid: strong in Concept, a faint memory after ————— */}
      <Layer p={p} o={[[0, 0.03, 0.18, 0.26], [0, 0.9, 0.9, 0.25]]}>
        <rect x="0" y="0" width="800" height="600" fill={`url(#${uid}-grid)`} />
      </Layer>

      {/* ————— Completion glow, behind the build ————— */}
      <Layer p={p} o={[[0.82, 0.92], [0, 1]]}>
        <ellipse cx="380" cy="330" rx="330" ry="230" fill={`url(#${uid}-glow)`} />
      </Layer>

      <motion.g style={{ scale: zoom, transformOrigin: '400px 340px' }}>
        {/* ————— Existing house: blueprint strokes → solid, once designed ————— */}
        <Layer p={p} o={[[0.19, 0.235], [1, 0]]}>
          <Draw p={p} range={[0.015, 0.055]} d={`M${HOUSE_L.split(' ').join(' L')} Z`} stroke={C.ink500} />
          <Draw p={p} range={[0.03, 0.07]} d={`M${HOUSE_R.split(' ').join(' L')} Z`} stroke={C.ink500} />
          <Draw p={p} range={[0.045, 0.085]} d={`M${HOUSE_ROOF.split(' ').join(' L')} Z`} stroke={C.ink500} />
          <Draw p={p} range={[0.06, 0.09]} d={`M${HOUSE_WINDOW.split(' ').join(' L')} Z`} stroke={C.ink500} width={1.5} />
        </Layer>
        <Layer p={p} o={[[0.19, 0.235], [0, 1]]}>
          <polygon points={HOUSE_L} fill={C.ink900} stroke={C.ink700} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={HOUSE_R} fill={C.ink800} stroke={C.ink700} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={HOUSE_ROOF} fill={C.inkPanel} stroke={C.ink700} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={HOUSE_WINDOW} fill="#4a5258" stroke={C.ink600} strokeWidth="2" strokeLinejoin="round" />
        </Layer>

        {/* ————— Soft long shadow, arrives with the real build ————— */}
        <Layer p={p} o={[[0.405, 0.46], [0, 1]]}>
          <ellipse cx="320" cy="497" rx="300" ry="42" fill="#000000" opacity="0.35" />
          <polygon points="400,486 590,400 706,438 520,522" fill="#000000" opacity="0.16" />
        </Layer>

        {/* ═════════ PHASE 1 · CONCEPT — the blueprint draws itself ═════════ */}
        <Layer p={p} o={[[0.2, 0.25], [1, 0]]}>
          {/* slab + box outlines, drawn in sequence */}
          <Draw p={p} range={[0.025, 0.075]} d="M98,340 L400,491 L590,396 L288,245 Z" stroke={C.blueprint} />
          <Draw p={p} range={[0.045, 0.085]} d="M98,340 L98,354 L400,505 L590,410 L590,396 M400,505 L400,491" stroke={C.blueprint} />
          <Draw p={p} range={[0.06, 0.11]} d="M400,480 L120,340 L120,202 L400,342 Z" stroke={C.blueprint} />
          <Draw p={p} range={[0.075, 0.125]} d="M400,480 L568,396 L568,258 L400,342 Z" stroke={C.blueprint} />
          <Draw p={p} range={[0.09, 0.14]} d="M400,326 L120,186 L288,102 L568,242 Z M400,342 L400,326 M120,202 L120,186 M568,258 L568,242" stroke={C.blueprint} />

          {/* dimension lines + labels */}
          <Layer p={p} o={[[0.1, 0.13], [0, 1]]}>
            <g stroke={C.ink300} strokeWidth="1.5" strokeDasharray="5 5">
              <line x1="92" y1="367" x2="394" y2="518" />
              <line x1="406" y1="517" x2="596" y2="422" />
              <line x1="580" y1="396" x2="580" y2="258" />
            </g>
            <g stroke={C.ink300} strokeWidth="1.5">
              <line x1="88" y1="359" x2="96" y2="375" />
              <line x1="390" y1="510" x2="398" y2="526" />
              <line x1="402" y1="509" x2="410" y2="525" />
              <line x1="592" y1="414" x2="600" y2="430" />
              <line x1="573" y1="396" x2="587" y2="396" />
              <line x1="573" y1="258" x2="587" y2="258" />
            </g>
            <g fill={C.ink300} fontFamily="var(--font-montserrat), sans-serif" fontSize="15" fontWeight="600">
              <text x="228" y="436" transform="rotate(26.6 228 436)">6.9 m</text>
              <text x="486" y="462" transform="rotate(-26.6 486 462)">3.8 m</text>
              <text x="594" y="330" transform="rotate(90 594 330)">2.9 m</text>
            </g>
          </Layer>

          {/* tape-measure arc over the roof */}
          <Layer p={p} o={[[0.125, 0.155], [0, 1]]}>
            <path d="M580,250 A 176 176 0 0 0 424,96" fill="none" stroke={C.blueprint} strokeWidth="1.5" strokeDasharray="4 7" opacity="0.8" />
            <path d="M430,106 L421,94 L436,92" fill="none" stroke={C.blueprint} strokeWidth="1.5" strokeLinecap="round" />
          </Layer>

          {/* survey pins drop onto the slab corners */}
          <SurveyPin p={p} at={PINS[0]} range={[0.08, 0.105]} />
          <SurveyPin p={p} at={PINS[1]} range={[0.1, 0.125]} />
          <SurveyPin p={p} at={PINS[2]} range={[0.12, 0.145]} />
        </Layer>

        {/* ═════════ PHASE 2 · DESIGN — ghost fills, options tried on ═════════ */}
        <Layer p={p} o={[[0.195, 0.24, 0.41, 0.47], [0, 1, 1, 0]]}>
          <g fillOpacity="0.32" stroke={C.blueprint} strokeWidth="1.5" strokeLinejoin="round" strokeOpacity="0.55">
            <polygon points={SLAB_TOP} fill={C.ink700} />
            <polygon points={SLAB_FRONT_L} fill={C.ink900} />
            <polygon points={SLAB_FRONT_R} fill={C.ink900} />
            <polygon points={FACE_FRONT} fill={C.green} />
            <polygon points={FACE_SIDE} fill={C.ink800} />
            <polygon points={ROOF_FASCIA_L} fill={C.ink900} />
            <polygon points={ROOF_FASCIA_R} fill={C.ink900} />
            <polygon points={ROOF_DECK} fill={C.ink100} />
          </g>

          {/* door option slides along the front wall and settles */}
          <Layer
            p={p}
            o={[[0.24, 0.265, 0.375, 0.4], [0, 1, 1, 0]]}
            x={[[0.24, 0.3, 0.315], [-84, 6, 0]]}
            y={[[0.24, 0.3, 0.315], [-42, 3, 0]]}
          >
            <polygon points="369,465 319,439 319,339 369,365" fill={C.glass} fillOpacity="0.28" stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
            <circle cx="326" cy="402" r="2.5" fill={C.seam} />
          </Layer>

          {/* window option slides the other way */}
          <Layer
            p={p}
            o={[[0.27, 0.295, 0.375, 0.4], [0, 1, 1, 0]]}
            x={[[0.27, 0.325, 0.34], [67, -5, 0]]}
            y={[[0.27, 0.325, 0.34], [34, -2, 0]]}
          >
            <polygon points="271,376 221,350 221,280 271,306" fill={C.glass} fillOpacity="0.28" stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
            <line x1="246" y1="363" x2="246" y2="293" stroke={C.seam} strokeWidth="1.5" />
          </Layer>

          {/* pitched roof option — considered, then rejected */}
          <Layer p={p} o={[[0.285, 0.305, 0.335, 0.36], [0, 1, 1, 0]]}>
            <path
              d="M400,326 L484,204 L568,242 M484,204 L204,64 M204,64 L120,186 M204,64 L288,102"
              fill="none"
              stroke={C.blueprint}
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
          </Layer>
          {/* …the flat roof pulses as the settled choice */}
          <Layer p={p} o={[[0.35, 0.37, 0.395], [0, 1, 0.35]]}>
            <polygon points={ROOF_DECK} fill="none" stroke={C.blueprint} strokeWidth="2.5" strokeLinejoin="round" />
          </Layer>
        </Layer>

        {/* swatch chips (screen-space UI, design phase only) */}
        <Layer p={p} o={[[0.22, 0.25, 0.375, 0.4], [0, 1, 1, 0]]}>
          {SWATCHES.map((fill, i) => (
            <polygon
              key={fill}
              points={`${56 + i * 52},64 ${96 + i * 52},64 ${88 + i * 52},88 ${48 + i * 52},88`}
              fill={fill}
              stroke={C.ink700}
              strokeWidth="1"
            />
          ))}
          <motion.polygon
            points="52,60 100,60 92,92 44,92"
            fill="none"
            stroke={C.seam}
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ x: swatchX }}
          />
        </Layer>

        {/* ═════════ PHASE 3 · BUILD — modules land (drawn under the interior
             layer is the slab; walls + roof render above it further down) ═════ */}

        {/* 1 · foundation slab rises */}
        <Layer p={p} o={[[0.405, 0.428], [0, 1]]} y={[[0.405, 0.437, 0.447], [70, -5, 0]]}>
          <polygon points={SLAB_FRONT_L} fill={C.ink900} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={SLAB_FRONT_R} fill={C.ink900} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={SLAB_TOP} fill={C.ink700} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
        </Layer>

        {/* ═════════ PHASE 4 · INTERIOR — painted before the walls so the
             dimmed facade becomes a cutaway veil over it ═════════ */}
        <Layer p={p} o={[[0.615, 0.655, 0.785, 0.822], [0, 1, 1, 0]]}>
          {/* bare inner wall… */}
          <polygon points={INNER_WALL} fill={C.ink700} stroke={C.ink600} strokeWidth="1.5" strokeLinejoin="round" />
          {/* …that the plaster wash sweeps across */}
          <g clipPath={`url(#${uid}-plaster)`}>
            <polygon points={INNER_WALL} fill={C.ink100} opacity="0.85" stroke={C.ink200} strokeWidth="1.5" strokeLinejoin="round" />
          </g>

          {/* flooring planks lay left→right */}
          {FLOOR_PLANKS.map((points, i) => (
            <Plank key={points} p={p} points={points} i={i} />
          ))}

          {/* downlights glow on one by one, washing the plastered wall */}
          <WallWasher p={p} at={INNER_LIGHTS[0]} range={[0.665, 0.685]} />
          <WallWasher p={p} at={INNER_LIGHTS[1]} range={[0.685, 0.705]} />
          <WallWasher p={p} at={INNER_LIGHTS[2]} range={[0.705, 0.725]} />
          <WallWasher p={p} at={INNER_LIGHTS[3]} range={[0.725, 0.745]} />

          {/* socket + switch details pop */}
          <Layer p={p} o={[[0.748, 0.772], [0, 1]]} y={[[0.748, 0.772], [4, 0]]}>
            <polygon points="506,346 518,340 518,331 506,337" fill={C.seam} opacity="0.9" />
            <polygon points="468,327 480,321 480,312 468,318" fill={C.seam} opacity="0.9" />
            <polygon points="536,310 546,305 546,294 536,299" fill={C.seam} opacity="0.9" />
          </Layer>
        </Layer>

        {/* walls + roof — the front face dims to 13% during Interior */}
        <Layer p={p} o={[[0.605, 0.65, 0.788, 0.835], [1, 0.13, 0.13, 1]]}>
          <Layer p={p} o={[[0.435, 0.455], [0, 1]]} x={[[0.435, 0.468, 0.478], [-280, 8, 0]]}>
            <polygon points={WALL_GREEN} fill={C.green} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          </Layer>
          <Layer p={p} o={[[0.46, 0.48], [0, 1]]} x={[[0.46, 0.492, 0.502], [-240, 7, 0]]}>
            <polygon points={WALL_LIME} fill={C.greenLight} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          </Layer>
          <Layer p={p} o={[[0.485, 0.505], [0, 1]]} x={[[0.485, 0.517, 0.527], [-220, 6, 0]]}>
            <polygon points={WALL_GREY} fill={C.ink600} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          </Layer>
        </Layer>

        {/* side walls dim with the front face during Interior — a true
            cutaway, so the sockets, wall-washers and right-hand planks
            behind them read */}
        <Layer p={p} o={[[0.605, 0.65, 0.788, 0.835], [1, 0.13, 0.13, 1]]}>
          <Layer p={p} o={[[0.45, 0.47], [0, 1]]} x={[[0.45, 0.482, 0.492], [260, -7, 0]]}>
            <polygon points={WALL_SIDE_A} fill={C.ink800} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          </Layer>
          <Layer p={p} o={[[0.475, 0.495], [0, 1]]} x={[[0.475, 0.507, 0.517], [240, -6, 0]]}>
            <polygon points={WALL_SIDE_B} fill={C.inkPanel} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          </Layer>
        </Layer>

        {/* roof lowers on last — and lifts like a lid for the Interior
            cutaway before settling back for Completion. Lift is −90px so the
            deck's back vertex (y=102) stays inside the viewBox (y≥12) instead
            of being hard-cropped at the canvas edge. */}
        <Layer
          p={p}
          o={[[0.53, 0.55], [0, 1]]}
          y={[[0.53, 0.567, 0.578, 0.605, 0.655, 0.782, 0.835], [-160, 6, 0, 0, -90, -90, 0]]}
        >
          <polygon points={ROOF_FASCIA_L} fill={C.ink900} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={ROOF_FASCIA_R} fill={C.ink900} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={ROOF_DECK} fill={C.ink100} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
        </Layer>

        {/* mortar course lines snap on across the finished shell — and dim
            with their walls through the Interior cutaway so no bright seams
            float over the planks */}
        <Layer p={p} o={[[0.565, 0.575, 0.605, 0.65, 0.788, 0.835], [0, 1, 1, 0.13, 0.13, 1]]}>
          <g stroke={C.seam} strokeWidth="1.5" opacity="0.55">
            <line x1="400" y1="411" x2="120" y2="271" />
            <line x1="400" y1="446" x2="288" y2="390" />
            <line x1="400" y1="411" x2="568" y2="327" />
            <line x1="484" y1="369" x2="568" y2="327" transform="translate(0,35)" />
          </g>
        </Layer>

        {/* factory gantry hint above (build phase only) */}
        <Layer p={p} o={[[0.4, 0.425, 0.575, 0.6], [0, 1, 1, 0]]}>
          <line x1="140" y1="12" x2="140" y2="34" stroke={C.ink600} strokeWidth="4" />
          <line x1="660" y1="12" x2="660" y2="34" stroke={C.ink600} strokeWidth="4" />
          <rect x="120" y="34" width="560" height="9" fill={C.ink800} stroke={C.ink600} strokeWidth="1.5" />
          <motion.g style={{ x: trolleyX }}>
            <rect x="-14" y="43" width="28" height="12" rx="2" fill={C.ink600} stroke={C.ink400} strokeWidth="1" />
            <motion.line x1={0} y1={55} x2={0} y2={hookY} stroke={C.ink400} strokeWidth="1.5" />
            <motion.g style={{ y: hookY }}>
              <path d="M0,0 c 0,7 -8,7 -8,1" fill="none" stroke={C.ink400} strokeWidth="2" strokeLinecap="round" />
            </motion.g>
          </motion.g>
        </Layer>

        {/* ═════════ PHASE 5 · COMPLETION — full facade + delights ═════════ */}
        <Layer p={p} o={[[0.795, 0.85], [0, 1]]}>
          {/* door */}
          <polygon points="369,465 319,439 319,339 369,365" fill="#2e3233" stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="326" cy="402" r="2.5" fill={C.seam} />
          {/* window on the lime module */}
          <polygon points="271,376 221,350 221,280 271,306" fill={C.glass} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <line x1="246" y1="363" x2="246" y2="293" stroke={C.seam} strokeWidth="1.5" />
          {/* full-height glazed bay */}
          <polygon points="196,370 128,336 128,219 196,253" fill={C.glass} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <line x1="173" y1="359" x2="173" y2="242" stroke={C.seam} strokeWidth="1.5" />
          <line x1="151" y1="347" x2="151" y2="230" stroke={C.seam} strokeWidth="1.5" />
          {/* side window + roof light */}
          <polygon points="506,382 546,362 546,297 506,317" fill={C.glassSide} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <polygon points="372,256 428,228 344,186 288,214" fill={C.glass} stroke={C.seam} strokeWidth="2" strokeLinejoin="round" />
          <line x1="400" y1="242" x2="316" y2="200" stroke={C.seam} strokeWidth="1.5" />

          {/* glass reflections sweep across the bay */}
          <motion.g style={{ x: shineX }}>
            <Layer p={p} o={[[0.86, 0.88, 0.91, 0.93], [0, 0.55, 0.55, 0]]}>
              <line x1="146" y1="316" x2="168" y2="270" stroke={C.seam} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="156" y1="330" x2="184" y2="272" stroke={C.seam} strokeWidth="1.5" strokeLinecap="round" />
            </Layer>
          </motion.g>
        </Layer>

        {/* exterior downlights glow on in sequence — the finale is a
            variation on the hero's ending, not a repeat: four lights (the
            hero has three, all at once) sweeping side face → far corner */}
        {([
          [470, 292, 0.815],
          [330, 313, 0.84],
          [260, 278, 0.862],
          [190, 243, 0.884],
        ] as const).map(([x, y, t]) => (
          <Layer key={x} p={p} o={[[t, t + 0.02], [0, 1]]}>
            <circle cx={x} cy={y} r="9" fill={C.greenLight} opacity="0.35" />
            <circle cx={x} cy={y} r="2.5" fill={C.seam} />
          </Layer>
        ))}
      </motion.g>

      {/* ————— The brand tick sweeps (echoes the logo checkmark) —————
          Deliberately NOT the hero's tick (M596 356 → 706 302, 10px): this
          one is larger, higher and swept further right so the story's payoff
          reads as its own beat rather than a literal repeat of the hero. */}
      <Draw
        p={p}
        range={[0.885, 0.945]}
        d="M572 336 L628 388 L734 260"
        stroke={C.green}
        width={12}
        o={[[0.885, 0.895], [0, 1]]}
      />

      {/* ————— Restrained confetti of angled blocks ————— */}
      {CONFETTI.map(({ x, y, fill, r }, i) => {
        const start = 0.875 + (i % 5) * 0.008
        return (
          <Layer
            key={`${x}-${y}`}
            p={p}
            o={[[start, start + 0.03, 0.97, 1], [0, 0.85, 0.85, 0]]}
            y={[[start, 1], [-22, 26]]}
          >
            <polygon
              points={`${x},${y} ${x + 16},${y} ${x + 11},${y + 11} ${x - 5},${y + 11}`}
              fill={fill}
              transform={`rotate(${r} ${x + 6} ${y + 6})`}
            />
          </Layer>
        )
      })}
    </svg>
  )
}

export default BuildScene
