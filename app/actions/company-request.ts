"use server"

import { headers } from "next/headers"

import type { CityId } from "@/lib/city-config"
import { COMPANY_CATEGORIES, type CompanyCategory } from "@/lib/company"
import { hashClientIp, hashCompanyRequestPayload } from "@/lib/meetup-submit"
import { createAdminClient } from "@/lib/supabase/admin"

type City = CityId

export type CompanyRequestPayload = {
  turnstileToken: string
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
  "tokyo",
])
const VALID_CATEGORIES = new Set<string>(COMPANY_CATEGORIES)

const RATE_WINDOW_MS = 24 * 60 * 60 * 1000
const RATE_MAX = 5
const DUPLICATE_WINDOW_MS = 15 * 60 * 1000

async function getRequestIp(): Promise<string> {
  const h = await headers()
  const xff = h.get("x-forwarded-for")
  if (xff) {
    return xff.split(",")[0]?.trim() ?? "127.0.0.1"
  }
  return h.get("x-real-ip") ?? "127.0.0.1"
}

async function verifyTurnstile(
  token: string,
  remoteIp: string
): Promise<{ ok: boolean; message?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    return { ok: false, message: "Turnstile is not configured on the server." }
  }

  const body = new URLSearchParams()
  body.set("secret", secret)
  body.set("response", token)
  body.set("remoteip", remoteIp)

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  )

  const data = (await res.json()) as { success?: boolean }
  if (!data.success) {
    return { ok: false, message: "Bot verification failed. Please try again." }
  }

  return { ok: true }
}

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

  if (!payload.turnstileToken.trim()) {
    return {
      status: "error",
      message: "Complete the verification challenge.",
    }
  }

  const ip = await getRequestIp()
  const ipHash = hashClientIp(ip)

  const turnstile = await verifyTurnstile(payload.turnstileToken, ip)
  if (!turnstile.ok) {
    return {
      status: "error",
      message: turnstile.message ?? "Verification failed.",
    }
  }

  const payloadHash = hashCompanyRequestPayload({
    city: payload.city,
    companyName,
    category: payload.category,
    founded: String(founded),
    locationLabel,
    shortDescription,
    website,
  })

  const supabase = createAdminClient()

  const duplicateCutoff = new Date(
    Date.now() - DUPLICATE_WINDOW_MS
  ).toISOString()
  const { data: duplicateAttempts, error: duplicateError } = await supabase
    .from("company_submission_attempts")
    .select("id")
    .match({ payload_hash: payloadHash })
    .gte("created_at", duplicateCutoff)
    .limit(1)

  if (duplicateError) {
    console.error("company request duplicate check failed", duplicateError)
    return {
      status: "error",
      message: "Could not verify duplicate cooldown. Try later.",
    }
  }

  if (duplicateAttempts && duplicateAttempts.length > 0) {
    return {
      status: "error",
      message:
        "You already submitted this company request recently. Try again later.",
    }
  }

  const rateCutoff = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count: rateCount, error: rateError } = await supabase
    .from("company_submission_attempts")
    .select("id", { count: "exact", head: true })
    .match({ ip_hash: ipHash })
    .gte("created_at", rateCutoff)

  if (rateError) {
    console.error("company request rate limit check failed", rateError)
    return {
      status: "error",
      message: "Could not verify rate limit. Try later.",
    }
  }

  if ((rateCount ?? 0) >= RATE_MAX) {
    return {
      status: "error",
      message: "Too many submissions from this network. Try again tomorrow.",
    }
  }

  const { error: attemptError } = await supabase
    .from("company_submission_attempts")
    .insert({ ip_hash: ipHash, payload_hash: payloadHash })

  if (attemptError) {
    console.error("company request attempt insert failed", attemptError)
    return {
      status: "error",
      message: "Could not record submission. Try again.",
    }
  }

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
    console.error("company request insert failed", error)
    return {
      status: "error",
      message: "Could not send the request. Please try again.",
    }
  }

  return { status: "success" }
}
