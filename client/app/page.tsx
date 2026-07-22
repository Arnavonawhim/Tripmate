"use client"

import { useEffect, useState } from "react"
import { fetchHealth, fetchModels, type ModelInfo } from "@/lib/api"
import AskPanel from "@/components/AskPanel"
import StreamPanel from "@/components/StreamPanel"
import ScenePanel from "@/components/ScenePanel"
import MetricsPanel from "@/components/MetricsPanel"

const TABS = [
  { key: "ask", icon: "✦", label: "Consensus" },
  { key: "stream", icon: "⚡", label: "Stream" },
  { key: "vision", icon: "◉", label: "Vision" },
  { key: "metrics", icon: "▦", label: "Metrics" },
] as const
type TabKey = (typeof TABS)[number]["key"]

export default function Home() {
  const [tab, setTab] = useState<TabKey>("ask")
  const [models, setModels] = useState<ModelInfo[]>([])
  const [healthy, setHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    fetchHealth().then(setHealthy)
    fetchModels()
      .then(setModels)
      .catch(() => setModels([]))
  }, [])

  return (
    <main className="container">
      <header className="hero">
        <div className="eyebrow">
          <span className="pulse-dot" /> multi-model ai gateway
        </div>
        <h1 className="hero-title">Trip-Mate</h1>
        <p className="hero-sub">
          One prompt, every model, in parallel —{" "}
          <span className="grad-text">the best answer wins.</span>
        </p>
        <div className="status-row">
          <span className={`chip ${healthy === false ? "chip-err" : "chip-ok"}`}>
            <span className="dot" />
            router{" "}
            {healthy === null ? "checking..." : healthy ? "online" : "offline"}
          </span>
          {models.map((m, i) => (
            <span
              key={m.name}
              className="chip chip-model"
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              {m.name}
            </span>
          ))}
          {healthy === false && (
            <span className="chip">start the router on :8000 to go live</span>
          )}
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "ask" && <AskPanel />}
      {tab === "stream" && <StreamPanel />}
      {tab === "vision" && <ScenePanel />}
      {tab === "metrics" && <MetricsPanel />}

      <footer className="footer">
        <span className="grad-text">Trip-Mate</span> — consensus router ·
        vision worker · the AI-infra flagship
      </footer>
    </main>
  )
}
