'use client';

import { useState, useRef } from 'react';

interface FieldState {
  value: string;
  error: string;
  valid: boolean;
}

function makeField(value = ''): FieldState {
  return { value, error: '', valid: false };
}

export default function NewsletterForm({ showExtended = true }: { showExtended?: boolean }) {
  const [name, setName] = useState(makeField());
  const [surname, setSurname] = useState(makeField());
  const [email, setEmail] = useState(makeField());
  const [company, setCompany] = useState(makeField());
  const [role, setRole] = useState(makeField());
  const [captcha, setCaptcha] = useState(makeField());
  const [submitted, setSubmitted] = useState(false);

  function validateEmail(v: string) {
    return v.includes('@') && v.includes('.com');
  }

  function validate() {
    let ok = true;
    const check = (
      field: FieldState,
      set: (f: FieldState) => void,
      isEmail = false
    ) => {
      if (!field.value.trim()) {
        set({ ...field, error: 'Υποχρεωτικό πεδίο', valid: false });
        ok = false;
      } else if (isEmail && !validateEmail(field.value.trim())) {
        set({ ...field, error: 'Παρακαλώ εισάγετε μια διεύθυνση email με τη μορφή: name@example.com', valid: false });
        ok = false;
      } else {
        set({ ...field, error: '', valid: true });
      }
    };
    check(name, setName);
    check(surname, setSurname);
    check(email, setEmail, true);
    check(captcha, setCaptcha);
    return ok;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName(makeField());
      setSurname(makeField());
      setEmail(makeField());
      setCompany(makeField());
      setRole(makeField());
      setCaptcha(makeField());
    }, 3200);
  }

  function inputClass(f: FieldState) {
    if (f.valid) return 'f-in valid';
    if (f.error) return 'f-in invalid';
    return 'f-in';
  }

  return (
    <form className="nl-form" onSubmit={handleSubmit} noValidate>
      <div className="f-row">
        <label htmlFor="nl-name">Όνομα <span className="req">*</span></label>
        <input
          className={inputClass(name)}
          type="text"
          id="nl-name"
          placeholder="Όνομα"
          required
          autoComplete="given-name"
          value={name.value}
          onChange={e => setName({ value: e.target.value, error: '', valid: false })}
        />
        {name.error && <span className="field-error">{name.error}</span>}
      </div>

      <div className="f-row">
        <label htmlFor="nl-surname">Επώνυμο <span className="req">*</span></label>
        <input
          className={inputClass(surname)}
          type="text"
          id="nl-surname"
          placeholder="Επώνυμο"
          required
          autoComplete="family-name"
          value={surname.value}
          onChange={e => setSurname({ value: e.target.value, error: '', valid: false })}
        />
        {surname.error && <span className="field-error">{surname.error}</span>}
      </div>

      <div className="f-row">
        <label htmlFor="nl-email">email <span className="req">*</span></label>
        <input
          className={inputClass(email)}
          type="email"
          id="nl-email"
          placeholder="email@example.com"
          required
          autoComplete="email"
          value={email.value}
          onChange={e => setEmail({ value: e.target.value, error: '', valid: false })}
        />
        {email.error && <span className="field-error">{email.error}</span>}
      </div>

      {showExtended && (
        <>
          <div className="f-row">
            <label htmlFor="nl-company">Εταιρία</label>
            <input
              className="f-in"
              type="text"
              id="nl-company"
              placeholder="Εταιρία"
              autoComplete="organization"
              value={company.value}
              onChange={e => setCompany({ value: e.target.value, error: '', valid: false })}
            />
          </div>
          <div className="f-row">
            <label htmlFor="nl-role">Θέση</label>
            <input
              className="f-in"
              type="text"
              id="nl-role"
              placeholder="Θέση"
              autoComplete="organization-title"
              value={role.value}
              onChange={e => setRole({ value: e.target.value, error: '', valid: false })}
            />
          </div>
        </>
      )}

      <div className="f-row">
        <label htmlFor="nl-captcha">Κωδικός ασφαλίας <span className="req">*</span></label>
        <div className="captcha-r">
          <div className="captcha-box" aria-label="Captcha: 7 × 7">7 · 7</div>
          <input
            className={inputClass(captcha)}
            type="text"
            id="nl-captcha"
            placeholder="= ?"
            required
            maxLength={4}
            inputMode="numeric"
            value={captcha.value}
            onChange={e => setCaptcha({ value: e.target.value, error: '', valid: false })}
          />
        </div>
        {captcha.error && <span className="field-error">{captcha.error}</span>}
      </div>

      <button type="submit" className={`nl-sub${submitted ? ' ok' : ''}`}>
        {submitted ? 'Αποστάλθηκε!' : 'Αποστολή'}
      </button>
      <p className="nl-terms">
        Πατώντας Αποστολή, δηλώνετε ότι συμφωνείτε με την Πολιτική Newsletter του Business-Analytics.gr
      </p>
    </form>
  );
}
