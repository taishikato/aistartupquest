import Image from "next/image"

const comments = [
  {
    quote: "this is fun, thanks for making it Taishi!",
    name: "Ben Lang",
    handle: "@benln",
    avatar: "/testimonials/benln.jpg",
    href: "https://x.com/benln/status/2079107571131015228",
  },
  {
    quote:
      "Taishi and I were talking about this a while back, wow awesome to see it",
    name: "Tibor (Tee)",
    handle: "@tibor_tee",
    avatar: "/testimonials/tibor_tee.jpg",
    href: "https://x.com/tibor_tee/status/2078920423161679926",
  },
] as const

export function AdventurersLog() {
  return (
    <section aria-label="Adventurer's log" className="mt-5">
      <h2 className="font-(family-name:--font-pixel) text-[8px] leading-4 text-[#8b6914]">
        Adventurer&apos;s log
      </h2>
      <div className="mt-2 grid gap-3">
        {comments.map((comment) => (
          <figure
            key={comment.href}
            className="border-2 border-[#95602f] bg-[#ead9ab] p-3 shadow-[3px_3px_0_#1a1a2e]"
          >
            <blockquote>
              <p className="text-xs leading-5 text-[#1a1a2e]">
                {comment.quote}
              </p>
            </blockquote>
            <figcaption className="mt-2 flex items-center gap-2">
              <Image
                src={comment.avatar}
                alt={comment.name}
                width={36}
                height={36}
                className="size-9 shrink-0 border-2 border-[#95602f] object-cover"
              />
              <a
                href={comment.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-wrap items-center gap-x-1.5 text-xs font-bold text-[#8b6914] underline decoration-2 underline-offset-2 hover:text-[#1a1a2e]"
              >
                <span>{comment.name}</span>
                <span className="font-(family-name:--font-pixel) text-[7px] leading-4">
                  {comment.handle}
                </span>
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
