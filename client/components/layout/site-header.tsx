"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

{/*const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/chat", label: "Assistant" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]
*/}
const NAV = [
  { href: "/chat", label: "Assistant" },
  { href: "/about", label: "About" },
  { href: "/console", label: "Console" },
]
export function SiteHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  // Routes that open with a full-bleed dark image behind the header. While
  // unscrolled there, the nav has to invert or it disappears into the photo.
  const overHero =
    pathname === "/" ||
    pathname === "/console" ||
    /^\/destinations\/[^/]+$/.test(pathname)

  const onDark = overHero && !scrolled

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        "[transition-timing-function:var(--ease-out-expo)]",
        scrolled
          ? "border-b border-sand-300/70 bg-sand-100/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 transition-all duration-500 sm:px-8",
          scrolled ? "h-16" : "h-20"
        )}
      >
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Tripmate — home"
        >
          <Image
            src="/assets/logo.png"
            alt=""
            width={34}
            height={34}
            className="h-[30px] w-[30px] transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-0.5"
            priority
          />
          <span
            className={cn(
              "font-display text-[1.35rem] leading-none font-semibold tracking-[-0.02em] transition-colors duration-500",
              onDark ? "text-sand-100" : "text-brand-900"
            )}
          >
            Tripmate
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative py-1 text-[0.9rem] tracking-[-0.01em] transition-colors duration-300",
                onDark
                  ? isActive(item.href)
                    ? "text-sand-200"
                    : "text-sand-100/75 hover:text-sand-100"
                  : isActive(item.href)
                    ? "text-brand-700"
                    : "text-ink-500 hover:text-brand-800"
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-underline"
                  className={cn(
                    "absolute -bottom-0.5 left-0 h-px w-full",
                    onDark ? "bg-sand-200" : "bg-brand-700"
                  )}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/*<Link
            href="/console"
            className={cn(
              "hidden text-[0.78rem] tracking-[0.02em] transition-colors duration-300 lg:block",
              onDark
                ? "text-sand-100/55 hover:text-sand-200"
                : "text-ink-300 hover:text-brand-700"
            )}
          >
            Console
          </Link>
          */}

          <Link
            href="/chat"
            className={cn(
              "group relative hidden overflow-hidden rounded-full px-5 py-2.5 text-[0.85rem] font-medium transition-all duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-0.5 active:translate-y-0 sm:inline-flex",
              onDark
                ? "bg-sand-200 text-brand-900"
                : "bg-brand-700 text-sand-100"
            )}
          >
            <span
              className={cn(
                "absolute inset-0 -translate-x-full transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-0",
                onDark ? "bg-paper" : "bg-brand-800"
              )}
            />
            <span className="relative">Ask the assistant</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden",
                onDark
                  ? "text-sand-100 hover:bg-sand-100/10"
                  : "text-brand-900 hover:bg-brand-50"
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full border-l-sand-300 bg-sand-100 sm:max-w-sm"
            >
              <SheetHeader className="border-b border-sand-300/70">
                <SheetTitle className="font-display text-xl text-brand-900">
                  Tripmate
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col px-2 py-4" aria-label="Mobile">
               {/*} {[...NAV, { href: "/console", label: "Console" }].map(
                  (item, i) => (
                    <SheetClose asChild key={item.href}>*/}
                    {NAV.map((item, i) => (
                      <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "animate-in fade-in slide-in-from-right-4 border-b border-sand-300/50 py-4 font-display text-[1.6rem] tracking-[-0.02em] transition-colors last:border-0",
                          isActive(item.href)
                            ? "text-brand-700"
                            : "text-brand-900 hover:text-brand-600"
                        )}
                        style={{
                          animationDelay: `${i * 55}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  )
                )}
              </nav>

              <div className="mt-auto p-4">
                <SheetClose asChild>
                  <Link
                    href="/chat"
                    className="block rounded-full bg-brand-700 px-6 py-4 text-center text-sm font-medium text-sand-100"
                  >
                    Ask the assistant
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
