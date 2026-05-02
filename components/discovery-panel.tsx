"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Search } from "lucide-react"

import {
  CATEGORY_COLORS,
  COMPANY_CATEGORIES,
  type Company,
  type CompanyCategory,
} from "@/lib/company"
import type { DiscoveryMode, Meetup } from "@/lib/meetup"
import { cn } from "@/lib/utils"
import { CompanyCard } from "@/components/company-card"
import { MeetupCard } from "@/components/meetup-card"

type DiscoveryPanelProps = {
  mode: DiscoveryMode
  onModeChange: (mode: DiscoveryMode) => void
  companies: Company[]
  meetups: Meetup[]
  meetupsLoading: boolean
  meetupsError: boolean
  selectedCompany: Company
  selectedMeetup: Meetup | null
  titleLines: [string, string]
  searchPlaceholder: string
  meetupSearchPlaceholder: string
  timeZone: string
  search: string
  onSearchChange: (value: string) => void
  category: CompanyCategory | "All"
  onCategoryChange: (value: CompanyCategory | "All") => void
  onSelectCompany: (slug: string) => void
  onSelectMeetup: (slug: string) => void
}

const FILTER_ALL_COLOR = "#1a1a2e"

export function DiscoveryPanel({
  mode,
  onModeChange,
  companies,
  meetups,
  meetupsLoading,
  meetupsError,
  selectedCompany,
  selectedMeetup,
  titleLines,
  searchPlaceholder,
  meetupSearchPlaceholder,
  timeZone,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onSelectCompany,
  onSelectMeetup,
}: DiscoveryPanelProps) {
  const activeItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const activeItem = activeItemRef.current
    const slug =
      mode === "startups" ? selectedCompany.slug : (selectedMeetup?.slug ?? "")
    const isSelectedVisible =
      mode === "startups"
        ? companies.some((company) => company.slug === slug)
        : meetups.some((m) => m.slug === slug)

    if (!activeItem || !isSelectedVisible) {
      return
    }

    activeItem.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }, [companies, meetups, mode, selectedCompany.slug, selectedMeetup?.slug])

  const boardCount =
    mode === "meetups" && meetupsLoading
      ? "Loading"
      : mode === "startups"
        ? companies.length
        : meetups.length
  const boardLabel =
    mode === "startups"
      ? "players on the board"
      : meetupsError
        ? "meetups unavailable"
        : "upcoming meetups"

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r-3 border-[#1a1a2e] bg-[#1a1a2e] text-[#f0f7e6]">
      <div className="shrink-0 border-b-2 border-[#3a3a5e] bg-[#1a1a2e] px-5 pt-5 pb-4 shadow-[0_6px_14px_rgba(26,26,46,0.5)]">
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
            <h1 className="font-(family-name:--font-pixel) text-lg leading-relaxed tracking-tight text-[#ffe66d]">
              {titleLines[0]}
              <br />
              {titleLines[1]}
            </h1>
          </div>
          <div className="font-(family-name:--font-pixel) text-[8px] text-[#4ecdc4]">
            {boardCount} {boardLabel}
          </div>
        </div>

        <div className="mt-4 flex gap-2 border-2 border-[#3a3a5e] bg-[#2a2a4e] p-2">
          <button
            type="button"
            onClick={() => onModeChange("startups")}
            className={cn(
              "flex-1 border-2 px-3 py-2 font-(family-name:--font-pixel) text-[9px] tracking-wide uppercase transition-colors",
              mode === "startups"
                ? "border-[#1a1a2e] bg-[#ffe66d] text-[#1a1a2e] shadow-[2px_2px_0px_#1a1a2e]"
                : "border-transparent bg-transparent text-[#f0f7e6]/70 hover:text-[#f0f7e6]"
            )}
          >
            Startups
          </button>
          <button
            type="button"
            onClick={() => onModeChange("meetups")}
            className={cn(
              "flex-1 border-2 px-3 py-2 font-(family-name:--font-pixel) text-[9px] tracking-wide uppercase transition-colors",
              mode === "meetups"
                ? "border-[#1a1a2e] bg-[#ffe66d] text-[#1a1a2e] shadow-[2px_2px_0px_#1a1a2e]"
                : "border-transparent bg-transparent text-[#f0f7e6]/70 hover:text-[#f0f7e6]"
            )}
          >
            Meetups
          </button>
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
                  placeholder={
                    mode === "startups"
                      ? searchPlaceholder
                      : meetupSearchPlaceholder
                  }
                  className="h-11 w-full border-2 border-[#3a3a5e] bg-[#1a1a2e] pr-4 pl-10 text-sm text-[#f0f7e6] transition-colors outline-none placeholder:text-[#f0f7e6]/30 focus:border-[#4ecdc4]"
                />
              </span>
            </label>

            {mode === "startups" ? (
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
            ) : null}
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
            {mode === "startups" ? (
              companies.length > 0 ? (
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
              )
            ) : meetupsLoading ? (
              <div className="border-2 border-dashed border-[#3a3a5e] bg-[#2a2a4e] p-6">
                <h3 className="font-(family-name:--font-pixel) text-[9px] text-[#ffe66d]">
                  Loading meetups
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#f0f7e6]/70">
                  Finding upcoming meetups for this city.
                </p>
              </div>
            ) : meetupsError ? (
              <div className="border-2 border-dashed border-[#3a3a5e] bg-[#2a2a4e] p-6">
                <h3 className="font-(family-name:--font-pixel) text-[9px] text-[#ff6b6b]">
                  Could not load meetups
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#f0f7e6]/70">
                  Please try again in a moment.
                </p>
              </div>
            ) : meetups.length > 0 ? (
              <div className="grid gap-3 pr-1">
                {meetups.map((meetup) => (
                  <div
                    key={meetup.slug}
                    ref={
                      meetup.slug === selectedMeetup?.slug
                        ? activeItemRef
                        : null
                    }
                  >
                    <MeetupCard
                      meetup={meetup}
                      timeZone={timeZone}
                      compact
                      active={meetup.slug === selectedMeetup?.slug}
                      onSelect={onSelectMeetup}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#3a3a5e] bg-[#2a2a4e] p-6">
                <h3 className="font-(family-name:--font-pixel) text-[9px] text-[#ff6b6b]">
                  No upcoming meetups
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#f0f7e6]/70">
                  Be the first to post a meetup for this city. Use Add meetup on
                  the map.
                </p>
              </div>
            )}
          </section>

          <section className="space-y-3 lg:hidden">
            <h2 className="font-(family-name:--font-pixel) text-[8px] text-[#4ecdc4]">
              Selected
            </h2>
            {mode === "startups" ? (
              <CompanyCard company={selectedCompany} active />
            ) : meetupsLoading ? (
              <p className="text-xs text-[#f0f7e6]/60">Loading meetups...</p>
            ) : meetupsError ? (
              <p className="text-xs text-[#f0f7e6]/60">
                Could not load meetups.
              </p>
            ) : selectedMeetup ? (
              <MeetupCard meetup={selectedMeetup} timeZone={timeZone} active />
            ) : (
              <p className="text-xs text-[#f0f7e6]/60">Nothing selected</p>
            )}
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
