"use server"

import type { CityId } from "@/lib/city-config"
import { COMPANY_CATEGORIES, type CompanyCategory } from "@/lib/company"
import { createAdminClient } from "@/lib/supabase/admin"

type City = CityId

export type CompanyRequestPayload = {
  category: CompanyCategory
  city: City
  companyName: string
  contactEmail: string
  founded: string
  locationLabel: string
  notes: string
  shortDescription: string
  website: string
}

export type CompanyRequestResult =
  | { status: "success" }
  | { status: "error"; message: string }

const VALID_CITIES = new Set<City>([
  "sf",
  "toronto",
  "ny",
  "london",
  "vancouver",
])
const VALID_CATEGORIES = new Set<string>(COMPANY_CATEGORIES)

export async function submitCompanyRequest(
  payload: CompanyRequestPayload
): Promise<CompanyRequestResult> {
  const companyName = payload.companyName.trim()
  const shortDescription = payload.shortDescription.trim()
  const locationLabel = payload.locationLabel.trim()
  const website = payload.website.trim()
  const contactEmail = payload.contactEmail.trim()
  const notes = payload.notes.trim()
  const founded = Number.parseInt(payload.founded, 10)

  if (!VALID_CITIES.has(payload.city)) {
    return { status: "error", message: "City is invalid." }
  }

  if (!companyName) {
    return { status: "error", message: "Company name is required." }
  }

  if (shortDescription.length < 20 || shortDescription.length > 280) {
    return {
      status: "error",
      message: "Short description must be between 20 and 280 characters.",
    }
  }

  if (!VALID_CATEGORIES.has(payload.category)) {
    return { status: "error", message: "Category is invalid." }
  }

  if (!Number.isInteger(founded) || founded < 1900 || founded > 2100) {
    return {
      status: "error",
      message: "Founded year must be between 1900 and 2100.",
    }
  }

  if (locationLabel.length < 4 || locationLabel.length > 200) {
    return { status: "error", message: "Address is required." }
  }

  if (website && website.length > 255) {
    return { status: "error", message: "Website is too long." }
  }

  if (contactEmail && contactEmail.length > 255) {
    return { status: "error", message: "Contact email is too long." }
  }

  if (notes.length > 1000) {
    return { status: "error", message: "Notes are too long." }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("company_submission_requests").insert({
    category: payload.category,
    city: payload.city,
    company_name: companyName,
    contact_email: contactEmail || null,
    founded,
    location_label: locationLabel,
    notes: notes || null,
    short_description: shortDescription,
    website: website || null,
  })

  if (error) {
    return {
      status: "error",
      message: "Could not send the request. Please try again.",
    }
  }

  return { status: "success" }
}
