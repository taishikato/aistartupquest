"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import { Search } from "lucide-react"

import { CompanyCard } from "@/components/company-card"
import {
  COMPANY_CATEGORIES,
  CATEGORY_COLORS,
  type Company,
  type CompanyCategory,
} from "@/lib/companies"
import { cn } from "@/lib/utils"

type DiscoveryPanelProps = {
  companies: Company[]
  selectedCompany: Company
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
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto border-r-3 border-[#1a1a2e] bg-[#1a1a2e] p-5 text-[#f0f7e6]">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Image
              src="/brand-mark.svg"
              alt=""
              width={40}
              height={40}
              className="shrink-0"
              priority
            />
            <h1 className="font-[family-name:var(--font-pixel)] text-lg leading-relaxed tracking-tight text-[#ffe66d]">
              SF AI
              <br />
              Startup Map
            </h1>
          </div>
          <div className="font-[family-name:var(--font-pixel)] text-[8px] text-[#4ecdc4]">
            {companies.length} players on the board
          </div>
        </div>
      </div>

      <div className="space-y-4 border-2 border-[#3a3a5e] bg-[#2a2a4e] p-4">
        <label className="block">
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ffe66d]">
            Search
          </span>
          <span className="relative mt-2 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#f0f7e6]/50" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="OpenAI, agents, voice..."
              className="h-11 w-full border-2 border-[#3a3a5e] bg-[#1a1a2e] pr-4 pl-10 text-sm text-[#f0f7e6] outline-none transition-colors placeholder:text-[#f0f7e6]/30 focus:border-[#4ecdc4]"
            />
          </span>
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ffe66d]">
              Category
            </span>
            <button
              type="button"
              onClick={() => onCategoryChange("All")}
              className="font-[family-name:var(--font-pixel)] text-[7px] text-[#ff6b6b] hover:text-[#ff6b6b]/80"
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
                  company.slug === selectedCompany.slug ? activeItemRef : null
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
            <h3 className="font-[family-name:var(--font-pixel)] text-[9px] text-[#ff6b6b]">
              No match found!
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#f0f7e6]/70">
              Clear the search or switch to All to broaden the view.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3 lg:hidden">
        <h2 className="font-[family-name:var(--font-pixel)] text-[8px] text-[#4ecdc4]">
          Selected
        </h2>
        <CompanyCard company={selectedCompany} active />
      </section>
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
