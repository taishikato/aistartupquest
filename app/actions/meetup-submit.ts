"use server"

import { headers } from "next/headers"

import type { CityId } from "@/lib/city-config"
import {
  buildMeetupGeocodeQuery,
  hashClientIp,
  hashMeetupPayload,
  slugifyMeetupBase,
} from "@/lib/meetup-submit"
import { createAdminClient } from "@/lib/supabase/admin"

export type MeetupSubmitPayload = {
  turnstileToken: string
  city: CityId
  title: string
  description: string
  venueName: string
  locationLabel: string
  startsAt: string
  endsAt: string | null
  organizerName: string
  eventUrl: string
  xAccount: string
}

export type MeetupSubmitResult =
  | { status: "success"; slug: string }
  | { status: "error"; message: string }

const VALID_CITIES = new Set<CityId>([
  "sf",
  "toronto",
  "ny",
  "london",
  "vancouver",
  "tokyo",
])

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

async function geocodeWithGoogle(address: string): Promise<{
  lat: number
  lng: number
} | null> {
  const key = process.env.GOOGLE_MAPS_GEOCODING_API_KEY
  if (!key) {
    throw new Error("GOOGLE_MAPS_GEOCODING_API_KEY is not set")
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
  const res = await fetch(url)
  const data = (await res.json()) as {
    status: string
    results?: { geometry: { location: { lat: number; lng: number } } }[]
  }

  if (data.status !== "OK" || !data.results?.[0]) {
    return null
  }

  const loc = data.results[0].geometry.location
  return { lat: loc.lat, lng: loc.lng }
}

function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export async function submitMeetup(
  payload: MeetupSubmitPayload
): Promise<MeetupSubmitResult> {
  const title = payload.title.trim()
  const description = payload.description.trim()
  const venueName = payload.venueName.trim()
  const locationLabel = payload.locationLabel.trim()
  const organizerName = payload.organizerName.trim()
  const eventUrl = payload.eventUrl.trim()
  const xAccount = payload.xAccount.trim()
  const storedDescription = description || title
  const storedOrganizerName = organizerName || xAccount

  if (!VALID_CITIES.has(payload.city)) {
    return { status: "error", message: "City is invalid." }
  }

  if (!payload.turnstileToken) {
    return { status: "error", message: "Complete the verification challenge." }
  }

  if (title.length < 1 || title.length > 200) {
    return { status: "error", message: "Title must be 1–200 characters." }
  }

  if (storedDescription.length < 1 || storedDescription.length > 5000) {
    return {
      status: "error",
      message: "Description must be 1–5000 characters.",
    }
  }

  if (venueName.length < 1 || venueName.length > 200) {
    return { status: "error", message: "Venue name must be 1–200 characters." }
  }

  if (locationLabel.length < 1 || locationLabel.length > 300) {
    return { status: "error", message: "Address must be 1–300 characters." }
  }

  if (!eventUrl || !isValidHttpUrl(eventUrl) || eventUrl.length > 2000) {
    return {
      status: "error",
      message: "Event link must be a valid http(s) URL.",
    }
  }

  if (xAccount.length < 1) {
    return { status: "error", message: "X account is required." }
  }

  if (xAccount.length > 120) {
    return { status: "error", message: "X account is too long." }
  }

  if (storedOrganizerName.length < 1 || storedOrganizerName.length > 120) {
    return {
      status: "error",
      message: "Organizer name must be 1–120 characters.",
    }
  }

  let startsAtMs: number
  let endsAtMs: number | null = null

  try {
    startsAtMs = new Date(payload.startsAt).getTime()
    if (!Number.isFinite(startsAtMs)) {
      return { status: "error", message: "Start time is invalid." }
    }
    if (payload.endsAt) {
      endsAtMs = new Date(payload.endsAt).getTime()
      if (!Number.isFinite(endsAtMs)) {
        return { status: "error", message: "End time is invalid." }
      }
      if (endsAtMs <= startsAtMs) {
        return {
          status: "error",
          message: "End time must be after start time.",
        }
      }
    }
  } catch {
    return { status: "error", message: "Date and time are invalid." }
  }

  const now = Date.now()
  const upcoming =
    endsAtMs !== null ? endsAtMs >= now : startsAtMs >= now - 2 * 60 * 60 * 1000

  if (!upcoming) {
    return {
      status: "error",
      message:
        "Only upcoming or currently running meetups can be listed. Adjust the times.",
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

  const payloadHash = hashMeetupPayload({
    city: payload.city,
    title,
    description: storedDescription,
    venueName,
    locationLabel,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    organizerName: storedOrganizerName,
    eventUrl,
    xAccount,
  })

  const supabase = createAdminClient()

  // Same-payload cooldown: any prior attempt row (including failed geocode/insert)
  // blocks repeats within the window so we cannot hammer the geocoder.
  const duplicateCutoff = new Date(
    Date.now() - DUPLICATE_WINDOW_MS
  ).toISOString()
  const { data: duplicateAttempts, error: duplicateError } = await supabase
    .from("meetup_submission_attempts")
    .select("id")
    .eq("payload_hash", payloadHash)
    .gte("created_at", duplicateCutoff)
    .limit(1)

  if (duplicateError) {
    return {
      status: "error",
      message: "Could not verify duplicate cooldown. Try later.",
    }
  }

  if (duplicateAttempts && duplicateAttempts.length > 0) {
    return {
      status: "error",
      message: "You already submitted this meetup recently. Try again later.",
    }
  }

  const rateCutoff = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count: rateCount, error: rateError } = await supabase
    .from("meetup_submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", rateCutoff)

  if (rateError) {
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
    .from("meetup_submission_attempts")
    .insert({ ip_hash: ipHash, payload_hash: payloadHash })

  if (attemptError) {
    return {
      status: "error",
      message: "Could not record submission. Try again.",
    }
  }

  const query = buildMeetupGeocodeQuery(venueName, locationLabel, payload.city)
  let coords: { lat: number; lng: number } | null
  try {
    coords = await geocodeWithGoogle(query)
  } catch {
    return {
      status: "error",
      message: "Location lookup is temporarily unavailable. Try again later.",
    }
  }

  if (!coords) {
    return {
      status: "error",
      message:
        "We could not place that address on the map. Check the venue and address.",
    }
  }

  const baseSlug = slugifyMeetupBase(title, payload.city, payload.startsAt)
  let slug = baseSlug
  let insertedSlug: string | null = null

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data: inserted, error: insertError } = await supabase
      .from("meetups")
      .insert({
        slug,
        city: payload.city,
        title,
        description: storedDescription,
        venue_name: venueName,
        location_label: locationLabel,
        latitude: coords.lat,
        longitude: coords.lng,
        starts_at: payload.startsAt,
        ends_at: payload.endsAt || null,
        organizer_name: storedOrganizerName,
        event_url: eventUrl,
        contact_email: xAccount || null,
        status: "published",
        payload_hash: payloadHash,
      })
      .select("slug")
      .maybeSingle()

    if (!insertError && inserted?.slug) {
      insertedSlug = inserted.slug
      break
    }

    const code = insertError?.code
    if (code === "23505") {
      slug = `${baseSlug}-${attempt + 2}`
      continue
    }

    return {
      status: "error",
      message: "Could not publish the meetup. Please try again.",
    }
  }

  if (!insertedSlug) {
    return { status: "error", message: "Could not assign a unique URL slug." }
  }

  return { status: "success", slug: insertedSlug }
}
