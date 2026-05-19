import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getArticleById, getAdjacentArticles } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ArticleNavigation from '@/components/ArticleNavigation';
import ArticleHeroImage from '@/components/ArticleHeroImage';

// Joomla subdirectory images live on the old server, not in Next.js public/
const JOOMLA_ORIGIN = 'https://www.business-analytics.gr'

function prepareContent(content: string, heroImage: string | null | undefined): string {
  let html = content;
  html = html.replace(/src="(\/images\/[^"/]+\/)/g, `src="${JOOMLA_ORIGIN}$1`);
  html = html.replace(/src='(\/images\/[^'/]+\/)/g, `src='${JOOMLA_ORIGIN}$1`);
  const heroResolved = heroImage
    ? (/^\/images\/[^/]+\//.test(heroImage) ? JOOMLA_ORIGIN + heroImage : heroImage)
    : '';
  for (const candidate of [heroResolved, heroImage].filter(Boolean) as string[]) {
    const esc = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
    html = html.replace(new RegExp(`<img[^>]+src="${esc}"[^>]*/?>`, 'i'), '');
  }
  html = html.replace(/<img[^>]+src="https?:\/\/(?!(?:www\.)?business-analytics\.gr\/)[^"]*"[^>]*\/?>/gi, '');
  html = html.replace(/<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>/gi, '');
  return html;
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(parseInt(id));
  if (!article) return { title: 'Άρθρο | Business Analytics' };
  return {
    title: `${article.title} | Business Analytics`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(parseInt(id));
  if (!article) notFound();
  const { prev: prevArticle, next: nextArticle } = await getAdjacentArticles(article.createdAt);
  const bodyHtml = prepareContent(article.content, article.image);
  return (
    <>
      <div className="page-hero">
        <div className="page-wrap">
          <nav className="breadcrumb">
            <Link href="/">Αρχική</Link>
            <span className="sep">›</span>
            <span className="current">{article.title}</span>
          </nav>
        </div>
      </div>
      <main className="page-wrap" style={{ marginTop: 28 }}>
        <div className="content-grid">
          <section>
            <article className="article-full glass fade-up" style={{ padding: '28px 28px 32px', borderRadius: 18 }}>
              <ArticleHeroImage src={article.image} alt={article.title} />
              <div className="article-meta-bar">
                <span className="a-cat">{article.category}</span>
                <span className="a-date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {article.date}
                </span>
              </div>
              <h1 className="article-title-lg">{article.title}</h1>
              <div className="article-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              <ArticleNavigation prev={prevArticle} next={nextArticle} />
            </article>
          </section>
          <Sidebar showExtendedNewsletter />
        </div>
      </main>
    </>
  );
}
