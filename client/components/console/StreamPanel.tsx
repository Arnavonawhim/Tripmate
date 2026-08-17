"use client"

import { useRef, useState } from "react"
import { streamAsk } from "@/lib/api"
import {
  Chip,
  Composer,
  ComposerBar,
  ConsoleButton,
  ConsoleTextarea,
  ErrorCard,
  Panel,
} from "@/components/console/console-ui"

export default function StreamPanel() {
  const [prompt, setPrompt] = useState("")
  const [output, setOutput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstTokenMs, setFirstTokenMs] = useState<number | null>(null)
  const [totalMs, setTotalMs] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function start() {
    if (!prompt.trim() || streaming) return
    setStreaming(true)
    setOutput("")
    setError(null)
    setFirstTokenMs(null)
    setTotalMs(null)

    const controller = new AbortController()
    abortRef.current = controller
    const startedAt = performance.now()
    let sawFirst = false

    try {
      await streamAsk(
        prompt,
        (delta) => {
          if (!sawFirst) {
            sawFirst = true
            setFirstTokenMs(Math.round(performance.now() - startedAt))
          }
          setOutput((prev) => prev + delta)
        },
        (message) => setError(message),
        controller.signal
      )
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      setTotalMs(Math.round(performance.now() - startedAt))
      setStreaming(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start()
  }

  return (
    <Panel>
      <Composer>
        <ConsoleTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Watch tokens arrive live over SSE — try a longer prompt like a full day-by-day itinerary..."
          aria-label="Prompt"
        />
        <ComposerBar>
          <div className="flex flex-wrap gap-2">
            {firstTokenMs != null && (
              <Chip tone="ok">first token {firstTokenMs} ms</Chip>
            )}
            {totalMs != null && !streaming && <Chip>total {totalMs} ms</Chip>}
          </div>

          {streaming ? (
            <ConsoleButton variant="ghost" onClick={stop}>
              <span className="h-2.5 w-2.5 bg-current" /> Stop
            </ConsoleButton>
          ) : (
            <ConsoleButton onClick={start} disabled={!prompt.trim()}>
              Stream live
              <span className="transition-transform duration-400 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1">
                &rarr;
              </span>
            </ConsoleButton>
          )}
        </ComposerBar>
      </Composer>

      {error && <ErrorCard message={error} />}

      {(output || streaming) && (
        <div className="overflow-hidden rounded-[4px] border border-sand-100/15 bg-brand-950/70">
          <div className="flex items-center gap-2 border-b border-sand-100/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rust/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-sand-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-moss/70" />
            <span className="ml-2 font-mono text-[0.72rem] tracking-wide text-sand-100/45">
              {streaming ? "● live — tokens over SSE" : "stream complete"}
            </span>
          </div>
          <pre className="max-h-[26rem] overflow-auto p-5 font-mono text-[0.82rem] leading-relaxed whitespace-pre-wrap text-sand-100/90">
            {output}
            {streaming && <span className="caret" />}
          </pre>
        </div>
      )}
    </Panel>
  )
}
