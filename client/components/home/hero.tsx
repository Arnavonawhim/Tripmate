"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { RevealLines, Reveal } from "@/components/motion/reveal"

/**
 * Homepage hero. Uses the existing mountain photograph as the primary
 * background, with a slow scroll-linked settle rather than a looping pan so
 * the frame stays visually stable while the copy lands.
 */
export function HomeHero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["0%", "12%"]
  )
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [1.04, 1.12]
  )
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden"
    >
      <motion.div
        style={{ y: imageY, scale: imageScale }}
        className="absolute inset-0 -z-10 will-change-transform"
      >
        <Image
          src="/assets/mountain.jpg"
          alt="First light catching the summit of a snow-covered Himalayan peak"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Graded scrim. mountain.jpg is bright where the copy sits — a pale
            dawn sky and lit snow — so the wash is heavier on the left column
            than the site's other heroes need, while leaving the summit glow
            legible on the right. */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/72 to-brand-950/48" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-950/45 to-transparent" />
      </motion.div>

      <motion.div
        style={{ opacity: copyOpacity }}
        className="mx-auto w-full max-w-[1240px] px-5 pt-32 pb-20 sm:px-8 sm:pb-28"
      >
        <RevealLines
          className="eyebrow text-sand-200/75"
          lines={["Tripmate — AI trip planner"]}
        />

        <h1 className="mt-6 max-w-[13ch] font-display text-[clamp(2.5rem,7vw,5.4rem)] leading-[0.96] font-light tracking-[-0.045em] text-sand-100">
          <RevealLines
            delay={0.14}
            lines={[
              "Your journey",
              "starts with",
              <em key="q" className="font-normal text-sand-200 italic">
                a question.
              </em>,
            ]}
          />
        </h1>

        <Reveal delay={0.62} y={16}>
          <p className="mt-7 max-w-lg text-[1.05rem] leading-relaxed text-sand-100/80">
            Tell it where your head is at — a season, a budget, a mood. Tripmate
            works out where that points, and builds the trip around it.
          </p>
        </Reveal>

        <Reveal delay={0.76} y={16}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 rounded-full bg-sand-200 px-7 py-3.5 text-sm font-medium text-brand-900 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Explore with AI
              <ArrowRight className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
            </Link>

            <a
              href="#discover"
              className="inline-flex items-center rounded-full border border-sand-100/25 px-7 py-3.5 text-sm text-sand-100/80 transition-colors hover:border-sand-200 hover:text-sand-200"
            >
              See how it works
            </a>
          </div>
        </Reveal>
      </motion.div>

      <motion.span
        style={{ opacity: copyOpacity }}
        aria-hidden="true"
        className="pointer-events-none absolute right-5 bottom-8 hidden items-center gap-3 sm:right-8 sm:flex"
      >
        <span className="eyebrow text-sand-100/40">Scroll</span>
        <span className="h-px w-14 bg-gradient-to-r from-sand-100/40 to-transparent" />
      </motion.span>
    </section>
  )
}
