"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"

const STEPS = [
  { word: "Discover", note: "Places you had not thought of" },
  { word: "Understand", note: "What a trip is actually like" },
  { word: "Decide", note: "Narrowed to what fits you" },
  { word: "Plan", note: "A day-by-day that holds up" },
  { word: "Experience", note: "Walk it before you fly" },
  { word: "Travel", note: "Go" },
]

function Step({
  word,
  note,
  index,
  total,
  progress,
  reduce,
}: {
  word: string
  note: string
  index: number
  total: number
  progress: MotionValue<number>
  reduce: boolean
}) {
  const seg = 1 / total
  const at = index * seg

  // Offsets are clamped into [0,1]: Framer promotes these to the native
  // scroll timeline, and WAAPI rejects keyframe offsets outside that range.
  const enter = Math.max(0, at - seg * 0.6)
  const settled = Math.min(1, Math.max(enter + 0.0001, at + seg * 0.35))

  // Each line lifts out of the page as the rail scrolls past it.
  const opacity = useTransform(progress, [enter, settled], [0.16, 1])
  const x = useTransform(
    progress,
    [enter, settled],
    reduce ? ["0%", "0%"] : ["-2%", "0%"]
  )

  return (
    <motion.li
      style={{ opacity, x }}
      className="group flex flex-col gap-1 border-t border-sand-300 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
    >
      <span className="flex items-baseline gap-5">
        <span className="tnum font-display text-sm text-sand-400">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-display text-[clamp(1.9rem,5.5vw,3.5rem)] leading-none font-light tracking-[-0.04em] text-brand-900">
          {word}
        </span>
      </span>
      <span className="pl-10 text-sm text-ink-500 sm:max-w-[24ch] sm:pl-0 sm:text-right">
        {note}
      </span>
    </motion.li>
  )
}

export function JourneyRail() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  })

  return (
    <section
      ref={ref}
      className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32"
    >
      <p className="eyebrow text-ink-300">The whole arc</p>
      <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.04] font-light tracking-[-0.035em] text-brand-900">
        Six steps, one thread —{" "}
        <em className="font-normal text-brand-600 italic">
          question to departure
        </em>
      </h2>

      <ul className="mt-14 border-b border-sand-300">
        {STEPS.map((step, i) => (
          <Step
            key={step.word}
            word={step.word}
            note={step.note}
            index={i}
            total={STEPS.length}
            progress={scrollYProgress}
            reduce={!!reduce}
          />
        ))}
      </ul>

      <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/chat"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-8 py-4 text-sm font-medium text-sand-100 transition-all duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-brand-800 active:translate-y-0"
        >
          Plan with Tripmate
          <ArrowRight className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
        </Link>
        <p className="text-sm text-ink-500">
          Starts as a conversation. No forms, no dates required yet.
        </p>
      </div>
    </section>
  )
}
