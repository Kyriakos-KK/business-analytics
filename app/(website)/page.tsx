import { getArticlesPaginated } from '@/lib/api'
import ArticleCard from '@/components/ArticleCard'
import Sidebar from '@/components/Sidebar'
import Pagination from '@/components/Pagination'

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  const { articles, totalDocs, totalPages } = await getArticlesPaginated(page, 30)

  return (
    <main className="page-wrap">
      <div className="content-grid">
        <section aria-label="Άρθρα">
          <div className="article-list">
            {articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} delay={Math.min(i * 50, 150)} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} totalDocs={totalDocs} />
        </section>
        <Sidebar shareUrl="https://www.business-analytics.gr/" showExtendedNewsletter />
      </div>
    </main>
  )
}