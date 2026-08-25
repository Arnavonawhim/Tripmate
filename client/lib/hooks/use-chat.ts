
"use client"

import { useCallback, useRef, useState } from "react"
import { ask, streamAsk } from "@/lib/api"

export type ChatMode = "consensus" | "stream"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  mode?: ChatMode
  /** Set while tokens are still arriving in quick-answer mode. */
  streaming?: boolean
  error?: boolean
  meta?: { chosen?: string | null; cached?: boolean; strategy?: string }
}

let counter = 0
const nextId = () => `m${++counter}`

/**
 * Chat state for the two chat-mode strategies.
 *
 * "stream"    → quick answer, SSE token-by-token from one primary model.
 * "consensus" → deep thinking, several models answer and the best reply wins.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const patch = useCallback((id: string, next: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...next } : m))
    )
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const send = useCallback(
    async (text: string, mode: ChatMode) => {
      const trimmed = text.trim()
      if (!trimmed || pending) return

      const userId = nextId()
      const replyId = nextId()

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text: trimmed },
        { id: replyId, role: "assistant", text: "", mode, streaming: true },
      ])
      setPending(true)

      try {
        if (mode === "stream") {
          const controller = new AbortController()
          abortRef.current = controller
          let buffer = ""

          await streamAsk(
            trimmed,
            (delta) => {
              buffer += delta
              patch(replyId, { text: buffer })
            },
            (message) => patch(replyId, { text: message, error: true }),
            controller.signal
          )

          patch(replyId, {
            streaming: false,
            text: buffer || "No tokens returned.",
          })
        } else {
          const result = await ask(trimmed, "semantic")
          patch(replyId, {
            streaming: false,
            text: result.answer ?? "Got it!",
            meta: {
              chosen: result.chosen,
              cached: result.cached,
              strategy: result.strategy,
            },
          })
        }
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError"
        patch(replyId, {
          streaming: false,
          error: !aborted,
          text: aborted
            ? "Stopped."
            : "Couldn't reach the router. Check it's running on :8000.",
        })
      } finally {
        abortRef.current = null
        setPending(false)
      }
    },
    [pending, patch]
  )

  return { messages, pending, send, stop }
}
/*
"use client"

import { useCallback, useRef, useState } from "react"
import { ask, fetchMetrics, streamAsk, type ModelStats } from "@/lib/api"

export type ChatMode = "consensus" | "stream" | "telemetry"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  mode?: ChatMode
  // Set while tokens are still arriving in stream mode.
  streaming?: boolean
  error?: boolean
  // Telemetry replies carry structured rows instead of prose.
  stats?: ModelStats[]
  meta?: { chosen?: string | null; cached?: boolean; strategy?: string }
}

let counter = 0
const nextId = () => `m${++counter}`

// Chat state for all three modes.
//
// The legacy `sendChat` sent every mode as a POST and called res.json() on it,
// so Stream (an SSE endpoint) and Telemetry (a GET-only route) always failed
// with "Error connecting to backend". Each mode now uses the matching helper
// from lib/api.ts — the request contracts themselves are unchanged.
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const patch = useCallback((id: string, next: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...next } : m))
    )
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const send = useCallback(
    async (text: string, mode: ChatMode) => {
      const trimmed = text.trim()
      if (!trimmed || pending) return

      const userId = nextId()
      const replyId = nextId()

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text: trimmed },
        { id: replyId, role: "assistant", text: "", mode, streaming: true },
      ])
      setPending(true)

      try {
        if (mode === "stream") {
          const controller = new AbortController()
          abortRef.current = controller
          let buffer = ""

          await streamAsk(
            trimmed,
            (delta) => {
              buffer += delta
              patch(replyId, { text: buffer })
            },
            (message) => patch(replyId, { text: message, error: true }),
            controller.signal
          )

          patch(replyId, { streaming: false, text: buffer || "No tokens returned." })
        } else if (mode === "telemetry") {
          const stats = await fetchMetrics()
          patch(replyId, {
            streaming: false,
            stats,
            text: stats.length
              ? `${stats.length} model${stats.length === 1 ? "" : "s"} logged so far.`
              : "No calls logged yet — ask something in Consensus mode first.",
          })
        } else {
          const result = await ask(trimmed, "semantic")
          patch(replyId, {
            streaming: false,
            // Same fallback chain the legacy handler used.
            text: result.answer ?? "Got it!",
            meta: {
              chosen: result.chosen,
              cached: result.cached,
              strategy: result.strategy,
            },
          })
        }
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError"
        patch(replyId, {
          streaming: false,
          error: !aborted,
          text: aborted
            ? "Stopped."
            : "Couldn't reach the router. Check it's running on :8000.",
        })
      } finally {
        abortRef.current = null
        setPending(false)
      }
    },
    [pending, patch]
  )

  return { messages, pending, send, stop }
}
*/
