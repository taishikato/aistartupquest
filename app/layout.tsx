import "maplibre-gl/dist/maplibre-gl.css"

import type { Metadata } from "next"
import { Geist_Mono, Inter, Press_Start_2P } from "next/font/google"

import "./globals.css"

import { ogImage, pageDescription, pageTitle, siteUrl } from "@/lib/config"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: siteUrl,
    siteName: "SF AI Startup Map",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [ogImage],
  },
  icons: {
    icon: [{ url: "/brand-mark.svg", type: "image/svg+xml" }],
    apple: "/brand-mark.svg",
  },
}

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontPixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        fontPixel.variable,
        "font-sans",
        fontSans.variable
      )}
    >
      <body>
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
