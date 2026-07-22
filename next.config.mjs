/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required so PostHog capture endpoints that use trailing slashes (e.g. /e/)
  // are not redirected before the rewrite runs.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/asq-relay/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/asq-relay/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/asq-relay/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ]
  },
}

export default nextConfig
