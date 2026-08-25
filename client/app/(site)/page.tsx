import { Stagger, StaggerItem, Reveal } from "@/components/motion/reveal"
import { HomeHero } from "@/components/home/hero"
import { CinematicSection } from "@/components/home/cinematic-section"
import { ItineraryPreview } from "@/components/home/itinerary-preview"
import { ArPreview } from "@/components/home/ar-preview"
import { JourneyRail } from "@/components/home/journey-rail"

const PIPELINE = [
  {
    label: "Your preferences",
    detail: "Interests, budget, mood, season, how long, how you like to move.",
  },
  {
    label: "Tripmate AI",
    detail: "Several models read the brief in parallel; the strongest reply wins.",
  },
  {
    label: "Destination recommendations",
    detail: "Three or four places that actually fit — with the reasoning shown.",
  },
  {
    label: "Personalized itinerary",
    detail: "A day-by-day you can argue with, reorder and keep refining.",
  },
]

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* ========================== DISCOVERY ==========================
          One image held steady across three beats — only the words change. */}
      <CinematicSection
        id="discover"
        eyebrow="N° 01 — Discover"
        stages={[
          {
            image: "/assets/hero.jpg",
            alt: "Low cloud moving through a deep green Himalayan valley",
            heading: "Not sure where to go?",
            body: "Most trips start the same way: a blank map, forty open tabs, and a feeling you are missing the good version.",
          },
          {
            heading: "Tell Tripmate what you're looking for.",
            body: "Plain sentences work best. “Ten days in March, cold is fine, I want to walk more than I drive, and I am not made of money.”",
          },
          {
            heading: "It reads the brief, not the keywords.",
            body: "Interests, budget, mood, season, duration and travel style all pull on the answer at once.",
          },
        ]}
      />

      {/* ===================== DESTINATION DISCOVERY =====================
          Here the image changes with each beat, crossfading slowly. */}
      <CinematicSection
        eyebrow="N° 02 — Understand"
        stages={[
          {
            image: "/assets/ladakh.jpg",
            alt: "A turquoise high-altitude lake below bare Ladakhi ranges",
            heading: "Find places that match your vibe.",
            body: "High, dry and quiet. Passes that open late and close early, and lakes the colour of glass.",
          },
          {
            image: "/assets/beach.jpg",
            alt: "Aerial view of palms on a white sandbar in turquoise water",
            heading: "Or the exact opposite.",
            body: "Reef, sandbar, nothing on the schedule before eleven. The same brief, pointed somewhere warmer.",
          },
          {
            image: "/assets/backwaters.jpg",
            alt: "A canoe moving down a palm-lined Keralan canal",
            heading: "Somewhere slower, at four knots.",
            body: "Village life on both banks, a boat instead of a bus, and the monsoon tail keeping the crowds away.",
          },
        ]}
      />

      {/* ========================= AI PLANNING ========================= */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <p className="eyebrow text-ink-300">N&deg; 03 — Decide</p>
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.04] font-light tracking-[-0.035em] text-brand-900">
            How a sentence becomes{" "}
            <em className="font-normal text-brand-600 italic">an itinerary</em>
          </h2>
        </Reveal>

        <Stagger className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step, i) => (
            <StaggerItem key={step.label} className="relative">
              <div className="flex items-center gap-3">
                <span className="tnum font-display text-sm text-sand-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-gradient-to-r from-sand-300 to-transparent"
                />
              </div>
              <h3 className="mt-4 font-display text-[1.35rem] leading-tight tracking-[-0.02em] text-brand-900">
                {step.label}
              </h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-500">
                {step.detail}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ========================== ITINERARY ========================== */}
      <ItineraryPreview />

      {/* ============================== AR ============================== */}
      <ArPreview />

      {/* ======================== FINAL JOURNEY ======================== */}
      <JourneyRail />
    </>
  )
}
