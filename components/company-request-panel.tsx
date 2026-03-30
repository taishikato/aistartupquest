"use client"

import { useState, useTransition, type FormEvent } from "react"
import { LoaderCircle, Plus, X } from "lucide-react"

import { COMPANY_CATEGORIES, type CompanyCategory } from "@/lib/company"
import { Button } from "@/components/ui/button"
import { submitCompanyRequest } from "@/app/actions/company-request"

type CompanyRequestPanelProps = {
  initialCity: "sf" | "toronto"
}

const WEBSITE_PATTERN = "https?://.+"
const CITY_OPTIONS = [
  { value: "sf", label: "San Francisco" },
  { value: "toronto", label: "Toronto" },
] as const

export function CompanyRequestPanel({ initialCity }: CompanyRequestPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [city, setCity] = useState<"sf" | "toronto">(initialCity)
  const [companyName, setCompanyName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [category, setCategory] = useState<CompanyCategory>("Vertical AI")
  const [founded, setFounded] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [website, setWebsite] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const resetForm = () => {
    setCity(initialCity)
    setCompanyName("")
    setShortDescription("")
    setCategory("Vertical AI")
    setFounded("")
    setLocationLabel("")
    setWebsite("")
    setContactEmail("")
    setNotes("")
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

    const trimmedCompanyName = companyName.trim()
    const trimmedShortDescription = shortDescription.trim()
    const trimmedLocationLabel = locationLabel.trim()
    const trimmedWebsite = website.trim()
    const trimmedContactEmail = contactEmail.trim()
    const trimmedNotes = notes.trim()
    const parsedFounded = Number.parseInt(founded, 10)

    if (!trimmedCompanyName) {
      setErrorMessage("Company name is required.")
      return
    }

    if (trimmedShortDescription.length < 20) {
      setErrorMessage("Short description must be at least 20 characters.")
      return
    }

    if (trimmedLocationLabel.length < 4) {
      setErrorMessage("Address is required.")
      return
    }

    if (
      !Number.isInteger(parsedFounded) ||
      parsedFounded < 1900 ||
      parsedFounded > 2100
    ) {
      setErrorMessage("Founded year must be between 1900 and 2100.")
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    startTransition(async () => {
      const result = await submitCompanyRequest({
        category,
        city,
        companyName: trimmedCompanyName,
        contactEmail: trimmedContactEmail,
        founded: String(parsedFounded),
        locationLabel: trimmedLocationLabel,
        notes: trimmedNotes,
        shortDescription: trimmedShortDescription,
        website: trimmedWebsite,
      })

      if (result.status === "error") {
        setStatus("idle")
        setErrorMessage(result.message)
        return
      }

      resetForm()
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
          Add company
        </Button>
      </div>

      {isOpen ? (
        <div className="absolute inset-0 z-30 flex justify-end bg-[rgba(15,23,42,0.16)]">
          <div className="flex h-full w-full max-w-[420px] flex-col border-l border-[#d5d9df] bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.16)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                  Add company request
                </p>
                <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
                  Suggest a company
                </h2>
                <p className="mt-2 max-w-[28ch] text-sm leading-6 text-[#4b5563]">
                  Send a company for review. Approved submissions can be added
                  to the map later.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="mt-0.5 border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                aria-label="Close request panel"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {status === "success" ? (
                <div className="border border-[#dbe4d4] bg-[#f7fbf4] px-4 py-4">
                  <p className="text-sm font-medium text-[#1f2937]">
                    Request sent.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                    Thanks. We will review it before publishing anything on the
                    map.
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
                        setCity(event.target.value as "sf" | "toronto")
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
                      Company name
                    </span>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      required
                      maxLength={120}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="Example AI"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Short description
                    </span>
                    <textarea
                      value={shortDescription}
                      onChange={(event) =>
                        setShortDescription(event.target.value)
                      }
                      required
                      maxLength={280}
                      rows={4}
                      className="w-full resize-none border border-[#d5d9df] bg-white px-3 py-3 text-sm leading-6 text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="What does this company do, and why does it belong on the map?"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                        Category
                      </span>
                      <select
                        value={category}
                        onChange={(event) =>
                          setCategory(event.target.value as CompanyCategory)
                        }
                        className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none focus:border-[#111827]"
                      >
                        {COMPANY_CATEGORIES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                        Founded
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={founded}
                        onChange={(event) => setFounded(event.target.value)}
                        required
                        min={1900}
                        max={2100}
                        className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                        placeholder="2024"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Address
                    </span>
                    <input
                      type="text"
                      value={locationLabel}
                      onChange={(event) => setLocationLabel(event.target.value)}
                      required
                      maxLength={200}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="1455 3rd St, San Francisco"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Website
                    </span>
                    <input
                      type="url"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      maxLength={255}
                      pattern={WEBSITE_PATTERN}
                      className="h-11 w-full border border-[#d5d9df] bg-white px-3 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="https://example.com"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Contact email
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

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-[#6b7280] uppercase">
                      Notes
                    </span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      maxLength={1000}
                      rows={6}
                      className="w-full resize-none border border-[#d5d9df] bg-white px-3 py-3 text-sm leading-6 text-[#111827] transition-colors outline-none placeholder:text-[#9ca3af] focus:border-[#111827]"
                      placeholder="Why should this company be added?"
                    />
                  </label>

                  {errorMessage ? (
                    <div className="border border-[#efc7c7] bg-[#fff7f7] px-3 py-3 text-sm text-[#b42318]">
                      {errorMessage}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-xs leading-5 text-[#6b7280]">
                      This creates a review request, not a public listing.
                    </p>
                    <Button
                      type="submit"
                      disabled={status === "submitting" || isPending}
                      className="h-11 min-w-[148px] border border-[#111827] bg-[#111827] px-4 text-[12px] font-semibold tracking-[0.08em] text-white uppercase hover:bg-[#1f2937]"
                    >
                      {status === "submitting" || isPending ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Sending
                        </>
                      ) : (
                        "Send request"
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
