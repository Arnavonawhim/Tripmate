"use client"

import { useEffect, useRef, useState } from "react"
import { GATEWAY_URL } from "@/lib/api"

export type AgentEvent = {
  event: string
  data: Record<string, unknown>
  ts: number
}

export function useAgentEvents(onEvent?: (e: AgentEvent) => void) {
  const [connected, setConnected] = useState(false)
  const [caption, setCaption] = useState<string | null>(null)
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    const source = new EventSource(`${GATEWAY_URL}/events`)
    source.onopen = () => setConnected(true)
    source.onerror = () => setConnected(false)
    source.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as AgentEvent
        if (parsed.event === "agent_reply" && typeof parsed.data?.text === "string") {
          setCaption(parsed.data.text as string)
        }
        handlerRef.current?.(parsed)
      } catch {
        return
      }
    }
    return () => source.close()
  }, [])

  return { connected, caption }
}