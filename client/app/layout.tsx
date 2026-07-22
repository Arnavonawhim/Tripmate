import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Trip-Mate — AI Travel Gateway",
  description:
    "Multi-model AI travel gateway - consensus routing, streaming, vision & metrics",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="aurora" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="grid-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
