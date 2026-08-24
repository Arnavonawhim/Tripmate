{/*import type { Metadata } from "next"
import { ChatShell } from "@/components/chat/chat-shell"
import { Reveal } from "@/components/motion/reveal"

export const metadata: Metadata = {
  title: "Travel assistant",
  description:
    "Ask about routes, altitude, budgets and timing. Several language models answer at once and the strongest reply wins.",
}

export default function ChatPage() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-32 pb-24 sm:px-8 sm:pt-40 sm:pb-28">
      <Reveal>
        <p className="eyebrow text-ink-300">The assistant</p>
        <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1] font-light tracking-[-0.035em] text-brand-900">
          Ask several models,{" "}
          <em className="font-normal text-brand-600 italic">get one answer</em>
        </h1>
      </Reveal>

      <div className="mt-12">
        <ChatShell />
      </div>
    </section>
  )
}
  */}
  import type { Metadata } from "next"
import { ChatShell } from "@/components/chat/chat-shell"
import { Reveal } from "@/components/motion/reveal"

export const metadata: Metadata = {
  title: "Assistant",
  description:
    "Ask about routes, altitude, budgets and timing — or put the guide in the room with you and point your camera at what you're looking at.",
}

export default function ChatPage() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-28 pb-12 sm:px-8 sm:pt-32 sm:pb-16">
      <Reveal>
        <p className="eyebrow text-ink-300">The assistant</p>
        <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1] font-light tracking-[-0.035em] text-brand-900">
          Talk it through,{" "}
          <em className="font-normal text-brand-600 italic">or look around</em>
        </h1>
      </Reveal>

      <div className="mt-8">
      <ChatShell />
     </div>
    </section>
  )
}
