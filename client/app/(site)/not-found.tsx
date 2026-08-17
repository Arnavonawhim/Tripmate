import Link from "next/link"

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] max-w-[1240px] flex-col justify-center px-5 py-32 sm:px-8">
      <p className="eyebrow text-ink-300">404</p>
      <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.98] font-light tracking-[-0.04em] text-brand-900">
        That route doesn&rsquo;t exist
      </h1>
      <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-500">
        The page or trip you were after isn&rsquo;t here. We only run four
        routes — one of them is probably the one you meant.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          href="/destinations"
          className="rounded-full bg-brand-700 px-6 py-3 text-sm font-medium text-sand-100 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5"
        >
          See all four
        </Link>
        <Link
          href="/"
          className="rounded-full border border-sand-300 px-6 py-3 text-sm text-ink-700 transition-colors hover:border-brand-700 hover:text-brand-700"
        >
          Back home
        </Link>
      </div>
    </section>
  )
}
