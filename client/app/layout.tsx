import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Tripmate — Small-group trips, planned properly",
    template: "%s — Tripmate",
  },
  description:
    "Twelve-person trips to Ladakh, the Himalaya, the Andamans and the Kerala backwaters, with a multi-model AI assistant for the planning in between.",
  icons: { icon: "/assets/logo.png" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="grain-fixed">
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-paper !border-sand-300 !text-ink-900 !rounded-xl !font-sans",
            },
          }}
        />
      </body>
    </html>
  )
}
