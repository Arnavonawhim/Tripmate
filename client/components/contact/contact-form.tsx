"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, Check } from "lucide-react"
import { ask } from "@/lib/api"
import { cn } from "@/lib/utils"

const schema = z.object({
  name: z.string().trim().min(2, "We need something to call you"),
  email: z.email("That email address doesn't look right"),
  message: z.string().trim().min(10, "A sentence or two helps us answer well"),
})

type ContactValues = z.infer<typeof schema>

const inputClass =
  "w-full border-0 border-b border-sand-300 bg-transparent px-0 py-3 text-[1.05rem] text-ink-900 outline-none transition-colors duration-300 placeholder:text-ink-300/70 focus:border-brand-700 aria-[invalid=true]:border-rust"

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const reduce = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
    mode: "onBlur",
  })

  async function onSubmit(values: ContactValues) {
    setFailed(null)

    // Identical payload to the legacy submitContact(): the three fields
    // concatenated into one prompt, POSTed to /ask with strategy "semantic".
    const fullMessage = `Name: ${values.name}\nEmail: ${values.email}\nMessage: ${values.message}`

    try {
      await ask(fullMessage, "semantic")
      setSent(true)
    } catch {
      // The legacy handler revealed the success line even when the router
      // returned an error. It now reports the failure instead.
      setFailed(
        "That didn't send — the router may be offline. Try again, or email us directly."
      )
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-sand-300 pt-10"
        >
          <motion.span
            initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-sand-100"
          >
            <Check className="h-5 w-5" />
          </motion.span>
          <h2 className="mt-6 font-display text-2xl tracking-[-0.02em] text-brand-900">
            Message queued
          </h2>
          <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-ink-500">
            Someone will read it properly and reply — usually within a working
            day.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          exit={{ opacity: 0, y: reduce ? 0 : -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-8 border-t border-sand-300 pt-10"
        >
          <div>
            <label htmlFor="name" className="eyebrow block text-ink-300">
              Your name
            </label>
            <input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              aria-invalid={!!errors.name}
              className={cn(inputClass, "mt-2")}
              {...register("name")}
            />
            {errors.name && (
              <p role="alert" className="pt-1.5 text-[0.8rem] text-rust">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="eyebrow block text-ink-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              aria-invalid={!!errors.email}
              className={cn(inputClass, "mt-2")}
              {...register("email")}
            />
            {errors.email && (
              <p role="alert" className="pt-1.5 text-[0.8rem] text-rust">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="message" className="eyebrow block text-ink-300">
              Where would you like to go?
            </label>
            <textarea
              id="message"
              rows={5}
              placeholder="Where would you like to go?"
              aria-invalid={!!errors.message}
              className={cn(inputClass, "mt-2 resize-y")}
              {...register("message")}
            />
            {errors.message && (
              <p role="alert" className="pt-1.5 text-[0.8rem] text-rust">
                {errors.message.message}
              </p>
            )}
          </div>

          {failed && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-[4px] border border-rust/25 bg-rust/5 px-4 py-3 text-[0.85rem] text-rust"
            >
              {failed}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-8 py-4.5 text-sm font-medium text-sand-100 transition-all duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-brand-800 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                Sending
              </>
            ) : (
              <>
                Send message
                <ArrowRight className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-1" />
              </>
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
