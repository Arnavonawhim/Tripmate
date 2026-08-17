import type { Metadata } from "next"
import Link from "next/link"
import { ContactForm } from "@/components/contact/contact-form"
import { Reveal } from "@/components/motion/reveal"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Custom itineraries, private departures and availability — send the Tripmate team a note.",
}

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-32 pb-24 sm:px-8 sm:pt-40 sm:pb-32">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
        <Reveal>
          <p className="eyebrow text-ink-300">Get in touch</p>
          <h1 className="mt-3 font-display text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1] font-light tracking-[-0.035em] text-brand-900">
            Tell us where you&rsquo;re thinking of going
          </h1>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-ink-500">
            Custom dates, private departures, or a route we don&rsquo;t list
            yet — all fair game. One working day for a reply, usually less.
          </p>

          <dl className="mt-12 space-y-6 border-t border-sand-300 pt-8">
            <div>
              <dt className="eyebrow text-ink-300">Faster still</dt>
              <dd className="mt-2 text-[0.95rem] text-ink-700">
                <Link href="/chat" className="link-underline text-brand-700">
                  Ask the assistant
                </Link>{" "}
                — it answers logistics questions instantly.
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-300">Group size</dt>
              <dd className="mt-2 text-[0.95rem] text-ink-700">
                Twelve is our cap. Larger parties need a private departure.
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  )
}
