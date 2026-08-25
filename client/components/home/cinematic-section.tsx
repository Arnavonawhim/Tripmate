"use client"

import { useRef } from "react"
import Image from "next/image"
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"
import { cn } from "@/lib/utils"

/**
 * Homepage-only cinematic stage.
 *
 * A tall scroll track with a sticky viewport-height frame inside it. Each
 * image owns exactly one block of copy, and the two are driven by the same
 * scroll progress so they change together.
 *
 * The transition is sequenced rather than cross-faded: a beat's copy is fully
 * out before the next beat's copy starts coming in, so two pieces of text are
 * never legible at the same time. The image dissolve is deliberately placed in
 * that gap — the picture changes while no words are on screen, which is what
 * makes the swap read as intentional instead of muddled.
 *
 * Everything is scroll-linked (no React state on scroll), so fast scrolling in
 * either direction is exactly reversible and cannot queue, jitter or flicker.
 * Motion rides the existing Lenis instance in components/providers.tsx —
 * `useScroll` reads native scroll position, which Lenis drives.
 */

export type CinematicStage = {
  /** Omit to hold the previous stage's image — that is what keeps it stable. */
  image?: string
  alt?: string
  heading: React.ReactNode
  body?: string
}

type Run = { src: string; alt: string; from: number; to: number }

/** Share of a segment spent transitioning. Also the image dissolve half-width. */
const FADE_RATIO = 0.16

/**
 * Dead zone on either side of a beat boundary where no copy is drawn at all.
 * Without it the outgoing and incoming curves meet exactly at the boundary,
 * and a frame of scroll lag can leave the previous beat at a few percent
 * opacity while the next is already rising. The gap makes "one beat at a
 * time" hold no matter how fast the wheel is spun.
 */
const GAP_RATIO = 0.1

/**
 * Keyframes for one beat's copy.
 *
 * Offsets stay inside [0,1] and never decrease — Framer promotes scroll-linked
 * transforms to the browser's native scroll timeline, and WAAPI rejects
 * keyframe offsets outside that range.
 *
 * The first beat starts already visible and the last one stays visible to the
 * end, so the section never opens or closes on empty space.
 */
function copyKeyframes(
  index: number,
  total: number,
  fade: number,
  gap: number
) {
  const seg = 1 / total
  const start = index * seg
  const end = start + seg
  const first = index === 0
  const last = index === total - 1

  const inFrom = Math.min(start + gap, end)
  const inTo = Math.min(inFrom + fade, end)
  const outTo = Math.max(end - gap, inTo)
  const outFrom = Math.max(outTo - fade, inTo)

  const input: number[] = []
  const opacity: number[] = []
  const shift: string[] = []

  // Every curve is anchored at 0 and 1. Numeric opacity gets promoted to the
  // browser's native scroll timeline, and that path does not apply Framer's
  // clamping to keyframes that stop short of the range — a curve ending at
  // 0.3 simply froze at its first value. Spanning the full range keeps the
  // accelerated path and the JS path in agreement.
  input.push(0)
  opacity.push(first ? 1 : 0)
  shift.push(first ? "0%" : "7%")

  if (!first) {
    input.push(inFrom, inTo)
    opacity.push(0, 1)
    shift.push("7%", "0%")
  }

  if (!last) {
    input.push(outFrom, outTo)
    opacity.push(1, 0)
    shift.push("0%", "-7%")
  }

  input.push(1)
  opacity.push(last ? 1 : 0)
  shift.push(last ? "0%" : "-7%")

  return { input, opacity, shift }
}

/**
 * Image dissolve, centred on the same boundary the copy hands over at — so
 * the picture changes while no words are on screen. Anchored at 0 and 1 for
 * the same reason as copyKeyframes.
 */
function imageKeyframes(from: number, to: number, fade: number) {
  const first = from <= 0.0001
  const last = to >= 0.9999

  const input: number[] = []
  const output: number[] = []

  input.push(0)
  output.push(first ? 1 : 0)

  if (!first) {
    input.push(Math.max(0.0001, from - fade), Math.min(1, from + fade))
    output.push(0, 1)
  }

  if (!last) {
    input.push(Math.max(0, to - fade), Math.min(0.9999, to + fade))
    output.push(1, 0)
  }

  input.push(1)
  output.push(last ? 1 : 0)

  return { input, output }
}

function ImageLayer({
  run,
  progress,
  fade,
  reduce,
  priority,
}: {
  run: Run
  progress: MotionValue<number>
  fade: number
  reduce: boolean
  priority: boolean
}) {
  const curve = imageKeyframes(run.from, run.to, fade)
  const opacity = useTransform(progress, curve.input, curve.output)

  // Controlled zoom: a slow settle across the layer's own run, never a pop.
  const scale = useTransform(
    progress,
    [0, Math.max(0.0001, run.from), run.to, 1],
    reduce ? [1, 1, 1, 1] : [1.06, 1.06, 1, 1]
  )

  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 will-change-[opacity,transform]"
    >
      <Image
        src={run.src}
        alt={run.alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes="100vw"
        className="object-cover"
      />
    </motion.div>
  )
}

function StageCopy({
  stage,
  index,
  total,
  progress,
  reduce,
}: {
  stage: CinematicStage
  index: number
  total: number
  progress: MotionValue<number>
  reduce: boolean
}) {
  const seg = 1 / total
  const keys = copyKeyframes(index, total, seg * FADE_RATIO, seg * GAP_RATIO)

  const opacity = useTransform(progress, keys.input, keys.opacity)
  const y = useTransform(
    progress,
    keys.input,
    reduce ? keys.shift.map(() => "0%") : keys.shift
  )

  return (
    <motion.div
      style={{ opacity, y }}
      className="pointer-events-none absolute inset-0 flex items-end will-change-[opacity,transform]"
    >
      <div className="mx-auto w-full max-w-[1240px] px-5 pt-24 pb-16 sm:px-8 sm:pb-24">
        <h2 className="max-w-[17ch] font-display text-[clamp(1.9rem,5.6vw,4.25rem)] leading-[1.04] font-light tracking-[-0.04em] text-sand-100">
          {stage.heading}
        </h2>
        {stage.body && (
          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-sand-100/70 sm:mt-5 sm:text-[1.05rem]">
            {stage.body}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export function CinematicSection({
  stages,
  eyebrow,
  className,
  priority = false,
  id,
}: {
  stages: CinematicStage[]
  eyebrow?: string
  className?: string
  priority?: boolean
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })

  const total = stages.length
  const seg = 1 / total

  // Resolve inherited images, then collapse consecutive identical sources into
  // one layer so a held image never dissolves against itself.
  const runs: Run[] = []
  let lastSrc = ""
  let lastAlt = ""
  stages.forEach((stage, i) => {
    const src = stage.image ?? lastSrc
    const alt = stage.image ? (stage.alt ?? "") : lastAlt
    const prev = runs[runs.length - 1]
    if (prev && prev.src === src) {
      prev.to = (i + 1) * seg
    } else {
      runs.push({ src, alt, from: i * seg, to: (i + 1) * seg })
    }
    lastSrc = src
    lastAlt = alt
  })

  return (
    <section
      id={id}
      ref={ref}
      className={cn("relative", className)}
      style={{ height: `${Math.max(2, total) * 100}svh` }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* image stack */}
        <div className="absolute inset-0">
          {runs.map((run, i) => (
            <ImageLayer
              key={`${run.src}-${run.from}`}
              run={run}
              progress={scrollYProgress}
              fade={seg * FADE_RATIO}
              reduce={!!reduce}
              priority={priority && i === 0}
            />
          ))}
        </div>

        {/* legibility scrim — same brand-950 wash used elsewhere on the site */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/45 to-brand-950/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/65 to-transparent" />

        {eyebrow && (
          <div className="absolute inset-x-0 top-0 mx-auto w-full max-w-[1240px] px-5 pt-28 sm:px-8 sm:pt-32">
            <p className="eyebrow text-sand-200/70">{eyebrow}</p>
          </div>
        )}

        {/* copy stack — only ever one beat legible at a time */}
        {stages.map((stage, i) => (
          <StageCopy
            key={i}
            stage={stage}
            index={i}
            total={total}
            progress={scrollYProgress}
            reduce={!!reduce}
          />
        ))}
      </div>
    </section>
  )
}
