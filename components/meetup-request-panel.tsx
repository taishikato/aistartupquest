"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { LoaderCircle, Plus, X } from "lucide-react"

import { CITY_TIMEZONES, type CityId } from "@/lib/city-config"
import { meetupLocalInputToUtcIso } from "@/lib/meetup-datetime"
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

export function MeetupRequestPanel({ initialCity }: MeetupRequestPanelProps) {
  const queryClient = useQueryClient()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""
  const [isOpen, setIsOpen] = useState(false)
  const [city, setCity] = useState<CityId>(initialCity)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startsAtLocal, setStartsAtLocal] = useState("")
  const [endsAtLocal, setEndsAtLocal] = useState("")
  const [venueName, setVenueName] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [organizerName, setOrganizerName] = useState("")
  const [eventUrl, setEventUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
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
    setStartsAtLocal("")
    setEndsAtLocal("")
    setVenueName("")
    setLocationLabel("")
    setOrganizerName("")
    setEventUrl("")
    setContactEmail("")
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
    const trimmedVenue = venueName.trim()
    const trimmedAddress = locationLabel.trim()
    const trimmedOrganizer = organizerName.trim()
    const trimmedUrl = eventUrl.trim()
    const trimmedEmail = contactEmail.trim()

    if (!trimmedTitle) {
      setErrorMessage("Title is required.")
      return
    }

    if (trimmedDescription.length < 1) {
      setErrorMessage("Description is required.")
      return
    }

    if (!startsAtLocal) {
      setErrorMessage("Start date and time are required.")
      return
    }

    if (!trimmedVenue || !trimmedAddress) {
      setErrorMessage("Venue and address are required.")
      return
    }

    if (!trimmedOrganizer) {
      setErrorMessage("Organizer is required.")
      return
    }

    if (!trimmedUrl) {
      setErrorMessage("Event link is required.")
      return
    }

    if (!turnstileToken) {
      setErrorMessage("Complete the verification challenge.")
      return
    }

    let startsAtUtc: string
    let endsAtUtc: string | null = null
    const submittedCity = city
    const tz = CITY_TIMEZONES[city]
    try {
      startsAtUtc = meetupLocalInputToUtcIso(startsAtLocal, tz)
      if (endsAtLocal) {
        endsAtUtc = meetupLocalInputToUtcIso(endsAtLocal, tz)
      }
    } catch {
      setErrorMessage("Date and time are invalid.")
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
        venueName: trimmedVenue,
        locationLabel: trimmedAddress,
        startsAt: startsAtUtc,
        endsAt: endsAtUtc,
        organizerName: trimmedOrganizer,
        eventUrl: trimmedUrl,
        contactEmail: trimmedEmail,
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
          className="h-11 border border-[#d5d9df] bg-white px-4 text-[12px] font-semibold tracking-[0.08em] text-[#111827] uppercase shadow-[0_10px_30px_rgba(15,23,42,0.12)] hover:bg-[#f8fafc]"
        >
          <Plus className="size-4" />
          Add meetup
        </Button>
      </div>

      {isOpen ? (
        <div className="absolute inset-0 z-30 flex justify-end bg-[rgba(15,23,42,0.16)]">
          <div className="flex h-full w-full max-w-[420px] flex-col border-l border-[#d5d9df] bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.16)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                  Add meetup
                </p>
                <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
                  Post an upcoming meetup
                </h2>
                <p className="mt-2 max-w-[28ch] text-sm leading-6 text-[#4b5563]">
                  Listings are published immediately. Times use each city&apos;s
                  local timezone (based on the city you select above).
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="mt-0.5 border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                aria-label="Close meetup panel"
              >
                <X className="size-4" />
              </Button>
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
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      City
                    </span>
                    <select
                      value={city}
                      onChange={(event) =>
                        setCity(event.target.value as CityId)
                      }
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none focus:border-[#111827]"
                    >
                      {CITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Title
                    </span>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                      maxLength={200}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="Event title"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Description
                    </span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      required
                      maxLength={5000}
                      rows={4}
                      className="w-full resize-none border border-[#d5d9df] bg-white px-3 py-3 text-sm leading-6 text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="What is this meetup about?"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Starts (local)
                    </span>
                    <input
                      type="datetime-local"
                      value={startsAtLocal}
                      onChange={(event) => setStartsAtLocal(event.target.value)}
                      required
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none focus:border-[#111827]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Ends (local, optional)
                    </span>
                    <input
                      type="datetime-local"
                      value={endsAtLocal}
                      onChange={(event) => setEndsAtLocal(event.target.value)}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none focus:border-[#111827]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Venue name
                    </span>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(event) => setVenueName(event.target.value)}
                      required
                      maxLength={200}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="Venue or building"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Address
                    </span>
                    <input
                      type="text"
                      value={locationLabel}
                      onChange={(event) => setLocationLabel(event.target.value)}
                      required
                      maxLength={300}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="Street, neighborhood, postal code"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Organizer
                    </span>
                    <input
                      type="text"
                      value={organizerName}
                      onChange={(event) => setOrganizerName(event.target.value)}
                      required
                      maxLength={120}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="Host or group name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Event link
                    </span>
                    <input
                      type="url"
                      value={eventUrl}
                      onChange={(event) => setEventUrl(event.target.value)}
                      required
                      maxLength={2000}
                      pattern={WEBSITE_PATTERN}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="https://example.com/rsvp"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Contact email (optional)
                    </span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                      maxLength={255}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="Optional"
                    />
                  </label>

                  {siteKey ? (
                    <div className="space-y-2">
                      <span className="block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
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

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-xs leading-5 text-[#6b7280]">
                      This listing is published immediately.
                    </p>
                    <Button
                      type="submit"
                      disabled={
                        status === "submitting" ||
                        isPending ||
                        !siteKey ||
                        !turnstileToken
                      }
                      className="h-11 min-w-[148px] border border-[#111827] bg-[#111827] px-4 text-[12px] font-semibold tracking-[0.08em] text-white uppercase hover:bg-[#1f2937]"
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
