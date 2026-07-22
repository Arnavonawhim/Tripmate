"use client"

import { useEffect, useState } from "react"
import { fetchHealth, fetchModels, type ModelInfo } from "@/lib/api"
import AskPanel from "@/components/AskPanel"
import StreamPanel from "@/components/StreamPanel"
import ScenePanel from "@/components/ScenePanel"
import MetricsPanel from "@/components/MetricsPanel"

const TABS = ["Ask", "Stream", "Vision", "Metrics"] as const
type Tab = (typeof TABS)[number]

export default function Home() {
  const [tab, setTab] = useState<Tab>("Ask")
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
      <header>
        <h1>🧭 Trip-Mate</h1>
        <p className="subtitle">
          Multi-model AI gateway - consensus routing, streaming, vision &
          metrics
        </p>
        <div className="status-row">
          <span className={`badge ${healthy ? "ok" : "err"}`}>
            router: {healthy === null ? "checking..." : healthy ? "online" : "offline"}
          </span>
          {models.map((m) => (
            <span key={m.name} className="badge model">
              {m.name}
            </span>
          ))}
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Ask" && <AskPanel />}
      {tab === "Stream" && <StreamPanel />}
      {tab === "Vision" && <ScenePanel />}
      {tab === "Metrics" && <MetricsPanel />}
    </main>
  )
}
