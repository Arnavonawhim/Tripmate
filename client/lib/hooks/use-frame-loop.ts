"use client"

import { useEffect, useRef, useState } from "react"
import { GATEWAY_URL } from "@/lib/api"

export function useFrameLoop(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

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

    const canvas = document.createElement("canvas")

    const timer = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2 || !video.videoWidth) return
      canvas.width = 640
      canvas.height = Math.round((video.videoHeight / video.videoWidth) * 640)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          const form = new FormData()
          form.append("image", blob, "frame.jpg")
          void fetch(`${GATEWAY_URL}/frame`, { method: "POST", body: form }).catch(() => {})
        },
        "image/jpeg",
        0.7
      )
    }, 2500)

    return () => {
      cancelled = true
      clearInterval(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setCameraOn(false)
    }
  }, [active])

  return { videoRef, cameraOn, cameraError }
}