"use client"

import { useState } from "react"
import { ask, type AskResult, type Strategy } from "@/lib/api"

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
      setResult(await ask(prompt.trim(), strategy))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask anything - the router fans it out to every active model in parallel..."
      />
      <div className="row">
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as Strategy)}
        >
          <option value="semantic">semantic consensus</option>
          <option value="judge">LLM as judge</option>
        </select>
        <button
          className="primary"
          onClick={submit}
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Running consensus..." : "Ask"}
        </button>
      </div>

      {error && (
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="card winner">
            <h3>Winner: {result.chosen ?? "no model succeeded"}</h3>
            <div className="meta">
              <span className="badge">{result.strategy}</span>
              {result.cached && <span className="badge cached">cached</span>}
              {result.request_id && (
                <span className="badge">req {result.request_id.slice(0, 8)}</span>
              )}
            </div>
            {result.judge?.reason && (
              <p className="muted">
                Judge ({result.judge.judge_model}): {result.judge.reason}
              </p>
            )}
            <p className="answer">
              {result.answer ?? "All models failed - check the candidates below."}
            </p>
          </div>

          <div className="grid">
            {result.candidates.map((c) => (
              <div key={c.name} className="card">
                <h3>{c.name}</h3>
                <div className="meta">
                  {c.was_selected && (
                    <span className="badge selected">selected</span>
                  )}
                  <span className={`badge ${c.ok ? "ok" : "err"}`}>
                    {c.ok ? "ok" : "failed"}
                  </span>
                  {c.latency_ms != null && (
                    <span className="badge">{c.latency_ms} ms</span>
                  )}
                  {c.tokens != null && (
                    <span className="badge">{c.tokens} tok</span>
                  )}
                  {c.agreement != null && (
                    <span className="badge">agreement {c.agreement}</span>
                  )}
                </div>
                {c.ok ? (
                  <p className="answer">{c.text}</p>
                ) : (
                  <p className="error-text">{c.error}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
