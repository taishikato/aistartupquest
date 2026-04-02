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
import { cn } from "@/lib/utils"
import { DiscoveryPanel } from "@/components/discovery-panel"
import { MapShell } from "@/components/map-shell"
import { SelectedCompanyPanel } from "@/components/selected-company-panel"

type CityMapProps = {
  companies: Company[]
  config: CityMapConfig
}

const SELECTED_PANEL_STORAGE_EVENT = "selected-company-panel-storage"

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
  const selectedSlug = useMemo(
    () =>
      resolveSelectedSlug(
        allCompanies,
        searchParams.get("c"),
        config.initialSelectedSlug
      ),
    [allCompanies, config.initialSelectedSlug, searchParams]
  )

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

  const updateSelectedSlugInUrl = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString())

      params.set("c", slug)

      const nextQuery = params.toString()
      const currentQuery = searchParams.toString()

      if (nextQuery === currentQuery) {
        return
      }

      const hash = typeof window === "undefined" ? "" : window.location.hash
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}${hash}` : pathname

      window.history.replaceState(null, "", nextUrl)
    },
    [pathname, searchParams]
  )

  useEffect(() => {
    updateSelectedSlugInUrl(selectedSlug)
  }, [selectedSlug, updateSelectedSlugInUrl])

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

  const selectedCompany =
    filteredCompanies.find((company) => company.slug === selectedSlug) ??
    allCompanies.find((company) => company.slug === selectedSlug) ??
    filteredCompanies[0] ??
    allCompanies[0]

  const mapCompanies = useMemo((): Company[] => {
    const base =
      filteredCompanies.length > 0 ? filteredCompanies : [selectedCompany]
    const boss = allCompanies.find((company) => company.slug === YC_BOSS_SLUG)

    if (!boss || base.some((c) => c.slug === YC_BOSS_SLUG)) {
      return base
    }

    return [...base, boss]
  }, [allCompanies, filteredCompanies, selectedCompany])

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
              companies={filteredCompanies}
              selectedCompany={selectedCompany}
              titleLines={config.titleLines}
              searchPlaceholder={config.searchPlaceholder}
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              onSelectCompany={updateSelectedSlugInUrl}
            />
          </div>
          <SelectedCompanyPanel
            company={selectedCompany}
            collapsed={isSelectedPanelCollapsed}
            onToggleCollapsed={handleToggleSelectedPanel}
          />
          <div className="relative h-full min-h-0 overflow-hidden">
            <MapShell
              key={config.initialSelectedSlug}
              companies={mapCompanies}
              selectedCompany={selectedCompany}
              config={config}
              onSelectCompany={updateSelectedSlugInUrl}
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
