"use client"

import { useState } from "react"
import { ask, type AskResult, type Strategy } from "@/lib/api"

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
    <section className="panel fade-up">
      <div className="composer">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Ask anything — "3 hidden gems near the Louvre", "is street food in Bangkok safe?", "draft a 2-day Kyoto plan"...'
        />
        <div className="composer-bar">
          <div className="seg">
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                title={s.hint}
                className={`seg-btn ${strategy === s.value ? "active" : ""}`}
                onClick={() => setStrategy(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <>
                <span className="spinner" /> racing models
              </>
            ) : (
              <>
                Run consensus <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="card skeleton-card"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line short" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card fade-up">
          <p className="error-text">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="card winner fade-up">
            <div className="winner-head">
              <h3>
                <span className="crown">👑</span>
                {result.chosen ?? "no model succeeded"}
              </h3>
              <div className="meta">
                <span className="badge badge-model">{result.strategy}</span>
                {result.cached && (
                  <span className="badge badge-cached">⚡ cached</span>
                )}
                {result.request_id && (
                  <span className="badge">req {result.request_id.slice(0, 8)}</span>
                )}
              </div>
            </div>
            {result.judge?.reason && (
              <p className="muted judge-note">
                ⚖️ {result.judge.judge_model}: {result.judge.reason}
              </p>
            )}
            <p className="answer">
              {result.answer ?? "All models failed — check the candidates below."}
            </p>
          </div>

          <h4 className="section-label">The race — every model’s answer</h4>
          <div className="grid">
            {result.candidates.map((c, i) => (
              <article
                key={c.name}
                className={`card candidate fade-up ${c.was_selected ? "picked" : ""}`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="candidate-head">
                  <h3>{c.name}</h3>
                  {c.was_selected && (
                    <span className="badge badge-selected">winner</span>
                  )}
                </div>
                <div className="meta">
                  <span className={`badge ${c.ok ? "badge-ok" : "badge-err"}`}>
                    {c.ok ? "ok" : "failed"}
                  </span>
                  {c.latency_ms != null && (
                    <span className="badge">{c.latency_ms} ms</span>
                  )}
                  {c.tokens != null && <span className="badge">{c.tokens} tok</span>}
                </div>
                {c.agreement != null && (
                  <div className="agreement">
                    <div className="agreement-bar">
                      <div
                        style={{
                          width: `${Math.min(100, Math.round(c.agreement * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="muted">agreement {c.agreement}</span>
                  </div>
                )}
                {c.ok ? (
                  <p className="answer clamp">{c.text}</p>
                ) : (
                  <p className="error-text">{c.error}</p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
