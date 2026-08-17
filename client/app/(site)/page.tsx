import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MessageSquare, ScanEye } from "lucide-react"
import {
  DestinationSearchProvider,
  DestinationSearchField,
  DestinationResults,
} from "@/components/destinations/destination-browser"
import { Reveal, RevealLines, Stagger, StaggerItem } from "@/components/motion/reveal"
import { Marquee } from "@/components/marquee"

const PROOF = [
  { value: "120+", label: "Trips run since 2019" },
  { value: "4.8", label: "Average rating across routes" },
  { value: "12", label: "People per departure, hard cap" },
]

export default function HomePage() {
  return (
    <DestinationSearchProvider>
      {/* ============================ HERO ============================ */}
      <section className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/assets/hero.jpg"
            alt="Cloud sitting low in a green Himalayan valley at first light"
            fill
            priority
            sizes="100vw"
            className="slow-pan object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/55 to-brand-950/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/70 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-[1240px] px-5 pt-32 pb-14 sm:px-8 sm:pb-20">
          <RevealLines
            className="eyebrow text-sand-200/80"
            lines={["Small-group travel · India"]}
          />

          <h1 className="mt-6 font-display text-[clamp(2.9rem,8.5vw,6.5rem)] leading-[0.94] font-light tracking-[-0.04em] text-sand-100">
            <RevealLines
              delay={0.15}
              lines={[
                "Four routes.",
                "Twelve seats.",
                <em key="3" className="font-normal text-sand-200 italic">
                  Zero guesswork.
                </em>,
              ]}
            />
          </h1>

          <Reveal delay={0.6} y={16}>
            <p className="mt-7 max-w-lg text-[1.05rem] leading-relaxed text-sand-100/80">
              Ladakh, the Himalaya, the Andamans and the Kerala backwaters — run
              with local guides who live there. Ask our assistant anything a
              brochure won&rsquo;t answer.
            </p>
          </Reveal>

          <Reveal delay={0.75} y={16}>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <DestinationSearchField
                tone="onImage"
                className="w-full max-w-md"
              />
              <Link
                href="/chat"
                className="group inline-flex shrink-0 items-center gap-2 text-[0.9rem] text-sand-100/80 transition-colors hover:text-sand-200"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="link-underline">or just ask</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee
        items={[
          "acclimatisation built into every itinerary",
          "local guides, not tour reps",
          "twelve people maximum",
          "no 5am coach transfers",
          "answers from four AI models at once",
        ]}
      />

      {/* ========================= DESTINATIONS ========================= */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div className="flex flex-col justify-between gap-6 border-b border-sand-300 pb-8 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-ink-300">N&deg; 01 — The trips</p>
              <h2 className="mt-3 max-w-xl font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.02] font-light tracking-[-0.035em] text-brand-900">
                Everything we run, all four of them
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-500">
              We&rsquo;d rather run four routes properly than forty badly. Each
              one has a details page and a booking form — the small button on
              each card gets you straight there.
            </p>
          </div>
        </Reveal>

        <div className="mt-14">
          <DestinationResults featureFirst />
        </div>
      </section>

      {/* ========================== ASSISTANT ========================== */}
      <section className="dark grain relative isolate overflow-hidden bg-brand-900 text-sand-100">
        <div className="relative z-10 mx-auto grid max-w-[1240px] gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="eyebrow text-sand-200/60">N&deg; 02 — The assistant</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.03] font-light tracking-[-0.035em] text-sand-100">
              Four models answer.{" "}
              <em className="font-normal text-sand-200 italic">
                You get the best one.
              </em>
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-sand-100/70">
              Every question goes to several language models at once. They vote
              — or a judge model picks the strongest reply. You see one answer,
              not four hedged ones.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="group inline-flex items-center gap-2 rounded-full bg-sand-200 px-6 py-3 text-sm font-medium text-brand-900 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5"
              >
                Start a conversation
                <ArrowRight className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
              </Link>
              <Link
                href="/console"
                className="inline-flex items-center gap-2 rounded-full border border-sand-100/25 px-6 py-3 text-sm text-sand-100/80 transition-colors hover:border-sand-200 hover:text-sand-200"
              >
                <ScanEye className="h-4 w-4" />
                Open the console
              </Link>
            </div>
          </Reveal>

          <Stagger className="space-y-3" delay={0.1}>
            {[
              {
                q: "Is Khardung La open in early May?",
                a: "Usually — the pass clears late April, but the Nubra side can hold snow a fortnight longer. We build a spare day into the Ladakh route for exactly this.",
              },
              {
                q: "Backwaters in September, or wait?",
                a: "Go. The monsoon tail keeps the canals full and the crowds thin. Bring a dry bag for the canoe morning.",
              },
            ].map((item) => (
              <StaggerItem
                key={item.q}
                className="rounded-[4px] border border-sand-100/12 bg-brand-950/45 p-6 backdrop-blur-sm"
              >
                <p className="text-sm font-medium text-sand-200">{item.q}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-sand-100/65">
                  {item.a}
                </p>
              </StaggerItem>
            ))}
            <StaggerItem className="pt-1">
              <p className="eyebrow text-sand-100/35">
                Sample answers · consensus mode
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ============================ PROOF ============================ */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
        <Stagger className="grid gap-10 sm:grid-cols-3">
          {PROOF.map((stat) => (
            <StaggerItem key={stat.label} className="border-t border-sand-300 pt-6">
              <p className="tnum font-display text-[clamp(2.75rem,6vw,4rem)] leading-none font-light tracking-[-0.04em] text-brand-700">
                {stat.value}
              </p>
              <p className="mt-3 max-w-[22ch] text-sm text-ink-500">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </DestinationSearchProvider>
  )
}
