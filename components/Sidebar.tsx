'use client';

import { useState, useEffect } from 'react';
import NewsletterForm from './NewsletterForm';

interface SidebarProps {
  shareUrl?: string;
  showExtendedNewsletter?: boolean;
}

const partners = [
  {
    href: 'http://www.businessanalyticsforum.eu/index.php',
    name: 'Business Analytics Forum IV',
    image: '/images/Forum_BA4.png',
  },
  {
    href: 'http://www.businessanalyticsforum.eu/ba3/index.php',
    name: 'Business Analytics Forum III',
    image: '/images/Forum_BA3.png',
  },
  {
    href: 'http://www.crm-analytics.gr/',
    name: 'CRM Analytics',
    image: '/images/Forum_CRM1.png',
  },
  {
    href: 'http://www.businessanalyticsforum.eu/ba2/index.php',
    name: 'Business Analytics Forum II',
    image: '/images/Forum_BA2.png',
  },
  {
    href: 'http://www.businessanalyticsforum.eu/ba1/index.php',
    name: 'Business Analytics Forum',
    image: '/images/Forum_BA1.png',
  },
];

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Sidebar({ shareUrl, showExtendedNewsletter = true }: SidebarProps) {
  // Initialize from prop so server and client first-render match, then update client-side
  const [pageUrl, setPageUrl] = useState(shareUrl ?? '');

  useEffect(() => {
    if (!shareUrl) setPageUrl(window.location.href);
  }, [shareUrl]);

  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
  const xShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=Business+Analytics`;

  return (
    <aside className="sidebar" aria-label="Πλαϊνή στήλη">
      {/* Facebook */}
      <div className="s-card glass fade-up" data-delay="50">
        <a
          href="https://www.facebook.com/businessanalytics.gr/"
          target="_blank"
          rel="noopener"
          className="fb-lnk"
          aria-label="Business Analytics on Facebook"
        >
          <div className="fb-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </div>
          <div className="fb-tx">
            <small>Find us on</small>
            <strong>Facebook</strong>
          </div>
          <div className="fb-arr" aria-hidden="true"><ArrowRight /></div>
        </a>
      </div>

      {/* Share */}
      <div className="s-card glass fade-up" data-delay="100">
        <div className="s-lbl">SHARE</div>
        <div className="share-row">
          <a href={fbShare} target="_blank" rel="noopener" className="share-btn s-fb" aria-label="Share on Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Facebook
          </a>
          <a href={xShare} target="_blank" rel="noopener" className="share-btn s-x" aria-label="Share on X">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X
          </a>
        </div>
      </div>

      {/* Newsletter */}
      <div className="s-card glass fade-up" data-delay="150">
        <div className="s-lbl">Newsletter</div>
        <NewsletterForm showExtended={showExtendedNewsletter} />
      </div>

      {/* Partners */}
      <div className="s-card glass fade-up" data-delay="200">
        <div className="s-lbl">Partners</div>
        <div className="partner-list">
          {partners.map(p => (
            <a key={p.href} href={p.href} target="_blank" rel="noopener" className="p-item glass">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="p-logo"><img src={p.image} alt={p.name} /></div>
              <div className="p-arr" aria-hidden="true"><ArrowRight /></div>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
