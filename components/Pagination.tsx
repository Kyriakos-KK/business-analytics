import Link from 'next/link'

interface Props {
  page: number
  totalPages: number
  totalDocs: number
}

function pageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]

  const left  = Math.max(2, current - 2)
  const right = Math.min(total - 1, current + 2)

  if (left > 2)        pages.push('…')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('…')
  pages.push(total)

  return pages
}

export default function Pagination({ page, totalPages, totalDocs }: Props) {
  if (totalPages <= 1) return null

  const pages = pageRange(page, totalPages)

  const href = (p: number) => (p === 1 ? '/' : `/?page=${p}`)

  return (
    <nav aria-label="Σελιδοποίηση" style={{ marginTop: '8px' }}>
      <p className="page-info" style={{ textAlign: 'center', marginBottom: '10px' }}>
        Σελίδα {page} από {totalPages} &nbsp;·&nbsp; {totalDocs.toLocaleString('el-GR')} άρθρα
      </p>
      <div className="pagination">
        {/* First */}
        <Link
          href={href(1)}
          aria-label="Πρώτη σελίδα"
          className={'page-btn' + (page === 1 ? ' disabled' : '')}
          aria-disabled={page === 1}
          tabIndex={page === 1 ? -1 : undefined}
        >«</Link>

        {/* Prev */}
        <Link
          href={href(page - 1)}
          aria-label="Προηγούμενη"
          className={'page-btn' + (page === 1 ? ' disabled' : '')}
          aria-disabled={page === 1}
          tabIndex={page === 1 ? -1 : undefined}
        >‹</Link>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="page-info">…</span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className={'page-btn' + (p === page ? ' active' : '')}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        <Link
          href={href(page + 1)}
          aria-label="Επόμενη"
          className={'page-btn' + (page === totalPages ? ' disabled' : '')}
          aria-disabled={page === totalPages}
          tabIndex={page === totalPages ? -1 : undefined}
        >›</Link>

        {/* Last */}
        <Link
          href={href(totalPages)}
          aria-label="Τελευταία σελίδα"
          className={'page-btn' + (page === totalPages ? ' disabled' : '')}
          aria-disabled={page === totalPages}
          tabIndex={page === totalPages ? -1 : undefined}
        >»</Link>
      </div>
    </nav>
  )
}