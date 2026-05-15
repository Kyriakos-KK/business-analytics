import Link from 'next/link'

export default function Footer() {
  return (
    <footer>
      <div className="ft-inner">
        <nav className="ft-links" aria-label="Footer navigation">
          <Link href="/oroi-xrisis" className="f-lnk">Όροι Χρήσης</Link>
          <span className="f-sep" aria-hidden="true">|</span>
          <Link href="/epikoinonia" className="f-lnk">Επικοινωνία</Link>
          <span className="f-sep" aria-hidden="true">|</span>
          <Link href="/politiki-newsletter" className="f-lnk">Πολιτική Newsletter</Link>
        </nav>
        <p className="ft-copy">
          Copyright &copy; <span>BUSINESS-ANALYTICS.GR 2026.</span> All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}