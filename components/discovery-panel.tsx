"use client"

import { useEffect, useRef } from "react"
import { Search } from "lucide-react"

import { CompanyCard } from "@/components/company-card"
import {
  COMPANY_CATEGORIES,
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
    const isSelectedVisible = companies.some((company) => company.slug === selectedCompany.slug)

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
    <aside className="flex min-h-0 h-full flex-col gap-4 overflow-y-auto border border-border bg-card p-5">
      <div className="space-y-4">
        <div className="space-y-3">
          <h1 className="max-w-xs text-4xl font-semibold leading-tight tracking-[-0.04em] text-foreground">
            SF AI startups, mapped.
          </h1>
          <div className="text-sm text-muted-foreground">{companies.length} companies</div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            A clean, curated view of the companies shaping the current San Francisco AI
            scene. Browse the map, filter the categories, and open the names that matter.
          </p>
        </div>
      </div>

      <div className="space-y-4 border border-border bg-background p-4">
        <label className="block">
          <span className="text-sm font-semibold text-foreground">Find a company</span>
          <span className="relative mt-2 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search OpenAI, agents, voice..."
              className="h-11 w-full border border-border bg-background pr-4 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
            />
          </span>
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Category</span>
            <button
              type="button"
              onClick={() => onCategoryChange("All")}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={category === "All"}
              label="All"
              onClick={() => onCategoryChange("All")}
            />
            {COMPANY_CATEGORIES.map((item) => (
              <FilterPill
                key={item}
                active={category === item}
                label={item}
                onClick={() => onCategoryChange(item)}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Visible on the map</h2>
          <span className="text-xs text-muted-foreground">Select a card or pin</span>
        </div>
        {companies.length > 0 ? (
          <div className="grid gap-3 pr-1">
            {companies.map((company) => (
              <div
                key={company.slug}
                ref={company.slug === selectedCompany.slug ? activeItemRef : null}
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
          <div className="border border-dashed border-border bg-background p-6">
            <h3 className="text-base font-semibold text-foreground">No companies match that filter.</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Clear the search or switch back to All scene to broaden the view.
            </p>
          </div>
        )}
      </section>
    </aside>
  )
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}
