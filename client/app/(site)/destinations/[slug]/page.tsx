import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Star } from "lucide-react"
import { PLACES, getPlace } from "@/lib/places"
import { Reveal, RevealLines, Stagger, StaggerItem } from "@/components/motion/reveal"
import { DestinationCard } from "@/components/destinations/destination-card"

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const place = getPlace(slug)
  if (!place) return { title: "Destination not found" }

  return {
    title: place.name,
    description: place.description,
    openGraph: { images: [place.image] },
  }
}

export default async function PlacePage({ params }: Params) {
  const { slug } = await params
  const place = getPlace(slug)

  // The legacy page rendered "Destination not found" inline; a real 404 is the
  // correct equivalent now that these are routes rather than query params.
  if (!place) notFound()

  const others = PLACES.filter((p) => p.slug !== place.slug)

  return (
    <article>
      {/* ============================ HERO ============================ */}
      <header className="relative isolate flex min-h-[78svh] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={place.image}
            alt={`${place.name}, ${place.region}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/50 to-brand-950/40" />
        </div>

        <div className="mx-auto w-full max-w-[1240px] px-5 pt-32 pb-14 sm:px-8 sm:pb-20">
          <Link
            href="/destinations"
            className="group inline-flex items-center gap-2 text-[0.82rem] text-sand-100/70 transition-colors hover:text-sand-200"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-x-1" />
            All destinations
          </Link>

          <p className="eyebrow mt-8 text-sand-200/75">{place.region}</p>

          <h1 className="mt-3 font-display text-[clamp(3rem,10vw,7.5rem)] leading-[0.9] font-light tracking-[-0.045em] text-sand-100">
            <RevealLines lines={[place.name]} />
          </h1>

          <Reveal delay={0.25} y={14}>
            <p className="mt-5 max-w-lg font-display text-xl leading-snug text-sand-200 italic">
              {place.tagline}
            </p>
          </Reveal>

          <Reveal delay={0.35} y={14}>
            <dl className="tnum mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-sand-100/20 pt-6 text-sand-100/85">
              <div>
                <dt className="eyebrow text-sand-100/45">Length</dt>
                <dd className="mt-1 text-[0.95rem]">{place.days}</dd>
              </div>
              <div>
                <dt className="eyebrow text-sand-100/45">Best window</dt>
                <dd className="mt-1 text-[0.95rem]">{place.best}</dd>
              </div>
              <div>
                <dt className="eyebrow text-sand-100/45">Rating</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-[0.95rem]">
                  <Star className="h-3.5 w-3.5 fill-sand-200 text-sand-200" />
                  {place.rating}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-sand-100/45">From</dt>
                <dd className="mt-1 text-[0.95rem]">${place.price} pp</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </header>

      {/* ============================ BODY ============================ */}
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr] lg:gap-24">
          <div>
            <Reveal>
              <p className="font-display text-[clamp(1.4rem,2.6vw,1.95rem)] leading-[1.35] font-light tracking-[-0.02em] text-brand-900">
                {place.description}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="eyebrow mt-16 text-ink-300">What you&rsquo;ll do</h2>
              <ul className="mt-6">
                {place.highlights.map((highlight, i) => (
                  <li
                    key={highlight}
                    className="group flex items-baseline gap-6 border-t border-sand-300 py-5 last:border-b"
                  >
                    <span className="tnum font-display text-sm text-sand-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[1.05rem] text-ink-900 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* --------------------- booking rail --------------------- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Reveal delay={0.15}>
              <div className="rounded-[4px] border border-sand-300 bg-paper p-7">
                <p className="eyebrow text-ink-300">Good to know</p>

                <dl className="mt-5 space-y-4">
                  {place.facts.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex items-baseline justify-between gap-4 border-b border-sand-300/70 pb-3 last:border-0 last:pb-0"
                    >
                      <dt className="shrink-0 text-[0.8rem] text-ink-300">
                        {fact.label}
                      </dt>
                      <dd className="text-right text-[0.88rem] text-ink-900">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-7 flex items-baseline justify-between border-t border-sand-300 pt-5">
                  <span className="text-sm text-ink-500">From</span>
                  <span className="tnum font-display text-3xl tracking-[-0.03em] text-brand-900">
                    ${place.price}
                    <span className="ml-1 font-sans text-xs text-ink-300">
                      / person
                    </span>
                  </span>
                </div>

                <Link
                  href={`/book/${place.slug}`}
                  className="group mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-4 text-sm font-medium text-sand-100 transition-all duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-brand-800 active:translate-y-0"
                >
                  Book this trip
                  <ArrowRight className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/chat"
                  className="mt-3 block text-center text-[0.82rem] text-ink-500 transition-colors hover:text-brand-700"
                >
                  <span className="link-underline">
                    Ask the assistant about {place.name}
                  </span>
                </Link>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>

      {/* ============================ MORE ============================ */}
      <section className="border-t border-sand-300 bg-sand-50">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
          <Reveal>
            <h2 className="font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-light tracking-[-0.03em] text-brand-900">
              The other three
            </h2>
          </Reveal>

          <Stagger className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <StaggerItem key={other.slug}>
                <DestinationCard
                  place={other}
                  index={PLACES.findIndex((p) => p.slug === other.slug)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </article>
  )
}
