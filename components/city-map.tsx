"use client"

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"

import type { CityMapConfig } from "@/lib/city-config"
import { YC_BOSS_SLUG, type Company, type CompanyCategory } from "@/lib/company"
import type { DiscoveryMode, Meetup } from "@/lib/meetup"
import { useCityMeetups } from "@/lib/use-city-meetups"
import { cn } from "@/lib/utils"
import { DiscoveryPanel } from "@/components/discovery-panel"
import { MapShell } from "@/components/map-shell"
import { SelectedCompanyPanel } from "@/components/selected-company-panel"
import { SelectedMeetupPanel } from "@/components/selected-meetup-panel"

type CityMapProps = {
  companies: Company[]
  config: CityMapConfig
}

const SELECTED_PANEL_STORAGE_EVENT = "selected-company-panel-storage"
const EMPTY_MEETUPS: Meetup[] = []

export function CityMap({ companies: allCompanies, config }: CityMapProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CompanyCategory | "All">("All")
  const [isAudioMuted, setIsAudioMuted] = useState(true)
  const selectedPanelStorageKey = `selected-company-panel:${config.city}`
  const isSelectedPanelCollapsed = useSyncExternalStore(
    (onStoreChange) =>
      subscribeToSelectedPanelPreference(
        selectedPanelStorageKey,
        onStoreChange
      ),
    () => readSelectedPanelPreference(selectedPanelStorageKey),
    () => false
  )
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const deferredSearch = useDeferredValue(search)

  const mode = useMemo((): DiscoveryMode => {
    return searchParams.get("mode") === "meetups" ? "meetups" : "startups"
  }, [searchParams])
  const meetupsQuery = useCityMeetups(config.city, mode === "meetups")
  const meetupsLoading = mode === "meetups" && meetupsQuery.isLoading
  const meetupsError = mode === "meetups" && meetupsQuery.isError
  const allMeetups = meetupsError
    ? EMPTY_MEETUPS
    : (meetupsQuery.data ?? EMPTY_MEETUPS)
  const meetupsSelectionUnavailable = meetupsLoading || meetupsError

  const selectedSlug = useMemo(
    () =>
      resolveSelectedSlug(
        allCompanies,
        searchParams.get("c"),
        config.initialSelectedSlug
      ),
    [allCompanies, config.initialSelectedSlug, searchParams]
  )

  const filteredCompanies = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()

    return [...allCompanies]
      .filter((company) =>
        category === "All" ? true : company.category === category
      )
      .filter((company) => (query ? true : company.slug !== YC_BOSS_SLUG))
      .filter((company) => {
        if (!query) {
          return true
        }

        return [
          company.name,
          company.shortDescription,
          company.category,
          company.locationLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      })
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [allCompanies, category, deferredSearch])

  const filteredMeetups = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return [...allMeetups]
      .filter((meetup) => {
        if (!query) {
          return true
        }

        return [
          meetup.title,
          meetup.description,
          meetup.venueName,
          meetup.locationLabel,
          meetup.organizerName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => {
        const t =
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        if (t !== 0) {
          return t
        }
        return a.title.localeCompare(b.title)
      })
  }, [allMeetups, deferredSearch])

  const selectedMeetupSlug = useMemo(() => {
    const slugFromQuery = searchParams.get("m")

    if (meetupsSelectionUnavailable && slugFromQuery) {
      return slugFromQuery
    }

    return resolveSelectedMeetupSlug(
      allMeetups,
      slugFromQuery,
      filteredMeetups[0]?.slug ?? null
    )
  }, [allMeetups, filteredMeetups, meetupsSelectionUnavailable, searchParams])

  const selectedCompany =
    filteredCompanies.find((company) => company.slug === selectedSlug) ??
    allCompanies.find((company) => company.slug === selectedSlug) ??
    filteredCompanies[0] ??
    allCompanies[0]

  const selectedMeetup = useMemo(() => {
    if (!selectedMeetupSlug) {
      return null
    }
    return (
      allMeetups.find((m) => m.slug === selectedMeetupSlug) ??
      filteredMeetups.find((m) => m.slug === selectedMeetupSlug) ??
      null
    )
  }, [allMeetups, filteredMeetups, selectedMeetupSlug])

  const mapCompanies = useMemo((): Company[] => {
    const base =
      filteredCompanies.length > 0 ? filteredCompanies : [selectedCompany]
    const boss = allCompanies.find((company) => company.slug === YC_BOSS_SLUG)

    if (!boss || base.some((c) => c.slug === YC_BOSS_SLUG)) {
      return base
    }

    return [...base, boss]
  }, [allCompanies, filteredCompanies, selectedCompany])

  const mapMeetups = useMemo((): Meetup[] => {
    if (filteredMeetups.length > 0) {
      return filteredMeetups
    }
    if (selectedMeetup) {
      return [selectedMeetup]
    }
    return []
  }, [filteredMeetups, selectedMeetup])

  useEffect(() => {
    const audio = new Audio("/audio/sf-ai-startup-map-theme.mp3")
    audio.loop = true
    audio.preload = "auto"
    audio.volume = 0.42
    audio.muted = true
    audioRef.current = audio

    audio.play().catch(() => {
      // Browsers usually allow muted autoplay, but failing closed is fine here.
    })

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.muted = isAudioMuted
  }, [isAudioMuted])

  const handleToggleSelectedPanel = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    const nextValue = isSelectedPanelCollapsed ? "expanded" : "collapsed"
    window.localStorage.setItem(selectedPanelStorageKey, nextValue)
    window.dispatchEvent(
      new CustomEvent(SELECTED_PANEL_STORAGE_EVENT, {
        detail: { key: selectedPanelStorageKey },
      })
    )
  }, [isSelectedPanelCollapsed, selectedPanelStorageKey])

  const handleToggleMute = async () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    const nextMuted = !isAudioMuted
    audio.muted = nextMuted
    setIsAudioMuted(nextMuted)

    if (!nextMuted) {
      try {
        await audio.play()
      } catch {
        setIsAudioMuted(true)
        audio.muted = true
      }
    }
  }

  const syncSelectionToUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    const hash = typeof window === "undefined" ? "" : window.location.hash

    if (mode === "startups") {
      params.delete("mode")
      params.delete("m")
      if (selectedCompany) {
        params.set("c", selectedCompany.slug)
      }
    } else {
      params.set("mode", "meetups")
      params.delete("c")
      if (meetupsSelectionUnavailable && searchParams.get("m")) {
        params.set("m", searchParams.get("m")!)
      } else if (selectedMeetupSlug) {
        params.set("m", selectedMeetupSlug)
      } else {
        params.delete("m")
      }
    }

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}${hash}` : pathname

    window.history.replaceState(null, "", nextUrl)
  }, [
    mode,
    pathname,
    searchParams,
    selectedCompany,
    selectedMeetupSlug,
    meetupsSelectionUnavailable,
  ])

  useEffect(() => {
    syncSelectionToUrl()
  }, [syncSelectionToUrl])

  const handleModeChange = useCallback(
    (next: DiscoveryMode) => {
      setSearch("")
      if (typeof window === "undefined") {
        return
      }

      const params = new URLSearchParams(searchParams.toString())
      const hash = window.location.hash

      if (next === "startups") {
        params.delete("mode")
        params.delete("m")
      } else {
        params.set("mode", "meetups")
        params.delete("c")
      }

      const nextQuery = params.toString()
      const nextUrl = nextQuery
        ? `${pathname}?${nextQuery}${hash}`
        : `${pathname}${hash}`

      window.history.replaceState(null, "", nextUrl)
    },
    [pathname, searchParams]
  )

  const updateCompanySlugInUrl = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const hash = typeof window === "undefined" ? "" : window.location.hash
      params.set("c", slug)
      params.delete("m")
      params.delete("mode")
      const nextQuery = params.toString()
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}${hash}` : pathname
      window.history.replaceState(null, "", nextUrl)
    },
    [pathname, searchParams]
  )

  const updateMeetupSlugInUrl = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const hash = typeof window === "undefined" ? "" : window.location.hash
      params.set("mode", "meetups")
      params.set("m", slug)
      params.delete("c")
      const nextQuery = params.toString()
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}${hash}` : pathname
      window.history.replaceState(null, "", nextUrl)
    },
    [pathname, searchParams]
  )

  if (!selectedCompany) {
    return (
      <main className="flex h-dvh items-center justify-center bg-[#1a1a2e] px-6 text-center text-[#f0f7e6]">
        <div>
          <h1 className="font-(family-name:--font-pixel) text-lg text-[#ffe66d]">
            {config.emptyStateTitle}
          </h1>
          <p className="mt-3 text-sm text-[#f0f7e6]/70">
            No companies are available yet.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#1a1a2e]">
      <section className="mx-auto h-full min-h-0 w-full">
        <div
          className={cn(
            "grid h-full min-h-0",
            "max-lg:grid-rows-[minmax(0,1fr)_minmax(260px,min(52vh,50dvh))]",
            isSelectedPanelCollapsed
              ? "lg:grid-cols-[380px_56px_minmax(0,1fr)]"
              : "lg:grid-cols-[380px_360px_minmax(0,1fr)]",
            "lg:grid-rows-1"
          )}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <DiscoveryPanel
              mode={mode}
              onModeChange={handleModeChange}
              companies={filteredCompanies}
              meetups={filteredMeetups}
              meetupsLoading={meetupsLoading}
              meetupsError={meetupsError}
              selectedCompany={selectedCompany}
              selectedMeetup={selectedMeetup}
              titleLines={config.titleLines}
              searchPlaceholder={config.searchPlaceholder}
              meetupSearchPlaceholder={config.meetupSearchPlaceholder}
              timeZone={config.timezone}
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              onSelectCompany={updateCompanySlugInUrl}
              onSelectMeetup={updateMeetupSlugInUrl}
            />
          </div>
          {mode === "startups" ? (
            <SelectedCompanyPanel
              company={selectedCompany}
              collapsed={isSelectedPanelCollapsed}
              onToggleCollapsed={handleToggleSelectedPanel}
            />
          ) : (
            <SelectedMeetupPanel
              meetup={selectedMeetup}
              timeZone={config.timezone}
              meetupsLoading={meetupsLoading}
              meetupsError={meetupsError}
              collapsed={isSelectedPanelCollapsed}
              onToggleCollapsed={handleToggleSelectedPanel}
            />
          )}
          <div className="relative h-full min-h-0 overflow-hidden">
            <MapShell
              mode={mode}
              companies={mapCompanies}
              meetups={mapMeetups}
              selectedCompany={selectedCompany}
              selectedMeetup={selectedMeetup}
              config={config}
              onSelectCompany={updateCompanySlugInUrl}
              onSelectMeetup={updateMeetupSlugInUrl}
              isAudioMuted={isAudioMuted}
              onToggleMute={handleToggleMute}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function resolveSelectedSlug(
  companies: Company[],
  slugFromQuery: string | null,
  fallbackSlug: string
) {
  if (
    slugFromQuery &&
    companies.some((company) => company.slug === slugFromQuery)
  ) {
    return slugFromQuery
  }

  return fallbackSlug
}

function resolveSelectedMeetupSlug(
  allMeetups: Meetup[],
  slugFromQuery: string | null,
  fallbackSlug: string | null
) {
  if (slugFromQuery && allMeetups.some((m) => m.slug === slugFromQuery)) {
    return slugFromQuery
  }

  return fallbackSlug
}

function readSelectedPanelPreference(key: string) {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(key) === "collapsed"
}

function subscribeToSelectedPanelPreference(
  key: string,
  onStoreChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) {
      onStoreChange()
    }
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ key?: string }>

    if (customEvent.detail?.key === key) {
      onStoreChange()
    }
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(
    SELECTED_PANEL_STORAGE_EVENT,
    handleCustomEvent as EventListener
  )

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(
      SELECTED_PANEL_STORAGE_EVENT,
      handleCustomEvent as EventListener
    )
  }
}
