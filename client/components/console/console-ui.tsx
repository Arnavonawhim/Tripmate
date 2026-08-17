"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

/** Shared presentation pieces for the gateway console. Logic-free. */

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("space-y-6", className)}
    >
      {children}
    </motion.section>
  )
}

export function Surface({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode
  className?: string
  tone?: "default" | "winner" | "error"
}) {
  return (
    <div
      className={cn(
        "rounded-[4px] border p-6 transition-colors",
        tone === "winner" && "border-sand-200/35 bg-brand-900/70",
        tone === "error" && "border-rust/40 bg-rust/10",
        tone === "default" && "border-sand-100/12 bg-brand-900/45",
        className
      )}
    >
      {children}
    </div>
  )
}

export function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode
  tone?: "default" | "ok" | "err" | "cached" | "selected"
}) {
  return (
    <span
      className={cn(
        "tnum inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium",
        tone === "default" && "bg-sand-100/8 text-sand-100/65",
        tone === "ok" && "bg-moss/25 text-sand-100",
        tone === "err" && "bg-rust/25 text-sand-100",
        tone === "cached" && "bg-sand-200 text-brand-900",
        tone === "selected" && "bg-sand-200 text-brand-900"
      )}
    >
      {children}
    </span>
  )
}

export function MicroLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow text-sand-100/40">{children}</p>
}

export function ConsoleButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost"
}) {
  return (
    <button
      {...props}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[0.85rem] font-medium transition-all duration-400 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-35",
        variant === "primary" && "bg-sand-200 text-brand-900 hover:bg-paper",
        variant === "ghost" &&
          "border border-sand-100/25 text-sand-100/80 hover:border-sand-200 hover:text-sand-200",
        className
      )}
    >
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
  )
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <Surface tone="error">
      <p className="font-mono text-[0.82rem] leading-relaxed break-words text-rust">
        {message}
      </p>
    </Surface>
  )
}

export function ConsoleTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      rows={4}
      {...props}
      className={cn(
        "w-full resize-y bg-transparent p-5 text-[0.95rem] leading-relaxed text-sand-100 outline-none placeholder:text-sand-100/35",
        props.className
      )}
    />
  )
}

export function Composer({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-sand-100/15 bg-brand-900/45 transition-colors duration-300 focus-within:border-sand-200/45">
      {children}
    </div>
  )
}

export function ComposerBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-100/10 px-4 py-3">
      {children}
    </div>
  )
}
