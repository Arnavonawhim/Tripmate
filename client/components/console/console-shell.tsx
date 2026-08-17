"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouterHealth } from "@/lib/hooks/use-router-health"
import AskPanel from "@/components/console/AskPanel"
import StreamPanel from "@/components/console/StreamPanel"
import ScenePanel from "@/components/console/ScenePanel"
import MetricsPanel from "@/components/console/MetricsPanel"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "ask", label: "Consensus" },
  { key: "stream", label: "Stream" },
  { key: "vision", label: "Vision" },
  { key: "metrics", label: "Telemetry" },
] as const

type TabKey = (typeof TABS)[number]["key"]

export function ConsoleShell() {
  const [tab, setTab] = useState<TabKey>("ask")
  const { healthy, models } = useRouterHealth()

  return (
    <div>
      {/* --------------------------- status --------------------------- */}
      <p className="flex flex-wrap items-center gap-2 text-[0.82rem] text-sand-100/55">
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            healthy === false
              ? "bg-rust"
              : healthy === null
                ? "bg-sand-400"
                : "bg-moss"
          )}
        />
        router{" "}
        {healthy === null
          ? "checking…"
          : healthy
            ? "online"
            : "offline — start it on :8000"}
        {models.length > 0 && (
          <span className="text-sand-100/40">
            · fleet: {models.map((m) => m.name).join(" / ")}
          </span>
        )}
      </p>

      {/* ---------------------------- tabs ---------------------------- */}
      <nav
        className="no-scrollbar mt-8 flex gap-1 overflow-x-auto border-b border-sand-100/12 pb-px"
        aria-label="Console sections"
      >
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-4 py-3 text-[0.88rem] transition-colors duration-300",
              tab === t.key
                ? "text-sand-200"
                : "text-sand-100/45 hover:text-sand-100/80"
            )}
          >
            <span className="tnum mr-2 text-[0.7rem] text-sand-100/30">
              0{i + 1}
            </span>
            {t.label}
            {tab === t.key && (
              <motion.span
                layoutId="console-tab"
                className="absolute inset-x-0 -bottom-px h-px bg-sand-200"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* --------------------------- panels --------------------------- */}
      <div className="mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "ask" && <AskPanel />}
            {tab === "stream" && <StreamPanel />}
            {tab === "vision" && <ScenePanel />}
            {tab === "metrics" && <MetricsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
