"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ask, type AskResult, type Strategy } from "@/lib/api"
import {
  Chip,
  Composer,
  ComposerBar,
  ConsoleButton,
  ConsoleTextarea,
  ErrorCard,
  MicroLabel,
  Panel,
  Spinner,
  Surface,
} from "@/components/console/console-ui"
import { cn } from "@/lib/utils"

const STRATEGIES: { value: Strategy; label: string; hint: string }[] = [
  {
    value: "semantic",
    label: "Semantic vote",
    hint: "models vote by embedding similarity",
  },
  {
    value: "judge",
    label: "LLM judge",
    hint: "a strong model picks the best answer",
  },
]

export default function AskPanel() {
  const [prompt, setPrompt] = useState("")
  const [strategy, setStrategy] = useState<Strategy>("semantic")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AskResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      setResult(await ask(prompt, strategy))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
  }

  return (
    <Panel>
      <Composer>
        <ConsoleTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Three hidden gems near the Louvre… is street food in Bangkok safe… a two-day plan for Kyoto…"
          aria-label="Prompt"
        />
        <ComposerBar>
          <div className="flex rounded-full border border-sand-100/15 p-0.5">
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                title={s.hint}
                onClick={() => setStrategy(s.value)}
                aria-pressed={strategy === s.value}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[0.78rem] transition-all duration-300",
                  strategy === s.value
                    ? "bg-sand-200 text-brand-900"
                    : "text-sand-100/60 hover:text-sand-100"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <ConsoleButton onClick={submit} disabled={loading || !prompt.trim()}>
            {loading ? (
              <>
                <Spinner /> polling the fleet
              </>
            ) : (
              <>
                Run consensus
                <span className="transition-transform duration-400 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1">
                  &rarr;
                </span>
              </>
            )}
          </ConsoleButton>
        </ComposerBar>
      </Composer>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Surface key={i} className="space-y-3">
              <div className="shimmer h-4 w-1/3 rounded bg-sand-100/10" />
              <div className="shimmer h-3 w-full rounded bg-sand-100/8" />
              <div className="shimmer h-3 w-full rounded bg-sand-100/8" />
              <div className="shimmer h-3 w-2/3 rounded bg-sand-100/8" />
            </Surface>
          ))}
        </div>
      )}

      {error && <ErrorCard message={error} />}

      {result && (
        <>
          <Surface tone="winner">
            <MicroLabel>the pick — {result.strategy}</MicroLabel>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl tracking-[-0.02em] text-sand-200">
                {result.chosen ?? "no model succeeded"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.cached && <Chip tone="cached">cached</Chip>}
                {result.request_id && (
                  <Chip>req {result.request_id.slice(0, 8)}</Chip>
                )}
              </div>
            </div>

            {result.judge?.reason && (
              <p className="mt-3 text-[0.82rem] text-sand-100/50">
                judge · {result.judge.judge_model} — {result.judge.reason}
              </p>
            )}

            <p className="mt-4 leading-relaxed whitespace-pre-wrap text-sand-100/90">
              {result.answer ?? "All models failed — check the candidates below."}
            </p>
          </Surface>

          <h4 className="eyebrow pt-2 text-sand-100/40">
            the race — all candidates
          </h4>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.candidates.map((c, i) => (
              <motion.article
                key={c.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Surface
                  className={cn(
                    "h-full",
                    c.was_selected && "border-sand-200/45 bg-brand-800/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[0.95rem] font-medium text-sand-100">
                      {c.name}
                    </h3>
                    {c.was_selected && <Chip tone="selected">selected</Chip>}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip tone={c.ok ? "ok" : "err"}>
                      {c.ok ? "ok" : "failed"}
                    </Chip>
                    {c.latency_ms != null && <Chip>{c.latency_ms} ms</Chip>}
                    {c.tokens != null && <Chip>{c.tokens} tok</Chip>}
                  </div>

                  {c.agreement != null && (
                    <div className="mt-4 flex items-center gap-3">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-sand-100/10">
                        <motion.span
                          className="block h-full rounded-full bg-sand-200"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, Math.round(c.agreement * 100))}%`,
                          }}
                          transition={{
                            duration: 0.8,
                            delay: 0.2,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      </span>
                      <span className="tnum text-[0.72rem] text-sand-100/45">
                        {c.agreement}
                      </span>
                    </div>
                  )}

                  {c.ok ? (
                    <p className="mt-4 line-clamp-6 text-[0.85rem] leading-relaxed text-sand-100/70">
                      {c.text}
                    </p>
                  ) : (
                    <p className="mt-4 font-mono text-[0.78rem] break-words text-rust">
                      {c.error}
                    </p>
                  )}
                </Surface>
              </motion.article>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}
