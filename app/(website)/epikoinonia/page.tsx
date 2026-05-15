import type { Metadata } from 'next'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Επικοινωνία | Business Analytics',
  description: 'Επικοινωνήστε μαζί μας στο Business-Analytics.gr',
}

export default function ContactPage() {
  return (
    <>
      <div className="page-hero">
        <div className="page-wrap">
          <nav className="breadcrumb">
            <Link href="/">Αρχική</Link>
            <span className="sep">›</span>
            <span className="current">Επικοινωνία</span>
          </nav>
        </div>
      </div>
      <main className="page-wrap" style={{ marginTop: 28 }}>
        <div className="content-grid">
          <section>
            <div className="article-full glass fade-up" style={{ padding: '32px', borderRadius: 18 }}>
              <div className="contact-info">
                <h1 className="contact-title">Business-Analytics.gr</h1>
                <p><strong>Τηλέφωνο:</strong>{' '}
                  <a href="tel:+302106846329" className="contact-link">+30 210 6846329</a>
                </p>
                <p><strong>Fax:</strong> +30 210 6841789</p>
                <p><strong>email:</strong>{' '}
                  <a href="mailto:info@business-analytics.gr" className="contact-link">info@business-analytics.gr</a>
                </p>
              </div>
              <ContactForm />
            </div>
          </section>
          <Sidebar shareUrl="https://www.business-analytics.gr/epikoinonia" />
        </div>
      </main>
    </>
  )
}