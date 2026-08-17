import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PLACES, getPlace } from "@/lib/places"
import { BookingForm } from "@/components/booking/booking-form"

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const place = getPlace(slug)
  if (!place) return { title: "Trip not found" }
  return {
    title: `Book ${place.name}`,
    description: `Request a place on the ${place.days} ${place.name} trip, from $${place.price} per person.`,
  }
}

export default async function BookPage({ params }: Params) {
  const { slug } = await params
  const place = getPlace(slug)

  if (!place) notFound()

  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-32 pb-24 sm:px-8 sm:pt-40 sm:pb-32">
      <BookingForm place={place} />
    </section>
  )
}
