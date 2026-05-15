import Link from 'next/link';
import type { Article } from '@/lib/api';

interface Props {
  prev: Article | null;
  next: Article | null;
}

export default function ArticleNavigation({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <div className="article-nav-row">
      {prev && (
        <Link href={`/article/${prev.id}`} className="art-nav-btn art-nav-prev" aria-label="Προηγούμενο άρθρο">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
      )}
      {next && (
        <Link href={`/article/${next.id}`} className="art-nav-btn art-nav-next" aria-label="Επόμενο άρθρο">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      )}
    </div>
  );
}
