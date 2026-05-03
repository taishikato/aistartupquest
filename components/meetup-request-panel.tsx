"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { LoaderCircle, Plus, X } from "lucide-react"

import { CITY_TIMEZONES, type CityId } from "@/lib/city-config"
import { meetupLocalInputToUtcIso } from "@/lib/meetup-datetime"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/turnstile-widget"
import { submitMeetup } from "@/app/actions/meetup-submit"

type MeetupRequestPanelProps = {
  initialCity: CityId
}

const CITY_OPTIONS = [
  { value: "sf", label: "San Francisco" },
  { value: "toronto", label: "Toronto" },
  { value: "ny", label: "New York" },
  { value: "london", label: "London" },
  { value: "vancouver", label: "Vancouver" },
  { value: "tokyo", label: "Tokyo" },
] as const

const WEBSITE_PATTERN = "https?://.+"
const FIELD_BASE_CLASS =
  "w-full border border-[#d5d9df] bg-white text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
const INPUT_CLASS = cn(FIELD_BASE_CLASS, "h-11 px-3")
const DATE_INPUT_CLASS = cn(INPUT_CLASS, "[color-scheme:light]")
const TEXTAREA_CLASS = cn(FIELD_BASE_CLASS, "resize-none px-3 py-3 leading-6")
const FIELD_LABEL_CLASS = cn(
  "mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase"
)

export function MeetupRequestPanel({ initialCity }: MeetupRequestPanelProps) {
  const queryClient = useQueryClient()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""
  const [isOpen, setIsOpen] = useState(false)
  const [city, setCity] = useState<CityId>(initialCity)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dateLocal, setDateLocal] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [eventUrl, setEventUrl] = useState("")
  const [xAccount, setXAccount] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null)

  const resetForm = () => {
    setCity(initialCity)
    setTitle("")
    setDescription("")
    setDateLocal("")
    setLocationLabel("")
    setEventUrl("")
    setXAccount("")
    setTurnstileToken(null)
    turnstileRef.current?.reset()
    setErrorMessage(null)
    setStatus("idle")
  }

  const handleClose = () => {
    setIsOpen(false)
    setErrorMessage(null)
    if (status !== "success") {
      setStatus("idle")
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (status === "submitting" || isPending) {
      return
    }

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const trimmedAddress = locationLabel.trim()
    const trimmedUrl = eventUrl.trim()
    const trimmedXAccount = xAccount.trim()

    if (!trimmedTitle) {
      setErrorMessage("Title is required.")
      return
    }

    if (!dateLocal) {
      setErrorMessage("Date is required.")
      return
    }

    if (!trimmedAddress) {
      setErrorMessage("Address is required.")
      return
    }

    if (!trimmedUrl) {
      setErrorMessage("Link is required.")
      return
    }

    if (!trimmedXAccount) {
      setErrorMessage("X account is required.")
      return
    }

    if (!turnstileToken) {
      setErrorMessage("Complete the verification challenge.")
      return
    }

    let startsAtUtc: string
    const submittedCity = city
    const tz = CITY_TIMEZONES[city]
    try {
      startsAtUtc = meetupLocalInputToUtcIso(`${dateLocal}T12:00`, tz)
    } catch {
      setErrorMessage("Date is invalid.")
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    startTransition(async () => {
      const result = await submitMeetup({
        turnstileToken,
        city,
        title: trimmedTitle,
        description: trimmedDescription,
        venueName: trimmedAddress.slice(0, 200),
        locationLabel: trimmedAddress,
        startsAt: startsAtUtc,
        endsAt: null,
        organizerName: trimmedXAccount,
        eventUrl: trimmedUrl,
        xAccount: trimmedXAccount,
      })

      if (result.status === "error") {
        setStatus("idle")
        setErrorMessage(result.message)
        turnstileRef.current?.reset()
        return
      }

      resetForm()
      void queryClient.invalidateQueries({
        queryKey: ["meetups", submittedCity],
      })
      setStatus("success")
    })
  }

  return (
    <>
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <Button
          type="button"
          onClick={() => {
            setIsOpen(true)
            if (status === "success") {
              setStatus("idle")
            }
          }}
          className="h-11 border-2 border-[#111827] bg-white px-4 text-[12px] font-semibold tracking-[0.08em] text-[#111827] uppercase shadow-[3px_3px_0_#111827] hover:bg-[#f8fafc]"
        >
          <Plus className="size-4" />
          Add meetup
        </Button>
      </div>

      {isOpen ? (
        <div className="absolute inset-0 z-30 flex justify-end bg-[rgba(17,24,39,0.18)]">
          <div className="flex h-full w-full max-w-[420px] flex-col border-l-2 border-[#111827] bg-white text-[#111827] shadow-[-6px_0_0_rgba(17,24,39,0.16)]">
            <div className="border-b border-[#d5d9df] bg-[#f8fafc] px-5 py-4">
              <div className="flex items-start justify-between gap-4 border border-[#d5d9df] bg-white px-4 py-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                    Add meetup
                  </p>
                  <h2 className="mt-2 text-[22px] leading-[1.15] font-semibold tracking-tight text-[#111827]">
                    Post an upcoming meetup
                  </h2>
                  <p className="mt-3 max-w-[30ch] text-sm leading-6 text-[#4b5563]">
                    Share a meetup with just the basics. The date uses the
                    selected city&apos;s local timezone.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="mt-0.5 border border-[#d5d9df] bg-white text-[#4b5563] hover:border-[#111827] hover:bg-[#f8fafc] hover:text-[#111827]"
                  aria-label="Close meetup panel"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {status === "success" ? (
                <div className="border border-[#dbe4d4] bg-[#f7fbf4] px-4 py-4">
                  <p className="text-sm font-medium text-[#1f2937]">
                    Meetup published.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                    It should appear on the map shortly. If the address could
                    not be placed, try editing the venue details and submit
                    again.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setStatus("idle")
                      setIsOpen(false)
                    }}
                    className="mt-4 h-10 border border-[#d5d9df] bg-white px-4 text-[12px] font-semibold tracking-[0.08em] text-[#111827] uppercase hover:bg-[#f8fafc]"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className={cn(FIELD_LABEL_CLASS)}>City</span>
                    <select
                      value={city}
                      onChange={(event) =>
                        setCity(event.target.value as CityId)
                      }
                      className={cn(INPUT_CLASS)}
                    >
                      {CITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={cn(FIELD_LABEL_CLASS)}>Title</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                      maxLength={200}
                      className={cn(INPUT_CLASS)}
                      placeholder="Event title"
                    />
                  </label>

                  <label className="block">
                    <span className={cn(FIELD_LABEL_CLASS)}>Description</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={5000}
                      rows={4}
                      className={cn(TEXTAREA_CLASS)}
                      placeholder="Optional"
                    />
                  </label>

                  <label className="block">
                    <span className={cn(FIELD_LABEL_CLASS)}>Date</span>
                    <input
                      type="date"
                      value={dateLocal}
                      onChange={(event) => setDateLocal(event.target.value)}
                      required
                      className={cn(DATE_INPUT_CLASS)}
                    />
                  </label>

                  <label className="block">
                    <span className={cn(FIELD_LABEL_CLASS)}>Address</span>
                    <input
                      type="text"
                      value={locationLabel}
                      onChange={(event) => setLocationLabel(event.target.value)}
                      required
                      maxLength={300}
                      className={cn(INPUT_CLASS)}
                      placeholder="Street, neighborhood, postal code"
                    />
                  </label>

                  <label className="block">
                    <span className={cn(FIELD_LABEL_CLASS)}>Link</span>
                    <input
                      type="url"
                      value={eventUrl}
                      onChange={(event) => setEventUrl(event.target.value)}
                      required
                      maxLength={2000}
                      pattern={WEBSITE_PATTERN}
                      className={cn(INPUT_CLASS)}
                      placeholder="https://example.com"
                    />
                  </label>

                  <label className="block">
                    <span className={cn(FIELD_LABEL_CLASS)}>X account</span>
                    <input
                      type="text"
                      value={xAccount}
                      onChange={(event) => setXAccount(event.target.value)}
                      required
                      maxLength={120}
                      className={cn(INPUT_CLASS)}
                      placeholder="@handle"
                    />
                  </label>

                  {siteKey ? (
                    <div className="space-y-2">
                      <span className={cn(FIELD_LABEL_CLASS, "mb-0")}>
                        Verification
                      </span>
                      <TurnstileWidget
                        ref={turnstileRef}
                        siteKey={siteKey}
                        onToken={setTurnstileToken}
                      />
                    </div>
                  ) : (
                    <div className="border border-[#efc7c7] bg-[#fff7f7] px-3 py-3 text-sm text-[#b42318]">
                      Meetup submissions are disabled because the site key is
                      not configured.
                    </div>
                  )}

                  {errorMessage ? (
                    <div className="border border-[#efc7c7] bg-[#fff7f7] px-3 py-3 text-sm text-[#b42318]">
                      {errorMessage}
                    </div>
                  ) : null}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={
                        status === "submitting" ||
                        isPending ||
                        !siteKey ||
                        !turnstileToken
                      }
                      className="h-11 min-w-[148px] border-2 border-[#111827] bg-white px-4 text-[12px] font-semibold tracking-[0.08em] text-[#111827] uppercase shadow-[3px_3px_0_#111827] hover:bg-[#f8fafc]"
                    >
                      {status === "submitting" || isPending ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Publishing
                        </>
                      ) : (
                        "Publish"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
