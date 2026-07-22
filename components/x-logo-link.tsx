import { xProfileUrl } from "@/lib/config"
import { cn } from "@/lib/utils"

function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

type XLogoLinkProps = {
  className?: string
}

/** Brand social link to the AI Startup Quest X profile. */
export function XLogoLink({ className }: XLogoLinkProps) {
  return (
    <a
      href={xProfileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center border-2 border-[#1a1a2e] bg-[#ead9ab] text-[#1a1a2e] shadow-[3px_3px_0_#1a1a2e] transition-colors hover:bg-[#ffe66d]",
        className
      )}
      aria-label="Follow AI Startup Quest on X"
    >
      <XLogoIcon className="size-3.5" />
    </a>
  )
}
