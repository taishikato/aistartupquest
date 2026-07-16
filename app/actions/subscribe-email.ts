"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type SubscribeEmailResult =
  | { ok: true }
  | { ok: false; error: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_SOURCE_LENGTH = 64

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeSource(source: string | undefined) {
  const trimmed = (source ?? "map_footer").trim()
  if (!trimmed || trimmed.length > MAX_SOURCE_LENGTH) {
    return "map_footer"
  }
  return trimmed
}

export async function subscribeEmail(input: {
  email: string
  source?: string
}): Promise<SubscribeEmailResult> {
  const email = normalizeEmail(input.email)
  const source = normalizeSource(input.source)

  if (email.length < 3 || email.length > 255 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." }
  }

  try {
    const supabase = createAdminClient()

    const existingResult = await supabase
      .from("email_subscribers")
      .select("id, unsubscribed_at")
      .match({ email })
      .maybeSingle()

    if (existingResult.error) {
      console.error("email_subscribers lookup failed", existingResult.error)
      return { ok: false, error: "Could not save your email. Try again." }
    }

    if (existingResult.data) {
      if (existingResult.data.unsubscribed_at) {
        const resumeResult = await supabase
          .from("email_subscribers")
          .update({ unsubscribed_at: null, source })
          .match({ id: existingResult.data.id })

        if (resumeResult.error) {
          console.error("email_subscribers resume failed", resumeResult.error)
          return { ok: false, error: "Could not save your email. Try again." }
        }
      }

      return { ok: true }
    }

    const insertResult = await supabase.from("email_subscribers").insert({
      email,
      source,
    })

    if (insertResult.error) {
      // Unique race: treat as success if another request inserted first.
      if (insertResult.error.code === "23505") {
        return { ok: true }
      }

      console.error("email_subscribers insert failed", insertResult.error)
      return { ok: false, error: "Could not save your email. Try again." }
    }

    return { ok: true }
  } catch (error) {
    console.error("subscribeEmail failed", error)
    return { ok: false, error: "Could not save your email. Try again." }
  }
}
