"use client"

import Link from "next/link"
import Image from "next/image"
import { Plus, Star, ArrowUpRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Place } from "@/lib/places"
import { cn } from "@/lib/utils"

/**
 * The legacy card carried a small "+" button revealing exactly two options —
 * "View details" and "Book this trip". That affordance is preserved here, now
 * on a Popover so it closes on outside-click and Escape and is keyboard
 * reachable, which the old `toggleOptions` handler was not.
 */
function OptionsMenu({ place }: { place: Place }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Options for ${place.name}`}
        onClick={(e) => e.stopPropagation()}
        className="group/opt flex h-9 w-9 items-center justify-center rounded-full border border-sand-100/25 bg-brand-950/35 text-sand-100 backdrop-blur-md transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] hover:scale-105 hover:bg-brand-950/60 focus-visible:scale-105 data-[state=open]:rotate-45 data-[state=open]:bg-sand-200 data-[state=open]:text-brand-900"
      >
        <Plus className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-48 overflow-hidden rounded-xl border-sand-300 bg-paper p-1 shadow-[0_18px_40px_-24px_rgba(1,44,43,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/destinations/${place.slug}`}
          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-ink-900 transition-colors hover:bg-brand-50"
        >
          View details <ArrowUpRight className="h-3.5 w-3.5 text-ink-300" />
        </Link>
        <Link
          href={`/book/${place.slug}`}
          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-ink-900 transition-colors hover:bg-brand-50"
        >
          Book this trip <ArrowUpRight className="h-3.5 w-3.5 text-ink-300" />
        </Link>
      </PopoverContent>
    </Popover>
  )
}

export function DestinationCard({
  place,
  index,
  featured = false,
  priority = false,
}: {
  place: Place
  index: number
  featured?: boolean
  priority?: boolean
}) {
  const reduce = useReducedMotion()

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative isolate flex flex-col",
        featured && "md:col-span-2"
      )}
    >
      <Link
        href={`/destinations/${place.slug}`}
        className="relative block overflow-hidden rounded-[4px] bg-brand-900"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden",
            featured ? "aspect-4/3 md:aspect-16/10" : "aspect-4/5"
          )}
        >
          <Image
            src={place.image}
            alt={`${place.name} — ${place.region}`}
            fill
            priority={priority}
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-[1.1s] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/5 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
        </div>

        {/* index marker */}
        <span className="absolute top-4 left-4 font-display text-xs tracking-[0.18em] text-sand-100/70 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* price sits on the image, right where the eye lands last */}
        <span className="tnum absolute bottom-4 left-4 rounded-full bg-sand-200 px-3 py-1 text-[0.78rem] font-semibold text-brand-900">
          ${place.price}
        </span>
      </Link>

      <div className="absolute top-3.5 right-3.5 z-10">
        <OptionsMenu place={place} />
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="eyebrow text-ink-300">{place.region}</p>

        <h3
          className={cn(
            "mt-1.5 font-display tracking-[-0.025em] text-brand-900",
            featured ? "text-3xl md:text-4xl" : "text-[1.4rem]"
          )}
        >
          <Link
            href={`/destinations/${place.slug}`}
            className="link-underline"
          >
            {place.name}
          </Link>
        </h3>

        <p
          className={cn(
            "mt-2 text-ink-500",
            featured ? "max-w-md text-[0.95rem] leading-relaxed" : "text-sm"
          )}
        >
          {featured ? place.description : place.tagline}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-sand-300/70 pt-3 text-[0.8rem] text-ink-500">
          <span className="tnum flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-sand-400 text-sand-400" />
            {place.rating}
          </span>
          <span className="tnum">
            {place.days} &middot; {place.best}
          </span>
        </div>
      </div>
    </motion.article>
  )
}
