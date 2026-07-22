import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Trip-Mate",
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
      <body>{children}</body>
    </html>
  )
}
