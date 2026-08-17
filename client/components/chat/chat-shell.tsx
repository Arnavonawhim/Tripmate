"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUp, Gauge, Layers, Square, Zap } from "lucide-react"
import { useChat, type ChatMessage, type ChatMode } from "@/lib/hooks/use-chat"
import { cn } from "@/lib/utils"

const MODES: {
  key: ChatMode
  label: string
  hint: string
  icon: React.ElementType
}[] = [
  {
    key: "consensus",
    label: "Consensus",
    hint: "Several models answer, the best reply wins",
    icon: Layers,
  },
  {
    key: "stream",
    label: "Stream",
    hint: "Tokens as they arrive, live over SSE",
    icon: Zap,
  },
  {
    key: "telemetry",
    label: "Telemetry",
    hint: "Win rate and latency per model",
    icon: Gauge,
  },
]

const CHIPS = [
  "Plan a 6-day Ladakh trip",
  "Best beaches in November?",
  "Budget for Kerala backwaters",
  "What do I pack for 5,000m?",
]

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-50"
          animate={{ opacity: [0.25, 0.9, 0.25], y: [0, -2, 0] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  )
}

function StatsTable({ stats }: { stats: NonNullable<ChatMessage["stats"]> }) {
  if (!stats.length) return null

  return (
    <div className="mt-3 -mx-1 overflow-x-auto">
      <table className="tnum w-full min-w-[22rem] text-left text-[0.78rem]">
        <thead>
          <tr className="text-ink-300">
            <th className="pb-2 font-medium">Model</th>
            <th className="pb-2 font-medium">Calls</th>
            <th className="pb-2 font-medium">Wins</th>
            <th className="pb-2 font-medium">Win rate</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.model} className="border-t border-sand-300/60">
              <td className="py-2 pr-3 text-ink-900">{s.model}</td>
              <td className="py-2 pr-3 text-ink-500">{s.calls}</td>
              <td className="py-2 pr-3 text-ink-500">{s.wins}</td>
              <td className="py-2">
                <span className="flex items-center gap-2">
                  <span className="h-1 w-14 overflow-hidden rounded-full bg-sand-300">
                    <span
                      className="block h-full rounded-full bg-brand-700"
                      style={{
                        width: `${Math.min(100, Math.round(s.win_rate * 100))}%`,
                      }}
                    />
                  </span>
                  <span className="text-ink-700">
                    {Math.round(s.win_rate * 100)}%
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const reduce = useReducedMotion()
  const isUser = message.role === "user"
  const empty = !message.text && message.streaming

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[min(42rem,88%)] rounded-[4px] px-5 py-4 text-[0.95rem] leading-relaxed",
          isUser
            ? "bg-brand-700 text-sand-100"
            : message.error
              ? "border border-rust/25 bg-rust/5 text-rust"
              : "border border-sand-300 bg-paper text-ink-900"
        )}
      >
        {!isUser && message.meta?.chosen && (
          <p className="eyebrow mb-2 flex flex-wrap items-center gap-2 text-ink-300">
            <span>{message.meta.chosen}</span>
            {message.meta.cached && (
              <span className="rounded-full bg-sand-200 px-2 py-0.5 text-brand-800">
                cached
              </span>
            )}
          </p>
        )}

        {empty ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap">
            {message.text}
            {message.streaming && <span className="caret ml-0.5" />}
          </p>
        )}

        {message.stats && <StatsTable stats={message.stats} />}
      </div>
    </motion.div>
  )
}

export function ChatShell() {
  const [mode, setMode] = useState<ChatMode>("consensus")
  const [input, setInput] = useState("")
  const { messages, pending, send, stop } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    })
  }, [messages, reduce])

  function submit(e: FormEvent) {
    e.preventDefault()
    const text = input
    setInput("")
    void send(text, mode)
  }

  const activeMode = MODES.find((m) => m.key === mode)!

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
      {/* --------------------------- mode rail --------------------------- */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="eyebrow text-ink-300">Mode</h2>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
          {MODES.map((m) => {
            const active = m.key === mode
            const Icon = m.icon
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                aria-pressed={active}
                className={cn(
                  "group relative shrink-0 rounded-[4px] border px-4 py-3 text-left transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] lg:w-full",
                  active
                    ? "border-brand-700 bg-brand-700 text-sand-100"
                    : "border-sand-300 bg-paper text-ink-700 hover:border-brand-300 hover:bg-sand-50"
                )}
              >
                <span className="flex items-center gap-2 text-[0.9rem] font-medium">
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </span>
                <span
                  className={cn(
                    "mt-1 hidden text-[0.72rem] leading-snug lg:block",
                    active ? "text-sand-100/65" : "text-ink-300"
                  )}
                >
                  {m.hint}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-6 hidden border-t border-sand-300 pt-4 text-[0.75rem] leading-relaxed text-ink-300 lg:block">
          Needs the router running on{" "}
          <code className="text-ink-500">:8000</code>. Consensus and Telemetry
          hit the router directly; Stream opens an SSE connection.
        </p>
      </aside>

      {/* ----------------------------- thread ----------------------------- */}
      <div className="flex min-h-[clamp(30rem,72svh,50rem)] flex-col overflow-hidden rounded-[4px] border border-sand-300 bg-sand-50">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-7"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col justify-center py-10">
              <motion.div
                initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="eyebrow text-ink-300">{activeMode.label} mode</p>
                <p className="mt-3 max-w-md font-display text-[clamp(1.6rem,3.5vw,2.25rem)] leading-[1.1] font-light tracking-[-0.03em] text-brand-900">
                  Ask the thing you&rsquo;d ask a friend who&rsquo;s been.
                </p>
                <p className="mt-3 max-w-sm text-[0.9rem] leading-relaxed text-ink-500">
                  Route logistics, altitude, what the weather actually does in
                  March, whether a trip is worth the flight.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {CHIPS.map((chip, i) => (
                    <motion.button
                      key={chip}
                      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.15 + i * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      onClick={() => void send(chip, mode)}
                      className="rounded-full border border-sand-300 bg-paper px-4 py-2 text-[0.83rem] text-ink-700 transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-700"
                    >
                      {chip}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <Bubble key={m.id} message={m} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* --------------------------- composer --------------------------- */}
        <form
          onSubmit={submit}
          className="border-t border-sand-300 bg-paper p-3 sm:p-4"
        >
          <div className="flex items-end gap-2 rounded-[4px] border border-sand-300 bg-sand-50 py-2 pr-2 pl-4 transition-colors duration-300 focus-within:border-brand-700">
            <label htmlFor="chat-input" className="sr-only">
              Message the travel assistant
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask in ${activeMode.label.toLowerCase()} mode…`}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[0.95rem] text-ink-900 outline-none placeholder:text-ink-300"
            />

            {pending && mode === "stream" ? (
              <button
                type="button"
                onClick={stop}
                className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-sand-300 px-4 text-[0.82rem] text-ink-700 transition-colors hover:border-rust hover:text-rust"
              >
                <Square className="h-3 w-3 fill-current" />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || pending}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sand-100 transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
