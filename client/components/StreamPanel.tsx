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
    const started = performance.now()
    let gotFirst = false

    try {
      await streamAsk(
        prompt.trim(),
        (delta) => {
          if (!gotFirst) {
            gotFirst = true
            setFirstTokenMs(Math.round(performance.now() - started))
          }
          setOutput((prev) => prev + delta)
        },
        (message) => setError(message),
        controller.signal,
      )
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      setTotalMs(Math.round(performance.now() - started))
      setStreaming(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  return (
    <div className="panel">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Streams token-by-token from the primary model over SSE..."
      />
      <div className="row">
        <button
          className="primary"
          onClick={start}
          disabled={streaming || !prompt.trim()}
        >
          {streaming ? "Streaming..." : "Stream"}
        </button>
        {streaming && (
          <button className="ghost" onClick={stop}>
            Stop
          </button>
        )}
        {firstTokenMs != null && (
          <span className="badge">first token {firstTokenMs} ms</span>
        )}
        {totalMs != null && !streaming && (
          <span className="badge">total {totalMs} ms</span>
        )}
      </div>

      {error && (
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      )}

      {output && (
        <div className="card">
          <p className="answer">{output}</p>
        </div>
      )}
    </div>
  )
}
