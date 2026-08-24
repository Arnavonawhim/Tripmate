"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  Captions,
  Crosshair,
  Languages,
  MapPin,
  Mic,
  PhoneOff,
  Save,
  ScanLine,
  Sparkles,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
}: {
  icon: React.ElementType
  label: string
  tone?: "default" | "danger"
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5",
        tone === "danger"
          ? "border-rust/40 bg-rust/15 text-rust hover:bg-rust/25"
          : "border-sand-100/20 bg-sand-100/5 text-sand-100/80 hover:border-sand-200 hover:text-sand-200"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

/** Guide-mode side action — one per gateway tool. */
function ToolAction({
  icon: Icon,
  label,
}: {
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-[4px] border border-sand-100/12 bg-brand-900/45 px-4 py-3 text-left text-[0.83rem] text-sand-100/75 transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-sand-200/40 hover:text-sand-200"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  )
}

function VideoCallStage() {
  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-sand-100/12 bg-brand-900/60">
        {/* guide tile */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-sand-200/25 bg-sand-100/5">
            <Sparkles className="h-7 w-7 text-sand-200/70" />
          </div>
          <div className="text-center">
            <p className="font-display text-xl tracking-[-0.02em] text-sand-200">
              Tripmate guide
            </p>
            <p className="mt-1 text-[0.8rem] text-sand-100/45">
              not connected — voice layer wires up later
            </p>
          </div>
        </div>

        {/* self-view PiP */}
        <div className="absolute right-4 bottom-4 flex h-24 w-36 items-center justify-center rounded-[3px] border border-sand-100/15 bg-brand-950/80">
          <p className="text-[0.7rem] text-sand-100/40">you</p>
        </div>

        {/* live captions strip */}
        <div className="absolute bottom-4 left-4 max-w-[min(28rem,60%)] rounded-[3px] bg-brand-950/70 px-4 py-2.5">
          <p className="text-[0.82rem] leading-relaxed text-sand-100/70">
            Captions appear here once the call is live.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <ControlButton icon={Mic} label="Mute microphone" />
        <ControlButton icon={Video} label="Turn off camera" />
        <ControlButton icon={Captions} label="Toggle captions" />
        <ControlButton icon={PhoneOff} label="Leave call" tone="danger" />
      </div>
    </div>
  )
}

function TourGuideStage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_15rem]">
      {/* viewfinder */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-sand-100/12 bg-brand-900/60">
        {/* ground reticle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-sand-200/35">
            <Crosshair className="h-5 w-5 text-sand-200/60" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-5">
          <p className="text-[0.82rem] text-sand-100/55">
            Point at the floor, then place your guide
          </p>
          <button
            type="button"
            className="rounded-full bg-sand-200 px-6 py-2.5 text-[0.85rem] font-medium text-brand-900 transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-paper"
          >
            Place guide
          </button>
        </div>

        <div className="absolute top-4 left-4 rounded-full bg-brand-950/70 px-3 py-1.5">
          <p className="text-[0.72rem] tracking-[0.02em] text-sand-100/55">
            camera off — scan mode wires up later
          </p>
        </div>
      </div>

      {/* tool rail */}
      <div className="flex flex-col gap-2">
        <h3 className="eyebrow text-sand-100/40">Guide can</h3>
        <ToolAction icon={MapPin} label="Find nearby" />
        <ToolAction icon={Save} label="Save this place" />
        <ToolAction icon={Sparkles} label="Memories" />
        <ToolAction icon={Languages} label="Translate a sign" />

        <p className="mt-3 border-t border-sand-100/12 pt-4 text-[0.75rem] leading-relaxed text-sand-100/40">
          Each action maps to one gateway tool. Wiring comes after the layout
          settles.
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