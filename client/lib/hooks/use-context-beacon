"use client"
import { useEffect, useRef } from "react"
import { GATEWAY_URL } from "@/lib/api"

export function useContextBeacon(active: boolean) {
  const posRef = useRef<{ lat: number; lng: number } | null>(null)
  const headingRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return

    let watchId: number | null = null

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          posRef.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
          if (pos.coords.heading !== null && !Number.isNaN(pos.coords.heading)) {
            headingRef.current = pos.coords.heading
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      const compass = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading
      if (typeof compass === "number") {
        headingRef.current = compass
      } else if (e.alpha !== null) {
        headingRef.current = (360 - e.alpha) % 360
      }
    }

    window.addEventListener("deviceorientationabsolute", onOrientation as EventListener)
    window.addEventListener("deviceorientation", onOrientation as EventListener)

    const timer = setInterval(() => {
      const body: Record<string, number> = {}
      if (posRef.current) {
        body.lat = posRef.current.lat
        body.lng = posRef.current.lng
      }
      if (headingRef.current !== null) {
        body.heading = headingRef.current
      }
      if (Object.keys(body).length === 0) return
      void fetch(`${GATEWAY_URL}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {})
    }, 2000)

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      window.removeEventListener("deviceorientationabsolute", onOrientation as EventListener)
      window.removeEventListener("deviceorientation", onOrientation as EventListener)
      clearInterval(timer)
    }
  }, [active])
}