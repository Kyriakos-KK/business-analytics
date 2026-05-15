'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveDate, setLiveDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function updateDate() {
      setLiveDate(
        new Date().toLocaleDateString('el-GR', {
          timeZone: 'Europe/Athens',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    }
    updateDate();
    const id = setInterval(updateDate, 60000);
    return () => clearInterval(id);
  }, []);

  function doSearch(q: string) {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <nav id="navbar" className={scrolled ? 'scrolled' : ''} role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <div className="nav-top">
          <Link href="/" className="logo-wrap" aria-label="Business Analytics Home">
            <Image src="/images/businessanalytics@3x.png" alt="Business Analytics" width={280} height={110} style={{ height: 110, width: 'auto' }} priority />
          </Link>

          <a href="https://investments-forum.com/" target="_blank" rel="noopener" className="conf-badge" aria-label="Conferience Partnership">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/conferience_610x75.gif" alt="Conferience – In Partnership" className="conf-gif" />
            <div className="conf-glass" aria-hidden="true" />
          </a>

          <div className="nav-actions">
            <span className="conf-text" style={{ fontSize: 10, color: 'var(--mid)' }}>
              {liveDate}
            </span>
            <button
              className="icon-btn hamburger"
              id="hamburger"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="mob-panel"
              onClick={() => setMenuOpen(o => !o)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="nav-bottom">
          <ul className="nav-links">
            <li>
              <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>
                Αρχική
              </Link>
            </li>
          </ul>
          <div className="search-wrap">
            <span className="search-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="search"
              className="s-input"
              placeholder="Αναζήτηση..."
              aria-label="Αναζήτηση"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch(searchQuery); }}
            />
          </div>
        </div>

        <div className={`mob-panel${menuOpen ? ' open' : ''}`} id="mob-panel" role="menu">
          <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`} role="menuitem" onClick={() => setMenuOpen(false)}>
            Αρχική
          </Link>
          <div className="mob-search">
            <input
              type="search"
              className="s-input"
              placeholder="Αναζήτηση..."
              aria-label="Αναζήτηση"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  doSearch((e.target as HTMLInputElement).value);
                  setMenuOpen(false);
                }
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
