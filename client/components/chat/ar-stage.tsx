"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  Captions,
  Crosshair,
  Mic,
  PhoneOff,
  ScanLine,
  Sparkles,
  Video,
  MicOff,
  Send
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAgentEvents } from "@/lib/hooks/use-agent-event"
import { useVoiceCall} from "@/lib/hooks/use-voice-call"
import { toast } from "sonner"
import { GATEWAY_URL } from "@/lib/api"
import { useContextBeacon } from "@/lib/hooks/use-context-beacon"
import { useFrameLoop } from "@/lib/hooks/use-frame-loop"

type ArMode = "call" | "guide"

const AR_MODES: {
  key: ArMode
  label: string
  hint: string
  icon: React.ElementType
}[] = [
  {
    key: "call",
    label: "Video call",
    hint: "Face to face with the guide",
    icon: Video,
  },
  {
    key: "guide",
    label: "Tour guide",
    hint: "Place the guide in your scene",
    icon: ScanLine,
  },
]

/** Bottom control bar button — shared by both AR modes. */
function ControlButton({
  icon: Icon,
  label,
  tone = "default",
  active = false,
  onClick,
}: {
  icon: React.ElementType
  label: string
  tone?: "default" | "danger"
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5",
        tone === "danger"
          ? "border-rust/40 bg-rust/15 text-rust hover:bg-rust/25"
          : active
            ? "border-sand-200 bg-sand-200 text-brand-900"
            : "border-sand-100/20 bg-sand-100/5 text-sand-100/80 hover:border-sand-200 hover:text-sand-200"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}


function VideoCallStage() {
  const { status, error, muted, guideJoined, agentId, join, leave, toggleMute } = useVoiceCall()
  const { connected, caption } = useAgentEvents()
  const [showCaptions, setShowCaptions] = useState(true)
  const live = status === "live"

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-sand-100/12 bg-brand-900/60">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full border border-sand-200/25 bg-sand-100/5",
              live && "shimmer"
            )}
          >
            <Sparkles className="h-7 w-7 text-sand-200/70" />
          </div>
          <div className="text-center">
            <p className="font-display text-xl tracking-[-0.02em] text-sand-200">
              Tripmate guide
            </p>
            <p className="mt-1 text-[0.8rem] text-sand-100/45">
              {status === "idle" && "ready when you are"}
              {status === "connecting" && "connecting…"}
              {status === "live" &&
              (!guideJoined
                ? "waiting for the guide to join…"
                : muted
                  ? "mic muted"
                  : "live — just start talking")}
              {status === "error" && (error ?? "something went wrong")}
            </p>
            {live && !guideJoined && agentId && (
              <p className="mt-2 font-mono text-[0.68rem] text-sand-100/30">{agentId}</p>
            )}
            {!live && status !== "connecting" && (
              <button
                type="button"
                onClick={() => void join()}
                className="mt-4 rounded-full bg-sand-200 px-6 py-2.5 text-[0.85rem] font-medium text-brand-900 transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-paper"
              >
                Start voice call
              </button>
            )}
          </div>
        </div>

        <div className="absolute right-4 bottom-4 flex h-24 w-36 items-center justify-center rounded-[3px] border border-sand-100/15 bg-brand-950/80">
          <p className="text-[0.7rem] text-sand-100/40">you</p>
        </div>

        {showCaptions && (
          <div className="absolute bottom-4 left-4 max-w-[min(28rem,60%)] rounded-[3px] bg-brand-950/70 px-4 py-2.5">
            <p className="text-[0.82rem] leading-relaxed text-sand-100/70">
              {caption ??
                (live
                  ? "Say something — captions appear here."
                  : "Captions appear here once the call is live.")}
            </p>
          </div>
        )}

        {live && !connected && (
          <div className="absolute top-4 left-4 rounded-full bg-brand-950/70 px-3 py-1.5">
            <p className="text-[0.72rem] tracking-[0.02em] text-sand-100/55">
              event stream reconnecting…
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <ControlButton
          icon={muted ? MicOff : Mic}
          label={muted ? "Unmute microphone" : "Mute microphone"}
          active={muted}
          onClick={() => void toggleMute()}
        />
        <ControlButton icon={Video} label="Camera arrives with scan mode" />
        <ControlButton
          icon={Captions}
          label="Toggle captions"
          active={showCaptions}
          onClick={() => setShowCaptions((v) => !v)}
        />
        <ControlButton
          icon={PhoneOff}
          label="Leave call"
          tone="danger"
          onClick={() => void leave()}
        />
      </div>
    </div>
  )
}

type ScanChatMessage = {
  id: number
  role: "user" | "guide"
  text: string
}

function extractReply(raw: string): string {
  const dig = (value: unknown): string | null => {
    if (typeof value !== "string") return null
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>
      const key = ["scene", "translation", "error", "status", "result"].find(
        (k) => typeof parsed[k] === "string"
      )
      if (!key) return null
      const inner = dig(parsed[key])
      return inner ?? (parsed[key] as string)
    } catch {
      return null
    }
  }
  return dig(raw) ?? raw
}

function TourGuideStage() {
  const [scanning, setScanning] = useState(false)
  const { videoRef, cameraOn, cameraError } = useFrameLoop(scanning)
  useContextBeacon(scanning)
  const [chat, setChat] = useState<ScanChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [thinking, setThinking] = useState(false)
  const idRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const pushMessage = (role: "user" | "guide", text: string) => {
    idRef.current += 1
    setChat((prev) => [...prev, { id: idRef.current, role, text }])
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat, thinking])

  const askAboutScene = async () => {
    const question = draft.trim()
    if (!question || thinking) return
    setDraft("")
    pushMessage("user", question)
    if (!cameraOn) {
      pushMessage("guide", "Start scanning first so I can see what you see.")
      return
    }
    setThinking(true)
    try {
      const res = await fetch(`${GATEWAY_URL}/debug/tool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "get_scene_context", args: { question } }),
      })
      const raw = await res.text()
      pushMessage("guide", extractReply(raw))
    } catch (e) {
      pushMessage("guide", e instanceof Error ? e.message : String(e))
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-sand-100/12 bg-brand-900/60">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            !cameraOn && "hidden"
          )}
        />
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-sand-200/35">
              <Crosshair className="h-5 w-5 text-sand-200/60" />
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-5">
          {!cameraOn && (
            <p className="text-[0.82rem] text-sand-100/55">
              Start scanning to share your view with the guide
            </p>
          )}
          <button
            type="button"
            onClick={() => setScanning((v) => !v)}
            className="rounded-full bg-sand-200 px-6 py-2.5 text-[0.85rem] font-medium text-brand-900 transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-paper"
          >
            {scanning ? "Stop scanning" : "Start scanning"}
          </button>
        </div>

        <div className="absolute top-4 left-4 rounded-full bg-brand-950/70 px-3 py-1.5">
          <p className="text-[0.72rem] tracking-[0.02em] text-sand-100/55">
            {scanning
              ? cameraOn
                ? "scanning — the guide sees this"
                : cameraError ?? "starting camera…"
              : "camera off"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="eyebrow text-sand-100/40">Ask about this place</h3>
        <div className="flex h-80 flex-col rounded-[4px] border border-sand-100/12 bg-brand-900/45">
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {chat.length === 0 && (
              <p className="text-[0.75rem] leading-relaxed text-sand-100/40">
                Start scanning, then ask about whatever the camera can see.
              </p>
            )}
            {chat.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[90%] rounded-[4px] px-3 py-2 text-[0.78rem] leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-sand-200 text-brand-900"
                    : "bg-brand-950/70 text-sand-100/80"
                )}
              >
                {m.text}
              </div>
            ))}
            {thinking && (
              <p className="text-[0.75rem] text-sand-100/40">looking around…</p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void askAboutScene()
            }}
            className="flex items-center gap-2 border-t border-sand-100/12 p-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What am I looking at?"
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[0.82rem] text-sand-100 placeholder:text-sand-100/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={thinking}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-200 text-brand-900 transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-paper disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-sand-100/40">
          Answers come from the same eyes the voice guide uses.
        </p>
      </div>
    </div>
  )
}

export function ArStage() {
  const [mode, setMode] = useState<ArMode>("call")
  const reduce = useReducedMotion()

  return (
    <div className="dark grain relative isolate overflow-hidden rounded-[4px] border border-sand-100/10 bg-brand-950 text-sand-100">
      <div className="relative z-10 p-5 sm:p-7">
        {/* sub-mode segmented control */}
        <div
          className="inline-flex rounded-full border border-sand-100/15 bg-brand-900/50 p-1"
          role="tablist"
          aria-label="AR sub-mode"
        >
          {AR_MODES.map((m) => {
            const active = m.key === mode
            const Icon = m.icon
            return (
              <button
                key={m.key}
                role="tab"
                aria-selected={active}
                onClick={() => setMode(m.key)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-2 text-[0.85rem] transition-colors duration-300",
                  active ? "text-brand-900" : "text-sand-100/60 hover:text-sand-100"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="ar-mode-pill"
                    className="absolute inset-0 rounded-full bg-sand-200"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 32 }
                    }
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{m.label}</span>
              </button>
            )
          })}
        </div>

        <p className="mt-3 text-[0.8rem] text-sand-100/45">
          {AR_MODES.find((m) => m.key === mode)!.hint}
        </p>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {mode === "call" ? <VideoCallStage /> : <TourGuideStage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}