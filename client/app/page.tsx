"use client"

import { useEffect, useState } from "react"
import { fetchHealth, fetchModels, type ModelInfo } from "@/lib/api"
import AskPanel from "@/components/AskPanel"
import StreamPanel from "@/components/StreamPanel"
import ScenePanel from "@/components/ScenePanel"
import MetricsPanel from "@/components/MetricsPanel"

const TABS = [
  { key: "ask", label: "Consensus" },
  { key: "stream", label: "Stream" },
  { key: "vision", label: "Vision" },
  { key: "metrics", label: "Telemetry" },
] as const
type TabKey = (typeof TABS)[number]["key"]

const TICKER = [
  "consensus routing",
  "live token streaming",
  "scene intelligence",
  "multi-model failover",
  "semantic voting",
  "redis cache-aside",
  "postgres telemetry",
]

export default function Home() {
  const [tab, setTab] = useState<TabKey>("ask")
  const [models, setModels] = useState<ModelInfo[]>([])
  const [healthy, setHealthy] = useState<boolean | null>(null)
  const [now, setNow] = useState("")

  useEffect(() => {
    fetchHealth().then(setHealthy)
    fetchModels()
      .then(setModels)
      .catch(() => setModels([]))
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <main className="container">
      <div className="topbar">
        <span className="wordmark">
          Trip-Mate<span className="mark-star">*</span>
        </span>
        <span>gateway console</span>
        <span suppressHydrationWarning>{now}</span>
      </div>

      <header className="hero">
        <p className="hero-kicker">N° 01 — multi-model travel gateway</p>
        <h1 className="hero-title">
          <span className="reveal">
            <span>Ask once.</span>
          </span>
          <span className="reveal">
            <span style={{ animationDelay: "0.12s" }}>
              Every model answers.
            </span>
          </span>
          <span className="reveal">
            <span style={{ animationDelay: "0.24s" }}>
              <em>The best one wins.</em>
            </span>
          </span>
        </h1>
        <p className="hero-status">
          <span className={`status-dot ${healthy === false ? "err" : ""}`} />
          router{" "}
          {healthy === null
            ? "checking…"
            : healthy
              ? "online"
              : "offline — start it on :8000"}
          {models.length > 0 && (
            <> · fleet: {models.map((m) => m.name).join(" / ")}</>
          )}
        </p>
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>
              {t}
              <i>*</i>
            </span>
          ))}
        </div>
      </div>

      <nav className="tabs">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-num">0{i + 1}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "ask" && <AskPanel />}
      {tab === "stream" && <StreamPanel />}
      {tab === "vision" && <ScenePanel />}
      {tab === "metrics" && <MetricsPanel />}

      <footer className="footer">
        <div className="footer-giant">TRIP·MATE</div>
        <div className="footer-meta">
          <span>consensus router · vision worker</span>
          <span>fastapi × next.js</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  )
}
