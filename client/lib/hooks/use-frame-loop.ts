"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GATEWAY_URL } from "@/lib/api"

export function useFrameLoop(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const captureNow = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || !video.videoWidth) return false
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas")
    const canvas = canvasRef.current
    canvas.width = 640
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 640)
    const ctx = canvas.getContext("2d")
    if (!ctx) return false
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.7)
    )
    if (!blob) return false
    const form = new FormData()
    form.append("image", blob, "frame.jpg")
    try {
      const res = await fetch(`${GATEWAY_URL}/frame`, { method: "POST", body: form })
      return res.ok
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (!active) return

    let cancelled = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setCameraOn(true)
        setCameraError(null)
      } catch (e) {
        setCameraError(e instanceof Error ? e.message : String(e))
      }
    }

    void start()

    const timer = setInterval(() => {
      void captureNow()
    }, 2500)

    return () => {
      cancelled = true
      clearInterval(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setCameraOn(false)
    }
  }, [active, captureNow])

  return { videoRef, cameraOn, cameraError, captureNow }
}