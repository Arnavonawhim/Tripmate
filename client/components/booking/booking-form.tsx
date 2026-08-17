"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from "lucide-react"
import type { Place } from "@/lib/places"
import { cn } from "@/lib/utils"

const schema = z.object({
  name: z.string().trim().min(2, "We need a name for the booking"),
  email: z.email("That email address doesn't look right"),
  date: z.string().min(1, "Pick a start date"),
  guests: z
    .number({ error: "Enter a number of travellers" })
    .int()
    .min(1, "At least one traveller")
    .max(12, "Twelve is the hard cap — email us for larger groups"),
})

type BookingValues = z.infer<typeof schema>

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string
  error?: string
  children: React.ReactNode
  htmlFor: string
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="eyebrow block text-ink-300"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            role="alert"
            className="overflow-hidden pt-1.5 text-[0.8rem] text-rust"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

const inputClass =
  "w-full border-0 border-b border-sand-300 bg-transparent px-0 py-3 text-[1.05rem] text-ink-900 outline-none transition-colors duration-300 placeholder:text-ink-300/70 focus:border-brand-700 aria-[invalid=true]:border-rust"

export function BookingForm({ place }: { place: Place }) {
  const [submitted, setSubmitted] = useState(false)
  const reduce = useReducedMotion()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", date: "", guests: 2 },
    mode: "onBlur",
  })

  // Identical to the legacy updateTotal(): price × guests, falling back to 1.
  const guests = Number(watch("guests")) || 1
  const total = place.price * guests

  // Reads the live form value rather than the render-time closure, so rapid
  // clicks on the steppers each apply instead of collapsing into one.
  function stepGuests(delta: number) {
    const current = Number(getValues("guests")) || 1
    setValue("guests", Math.min(12, Math.max(1, current + delta)), {
      shouldValidate: true,
    })
  }

  // The legacy submitBooking() only called preventDefault() and revealed the
  // confirmation — no request was ever sent. That behaviour is preserved.
  function onSubmit() {
    setSubmitted(true)
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
      {/* ------------------------- the form ------------------------- */}
      <div>
        <Link
          href={`/destinations/${place.slug}`}
          className="group inline-flex items-center gap-2 text-[0.82rem] text-ink-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-x-1" />
          Back to {place.name}
        </Link>

        <p className="eyebrow mt-8 text-ink-300">Request a place</p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,5.5vw,3.5rem)] leading-[1] font-light tracking-[-0.035em] text-brand-900">
          Book {place.name}
        </h1>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-500">
          Nothing is charged now. We confirm the departure has space, then send
          a payment link — usually within a working day.
        </p>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 border-t border-sand-300 pt-10"
            >
              <motion.span
                initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-sand-100"
              >
                <Check className="h-5 w-5" />
              </motion.span>

              <h2 className="mt-6 font-display text-2xl tracking-[-0.02em] text-brand-900">
                Request received
              </h2>
              <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-ink-500">
                We&rsquo;ll confirm availability by email. If the departure is
                full we&rsquo;ll offer you the next one before anyone else.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/destinations"
                  className="rounded-full bg-brand-700 px-6 py-3 text-sm font-medium text-sand-100 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5"
                >
                  Browse the other trips
                </Link>
                <Link
                  href="/chat"
                  className="rounded-full border border-sand-300 px-6 py-3 text-sm text-ink-700 transition-colors hover:border-brand-700 hover:text-brand-700"
                >
                  Ask about packing
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              exit={{ opacity: 0, y: reduce ? 0 : -10 }}
              transition={{ duration: 0.3 }}
              className="mt-12 space-y-8 border-t border-sand-300 pt-10"
            >
              <Field label="Full name" htmlFor="name" error={errors.name?.message}>
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="Full name"
                  aria-invalid={!!errors.name}
                  className={inputClass}
                  {...register("name")}
                />
              </Field>

              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  aria-invalid={!!errors.email}
                  className={inputClass}
                  {...register("email")}
                />
              </Field>

              <Field
                label="Start date"
                htmlFor="date"
                error={errors.date?.message}
              >
                <input
                  id="date"
                  type="date"
                  aria-invalid={!!errors.date}
                  className={cn(inputClass, "tnum")}
                  {...register("date")}
                />
              </Field>

              <Field
                label="Travellers"
                htmlFor="guests"
                error={errors.guests?.message}
              >
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => stepGuests(-1)}
                    disabled={guests <= 1}
                    aria-label="One fewer traveller"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-300 text-ink-700 transition-all duration-300 hover:border-brand-700 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-35"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <input
                    id="guests"
                    type="number"
                    min={1}
                    max={12}
                    aria-invalid={!!errors.guests}
                    className="tnum w-16 border-0 border-b border-sand-300 bg-transparent py-3 text-center font-display text-2xl text-ink-900 outline-none focus:border-brand-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    {...register("guests", { valueAsNumber: true })}
                  />

                  <button
                    type="button"
                    onClick={() => stepGuests(1)}
                    disabled={guests >= 12}
                    aria-label="One more traveller"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-300 text-ink-700 transition-all duration-300 hover:border-brand-700 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-35"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <span className="text-sm text-ink-300">of 12 places</span>
                </div>
              </Field>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-8 py-4.5 text-sm font-medium text-sand-100 transition-all duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-brand-800 active:translate-y-0"
              >
                Request booking
                <ArrowRight className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* ------------------------ trip summary ------------------------ */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-[4px] border border-sand-300 bg-paper">
          <div className="relative aspect-16/10">
            <Image
              src={place.image}
              alt={place.name}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 to-transparent" />
            <div className="absolute right-5 bottom-4 left-5">
              <p className="eyebrow text-sand-200/80">{place.region}</p>
              <p className="font-display text-2xl tracking-[-0.02em] text-sand-100">
                {place.name}
              </p>
            </div>
          </div>

          <div className="p-6">
            <dl className="tnum space-y-3 text-[0.9rem]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Length</dt>
                <dd className="text-ink-900">{place.days}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Best window</dt>
                <dd className="text-ink-900">{place.best}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Per person</dt>
                <dd className="text-ink-900">${place.price}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Travellers</dt>
                <dd className="text-ink-900">&times; {guests}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-sand-300 pt-5">
              <span className="text-sm text-ink-500">Estimated total</span>
              <motion.span
                key={total}
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="tnum font-display text-3xl tracking-[-0.03em] text-brand-900"
              >
                ${total}
              </motion.span>
            </div>

            <p className="mt-4 text-[0.78rem] leading-relaxed text-ink-300">
              Estimate only. Nothing is charged until we confirm the departure
              and send a payment link.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
