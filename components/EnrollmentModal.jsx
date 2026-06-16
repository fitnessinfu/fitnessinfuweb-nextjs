'use client';

import { useState, useEffect } from 'react';

const WHATSAPP_NUMBER = '917012450410'; // Replace with actual number e.g. 919876543210

const COURSE_OPTIONS = [
  { value: 'FI7 Elevate', label: 'FI7 Elevate — ₹14,999 (12 Weeks)' },
  { value: 'FI7 Elevate Peak Performance', label: 'FI7 Elevate Peak Performance — ₹24,999 (16 Weeks)' },
  { value: 'FI7 Running Club', label: 'FI7 Running Club — ₹2,999/Month (Ongoing)' },
];

export default function EnrollmentModal({ isOpen, onClose, defaultCourse = '' }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    course: defaultCourse || COURSE_OPTIONS[0].value,
    goals: '',
    notes: '',
  });

  // Sync defaultCourse when it changes
  useEffect(() => {
    if (defaultCourse) setForm((f) => ({ ...f, course: defaultCourse }));
  }, [defaultCourse]);

  // Reset form fields when modal opens fresh
  useEffect(() => {
    if (!isOpen) {
      setForm({
        name: '',
        phone: '',
        email: '',
        course: defaultCourse || COURSE_OPTIONS[0].value,
        goals: '',
        notes: '',
      });
    }
  }, [isOpen, defaultCourse]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleWhatsApp = () => {
    const lines = [
      'Hello Fitness Infu Team! 👋',
      '',
      'I would like to join the following premium course:',
      '',
      `📚 *Course:* ${form.course}`,
      `👤 *Name:* ${form.name || '—'}`,
      `📞 *Phone:* ${form.phone || '—'}`,
      `📧 *Email:* ${form.email || '—'}`,
      `🎯 *Fitness Goals:* ${form.goals || '—'}`,
      `📝 *Additional Notes:* ${form.notes || '—'}`,
      '',
      'Please share the enrollment details. Thank you!',
    ];
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="enrollment-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Course Enrollment"
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal-header">
          <div className="modal-badge">🚀 Enrollment</div>
          <h2 className="modal-title">Join FI7 Premium</h2>
          <p className="modal-subtitle">Fill in your details — we&apos;ll send everything to WhatsApp.</p>
        </div>

        <div className="enrollment-form">
          <div className="enroll-field">
            <label htmlFor="enroll-name">Full Name *</label>
            <input
              id="enroll-name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="enroll-row">
            <div className="enroll-field">
              <label htmlFor="enroll-phone">Phone Number *</label>
              <input
                id="enroll-phone"
                name="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div className="enroll-field">
              <label htmlFor="enroll-email">Email Address</label>
              <input
                id="enroll-email"
                name="email"
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="enroll-field">
            <label htmlFor="enroll-course">Selected Course *</label>
            <select
              id="enroll-course"
              name="course"
              value={form.course}
              onChange={handleChange}
            >
              {COURSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="enroll-field">
            <label htmlFor="enroll-goals">Fitness Goals</label>
            <input
              id="enroll-goals"
              name="goals"
              type="text"
              placeholder="e.g. Lose weight, Build muscle, Run a marathon..."
              value={form.goals}
              onChange={handleChange}
            />
          </div>

          <div className="enroll-field">
            <label htmlFor="enroll-notes">Additional Notes</label>
            <textarea
              id="enroll-notes"
              name="notes"
              placeholder="Any injuries, health concerns, or questions..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="enroll-actions">
            <button
              type="button"
              className="enroll-whatsapp-btn enroll-whatsapp-btn--full"
              onClick={handleWhatsApp}
              id="enroll-whatsapp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Join via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
