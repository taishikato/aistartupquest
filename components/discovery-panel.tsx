"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"

import {
  CATEGORY_COLORS,
  COMPANY_CATEGORIES,
  type Company,
  type CompanyCategory,
} from "@/lib/company"
import { cn } from "@/lib/utils"
import { CompanyCard } from "@/components/company-card"

type DiscoveryPanelProps = {
  companies: Company[]
  selectedCompany: Company
  titleLines: [string, string]
  searchPlaceholder: string
  search: string
  onSearchChange: (value: string) => void
  category: CompanyCategory | "All"
  onCategoryChange: (value: CompanyCategory | "All") => void
  onSelectCompany: (slug: string) => void
}

const FILTER_ALL_COLOR = "#1a1a2e"

export function DiscoveryPanel({
  companies,
  selectedCompany,
  titleLines,
  searchPlaceholder,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onSelectCompany,
}: DiscoveryPanelProps) {
  const activeItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const activeItem = activeItemRef.current
    const isSelectedVisible = companies.some(
      (company) => company.slug === selectedCompany.slug
    )

    if (!activeItem || !isSelectedVisible) {
      return
    }

    activeItem.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }, [companies, selectedCompany.slug])

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r-3 border-[#1a1a2e] bg-[#1a1a2e] text-[#f0f7e6]">
      <div className="shrink-0 border-b-2 border-[#3a3a5e] bg-[#1a1a2e] px-5 pt-5 pb-4 shadow-[0_6px_14px_rgba(26,26,46,0.5)]">
        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-start gap-3 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4ecdc4]"
          >
            <Image
              src="/brand-mark.png"
              alt=""
              width={40}
              height={40}
              className="shrink-0"
              priority
            />
            <h1 className="font-(family-name:--font-pixel) text-lg leading-relaxed tracking-tight text-[#ffe66d]">
              {titleLines[0]}
              <br />
              {titleLines[1]}
            </h1>
          </Link>
          <div className="font-(family-name:--font-pixel) text-[8px] text-[#4ecdc4]">
            {companies.length} players on the board
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
        <div className="flex flex-col gap-4">
          <div className="space-y-4 border-2 border-[#3a3a5e] bg-[#2a2a4e] p-4">
            <label className="block">
              <span className="font-(family-name:--font-pixel) text-[8px] text-[#ffe66d]">
                Search
              </span>
              <span className="relative mt-2 block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#f0f7e6]/50" />
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-11 w-full border-2 border-[#3a3a5e] bg-[#1a1a2e] pr-4 pl-10 text-sm text-[#f0f7e6] transition-colors outline-none placeholder:text-[#f0f7e6]/30 focus:border-[#4ecdc4]"
                />
              </span>
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-(family-name:--font-pixel) text-[8px] text-[#ffe66d]">
                  Category
                </span>
                <button
                  type="button"
                  onClick={() => onCategoryChange("All")}
                  className="font-(family-name:--font-pixel) text-[7px] text-[#ff6b6b] hover:text-[#ff6b6b]/80"
                >
                  Reset
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterPill
                  active={category === "All"}
                  label="All"
                  color={FILTER_ALL_COLOR}
                  onClick={() => onCategoryChange("All")}
                />
                {COMPANY_CATEGORIES.map((item) => (
                  <FilterPill
                    key={item}
                    active={category === item}
                    label={item}
                    color={CATEGORY_COLORS[item]}
                    onClick={() => onCategoryChange(item)}
                  />
                ))}
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-pixel)] text-[8px] text-[#4ecdc4]">
                On the map
              </h2>
              <span className="font-[family-name:var(--font-pixel)] text-[6px] text-[#f0f7e6]/50">
                Tap to select
              </span>
            </div>
            {companies.length > 0 ? (
              <div className="grid gap-3 pr-1">
                {companies.map((company) => (
                  <div
                    key={company.slug}
                    ref={
                      company.slug === selectedCompany.slug
                        ? activeItemRef
                        : null
                    }
                  >
                    <CompanyCard
                      company={company}
                      compact
                      active={company.slug === selectedCompany.slug}
                      onSelect={onSelectCompany}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#3a3a5e] bg-[#2a2a4e] p-6">
                <h3 className="font-(family-name:--font-pixel) text-[9px] text-[#ff6b6b]">
                  No match found!
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#f0f7e6]/70">
                  Clear the search or switch to All to broaden the view.
                </p>
              </div>
            )}
          </section>

          <section className="space-y-3 lg:hidden">
            <h2 className="font-(family-name:--font-pixel) text-[8px] text-[#4ecdc4]">
              Selected
            </h2>
            <CompanyCard company={selectedCompany} active />
          </section>
        </div>
      </div>
    </aside>
  )
}

function FilterPill({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-2 px-3 py-2 text-[10px] font-bold transition-colors",
        active
          ? "border-[#1a1a2e] text-[#1a1a2e] shadow-[2px_2px_0px_#1a1a2e]"
          : "border-[#3a3a5e] text-[#f0f7e6]/70 hover:text-[#f0f7e6]"
      )}
      style={{
        backgroundColor: active ? color : "transparent",
        color: active
          ? label === "Devtools" || label === "Vertical AI"
            ? "#1a1a2e"
            : "#ffffff"
          : undefined,
      }}
    >
      {label}
    </button>
  )
}
