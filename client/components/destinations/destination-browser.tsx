"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type FormEvent,
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Search, X } from "lucide-react"
import { PLACES, searchPlaces, type Place } from "@/lib/places"
import { DestinationCard } from "@/components/destinations/destination-card"
import { cn } from "@/lib/utils"

type Ctx = {
  query: string
  setQuery: (q: string) => void
  results: Place[]
}

const SearchCtx = createContext<Ctx | null>(null)

function useDestinationSearch() {
  const ctx = useContext(SearchCtx)
  if (!ctx) {
    throw new Error(
      "Destination search components must be used inside <DestinationSearchProvider>"
    )
  }
  return ctx
}

export function DestinationSearchProvider({
  children,
  initialQuery = "",
}: {
  children: React.ReactNode
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)

  // Same predicate as the legacy handleSearch: name + region, case-insensitive.
  const results = useMemo(() => searchPlaces(query), [query])

  return (
    <SearchCtx.Provider value={{ query, setQuery, results }}>
      {children}
    </SearchCtx.Provider>
  )
}

export function DestinationSearchField({
  className,
  tone = "light",
  placeholder = "Ladakh, backwaters, the Andamans…",
}: {
  className?: string
  tone?: "light" | "onImage"
  placeholder?: string
}) {
  const { query, setQuery, results } = useDestinationSearch()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Results already update as you type; submitting just moves focus along
    // without reloading the page, as the legacy form did.
    e.preventDefault()
    document
      .getElementById("destination-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const onImage = tone === "onImage"

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn(
        "group flex items-center gap-3 rounded-full border py-2 pr-2 pl-5 transition-all duration-500 [transition-timing-function:var(--ease-out-expo)]",
        onImage
          ? "border-sand-100/25 bg-brand-950/30 backdrop-blur-lg focus-within:border-sand-200/60 focus-within:bg-brand-950/50"
          : "border-sand-300 bg-paper focus-within:border-brand-400",
        className
      )}
    >
      <Search
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          onImage ? "text-sand-100/60" : "text-ink-300"
        )}
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search destinations"
        className={cn(
          "min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] outline-none",
          onImage
            ? "text-sand-100 placeholder:text-sand-100/45"
            : "text-ink-900 placeholder:text-ink-300"
        )}
      />

      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className={cn(
            "rounded-full p-1.5 transition-colors",
            onImage
              ? "text-sand-100/60 hover:bg-sand-100/10 hover:text-sand-100"
              : "text-ink-300 hover:bg-brand-50 hover:text-ink-700"
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="submit"
        className={cn(
          "tnum shrink-0 rounded-full px-5 py-2.5 text-[0.85rem] font-medium transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-px active:translate-y-0",
          onImage
            ? "bg-sand-200 text-brand-900 hover:bg-paper"
            : "bg-brand-700 text-sand-100 hover:bg-brand-800"
        )}
      >
        {results.length === PLACES.length
          ? "Search"
          : `${results.length} match${results.length === 1 ? "" : "es"}`}
      </button>
    </form>
  )
}

export function DestinationResults({
  featureFirst = false,
  className,
}: {
  featureFirst?: boolean
  className?: string
}) {
  const { results, query, setQuery } = useDestinationSearch()
  const reduce = useReducedMotion()

  if (results.length === 0) {
    return (
      <div
        id="destination-results"
        className="rounded-[4px] border border-dashed border-sand-300 bg-sand-50 px-6 py-20 text-center"
      >
        <p className="font-display text-2xl text-brand-900">
          Nothing matches &ldquo;{query}&rdquo;
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
          We run four trips at the moment. Try a region, or ask the assistant to
          build something custom.
        </p>
        <button
          onClick={() => setQuery("")}
          className="mt-6 rounded-full border border-brand-700 px-5 py-2.5 text-sm text-brand-700 transition-colors hover:bg-brand-700 hover:text-sand-100"
        >
          Show all four
        </button>
      </div>
    )
  }

  return (
    <div
      id="destination-results"
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {results.map((place, i) => (
          <motion.div
            key={place.slug}
            layout={!reduce}
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
            transition={{
              duration: 0.55,
              delay: i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(featureFirst && i === 0 && "sm:col-span-2")}
          >
            <DestinationCard
              place={place}
              index={PLACES.findIndex((p) => p.slug === place.slug)}
              featured={featureFirst && i === 0}
              priority={i < 2}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

