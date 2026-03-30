"use client"

import { useState } from "react"
import { ArrowUpRight, MapPin } from "lucide-react"

import {
  CATEGORY_COLORS,
  categoryPillForeground,
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
} from "@/lib/company"
import { cn } from "@/lib/utils"

type CompanyCardProps = {
  company: Company
  active?: boolean
  compact?: boolean
  onSelect?: (slug: string) => void
}

export function CompanyCard({
  company,
  active = false,
  compact = false,
  onSelect,
}: CompanyCardProps) {
  const monogram = getCompanyMonogram(company)
  const categoryColor = CATEGORY_COLORS[company.category]

  const compactBody = (
    <article
      className={cn(
        "border-2 p-3 transition-all",
        active
          ? "border-[#f0f7e6] bg-[#2a2a4e] shadow-[3px_3px_0px_#f0f7e6]/20"
          : "border-[#3a3a5e] bg-[#1a1a2e] hover:border-[#f0f7e6]/40"
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo company={company} monogram={monogram} compact />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="border px-1.5 py-0.5 text-[8px] font-bold"
                  style={{
                    borderColor: categoryColor,
                    color: categoryColor,
                  }}
                >
                  {company.category}
                </span>
                {company.mapSprite === "boss" ? (
                  <span className="text-[8px] font-bold text-[#f26522]">
                    BOSS
                  </span>
                ) : null}
              </div>
              <h3 className="mt-1 text-sm font-bold text-[#f0f7e6]">
                {company.name}
              </h3>
            </div>
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit ${company.name}`}
              className="inline-flex size-7 shrink-0 items-center justify-center border-2 border-[#3a3a5e] bg-[#2a2a4e] text-[#f0f7e6]/70 transition-colors hover:border-[#4ecdc4] hover:text-[#4ecdc4]"
            >
              <ArrowUpRight className="size-3" />
            </a>
          </div>

          <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[#f0f7e6]/60">
            {company.shortDescription}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#f0f7e6]/40">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {company.locationLabel}
            </span>
            <span>Est. {company.founded}</span>
          </div>
        </div>
      </div>
    </article>
  )

  const body = (
    <article
      className={cn(
        "border-2 p-4 transition-all",
        active
          ? "border-[#f0f7e6] bg-[#2a2a4e] shadow-[4px_4px_0px_rgba(240,247,230,0.2)]"
          : "border-[#3a3a5e] bg-[#1a1a2e] hover:border-[#f0f7e6]/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="border-2 px-2 py-1 text-[8px] font-bold"
              style={{
                borderColor: categoryColor,
                backgroundColor: categoryColor,
                color: categoryPillForeground(company.category),
              }}
            >
              {company.category}
            </span>
            {company.mapSprite === "boss" ? (
              <span className="text-[10px] font-bold text-[#f26522]">BOSS</span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <CompanyLogo company={company} monogram={monogram} />
            <h3 className="min-w-0 text-lg font-bold text-[#f0f7e6]">
              {company.name}
            </h3>
          </div>
        </div>
        <a
          href={company.website}
          target="_blank"
          rel="noreferrer"
          aria-label={`Visit ${company.name}`}
          className="inline-flex size-9 shrink-0 items-center justify-center border-2 border-[#3a3a5e] bg-[#2a2a4e] text-[#4ecdc4] transition-colors hover:border-[#4ecdc4] hover:bg-[#4ecdc4] hover:text-[#1a1a2e]"
        >
          <ArrowUpRight className="size-4" />
        </a>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#f0f7e6]/70">
        {company.shortDescription}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#f0f7e6]/50">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {company.locationLabel}
        </span>
        <span>Est. {company.founded}</span>
        <a
          href={company.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#4ecdc4] underline-offset-2 hover:underline"
        >
          Source
        </a>
      </div>
    </article>
  )

  const cardBody = compact ? compactBody : body

  if (!onSelect || compact === false) {
    return cardBody
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(company.slug)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(company.slug)
        }
      }}
      className="w-full text-left outline-none"
    >
      {cardBody}
    </div>
  )
}

function CompanyLogo({
  company,
  monogram,
  compact = false,
}: {
  company: Company
  monogram: string
  compact?: boolean
}) {
  const [showFallback, setShowFallback] = useState(false)
  const categoryColor = CATEGORY_COLORS[company.category]

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border-2 bg-[#fffbe6]",
        compact ? "size-9" : "size-10"
      )}
      style={{ borderColor: categoryColor }}
    >
      {showFallback ? (
        <span
          className={cn("font-bold", compact ? "text-xs" : "text-sm")}
          style={{ color: categoryColor }}
        >
          {monogram}
        </span>
      ) : (
        <img
          src={getCompanyLogoUrl(company)}
          alt={`${company.name} logo`}
          className={cn("object-contain", compact ? "size-5" : "size-6")}
          loading="lazy"
          onError={() => setShowFallback(true)}
        />
      )}
    </div>
  )
}
