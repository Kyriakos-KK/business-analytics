'use client'

import { useState } from 'react'

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

export default function ArticleHeroImage({ src, alt }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || src.trim() === '' || failed) return null

  const resolved = resolveSrc(src)

  return (
    <img
      src={resolved}
      alt={alt}
      className="article-hero-img"
      onError={() => setFailed(true)}
    />
  )
}