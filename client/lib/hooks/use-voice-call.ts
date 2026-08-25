"use client"

import { useCallback, useRef, useState } from "react"
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng"
import { GATEWAY_URL } from "@/lib/api"

export type CallStatus = "idle" | "connecting" | "live" | "error"

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? ""

export function useVoiceCall() {
  const [status, setStatus] = useState<CallStatus>("idle")
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const micRef = useRef<IMicrophoneAudioTrack | null>(null)
  const agentIdRef = useRef<string | null>(null)

  const leave = useCallback(async () => {
    const agentId = agentIdRef.current
    agentIdRef.current = null
    if (agentId) {
      void fetch(`${GATEWAY_URL}/agent/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId }),
      })
    }
    micRef.current?.close()
    micRef.current = null
    await clientRef.current?.leave()
    clientRef.current = null
    setMuted(false)
    setStatus("idle")
  }, [])

  const join = useCallback(async () => {
    if (!APP_ID) {
      setError("NEXT_PUBLIC_AGORA_APP_ID is not set")
      setStatus("error")
      return
    }
    setStatus("connecting")
    setError(null)
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
      clientRef.current = client
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === "audio") user.audioTrack?.play()
      })
      const channel = `tripmate-${Math.random().toString(36).slice(2, 8)}`
      const tokenRes = await fetch(`${GATEWAY_URL}/rtc-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, uid: 0 }),})
      const tokenData = (await tokenRes.json().catch(() => ({}))) as Record<string, unknown>
      if (!tokenRes.ok) {
      throw new Error(String(tokenData.error ?? `token failed: ${tokenRes.status}`))}
      const rtcToken =typeof tokenData.token === "string" && tokenData.token !== ""
            ? tokenData.token : null
      await client.join(APP_ID, channel, rtcToken, null)
      const mic = await AgoraRTC.createMicrophoneAudioTrack()
      micRef.current = mic
      await client.publish([mic])
      const res = await fetch(`${GATEWAY_URL}/agent/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, token: "" }),
      })
      const data = await res.json().catch(() => ({}) as Record<string, unknown>)
      if (!res.ok) {
        throw new Error(String(data.error ?? data.detail ?? `agent start failed: ${res.status}`))
      }
      agentIdRef.current = typeof data.agent_id === "string" ? data.agent_id : null
      setStatus("live")
    } catch (e) {
      await leave()
      setError(e instanceof Error ? e.message : String(e))
      setStatus("error")
    }
  }, [leave])

  const toggleMute = useCallback(async () => {
    const mic = micRef.current
    if (!mic) return
    const next = !muted
    await mic.setMuted(next)
    setMuted(next)
  }, [muted])

  return { status, error, muted, join, leave, toggleMute }
}