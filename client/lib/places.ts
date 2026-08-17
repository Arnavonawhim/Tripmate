/**
 * Destination data — ported verbatim from the legacy `data.js` PLACES array.
 * Every original field (slug, name, region, image, rating, price, days, best,
 * description, highlights) is unchanged. Editorial fields are additive.
 */

export type PlaceFact = { label: string; value: string }

export type Place = {
  slug: string
  name: string
  region: string
  image: string
  rating: number
  price: number
  days: string
  best: string
  description: string
  highlights: string[]
  /** Short editorial line used on cards and the detail hero. */
  tagline: string
  /** Fact strip on the detail page. */
  facts: PlaceFact[]
}

export const PLACES: Place[] = [
  {
    slug: "ladakh",
    name: "Ladakh",
    region: "Jammu & Kashmir, India",
    image: "/assets/ladakh.jpg",
    rating: 4.9,
    price: 480,
    days: "6 days",
    best: "May - Sep",
    description:
      "High-altitude desert of turquoise lakes, monasteries and endless mountain passes. Pangong Tso, Nubra Valley and Khardung La in one unforgettable loop.",
    highlights: [
      "Pangong Tso lake",
      "Nubra Valley dunes",
      "Thiksey Monastery",
      "Khardung La pass",
    ],
    tagline: "Six days above three thousand metres",
    facts: [
      { label: "Altitude", value: "3,500–5,350 m" },
      { label: "Pace", value: "Two acclimatisation days first" },
      { label: "Nights", value: "Guesthouses and one camp" },
      { label: "Group", value: "Capped at 12" },
    ],
  },
  {
    slug: "himalayan-peaks",
    name: "Himalayan Peaks",
    region: "Uttarakhand, India",
    image: "/assets/mountain.jpg",
    rating: 4.8,
    price: 390,
    days: "5 days",
    best: "Mar - Jun",
    description:
      "Sunrise over snow-capped giants, alpine meadows and quiet trekking trails through pine forests and old hill villages.",
    highlights: [
      "Sunrise viewpoint trek",
      "Alpine meadow camp",
      "Local homestay",
      "Stargazing night",
    ],
    tagline: "Up before the light, every morning",
    facts: [
      { label: "Walking", value: "4–6 hrs most days" },
      { label: "Terrain", value: "Forest trail to open meadow" },
      { label: "Nights", value: "Homestay and meadow camp" },
      { label: "Group", value: "Capped at 12" },
    ],
  },
  {
    slug: "island-beaches",
    name: "Island Beaches",
    region: "Andaman Islands",
    image: "/assets/beach.jpg",
    rating: 4.7,
    price: 540,
    days: "4 days",
    best: "Nov - Apr",
    description:
      "Powder-white sand, coral reefs and water so clear you can count the fish. Perfect for snorkelling and slow mornings.",
    highlights: [
      "Coral reef snorkelling",
      "Sunset kayaking",
      "Beach shack dining",
      "Island hopping",
    ],
    tagline: "Water clear enough to count the fish",
    facts: [
      { label: "In the water", value: "Reef snorkelling daily" },
      { label: "Pace", value: "Deliberately unhurried" },
      { label: "Nights", value: "Beachfront, two islands" },
      { label: "Group", value: "Capped at 12" },
    ],
  },
  {
    slug: "kerala-backwaters",
    name: "Kerala Backwaters",
    region: "Kerala, India",
    image: "/assets/backwaters.jpg",
    rating: 4.8,
    price: 320,
    days: "3 days",
    best: "Sep - Mar",
    description:
      "Drift through palm-lined canals on a traditional houseboat, with village life unfolding on both banks.",
    highlights: [
      "Houseboat overnight",
      "Canoe village tour",
      "Ayurveda spa",
      "Toddy tapping visit",
    ],
    tagline: "Village life on both banks, at four knots",
    facts: [
      { label: "On water", value: "Two nights aboard" },
      { label: "Pace", value: "Slow by design" },
      { label: "Food", value: "Cooked on board, Keralan" },
      { label: "Group", value: "Capped at 12" },
    ],
  },
]

export function getPlace(slug: string | undefined): Place | undefined {
  return PLACES.find((p) => p.slug === slug)
}

/**
 * Same predicate the legacy `handleSearch` used: case-insensitive substring
 * match against name + region concatenated.
 */
export function searchPlaces(query: string): Place[] {
  const q = query.trim().toLowerCase()
  if (!q) return PLACES
  return PLACES.filter((p) => (p.name + p.region).toLowerCase().includes(q))
}
