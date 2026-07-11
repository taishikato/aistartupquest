import { describe, expect, it } from "vitest"

import { submitCompanyRequest } from "@/app/actions/company-request"
import { hashCompanyRequestPayload } from "@/lib/meetup-submit"

function makePayload(
  overrides: Partial<Parameters<typeof submitCompanyRequest>[0]> = {}
) {
  return {
    turnstileToken: "",
    category: "Vertical AI" as const,
    city: "sf" as const,
    companyName: "Example AI",
    contactEmail: "",
    founded: "2024",
    locationLabel: "1455 3rd St, San Francisco",
    notes: "",
    shortDescription: "A solid short description for the map.",
    website: "https://example.com",
    ...overrides,
  }
}

describe("hashCompanyRequestPayload", () => {
  it("returns identical hashes for identical payloads", () => {
    const parts = {
      city: "sf",
      companyName: "Example AI",
      category: "Vertical AI",
      founded: "2024",
      locationLabel: "1455 3rd St",
      shortDescription: "A solid short description for the map.",
      website: "https://example.com",
    }

    expect(hashCompanyRequestPayload(parts)).toBe(
      hashCompanyRequestPayload(parts)
    )
  })

  it("returns different hashes when any field differs", () => {
    const base = {
      city: "sf",
      companyName: "Example AI",
      category: "Vertical AI",
      founded: "2024",
      locationLabel: "1455 3rd St",
      shortDescription: "A solid short description for the map.",
      website: "https://example.com",
    }

    expect(hashCompanyRequestPayload({ ...base, city: "ny" })).not.toBe(
      hashCompanyRequestPayload(base)
    )
    expect(
      hashCompanyRequestPayload({ ...base, companyName: "Other AI" })
    ).not.toBe(hashCompanyRequestPayload(base))
    expect(hashCompanyRequestPayload({ ...base, category: "Agents" })).not.toBe(
      hashCompanyRequestPayload(base)
    )
    expect(hashCompanyRequestPayload({ ...base, founded: "2023" })).not.toBe(
      hashCompanyRequestPayload(base)
    )
    expect(
      hashCompanyRequestPayload({ ...base, locationLabel: "Other St" })
    ).not.toBe(hashCompanyRequestPayload(base))
    expect(
      hashCompanyRequestPayload({
        ...base,
        shortDescription: "A different short description for hashing.",
      })
    ).not.toBe(hashCompanyRequestPayload(base))
    expect(
      hashCompanyRequestPayload({ ...base, website: "https://other.com" })
    ).not.toBe(hashCompanyRequestPayload(base))
  })
})

describe("submitCompanyRequest validation", () => {
  it("rejects an invalid city", async () => {
    const result = await submitCompanyRequest(
      makePayload({ city: "paris" as "sf" })
    )
    expect(result).toEqual({ status: "error", message: "City is invalid." })
  })

  it("rejects a short description under 20 characters", async () => {
    const result = await submitCompanyRequest(
      makePayload({ shortDescription: "x".repeat(19) })
    )
    expect(result).toEqual({
      status: "error",
      message: "Short description must be between 20 and 280 characters.",
    })
  })

  it("accepts a 20-character short description past the length check", async () => {
    const result = await submitCompanyRequest(
      makePayload({ shortDescription: "x".repeat(20), turnstileToken: "" })
    )
    expect(result).toEqual({
      status: "error",
      message: "Complete the verification challenge.",
    })
  })

  it("rejects founded years outside 1900-2100", async () => {
    const tooOld = await submitCompanyRequest(makePayload({ founded: "1899" }))
    expect(tooOld).toEqual({
      status: "error",
      message: "Founded year must be between 1900 and 2100.",
    })

    const tooNew = await submitCompanyRequest(makePayload({ founded: "2101" }))
    expect(tooNew).toEqual({
      status: "error",
      message: "Founded year must be between 1900 and 2100.",
    })
  })

  it("rejects a missing turnstile token", async () => {
    const result = await submitCompanyRequest(
      makePayload({ turnstileToken: "   " })
    )
    expect(result).toEqual({
      status: "error",
      message: "Complete the verification challenge.",
    })
  })
})
