import type { Metadata } from "next"
import {
  DestinationSearchProvider,
  DestinationSearchField,
  DestinationResults,
} from "@/components/destinations/destination-browser"
import { Reveal } from "@/components/motion/reveal"

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Four small-group routes: Ladakh, the Himalayan peaks of Uttarakhand, the Andaman islands and the Kerala backwaters.",
}

export default function DestinationsPage() {
  return (
    <DestinationSearchProvider>
      <section className="mx-auto max-w-[1240px] px-5 pt-36 pb-24 sm:px-8 sm:pt-44 sm:pb-32">
        <Reveal>
          <p className="eyebrow text-ink-300">The full list</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.98] font-light tracking-[-0.04em] text-brand-900">
            Four routes we&rsquo;d go back to{" "}
            <em className="font-normal text-brand-600 italic">ourselves</em>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col gap-6 border-b border-sand-300 pb-10 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-[0.95rem] leading-relaxed text-ink-500">
              Mountains, coast and backwater. Every card opens a full itinerary,
              or use the small button for the shortcut straight to booking.
            </p>
            <DestinationSearchField className="w-full md:max-w-sm" />
          </div>
        </Reveal>

        <div className="mt-14">
          <DestinationResults />
        </div>
      </section>
    </DestinationSearchProvider>
  )
}
