// withPayload wraps the Next.js config to add Payload CMS support.
// It sets up the @payload-config path alias and bundles Payload's admin UI.
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

// Note: --turbopack is removed from the dev script because withPayload uses
// webpack plugins. Use "next dev" (without --turbopack) for full compatibility.
export default withPayload(nextConfig)
