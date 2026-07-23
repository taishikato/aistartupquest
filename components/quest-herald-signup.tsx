"use client"

import {
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react"
import { X } from "lucide-react"

import { track } from "@/lib/analytics"
import {
  dismissQuestHerald,
  markQuestHeraldSubscribed,
  readQuestHeraldHidden,
  subscribeToQuestHeraldPreference,
} from "@/lib/quest-herald-preference"
import { cn } from "@/lib/utils"
import { subscribeEmail } from "@/app/actions/subscribe-email"

type QuestHeraldSignupProps = {
  source?: string
  className?: string
  heading?: string
  compact?: boolean
  onDismiss?: () => void
}

export function QuestHeraldSignup({
  source = "map_footer",
  className,
  heading = "Get alerted when new meetups and community events land on the map.",
  compact = false,
  onDismiss,
}: QuestHeraldSignupProps) {
  const isHidden = useSyncExternalStore(
    subscribeToQuestHeraldPreference,
    readQuestHeraldHidden,
    () => true
  )
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (isHidden && !succeeded) {
    return null
  }

  const handleDismiss = () => {
    track("quest_herald_dismiss", { source })
    dismissQuestHerald()
    onDismiss?.()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await subscribeEmail({ email, source })

      if (!result.ok) {
        setError(result.error)
        track("quest_herald_subscribe_error", { source })
        return
      }

      track("quest_herald_subscribe", { source })
      setSucceeded(true)
      markQuestHeraldSubscribed()

      window.setTimeout(() => {
        setSucceeded(false)
      }, 1800)
    })
  }

  return (
    <div
      className={cn(
        "pointer-events-auto w-full",
        compact ? "max-w-none" : "max-w-[min(420px,calc(100vw-1.5rem))]",
        className
      )}
    >
      <div
        className={cn(
          "border-[3px] border-[#342414] bg-[#ead9ab]",
          compact ? "shadow-[3px_3px_0_#342414]" : "shadow-[4px_4px_0_#342414]"
        )}
      >
        <div className="flex items-start justify-between gap-2 border-b-2 border-[#95602f]/40 px-3 py-2">
          <div className="min-w-0">
            <p className="font-(family-name:--font-pixel) text-[9px] leading-4 text-[#8b6914]">
              Quest Herald
            </p>
            <p
              className={cn(
                "mt-1 text-xs leading-4 text-[#1a1a2e]",
                !compact && "sm:text-sm sm:leading-5"
              )}
            >
              {heading}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex size-7 shrink-0 items-center justify-center border-2 border-[#342414] bg-[#f4ecd2] text-[#4c3926] shadow-[2px_2px_0_#342414] transition-colors hover:bg-[#ffe66d]"
            aria-label="Dismiss email signup"
          >
            <X className="size-3.5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        {succeeded ? (
          <p className="px-3 py-3 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e]">
            You&apos;re on the list. New quests will find you.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex gap-2 px-3 py-3",
              compact
                ? "flex-row items-stretch"
                : "flex-col sm:flex-row sm:items-stretch"
            )}
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                disabled={isPending}
                className="h-10 w-full border-2 border-[#342414] bg-[#fff7dd] px-3 text-sm text-[#1a1a2e] outline-none placeholder:text-[#1a1a2e]/35 focus:border-[#8b6914] disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 shrink-0 border-2 border-[#342414] bg-[#ffe66d] px-4 font-(family-name:--font-pixel) text-[9px] leading-4 text-[#1a1a2e] shadow-[3px_3px_0_#342414] transition-colors hover:bg-[#4ecdc4] disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Subscribe"}
            </button>
          </form>
        )}

        {error ? (
          <p className="border-t-2 border-[#95602f]/40 px-3 py-2 text-xs text-[#9a4d30]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
