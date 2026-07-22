"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchMetrics, type ModelStats } from "@/lib/api"

export default function MetricsPanel() {
  const [stats, setStats] = useState<ModelStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await fetchMetrics())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totalCalls = stats.reduce((acc, s) => acc + s.calls, 0)
  const best = [...stats]
    .filter((s) => s.calls > 0)
    .sort((a, b) => b.win_rate - a.win_rate)[0]
  const withLatency = stats.filter((s) => s.avg_latency_ms != null)
  const avgLatency = withLatency.length
    ? Math.round(
        withLatency.reduce((acc, s) => acc + (s.avg_latency_ms ?? 0), 0) /
          withLatency.length
      )
    : null

  return (
    <section className="panel fade-up">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalCalls}</div>
          <div className="stat-label">model calls logged</div>
        </div>
        <div className="stat-card">
          <div className="stat-value small">{best ? best.model : "—"}</div>
          <div className="stat-label">top model by win rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {avgLatency != null ? `${avgLatency} ms` : "—"}
          </div>
          <div className="stat-label">avg latency across models</div>
        </div>
      </div>

      <div className="row">
        <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
        <span className="muted">
          Win rate, latency and agreement per model — live from Postgres.
        </span>
      </div>

      {error && (
        <div className="card fade-up">
          <p className="error-text">{error}</p>
        </div>
      )}

      <div className="card">
        <table className="metrics">
          <thead>
            <tr>
              <th>Model</th>
              <th>Provider</th>
              <th>Calls</th>
              <th>Wins</th>
              <th>Win rate</th>
              <th>Avg latency</th>
              <th>Avg agreement</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No calls logged yet — run some prompts in the Consensus tab
                  first.
                </td>
              </tr>
            )}
            {stats.map((s) => (
              <tr key={s.model}>
                <td>{s.model}</td>
                <td>{s.provider}</td>
                <td>{s.calls}</td>
                <td>{s.wins}</td>
                <td>
                  <div className="row">
                    <div className="bar">
                      <div
                        style={{
                          width: `${Math.min(100, Math.round(s.win_rate * 100))}%`,
                        }}
                      />
                    </div>
                    <span>{Math.round(s.win_rate * 100)}%</span>
                  </div>
                </td>
                <td>
                  {s.avg_latency_ms != null ? `${s.avg_latency_ms} ms` : "—"}
                </td>
                <td>{s.avg_agreement != null ? s.avg_agreement : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
