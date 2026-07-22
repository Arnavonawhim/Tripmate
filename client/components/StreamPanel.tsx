"use client"

import { useRef, useState } from "react"
import { streamAsk } from "@/lib/api"

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
        {
          onDelta: (delta) => {
            if (!sawFirst) {
              sawFirst = true
              setFirstTokenMs(Math.round(performance.now() - startedAt))
            }
            setOutput((prev) => prev + delta)
          },
          onError: (message) => setError(message),
        },
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
    <section className="panel fade-up">
      <div className="composer">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Watch tokens arrive live over SSE — try a longer prompt like a full day-by-day itinerary..."
        />
        <div className="composer-bar">
          <div className="row">
            {firstTokenMs != null && (
              <span className="badge badge-ok">first token {firstTokenMs} ms</span>
            )}
            {totalMs != null && !streaming && (
              <span className="badge">total {totalMs} ms</span>
            )}
          </div>
          {streaming ? (
            <button className="btn btn-ghost" onClick={stop}>
              ■ Stop
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={start}
              disabled={!prompt.trim()}
            >
              Stream live <span className="btn-arrow">→</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card fade-up">
          <p className="error-text">{error}</p>
        </div>
      )}

      {(output || streaming) && (
        <div className="terminal fade-up">
          <div className="terminal-head">
            <span className="term-dot r" />
            <span className="term-dot y" />
            <span className="term-dot g" />
            <span className="terminal-title">
              {streaming ? "● live — tokens over SSE" : "stream complete"}
            </span>
          </div>
          <pre className="terminal-body">
            {output}
            {streaming && <span className="caret" />}
          </pre>
        </div>
      )}
    </section>
  )
}
