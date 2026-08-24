"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowUp,
  Check,
  ChevronDown,
  Layers,
  MessageSquare,
  Square,
  View,
  Zap,
} from "lucide-react"
import { useChat, type ChatMessage, type ChatMode } from "@/lib/hooks/use-chat"
import { ArStage } from "@/components/chat/ar-stage"
import { cn } from "@/lib/utils"

type SurfaceKey = "chat" | "ar"

{/*const SURFACES: {
  key: SurfaceKey
  label: string
  icon: React.ElementType
}[] = [
  { key: "chat", label: "Chat mode", icon: MessageSquare },
  { key: "ar", label: "AR mode", icon: View },
]*/}
const SURFACES: {
  key: SurfaceKey
  label: string
  hint: string
  icon: React.ElementType
}[] = [
  {
    key: "chat",
    label: "Chat mode",
    hint: "Type it out — quick answer or deep thinking",
    icon: MessageSquare,
  },
  {
    key: "ar",
    label: "AR mode",
    hint: "Video call the guide, or place it in your scene",
    icon: View,
  },
]

const CHAT_MODES: {
  key: ChatMode
  label: string
  hint: string
  icon: React.ElementType
}[] = [
  {
    key: "stream",
    label: "Quick answer",
    hint: "Tokens as they arrive, live over SSE",
    icon: Zap,
  },
  {
    key: "consensus",
    label: "Deep thinking",
    hint: "Several models answer, the best reply wins",
    icon: Layers,
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
      </div>
    </motion.div>
  )
}

/** GPT-style mode picker that lives inside the composer. */
function ModePicker({
  mode,
  setMode,
}: {
  mode: ChatMode
  setMode: (m: ChatMode) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = CHAT_MODES.find((m) => m.key === mode)!
  const ActiveIcon = active.icon

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-sand-300 bg-paper py-1.5 pr-2 pl-3 text-[0.8rem] text-ink-700 transition-colors duration-300 hover:border-brand-400 hover:text-brand-700"
      >
        <ActiveIcon className="h-3.5 w-3.5" />
        {active.label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 w-[17rem] overflow-hidden rounded-[4px] border border-sand-300 bg-paper shadow-[0_18px_50px_-24px_rgba(20,30,25,0.35)]"
          >
            {CHAT_MODES.map((m) => {
              const Icon = m.icon
              const selected = m.key === mode
              return (
                <li key={m.key} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(m.key)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200",
                      selected ? "bg-sand-50" : "hover:bg-sand-50"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.88rem] font-medium text-ink-900">
                        {m.label}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] leading-snug text-ink-300">
                        {m.hint}
                      </span>
                    </span>
                    {selected && (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
                    )}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ChatShell() {
  const [surface, setSurface] = useState<SurfaceKey>("chat")
  const [mode, setMode] = useState<ChatMode>("stream")
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

  const activeMode = CHAT_MODES.find((m) => m.key === mode)!

  
  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-10">
      {/* -------------------------- surface rail -------------------------- */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="eyebrow hidden text-ink-300 lg:block">Mode</h2>

        <div
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:mt-4 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0"
          role="tablist"
          aria-label="Assistant surface"
        >
          {SURFACES.map((s) => {
            const active = s.key === surface
            const Icon = s.icon
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={active}
                onClick={() => setSurface(s.key)}
                className={cn(
                  "shrink-0 rounded-[4px] border px-4 py-3 text-left transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] lg:w-full",
                  active
                    ? "border-brand-700 bg-brand-700 text-sand-100"
                    : "border-sand-300 bg-paper text-ink-700 hover:border-brand-400 hover:bg-sand-50"
                )}
              >
                <span className="flex items-center gap-2 text-[0.9rem] font-medium">
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </span>
                <span
                  className={cn(
                    "mt-1 hidden text-[0.72rem] leading-snug lg:block",
                    active ? "text-sand-100/65" : "text-ink-300"
                  )}
                >
                  {s.hint}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-6 hidden border-t border-sand-300 pt-4 text-[0.75rem] leading-relaxed text-ink-300 lg:block">
          Chat mode talks to the router on{" "}
          <code className="text-ink-500">:8000</code>. AR mode is layout only
          for now.
        </p>
      </aside>

      {/* --------------------------- active panel --------------------------- */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={surface}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {surface === "ar" ? (
              <ArStage />
            ) : (
             <div className="flex h-[calc(100svh-11rem)] min-h-[34rem] flex-col overflow-hidden rounded-[4px] border border-sand-300 bg-sand-50">
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
                        <p className="eyebrow text-ink-300">
                          {activeMode.label}
                        </p>
                        <p className="mt-3 max-w-md font-display text-[clamp(1.6rem,3.5vw,2.25rem)] leading-[1.1] font-light tracking-[-0.03em] text-brand-900">
                          Ask the thing you&rsquo;d ask a friend who&rsquo;s
                          been.
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

                {/* ------------------------- composer ------------------------- */}
                <form
                  onSubmit={submit}
                  className="border-t border-sand-300 bg-paper p-3 sm:p-4"
                >
                  <div className="rounded-[4px] border border-sand-300 bg-sand-50 px-3 py-2.5 transition-colors duration-300 focus-within:border-brand-700">
                    <label htmlFor="chat-input" className="sr-only">
                      Message the travel assistant
                    </label>
                    <input
                      id="chat-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything…"
                      autoComplete="off"
                      className="w-full bg-transparent px-1 py-1.5 text-[0.95rem] text-ink-900 outline-none placeholder:text-ink-300"
                    />

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <ModePicker mode={mode} setMode={setMode} />

                      {pending && mode === "stream" ? (
                        <button
                          type="button"
                          onClick={stop}
                          className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-sand-300 px-4 text-[0.82rem] text-ink-700 transition-colors hover:border-rust hover:text-rust"
                        >
                          <Square className="h-3 w-3 fill-current" />
                          Stop
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!input.trim() || pending}
                          aria-label="Send message"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sand-100 transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}