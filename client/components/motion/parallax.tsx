"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

/**
 * Scroll-linked vertical drift. Deliberately small (default 12%) — enough to
 * give depth, not enough to make the page feel unmoored.
 */
export function Parallax({
  children,
  className,
  amount = 12,
}: {
  children: React.ReactNode
  className?: string
  amount?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : [`-${amount}%`, `${amount}%`]
  )

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div style={{ y }} className="h-[125%] w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  )
}
