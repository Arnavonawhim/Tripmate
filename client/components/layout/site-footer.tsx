import Link from "next/link"

const COLUMNS = [
  {
    heading: "Trips",
    links: [
      { href: "/destinations", label: "All destinations" },
      { href: "/destinations/ladakh", label: "Ladakh" },
      { href: "/destinations/kerala-backwaters", label: "Kerala backwaters" },
      { href: "/destinations/island-beaches", label: "Andaman islands" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Product",
    links: [
      { href: "/chat", label: "Travel assistant" },
      { href: "/console", label: "Gateway console" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="dark grain relative isolate overflow-hidden bg-brand-950 text-sand-100">
      <div className="relative z-10 mx-auto max-w-[1240px] px-5 pt-20 pb-10 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <p className="font-display text-2xl tracking-[-0.02em] text-sand-200">
              Tripmate
            </p>
            <p className="mt-3 text-sm leading-relaxed text-sand-100/60">
              Small-group trips across the subcontinent, with a multi-model AI
              assistant that actually knows the route.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h2 className="eyebrow text-sand-100/40">{col.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-underline text-sm text-sand-100/75 transition-colors hover:text-sand-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none mt-16 -mb-4 hidden overflow-hidden select-none md:block"
        >
          <p className="font-display text-[clamp(4rem,15vw,13rem)] leading-[0.8] font-light tracking-[-0.045em] text-sand-100/[0.055]">
            TRIPMATE
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-sand-100/10 pt-6 text-xs text-sand-100/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} Tripmate Travel. Capped at twelve
            people, always.
          </span>
          <span>Consensus router &middot; vision worker &middot; FastAPI</span>
        </div>
      </div>
    </footer>
  )
}
