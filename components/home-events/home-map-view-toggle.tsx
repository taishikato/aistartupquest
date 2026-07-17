"use client"

import type { HomeMapView } from "@/lib/home-map-url"
import { cn } from "@/lib/utils"

type HomeMapViewToggleProps = {
  view: HomeMapView
  onSwitchView: (view: HomeMapView) => void
}

export function HomeMapViewToggle({
  view,
  onSwitchView,
}: HomeMapViewToggleProps) {
  return (
    <div className="pointer-events-none absolute top-4 right-0 left-0 z-30 flex justify-center px-4 md:top-6 md:left-[min(380px,calc(100vw-24px))]">
      <div className="pointer-events-auto flex shadow-[3px_3px_0_#1a1a2e]">
        <button
          type="button"
          onClick={() => onSwitchView("mercator")}
          className={cn(
            "border-2 border-[#1a1a2e] px-4 py-2 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] transition-colors",
            view === "mercator" ? "bg-[#ffe66d]" : "bg-white"
          )}
          aria-pressed={view === "mercator"}
        >
          MAP
        </button>
        <button
          type="button"
          onClick={() => onSwitchView("globe")}
          className={cn(
            "-ml-0.5 border-2 border-[#1a1a2e] px-4 py-2 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] transition-colors",
            view === "globe" ? "bg-[#ffe66d]" : "bg-white"
          )}
          aria-pressed={view === "globe"}
        >
          GLOBE
        </button>
      </div>
    </div>
  )
}
