'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ padding: '24px', background: 'rgba(90,160,100,.10)', border: '1px solid rgba(90,160,100,.30)', borderRadius: 10, color: 'var(--hi)' }}>
        <strong>Το μήνυμά σας στάλθηκε!</strong><br />
        Θα επικοινωνήσουμε μαζί σας σύντομα.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="cf-row">
        <label className="cf-label">Όνομα <span className="cf-req">*</span></label>
        <input className="cf-input" type="text" required />
      </div>
      <div className="cf-row">
        <label className="cf-label">e-mail <span className="cf-req">*</span></label>
        <input className="cf-input" type="email" required />
      </div>
      <div className="cf-row">
        <label className="cf-label">Θέμα <span className="cf-req">*</span></label>
        <input className="cf-input" type="text" required />
      </div>
      <div className="cf-row">
        <label className="cf-label">Μήνυμα <span className="cf-req">*</span></label>
        <textarea className="cf-input cf-textarea" required rows={6} />
      </div>
      <button type="submit" className="cf-btn">ΑΠΟΣΤΟΛΗ</button>
    </form>
  )
}