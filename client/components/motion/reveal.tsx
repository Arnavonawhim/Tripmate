"use client"

import { motion, useReducedMotion, type Variants } from "motion/react"
import { cn } from "@/lib/utils"

const EASE = [0.16, 1, 0.3, 1] as const

/** Fade-and-rise as the element scrolls into view. Fires once. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  as?: "div" | "section" | "article" | "li" | "header"
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  )
}

/** Parent that staggers its Stagger.Item children into view. */
export function Stagger({
  children,
  className,
  delay = 0,
  gap = 0.09,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  gap?: number
}) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: gap, delayChildren: delay } },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  y = 24,
}: {
  children: React.ReactNode
  className?: string
  y?: number
}) {
  const reduce = useReducedMotion()

  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  }

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}

/**
 * Editorial headline reveal: each line rises out of its own overflow mask,
 * the way type sets in print. Pass lines as an array of strings.
 */
export function RevealLines({
  lines,
  className,
  lineClassName,
  delay = 0,
}: {
  lines: React.ReactNode[]
  className?: string
  lineClassName?: string
  delay?: number
}) {
  const reduce = useReducedMotion()

  return (
    <span className={cn("block", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={cn("block", lineClassName)}
            initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 1,
              delay: delay + i * 0.11,
              ease: EASE,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
