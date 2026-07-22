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

  return (
    <div className="panel">
      <div className="row">
        <button className="ghost" onClick={refresh} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        <span className="muted">
          Per-model win rate, latency and agreement, aggregated from Postgres.
        </span>
      </div>

      {error && (
        <div className="card">
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
            {stats.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="muted">
                  No calls logged yet - run some prompts in the Ask tab first.
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
                    <div className="bar" style={{ width: 80 }}>
                      <div
                        style={{ width: `${Math.round(s.win_rate * 100)}%` }}
                      />
                    </div>
                    <span>{Math.round(s.win_rate * 100)}%</span>
                  </div>
                </td>
                <td>
                  {s.avg_latency_ms != null ? `${s.avg_latency_ms} ms` : "-"}
                </td>
                <td>{s.avg_agreement ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
