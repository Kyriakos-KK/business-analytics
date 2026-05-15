'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function FadeObserverInner() {
  const pathname   = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = parseInt(
              (entry.target as HTMLElement).dataset.delay ?? '0'
            )
            setTimeout(() => entry.target.classList.add('in'), delay)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '120px 0px 120px 0px' }
    )

    const timer = setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('.fade-up:not(.in)')
        .forEach(el => observer.observe(el))
    }, 50)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [pathname, searchParams])

  return null
}

export default function FadeObserver() {
  return (
    <Suspense fallback={null}>
      <FadeObserverInner />
    </Suspense>
  )
}