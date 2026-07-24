"use client"

import { useState } from "react"

import {
  CATEGORY_COLORS,
  categoryPillForeground,
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
} from "@/lib/company"
import { cn } from "@/lib/utils"

type CompanyCategoryTagProps = {
  company: Company
  compact?: boolean
  filled?: boolean
}

type CompanyLogoBadgeProps = {
  company: Company
  compact?: boolean
  large?: boolean
}

export function CompanyCategoryTag({
  company,
  compact = false,
  filled = false,
}: CompanyCategoryTagProps) {
  const categoryColor = CATEGORY_COLORS[company.category]

  return (
    <span
      className={cn(
        "font-bold",
        compact
          ? "border px-1.5 py-0.5 text-[8px]"
          : "border-2 px-2 py-1 text-[8px]"
      )}
      style={{
        borderColor: categoryColor,
        backgroundColor: filled ? categoryColor : "transparent",
        color: filled
          ? categoryPillForeground(company.category)
          : categoryColor,
      }}
    >
      {company.category}
    </span>
  )
}

export function CompanyLogoBadge({
  company,
  compact = false,
  large = false,
}: CompanyLogoBadgeProps) {
  const [showFallback, setShowFallback] = useState(false)
  const monogram = getCompanyMonogram(company)
  const categoryColor = CATEGORY_COLORS[company.category]

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border-2 bg-[#fffbe6]",
        large ? "size-28" : compact ? "size-9" : "size-10"
      )}
      style={{ borderColor: categoryColor }}
    >
      {showFallback ? (
        <span
          className={cn(
            "font-bold",
            large ? "text-3xl" : compact ? "text-xs" : "text-sm"
          )}
          style={{ color: categoryColor }}
        >
          {monogram}
        </span>
      ) : (
        // External logo hosts vary by company; plain img keeps fallback behavior stable.
        <img
          src={getCompanyLogoUrl(company)}
          alt={`${company.name} logo`}
          className={cn(
            "object-contain",
            large ? "size-16" : compact ? "size-5" : "size-6"
          )}
          loading="lazy"
          onError={() => setShowFallback(true)}
        />
      )}
    </div>
  )
}
