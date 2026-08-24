"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "motion/react"
import { fetchMetrics, type ModelStats } from "@/lib/api"
import {
  ConsoleButton,
  ErrorCard,
  Panel,
  Surface,
} from "@/components/console/console-ui"

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let frame: number
    const started = performance.now()
    const duration = 900
    const step = (t: number) => {
      const p = Math.min(1, (t - started) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * eased))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <>
      {display}
      {suffix}
    </>
  )
}

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
    <Panel>
      <div className="grid gap-4 sm:grid-cols-3">
        <Surface>
          <p className="tnum font-display text-[2.75rem] leading-none font-light tracking-[-0.04em] text-sand-200">
            <CountUp value={totalCalls} />
          </p>
          <p className="mt-3 text-[0.8rem] text-sand-100/50">
            model calls logged
          </p>
        </Surface>

        <Surface>
          <p className="font-display text-2xl leading-tight tracking-[-0.02em] text-sand-200">
            {best ? best.model : "—"}
          </p>
          <p className="mt-3 text-[0.8rem] text-sand-100/50">
            top model by win rate
          </p>
        </Surface>

        <Surface>
          <p className="tnum font-display text-[2.75rem] leading-none font-light tracking-[-0.04em] text-sand-200">
            {avgLatency != null ? <CountUp value={avgLatency} suffix=" ms" /> : "—"}
          </p>
          <p className="mt-3 text-[0.8rem] text-sand-100/50">
            avg latency across models
          </p>
        </Surface>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <ConsoleButton variant="ghost" onClick={refresh} disabled={loading}>
          {loading ? "loading…" : "refresh"}
        </ConsoleButton>
        <span className="text-[0.8rem] text-sand-100/45">
          Win rate, latency and agreement per model — live from Postgres.
        </span>
      </div>

      {error && <ErrorCard message={error} />}

      <Surface className="overflow-x-auto p-0">
        <table className="tnum w-full min-w-[46rem] text-left text-[0.85rem]">
          <thead>
            <tr className="border-b border-sand-100/10 text-sand-100/45">
              <th className="px-5 py-4 font-medium">Model</th>
              <th className="px-5 py-4 font-medium">Provider</th>
              <th className="px-5 py-4 font-medium">Calls</th>
              <th className="px-5 py-4 font-medium">Wins</th>
              <th className="px-5 py-4 font-medium">Win rate</th>
              <th className="px-5 py-4 font-medium">Avg latency</th>
              <th className="px-5 py-4 font-medium">Avg agreement</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 && (
              <tr>
                {/*<td colSpan={7} className="px-5 py-10 text-sand-100/45">
                  No calls logged yet — run some prompts in the Consensus tab
                  first.
                </td>
                */}
                <td colSpan={7} className="px-5 py-10 text-sand-100/45">
                  No calls logged yet — send a request through the gateway and
                   the fleet shows up here.
                </td>
              </tr>
            )}
            {stats.map((s) => (
              <tr
                key={s.model}
                className="border-b border-sand-100/8 transition-colors last:border-0 hover:bg-sand-100/[0.03]"
              >
                <td className="px-5 py-4 text-sand-100">{s.model}</td>
                <td className="px-5 py-4 text-sand-100/55">{s.provider}</td>
                <td className="px-5 py-4 text-sand-100/55">{s.calls}</td>
                <td className="px-5 py-4 text-sand-100/55">{s.wins}</td>
                <td className="px-5 py-4">
                  <span className="flex items-center gap-3">
                    <span className="h-1 w-20 overflow-hidden rounded-full bg-sand-100/10">
                      <motion.span
                        className="block h-full rounded-full bg-sand-200"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, Math.round(s.win_rate * 100))}%`,
                        }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </span>
                    <span className="text-sand-100/80">
                      {Math.round(s.win_rate * 100)}%
                    </span>
                  </span>
                </td>
                <td className="px-5 py-4 text-sand-100/55">
                  {s.avg_latency_ms != null ? `${s.avg_latency_ms} ms` : "—"}
                </td>
                <td className="px-5 py-4 text-sand-100/55">
                  {s.avg_agreement != null ? s.avg_agreement : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
    </Panel>
  )
}
