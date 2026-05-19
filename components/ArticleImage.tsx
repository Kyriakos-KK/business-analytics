'use client'

import { useState } from 'react'
import Image from 'next/image'

// Images in subdirectories (/images/stories/, /images/articles/, etc.) live on the
// old Joomla server, not in Next.js public/. Rewrite them to the live site URL.
const JOOMLA_ORIGIN = 'https://www.business-analytics.gr'
const JOOMLA_SUBDIR = /^\/images\/[^/]+\//

function resolveSrc(src: string): string {
  if (JOOMLA_SUBDIR.test(src)) return JOOMLA_ORIGIN + src
  return src
}

interface Props {
  src: string
  alt: string
}

const PlaceholderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

export default function ArticleImage({ src, alt }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || src.trim() === '' || failed) {
    return (
      <div className="thumb-ph">
        <PlaceholderIcon />
      </div>
    )
  }

  const resolved = resolveSrc(src)

  // External URLs (Joomla subdirectory paths) use a plain <img> to avoid
  // needing next.config remotePatterns for the old Joomla server.
  if (resolved.startsWith('http')) {
    return (
      <img
        src={resolved}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={162}
      height={112}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  )
}