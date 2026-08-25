"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

/**
 * AR section. The gateway has scene/vision endpoints, but there is no shipped
 * AR view yet — so this is presented honestly as a preview of the intended
 * experience rather than a working feature. No link is offered that would
 * imply otherwise.
 */
export function ArPreview() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["-6%", "6%"]
  )

  return (
    <section
      ref={ref}
      className="dark grain relative isolate overflow-hidden bg-brand-950 text-sand-100"
    >
      <div className="relative z-10 mx-auto grid max-w-[1240px] gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <p className="eyebrow text-sand-200/60">Experience</p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.04] font-light tracking-[-0.035em] text-sand-100">
            See more than a picture.
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-sand-100/70">
            Stand in the valley before you book the flight. Point your camera at
            a street, a menu, a peak on the horizon — and get the name, the
            story and the translation back in place.
          </p>

          <ul className="mt-9 space-y-3">
            {[
              "Landmarks identified from the live camera",
              "Signs and menus read and translated in frame",
              "Route context anchored to what you are looking at",
            ].map((line) => (
              <li
                key={line}
                className="flex items-baseline gap-3 border-t border-sand-100/12 pt-3 text-[0.92rem] text-sand-100/75"
              >
                <span className="text-sand-200/50">&#10022;</span>
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-9 inline-flex items-center gap-2 rounded-full border border-sand-100/25 px-4 py-1.5 text-[0.75rem] text-sand-100/60">
            In development — preview of the intended experience
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="relative aspect-4/5 overflow-hidden rounded-[4px] border border-sand-100/15 sm:aspect-4/3 lg:aspect-4/5">
            <motion.div style={{ y: imageY }} className="absolute inset-[-6%]">
              <Image
                src="/assets/ladakh.jpg"
                alt="A turquoise high-altitude lake below bare Ladakhi ranges"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
              />
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/75 via-transparent to-brand-950/25" />

            {/* mocked AR overlay — decorative, not a live readout */}
            <div aria-hidden="true" className="absolute inset-0 p-5 sm:p-7">
              <span className="absolute top-6 left-6 h-8 w-8 border-t border-l border-sand-200/70" />
              <span className="absolute top-6 right-6 h-8 w-8 border-t border-r border-sand-200/70" />
              <span className="absolute bottom-6 left-6 h-8 w-8 border-b border-l border-sand-200/70" />
              <span className="absolute right-6 bottom-6 h-8 w-8 border-r border-b border-sand-200/70" />

              <div className="absolute top-1/3 left-1/2 w-[min(17rem,72%)] -translate-x-1/2 rounded-[4px] border border-sand-100/20 bg-brand-950/70 p-4 backdrop-blur-md">
                <p className="eyebrow text-sand-200/70">Identified</p>
                <p className="mt-1.5 font-display text-lg text-sand-100">
                  Pangong Tso
                </p>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-sand-100/60">
                  4,350 m · 134 km long · two-thirds of it across the border
                </p>
              </div>

              <span className="absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full bg-sand-200/90 px-3.5 py-1 text-[0.7rem] font-medium text-brand-900">
                AR preview
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
