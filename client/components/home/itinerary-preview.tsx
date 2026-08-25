"use client"

import { motion, useReducedMotion } from "motion/react"

/**
 * A sample of the itinerary Tripmate produces. Deliberately read-only — this
 * is an illustration of the output, not a booking surface.
 */

const DAYS = [
  {
    day: "Day 01",
    place: "Leh",
    title: "Land, then do nothing",
    detail:
      "3,500 m hits harder than people expect. Slow walk to the old bazaar, early night, litres of water.",
  },
  {
    day: "Day 02",
    place: "Leh · Thiksey",
    title: "Morning prayers at the monastery",
    detail:
      "Arrive by 6:40 for the chant. Back for lunch, afternoon free while your body catches up.",
  },
  {
    day: "Day 03",
    place: "Nubra",
    title: "Over Khardung La",
    detail:
      "Five hours with stops. Dunes at golden hour, and the pass is clear this week.",
  },
]

export function ItineraryPreview() {
  const reduce = useReducedMotion()

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow text-ink-300">What comes back</p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.04] font-light tracking-[-0.035em] text-brand-900">
            A day-by-day that{" "}
            <em className="font-normal text-brand-600 italic">
              accounts for altitude
            </em>
          </h2>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-ink-500">
            Not a list of sights. An order of operations — what the body needs
            first, what the weather allows, what is worth getting up for.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-sand-200 px-4 py-1.5 text-[0.75rem] font-medium text-brand-800">
            Sample itinerary · Ladakh, six days
          </p>
        </div>

        <ol className="relative">
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[7px] w-px bg-sand-300"
          />

          {DAYS.map((entry, i) => (
            <motion.li
              key={entry.day}
              initial={{ opacity: 0, y: reduce ? 0 : 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -15% 0px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative pb-10 pl-10 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-2 left-0 h-[15px] w-[15px] rounded-full border-2 border-sand-300 bg-paper"
              />
              <p className="eyebrow text-ink-300">
                {entry.day} &middot; {entry.place}
              </p>
              <h3 className="mt-2 font-display text-[1.45rem] tracking-[-0.02em] text-brand-900">
                {entry.title}
              </h3>
              <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-ink-500">
                {entry.detail}
              </p>
            </motion.li>
          ))}

          <li className="relative pl-10">
            <span
              aria-hidden="true"
              className="absolute top-2 left-0 h-[15px] w-[15px] rounded-full border-2 border-dashed border-sand-400 bg-paper"
            />
            <p className="text-sm text-ink-300">
              …and three more days, adjusted as you talk it through.
            </p>
          </li>
        </ol>
      </div>
    </section>
  )
}
