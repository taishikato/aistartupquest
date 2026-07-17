"use client"

import { Crosshair, Volume2, VolumeX } from "lucide-react"

import type { UserLocationStatus } from "@/lib/user-location"
import { locateButtonLabel } from "@/lib/user-location"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type HomeMapControlsProps = {
  isAudioMuted: boolean
  onToggleMute: () => void | Promise<void>
  userLocationStatus: UserLocationStatus
  onLocateUser: () => void
}

export function HomeMapControls({
  isAudioMuted,
  onToggleMute,
  userLocationStatus,
  onLocateUser,
}: HomeMapControlsProps) {
  return (
    <div className="pointer-events-none absolute top-4 left-4 z-30 flex items-center gap-2 md:top-6 md:left-[calc(min(380px,calc(100vw-24px))+1rem)]">
      <Button
        type="button"
        onClick={onToggleMute}
        aria-label={isAudioMuted ? "Unmute audio" : "Mute audio"}
        className={cn(
          "pointer-events-auto size-10 border-[3px] border-[#342414] bg-[#f4ecd2] p-0 text-[#4c3926] shadow-[4px_4px_0px_#342414] hover:bg-[#e7d8ae]",
          !isAudioMuted && "audio-unmuted-btn"
        )}
      >
        {isAudioMuted ? (
          <VolumeX className="size-3.5" />
        ) : (
          <Volume2 className="volume-unmuted-icon size-3.5" />
        )}
      </Button>
      <Button
        type="button"
        onClick={onLocateUser}
        disabled={
          userLocationStatus === "unsupported" ||
          userLocationStatus === "requesting"
        }
        aria-label={locateButtonLabel(userLocationStatus)}
        title={locateButtonLabel(userLocationStatus)}
        className={cn(
          "pointer-events-auto size-10 border-[3px] border-[#342414] bg-[#f4ecd2] p-0 text-[#4c3926] shadow-[4px_4px_0px_#342414] hover:bg-[#e7d8ae]",
          userLocationStatus === "tracking" &&
            "border-[#2a9d96] bg-[#dff7f4] text-[#1a6f6a]",
          (userLocationStatus === "denied" ||
            userLocationStatus === "unavailable") &&
            "text-[#9a4d30]"
        )}
      >
        <Crosshair
          className={cn(
            "size-3.5",
            userLocationStatus === "requesting" && "animate-pulse"
          )}
        />
      </Button>
    </div>
  )
}
