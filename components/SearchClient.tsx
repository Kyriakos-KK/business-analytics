'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Article } from '@/lib/api';
import Sidebar from './Sidebar';
import ArticleImage from './ArticleImage';

const PER_PAGE = 8;

type SortKey = 'newest' | 'popular' | 'alpha' | 'category';

function sortResults(arr: Article[], key: SortKey): Article[] {
  const copy = [...arr];
  if (key === 'newest') return copy.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  if (key === 'popular') return copy.sort((a, b) => b.popularity - a.popularity);
  if (key === 'alpha') return copy.sort((a, b) => a.title.localeCompare(b.title, 'el'));
  if (key === 'category') return copy.sort((a, b) => a.category.localeCompare(b.category, 'el'));
  return copy;
}

// articles are passed from the server component (search/page.tsx)
// so we don't need to import BA_DATA here anymore
interface Props {
  articles: Article[];
}

export default function SearchClient({ articles }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') ?? '');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  const allResults = query
    ? articles.filter(a => {
        const q = query.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      })
    : [];

  const sorted = sortResults(allResults, sortKey);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const slice = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Trigger fade-in for dynamically rendered result cards
  useEffect(() => {
    const timer = setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('#search-results .fade-up:not(.in)')
        .forEach(el => el.classList.add('in'));
    }, 60);
    return () => clearTimeout(timer);
  }, [slice]);

  function runSearch(q: string) {
    const trimmed = q.trim();
    setQuery(trimmed);
    setPage(1);
    if (trimmed) {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
  }

  return (
    <>
      <div className="page-hero search-hero">
        <div className="page-wrap">
          <nav className="breadcrumb">
            <Link href="/">Αρχική</Link>
            <span className="sep">›</span>
            <span className="current">Αναζήτηση</span>
          </nav>
          <h1>Αναζήτηση</h1>
          <div className="search-big" style={{ marginTop: 18 }}>
            <input
              type="search"
              id="search-input"
              placeholder="Αναζητήστε άρθρα..."
              aria-label="Αναζήτηση"
              autoComplete="off"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(inputVal); }}
            />
            <button onClick={() => runSearch(inputVal)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={16} height={16}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              Αναζήτηση
            </button>
          </div>
        </div>
      </div>

      <main className="page-wrap" style={{ marginTop: 24 }}>
        <div className="content-grid">
          <section>
            {query && (
              <div className="search-controls" style={{ display: 'flex' }}>
                <label htmlFor="sort-select">Κατάταξη:</label>
                <select
                  className="sort-select"
                  id="sort-select"
                  aria-label="Κατάταξη αποτελεσμάτων"
                  value={sortKey}
                  onChange={e => { setSortKey(e.target.value as SortKey); setPage(1); }}
                >
                  <option value="newest">Πρώτα τα νεότερα</option>
                  <option value="popular">Περισσότερο Δημοφιλή</option>
                  <option value="alpha">Αλφαβητικά</option>
                  <option value="category">Κατηγορία</option>
                </select>
                <span className="search-count">{sorted.length} αποτελέσματα</span>
              </div>
            )}

            <div id="search-results">
              {query && sorted.length === 0 && (
                <div className="no-results">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <h3>Δεν βρέθηκαν αποτελέσματα</h3>
                  <p>Δοκιμάστε διαφορετικές λέξεις-κλειδιά</p>
                </div>
              )}
              {slice.map(a => (
                <article key={a.id} className="a-card glass fade-up">
                  <div className="a-inner">
                    <div className="a-thumb">
                      <ArticleImage src={a.image} alt={a.title} />
                    </div>
                    <div className="a-body">
                      <div className="a-meta">
                        <span className="badge b-date">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={12} height={12}>
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {a.date}
                        </span>
                        <span className="badge b-cat">{a.category}</span>
                      </div>
                      <h2 className="a-title">
                        <Link href={`/article/${a.id}`}>{a.title}</Link>
                      </h2>
                      <div className="sum-tag">Περίληψη</div>
                      <p className="a-excerpt">{a.excerpt}</p>
                      <Link href={`/article/${a.id}`} className="read-more">
                        Περισσότερα...
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination" aria-label="Σελιδοποίηση αποτελεσμάτων">
                <span className="page-info">Σελίδα {page} από {totalPages}</span>
                <button className="page-btn" disabled={page === 1} onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`page-btn${p === page ? ' active' : ''}`}
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    {p}
                  </button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>›</button>
              </div>
            )}
          </section>

          <Sidebar showExtendedNewsletter={false} />
        </div>
      </main>
    </>
  );
}
