{/*import type { Metadata } from "next"
import { ConsoleShell } from "@/components/console/console-shell"

export const metadata: Metadata = {
  title: "Gateway console",
  description:
    "Consensus routing, live token streaming, scene intelligence and per-model telemetry for the Tripmate gateway.",
}

export default function ConsolePage() {
  return (
    <section className="dark grain relative isolate min-h-screen bg-brand-950 text-sand-100">
      <div className="relative z-10 mx-auto max-w-[1240px] px-5 pt-32 pb-24 sm:px-8 sm:pt-40 sm:pb-32">
        <p className="eyebrow text-sand-100/40">
          N&deg; 03 — Multi-model gateway
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1] font-light tracking-[-0.035em] text-sand-100">
          Ask once.{" "}
          <em className="font-normal text-sand-200 italic">
            Every model answers.
          </em>
        </h1>
        <p className="mt-5 max-w-lg leading-relaxed text-sand-100/60">
          The operator view: fan a prompt across the fleet, watch tokens land in
          real time, read a scene from a photograph, and see which model is
          actually winning.
        </p>

        <div className="mt-12">
          <ConsoleShell />
        </div>
      </div>
    </section>
  )
}
*/}
import type { Metadata } from "next"
import { ConsoleShell } from "@/components/console/console-shell"

export const metadata: Metadata = {
  title: "Telemetry",
  description:
    "Per-model win rate, latency and agreement for the Tripmate multi-model gateway.",
}

export default function ConsolePage() {
  return (
    <section className="dark grain relative isolate min-h-screen bg-brand-950 text-sand-100">
      <div className="relative z-10 mx-auto max-w-[1240px] px-5 pt-32 pb-24 sm:px-8 sm:pt-40 sm:pb-32">
        <p className="eyebrow text-sand-100/40">Telemetry</p>
        <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1] font-light tracking-[-0.035em] text-sand-100">
          Which model{" "}
          <em className="font-normal text-sand-200 italic">actually wins.</em>
        </h1>

        <div className="mt-12">
          <ConsoleShell />
        </div>
      </div>
    </section>
  )
}