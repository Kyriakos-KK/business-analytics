import { getPayload } from 'payload'
import config from '@payload-config'

export interface Article {
  id: number
  title: string
  date: string
  dateISO: string
  createdAt: string
  category: string
  image: string
  popularity: number
  excerpt: string
  content: string
  author: string
}

function formatCreatedAt(isoString: string): { date: string; dateISO: string } {
  const d = new Date(isoString)
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  return {
    date:    `${day}/${month}/${year}`,
    dateISO: isoString.split('T')[0],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDoc(doc: any): Article {
  const { date, dateISO } = formatCreatedAt(doc.createdAt as string)
  return {
    id:         Number(doc.id),
    title:      (doc.title       as string) ?? '',
    date,
    dateISO,
    category:   (doc.category    as string) ?? '',
    image:      (doc.image       as string) ?? '',
    popularity: Number(doc.popularity ?? 0),
    excerpt:    (doc.description as string) ?? '',
    content:    (doc.content     as string) ?? '',
    author:     (doc.author      as string) ?? 'Business Analytics',
    createdAt:  (doc.createdAt   as string) ?? '',
  }
}

export async function getAllArticles(): Promise<Article[]> {
  try {
    const payload = await getPayload({ config })
    const result  = await payload.find({
      collection: 'articles',
      sort:       '-createdAt',
      limit:      1200,
      depth:      0,
    })
    return result.docs.map(mapDoc)
  } catch (error) {
    console.error('getAllArticles failed:', error)
    return []
  }
}

export async function getArticlesPaginated(
  page: number,
  limit = 8,
): Promise<{ articles: Article[]; totalDocs: number; totalPages: number; page: number }> {
  try {
    const payload = await getPayload({ config })
    const result  = await payload.find({
      collection: 'articles',
      sort:       '-createdAt',
      limit,
      page,
      depth:      0,
    })
    return {
      articles:   result.docs.map(mapDoc),
      totalDocs:  result.totalDocs,
      totalPages: result.totalPages,
      page:       result.page ?? page,
    }
  } catch (error) {
    console.error('getArticlesPaginated failed:', error)
    return { articles: [], totalDocs: 0, totalPages: 1, page: 1 }
  }
}

export async function getArticleById(id: number): Promise<Article | null> {
  try {
    const payload = await getPayload({ config })
    const doc     = await payload.findByID({
      collection: 'articles',
      id,
      depth: 0,
    })
    return mapDoc(doc)
  } catch {
    return null
  }
}

export async function getAdjacentArticles(
  createdAt: string,
): Promise<{ prev: Article | null; next: Article | null }> {
  try {
    const payload = await getPayload({ config })
    const [prevResult, nextResult] = await Promise.all([
      payload.find({
        collection: 'articles',
        where:      { createdAt: { greater_than: createdAt } },
        sort:       'createdAt',
        limit:      1,
        depth:      0,
      }),
      payload.find({
        collection: 'articles',
        where:      { createdAt: { less_than: createdAt } },
        sort:       '-createdAt',
        limit:      1,
        depth:      0,
      }),
    ])
    return {
      prev: prevResult.docs[0]  ? mapDoc(prevResult.docs[0])  : null,
      next: nextResult.docs[0] ? mapDoc(nextResult.docs[0]) : null,
    }
  } catch {
    return { prev: null, next: null }
  }
}