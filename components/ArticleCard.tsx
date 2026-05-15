import Link from 'next/link'
import type { Article } from '@/lib/api'
import ArticleImage from '@/components/ArticleImage'

interface Props {
  article: Article
  delay?: number
}

const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

export default function ArticleCard({ article, delay = 0 }: Props) {
  return (
    <article className="a-card glass fade-up" data-delay={delay}>
      <div className="a-inner">
        <div className="a-thumb">
          <ArticleImage src={article.image} alt={article.title} />
        </div>
        <div className="a-body">
          <div className="a-meta">
            <span className="badge b-date">
              <CalIcon />
              {article.date}
            </span>
            <span className="badge b-cat">{article.category}</span>
          </div>
          <h2 className="a-title">
            <Link href={`/article/${article.id}`}>{article.title}</Link>
          </h2>
          <div className="sum-tag">Περίληψη</div>
          <p className="a-excerpt">{article.excerpt}</p>
          <Link href={`/article/${article.id}`} className="read-more">
            Περισσότερα...
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}