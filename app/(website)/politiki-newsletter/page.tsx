import type { Metadata } from 'next'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Πολιτική Newsletter | Business Analytics',
  description: 'Πολιτική προστασίας προσωπικών δεδομένων για το Newsletter του Business-Analytics.gr',
}

export default function NewsletterPolicyPage() {
  return (
    <>
      <div className="page-hero">
        <div className="page-wrap">
          <nav className="breadcrumb">
            <Link href="/">Αρχική</Link>
            <span className="sep">›</span>
            <span className="current">Πολιτική Newsletter</span>
          </nav>
        </div>
      </div>
      <main className="page-wrap" style={{ marginTop: 28 }}>
        <div className="content-grid">
          <section>
            <article className="article-full glass fade-up" style={{ padding: '32px', borderRadius: 18 }}>
              <h1 className="article-title-lg">Newsletter</h1>
              <p className="static-date">03/05/2018</p>

              <div className="static-content">
                <p>
                  Τα προσωπικά στοιχεία (e-mail, όνομα, επίθετο, εταιρεία, και θέση) που συλλέγονται θα
                  χρησιμοποιηθούν για την τήρηση αρχείου με σκοπό την επικοινωνία και την προώθηση των
                  υπηρεσιών του www.business-analytics.gr στα μέλη της κοινότητας που είναι εγγεγραμμένα
                  στο newsletter. Το www.business-analytics.gr δεσμεύεται ότι θα χρησιμοποιεί αυτά τα
                  στοιχεία σύμφωνα με τους νόμους του Ελληνικού κράτους και της Ευρωπαϊκής Ένωσης.
                </p>
                <p>
                  Τα στοιχεία που συλλέγονται έχουν σκοπό την αποστολή του newsletter ή ενημερωτικού υλικού
                  από διαφημιζόμενους στο www.business-analytics.gr. Τα στοιχεία αυτά δεν μεταπωλούνται
                  ούτε κοινοποιούνται σε τρίτους, αλλά το www.business-analytics.gr διατηρεί το δικαίωμα
                  λήψης οποιωνμέτρων (π.χ. προσωρινή ή μόνιμη διακοπή παροχής της υπηρεσίας), κατά όσων
                  χρησιμοποιούν την υπηρεσία κακόβουλα ή με ψευδή στοιχεία.
                </p>
                <p>
                  Ο Χρήστης έχει το δικαίωμα της διαγραφής από το newsletter, οποιαδήποτε στιγμή το
                  θελήσει στέλνοντας στο{' '}
                  <a href="mailto:info@business-analytics.gr" className="contact-link">info@business-analytics.gr</a>
                  {' '}email ζητώντας την Διαγραφή του από κάθε επικοινωνία μαζί μας. Αν για οποιονδήποτε
                  λόγο κάποιος χρήστης έχει διαγραφεί από το newsletter (όπως περιγράφεται παραπάνω) και
                  παρ' όλα αυτά συνεχίζουν να του έρχονται e-mail από το newsletter μας, παρακαλώ
                  επικοινωνήστε με το{' '}
                  <a href="mailto:info@business-analytics.gr" className="contact-link">info@business-analytics.gr</a>
                  {' '}με το θέμα — Πρόβλημα με τη Mailing list.
                </p>
              </div>
            </article>
          </section>
          <Sidebar shareUrl="https://www.business-analytics.gr/politiki-newsletter" />
        </div>
      </main>
    </>
  )
}