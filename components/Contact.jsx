'use client';

import { useState, useRef } from 'react';
import FadeUp from './FadeUp';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    program: '',
    ageGroup: '',
    goals: '',
  });
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | success
  const timeoutRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.phone.trim()) newErrors.phone = true;
    if (!formData.email.trim()) newErrors.email = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setSubmitStatus('success');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSubmitStatus('idle');
    }, 4000);
  };

  return (
    <section id="contact">
      <FadeUp>
        <div className="tag">Get in Touch</div>
      </FadeUp>
      <FadeUp>
        <h2 className="section-title">
          Start Your<br />
          <span className="accent">Journey Today.</span>
        </h2>
      </FadeUp>
      <div className="contact-grid">
        <FadeUp delay="d1" className="contact-items">
          <div className="contact-item">
            <div className="contact-icon-box">📍</div>
            <div>
              <div className="contact-label">Location</div>
              <div className="contact-val">Elakamon, Kerala, India</div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon-box">📞</div>
            <div>
              <div className="contact-label">Phone</div>
              <div className="contact-val">
                <a href="tel:+917012450410">+91 7012450410</a>
              </div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon-box">✉️</div>
            <div>
              <div className="contact-label">Email</div>
              <div className="contact-val">
                <a href="mailto:fitnessinfu919@gmail.com">fitnessinfu919@gmail.com</a>
              </div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon-box">💬</div>
            <div>
              <div className="contact-label">WhatsApp</div>
              <div className="contact-val">
                <a href="https://wa.me/917012450410" target="_blank" rel="noopener noreferrer">
                  +91 7012450410 — Message Us Directly
                </a>
              </div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon-box">📱</div>
            <div>
              <div className="contact-label">Follow Our Journey</div>
              <div className="social-row">
                <a href="#" className="soc-btn">IG</a>
                <a href="#" className="soc-btn">FB</a>
                <a href="#" className="soc-btn">YT</a>
              </div>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay="d2" className="contact-form-wrap">
          <h3 className="form-title">Book Your Assessment</h3>
          <p className="form-note">
            Fill in your details and we&apos;ll get back to you within 24 hours.
          </p>
          <div className="form-row">
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={errors.name ? { borderColor: '#f07c20' } : {}}
              />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={errors.phone ? { borderColor: '#f07c20' } : {}}
              />
            </div>
          </div>
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={errors.email ? { borderColor: '#f07c20' } : {}}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Program of Interest</label>
              <select name="program" value={formData.program} onChange={handleChange}>
                <option value="">Select a program...</option>
                <option>Athlete Performance Program</option>
                <option>General Population Program</option>
                <option>Youth Development Program (Ages 4 –16)</option>
                <option>Special Population Program</option>
                <option>Not Sure — Help Me Decide</option>
              </select>
            </div>
            <div className="field">
              <label>Age Group</label>
              <select name="ageGroup" value={formData.ageGroup} onChange={handleChange}>
                <option value="">Select age group...</option>
                <option>Child (4 –7)</option>
                <option>Junior (8 –12)</option>
                <option>Teen (13 –17)</option>
                <option>Adult (18 –40)</option>
                <option>Adult (40+)</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Tell Us Your Goals</label>
            <textarea
              rows="4"
              name="goals"
              value={formData.goals}
              onChange={handleChange}
            />
          </div>
          <button
            className="form-submit"
            onClick={handleSubmit}
            style={submitStatus === 'success' ? { background: '#2ecc71' } : {}}
          >
            {submitStatus === 'success'
              ? "✓ Message Sent! We'll Contact You Within 24 Hours"
              : 'Send Message & Book Assessment'}
          </button>
        </FadeUp>
      </div>
    </section>
  );
}
