import { Suspense } from 'react';
import { getAllArticles } from '@/lib/api';
import SearchClient from '@/components/SearchClient';

export const metadata = {
  title: 'Αναζήτηση | Business Analytics',
  description: 'Αναζήτηση άρθρων στο Business Analytics',
};

export default async function SearchPage() {
  const articles = await getAllArticles();

  return (
    <Suspense fallback={<div className="page-wrap" style={{ paddingTop: 60 }}>Φόρτωση...</div>}>
      <SearchClient articles={articles} />
    </Suspense>
  );
}
