import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const makePublicPreviewOrigin = (() => {
  const publicURL = process.env.FIGMA_PUBLIC_URL
  if (!publicURL) return undefined

  try {
    // Next.js expects host[:port] entries rather than full URL origins.
    return new URL(publicURL).host
  } catch {
    return undefined
  }
})()

const nextConfig: NextConfig = {
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  output: 'standalone',
  // Don't block publishing or preview deploys on errors if the emitted JS is valid
  typescript: {
    ignoreBuildErrors: true,
  },
  // `next dev` serves the Make preview at a per-sandbox cross-origin host. Next
  // blocks its dev resources (`/_next/*`, HMR WebSocket, internal endpoints)
  // unless the origin is listed here, and a blocked HMR socket stalls Turbopack
  // so the preview iframe renders blank.
  // Dev-only - ignored by `next build`.
  //
  allowedDevOrigins: makePublicPreviewOrigin ? [makePublicPreviewOrigin] : [],
  // Prerender source maps add ~100 MB per static build worker
  enablePrerenderSourceMaps: false,
  experimental: {
    // Caps static build workers (~250-380 MB each) to lower `next build` peak memory
    cpus: 2,
    // Server Actions use the browser origin. In the Make preview proxy, the
    // browser origin is the public sandbox host while `x-forwarded-host` points
    // at the local dev server. Allow only that exact platform-provisioned host.
    serverActions: {
      allowedOrigins: makePublicPreviewOrigin ? [makePublicPreviewOrigin] : [],
    },
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.FIGMA_PUBLIC_URL || 'http://localhost:3000',
    // NOTE: Do not add API keys, tokens, OAuth client secrets, or any other
    // credential here. Values placed in `env` are inlined into the JavaScript
    // bundle by Next.js at build time and become readable by anyone who can
    // load the app's client assets. Server-side code can still read
    // `process.env.*` without declaring it here. Only public, non-secret values
    // that explicitly need to be available in browser code should be added -
    // and those should use the `NEXT_PUBLIC_*` naming convention.
  },
}

export default nextConfig
