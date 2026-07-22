import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Trip-Mate — Gateway Console",
  description:
    "Multi-model AI travel gateway - consensus routing, streaming, vision & telemetry",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
