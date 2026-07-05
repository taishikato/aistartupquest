"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import Script from "next/script"

export type TurnstileWidgetHandle = {
  /** Clears the widget and issues a new challenge (invalidates the prior token). */
  reset: () => void
}

type TurnstileWidgetProps = {
  siteKey: string
  onToken: (token: string | null) => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
        }
      ) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget({ siteKey, onToken }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  const renderWidget = useCallback(() => {
    const container = containerRef.current
    const api = window.turnstile
    if (!container || !api) {
      return
    }

    if (widgetIdRef.current) {
      api.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }

    widgetIdRef.current = api.render(container, {
      sitekey: siteKey,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    })
  }, [onToken, siteKey])

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        onToken(null)
        const api = window.turnstile
        const id = widgetIdRef.current
        if (api && id) {
          api.reset(id)
        }
      },
    }),
    [onToken]
  )

  useEffect(() => {
    if (!scriptReady) {
      return
    }
    renderWidget()
    return () => {
      const api = window.turnstile
      if (api && widgetIdRef.current) {
        api.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [renderWidget, scriptReady])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  )
})
