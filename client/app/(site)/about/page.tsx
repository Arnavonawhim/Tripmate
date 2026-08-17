import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { Parallax } from "@/components/motion/parallax"

export const metadata: Metadata = {
  title: "About",
  description:
    "Tripmate runs four small-group routes across India with local guides, capped at twelve people, and a multi-model AI assistant for everything in between.",
}

const STATS = [
  { value: "120+", label: "Trips run since 2019" },
  { value: "4.8", label: "Average rating" },
  { value: "12", label: "Maximum group size" },
]

const PRINCIPLES = [
  {
    title: "Four routes, not forty",
    body: "We only sell trips we've walked ourselves. When a route stops being good, we drop it rather than discount it.",
  },
  {
    title: "Guides who live there",
    body: "Every departure is led by someone from the region — not a rep flown in for the season. They decide when the weather says turn back.",
  },
  {
    title: "Twelve people, hard cap",
    body: "Small enough to fit in one homestay, eat at one table, and change plans on the morning without a committee.",
  },
  {
    title: "Answers, not brochures",
    body: "Our assistant runs your question past several language models at once. You get the strongest answer, with the model that gave it named.",
  },
]

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-5 pt-36 pb-16 sm:px-8 sm:pt-44">
        <Reveal>
          <p className="eyebrow text-ink-300">About</p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.98] font-light tracking-[-0.04em] text-brand-900">
            Trips planned by people who{" "}
            <em className="font-normal text-brand-600 italic">
              actually went
            </em>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-8 max-w-xl text-[1.05rem] leading-relaxed text-ink-500">
            Tripmate started because the good trips were impossible to find
            behind a wall of identical listings. We run four routes across the
            subcontinent — mountains, coast and backwater — each capped at
            twelve people and built with guides who live there.
          </p>
        </Reveal>
      </section>

      <Parallax className="relative h-[45svh] sm:h-[60svh]" amount={9}>
        <div className="relative h-full w-full">
          <Image
            src="/assets/hero.jpg"
            alt="Mist moving through a green valley"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-brand-950/20" />
        </div>
      </Parallax>

      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
        <Stagger className="grid gap-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <StaggerItem key={stat.label} className="border-t border-sand-300 pt-6">
              <p className="tnum font-display text-[clamp(2.75rem,6vw,4rem)] leading-none font-light tracking-[-0.04em] text-brand-700">
                {stat.value}
              </p>
              <p className="mt-3 text-sm text-ink-500">{stat.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="border-t border-sand-300 bg-sand-50">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
          <Reveal>
            <h2 className="max-w-xl font-display text-[clamp(1.8rem,4vw,2.75rem)] leading-[1.05] font-light tracking-[-0.035em] text-brand-900">
              How we run things
            </h2>
          </Reveal>

          <Stagger className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {PRINCIPLES.map((item, i) => (
              <StaggerItem key={item.title} className="border-t border-sand-300 pt-6">
                <span className="tnum font-display text-sm text-sand-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl tracking-[-0.02em] text-brand-900">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-500">
                  {item.body}
                </p>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <div className="mt-16 flex flex-wrap gap-3">
              <Link
                href="/destinations"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-sm font-medium text-sand-100 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5"
              >
                See the four routes
                <ArrowRight className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-sand-300 px-6 py-3.5 text-sm text-ink-700 transition-colors hover:border-brand-700 hover:text-brand-700"
              >
                Ask about a private departure
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
