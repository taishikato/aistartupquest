import { XLogoLink } from "@/components/x-logo-link"

const X_PROFILE_URL = "https://x.com/taishik_"

export function CompanyAddInvite() {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-start gap-2">
      <XLogoLink />
      <a
        href={X_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block border-2 border-[#1a1a2e] bg-[#ead9ab] px-3 py-2 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] shadow-[3px_3px_0_#1a1a2e] transition-colors hover:bg-[#ffe66d]"
      >
        Want to add your startup? DM me on X!
      </a>
    </div>
  )
}
