export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items]

  return (
    <div
      className="marquee-host relative flex overflow-hidden border-y border-sand-300/70 bg-sand-50 py-3.5 select-none"
      aria-hidden="true"
    >
      <div className="marquee-track flex shrink-0 items-center gap-10 pr-10">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="eyebrow flex shrink-0 items-center gap-10 text-ink-500"
          >
            {item}
            <span className="text-sand-400">&#10022;</span>
          </span>
        ))}
      </div>
    </div>
  )
}
