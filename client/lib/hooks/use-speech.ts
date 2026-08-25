"use client"

import { useCallback, useRef, useState } from "react"
import { fetchSpeech } from "@/lib/api"

export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    if (typeof window !== "undefined") window.speechSynthesis?.cancel()
    setSpeakingId(null)
  }, [])

  const speak = useCallback(
    async (id: string, text: string) => {
      if (speakingId === id) {
        stop()
        return
      }
      stop()
      setSpeakingId(id)
      const blob = await fetchSpeech(text)
      if (blob) {
        const audio = new Audio(URL.createObjectURL(blob))
        audioRef.current = audio
        audio.onended = () => setSpeakingId(null)
        audio.onerror = () => setSpeakingId(null)
        void audio.play()
        return
      }
      if (!window.speechSynthesis) {
        setSpeakingId(null)
        return
      }
      const utter = new SpeechSynthesisUtterance(text)
      utter.onend = () => setSpeakingId(null)
      utter.onerror = () => setSpeakingId(null)
      window.speechSynthesis.speak(utter)
    },
    [speakingId, stop]
  )

  return { speakingId, speak }
}