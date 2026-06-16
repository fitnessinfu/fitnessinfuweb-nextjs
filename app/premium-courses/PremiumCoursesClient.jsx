'use client';

import { useState } from 'react';
import EnrollmentModal from '@/components/EnrollmentModal';

/* ─── DATA ──────────────────────────────────────────── */
const SEVEN_ASPECTS = [
  { icon: '🎯', title: 'Movement Quality', desc: 'Master foundational patterns for pain-free, efficient movement in every aspect of life.' },
  { icon: '💪', title: 'Strength Development', desc: 'Progressive resistance training tailored to your goals, building real-world functional strength.' },
  { icon: '🧘', title: 'Mobility & Flexibility', desc: 'Expand range of motion through targeted yoga, stretching, and joint mobility protocols.' },
  { icon: '🏃', title: 'Endurance Development', desc: 'Build aerobic and anaerobic capacity through structured conditioning programs.' },
  { icon: '🔄', title: 'Recovery & Regeneration', desc: 'Sleep optimization, active recovery, and stress management for peak adaptation.' },
  { icon: '🌱', title: 'Lifestyle & Habit Formation', desc: 'Sustainable nutrition habits, sleep hygiene, and daily practices that compound over time.' },
  { icon: '📈', title: 'Performance Optimization', desc: 'Data-driven assessment, testing, and programming refinements to keep you progressing.' },
];

const COURSES = [
  {
    id: 'fi7-elevate',
    name: 'FI7 Elevate',
    badge: 'FOUNDATION',
    tagline: 'Build a Strong Foundation for Life',
    badgeColor: '#d4a017',
    desc: 'FI7 Elevate is designed for the general population looking to improve strength, mobility, movement quality, fitness, and overall health through a structured training system based on the FI7 methodology.',
    learn: ['Strength Training', 'Yoga', 'Mudgar Training', 'Mobility Development', 'Functional Movement', 'Recovery Strategies', 'Lifestyle Coaching'],
    benefits: ['Better movement quality', 'Increased strength', 'Improved flexibility', 'Reduced injury risk', 'Sustainable fitness habits'],
    duration: '12 Weeks',
    price: '₹14,999',
    priceNote: 'One-time payment',
    schedule: '3 Sessions per Week',
    icon: '🏋️',
    accent: '#d4a017',
  },
  {
    id: 'fi7-peak',
    name: 'FI7 Elevate Peak Performance',
    badge: 'ELITE',
    tagline: 'Performance Coaching for Athletes',
    badgeColor: '#e5c03a',
    desc: 'Designed for athletes who want to maximize performance, improve physical preparation, and develop sport-specific strength and conditioning.',
    learn: ['Strength & Conditioning', 'Performance Testing', 'Athletic Assessment', 'Speed Development', 'Agility Training', 'Injury Prevention', 'Recovery Management', 'Off-Season Training'],
    benefits: ['Increased athletic performance', 'Improved power output', 'Better movement efficiency', 'Enhanced recovery', 'Reduced injury risk'],
    duration: '16 Weeks',
    price: '₹24,999',
    priceNote: 'One-time payment',
    schedule: '4 Sessions per Week',
    icon: '⚡',
    accent: '#e5c03a',
    featured: true,
  },
  {
    id: 'fi7-running',
    name: 'FI7 Running Club',
    badge: 'COMMUNITY',
    tagline: 'Run Strong. Run Smart. Run Together.',
    badgeColor: '#c8860a',
    desc: 'A complete running development community for beginners and intermediate runners looking to improve performance safely and effectively.',
    learn: ['Personalized Running Programs', 'Running Technique Coaching', 'Strength Training for Runners', 'Mobility & Recovery', 'Endurance Development', 'Race Preparation', 'Injury Prevention', 'Community Accountability'],
    benefits: ['Improved running efficiency', 'Better endurance', 'Reduced injury risk', 'Stronger body for running', 'Structured progression'],
    duration: 'Ongoing Membership',
    price: '₹2,999',
    priceNote: 'Per Month',
    schedule: 'Weekly Coaching + Community Sessions',
    icon: '🏃',
    accent: '#c8860a',
  },
];

const TESTIMONIALS = [
  {
    quote: "FI7 Elevate transformed how I move. After 12 weeks I'm stronger, pain-free, and my posture is completely different. Coach Aswin truly understands the body.",
    name: 'Rahul M.',
    role: 'FI7 Elevate Graduate',
    initial: 'R',
  },
  {
    quote: "Peak Performance gave me an edge I didn't know was possible. My sprint times improved, I recovered faster, and I felt bulletproof heading into my season.",
    name: 'Anjali S.',
    role: 'State-Level Athlete',
    initial: 'A',
  },
  {
    quote: "The Running Club is more than a program — it's a community. My first 10K is done, and now I'm training for a half marathon. The coaching is world-class.",
    name: 'Deepak K.',
    role: 'FI7 Running Club Member',
    initial: 'D',
  },
  {
    quote: "I joined FI7 Elevate skeptical, but the science-backed approach and personalised attention won me over completely. Best investment in my health.",
    name: 'Priya V.',
    role: 'FI7 Elevate Graduate',
    initial: 'P',
  },
];

const FAQS = [
  {
    q: 'Who are these courses designed for?',
    a: 'FI7 Elevate is for the general public of all fitness levels. Peak Performance is for athletes and competitive sports people. Running Club is for beginner-to-intermediate runners.',
  },
  {
    q: 'Are the sessions online or in-person?',
    a: 'We offer both! You can join our facility in Elakamon, Kerala, or access structured programming remotely with video coaching check-ins.',
  },
  {
    q: 'What happens after I submit the application?',
    a: 'Our team will contact you within 24 hours to schedule a free discovery call, discuss your goals, and guide you through enrollment.',
  },
  {
    q: 'Can I switch courses mid-program?',
    a: 'Yes — we evaluate your progress and can recommend transitioning to a more advanced program if your goals evolve. Your investment is never wasted.',
  },
  {
    q: 'Is there a group or community element?',
    a: 'Absolutely. All programs include access to our private FI7 community group for support, accountability, and motivation.',
  },
  {
    q: 'What equipment do I need for remote participation?',
    a: 'For FI7 Elevate: minimal home equipment. For Peak Performance: access to a gym. Running Club requires running shoes and motivation — that\'s it!',
  },
];

/* ─── COMPONENT ─────────────────────────────────────── */
export default function PremiumCoursesClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const openEnroll = (courseName) => {
    setSelectedCourse(courseName);
    setModalOpen(true);
  };

  return (
    <>
      <EnrollmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultCourse={selectedCourse}
      />

      <main className="pc-page">
        {/* ── HERO ──────────────────────────────────── */}
        <section className="pc-hero">
          <div className="pc-hero-bg" aria-hidden="true" />
          <div className="pc-hero-grid" aria-hidden="true" />
          <div className="pc-hero-orbs" aria-hidden="true">
            <div className="pc-orb pc-orb--1" />
            <div className="pc-orb pc-orb--2" />
          </div>
          <div className="pc-hero-content">
            <div className="pc-hero-eyebrow">
              <span className="pc-eyebrow-line" />
              FI7 · Premium Coaching Programs
            </div>
            <h1 className="pc-hero-h1">
              FI7 Premium <span className="pc-gold">Courses</span>
            </h1>
            <p className="pc-hero-sub">
              Built around our <strong>7 Aspects of Training</strong> framework to help you{' '}
              <span className="pc-gold">Learn, Perform, and Transform.</span>
            </p>
            <div className="pc-hero-ctas">
              <button
                className="pc-btn-gold"
                onClick={() => openEnroll(COURSES[0].name)}
                id="hero-join-now"
              >
                Join Premium Course
              </button>
              <a href="#courses" className="pc-btn-ghost">
                Explore Courses ↓
              </a>
            </div>
            <div className="pc-hero-stats">
              <div className="pc-hero-stat">
                <div className="pc-stat-num">3</div>
                <div className="pc-stat-label">Premium Programs</div>
              </div>
              <div className="pc-hero-stat">
                <div className="pc-stat-num">7</div>
                <div className="pc-stat-label">Training Aspects</div>
              </div>
              <div className="pc-hero-stat">
                <div className="pc-stat-num">100%</div>
                <div className="pc-stat-label">Science-Based</div>
              </div>
              <div className="pc-hero-stat">
                <div className="pc-stat-num">∞</div>
                <div className="pc-stat-label">Community Support</div>
              </div>
            </div>
          </div>
          <div className="pc-hero-scroll-indicator" aria-hidden="true">
            <span className="pc-scroll-line" />
            <span>Scroll</span>
          </div>
        </section>

        {/* ── COURSES ───────────────────────────────── */}
        <section className="pc-courses-section" id="courses">
          <div className="pc-container">
            <div className="pc-section-header">
              <div className="pc-tag">Premium Programs</div>
              <h2 className="pc-section-title">Choose Your Path</h2>
              <p className="pc-section-sub">
                Every program is built with precision, purpose, and the complete FI7 methodology.
                Find the path that fits your goals.
              </p>
            </div>

            <div className="pc-courses-grid">
              {COURSES.map((course) => (
                <article
                  key={course.id}
                  id={course.id}
                  className={`pc-course-card ${course.featured ? 'pc-course-card--featured' : ''}`}
                >
                  {course.featured && (
                    <div className="pc-featured-ribbon">⭐ Most Popular</div>
                  )}
                  <div className="pc-course-card-inner">
                    {/* Header */}
                    <div className="pc-course-header">
                      <div className="pc-course-icon-wrap">
                        <span className="pc-course-icon">{course.icon}</span>
                      </div>
                      <div>
                        <div className="pc-course-badge" style={{ background: `${course.accent}22`, color: course.accent, borderColor: `${course.accent}44` }}>
                          {course.badge}
                        </div>
                        <h3 className="pc-course-name">{course.name}</h3>
                        <p className="pc-course-tagline" style={{ color: course.accent }}>{course.tagline}</p>
                      </div>
                    </div>

                    <p className="pc-course-desc">{course.desc}</p>

                    {/* Meta */}
                    <div className="pc-course-meta-row">
                      <div className="pc-meta-item">
                        <span className="pc-meta-icon">⏱</span>
                        <div>
                          <div className="pc-meta-label">Duration</div>
                          <div className="pc-meta-value">{course.duration}</div>
                        </div>
                      </div>
                      <div className="pc-meta-item">
                        <span className="pc-meta-icon">📅</span>
                        <div>
                          <div className="pc-meta-label">Schedule</div>
                          <div className="pc-meta-value">{course.schedule}</div>
                        </div>
                      </div>
                    </div>

                    {/* Learn & Benefits */}
                    <div className="pc-course-lists">
                      <div className="pc-course-list-col">
                        <div className="pc-list-heading">What You&apos;ll Learn</div>
                        <ul className="pc-list">
                          {course.learn.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pc-course-list-col">
                        <div className="pc-list-heading">Program Benefits</div>
                        <ul className="pc-list pc-list--benefit">
                          {course.benefits.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="pc-course-price-block" style={{ borderColor: `${course.accent}44`, background: `${course.accent}11` }}>
                      <div className="pc-price-amount" style={{ color: course.accent }}>
                        {course.price}
                      </div>
                      <div className="pc-price-note">{course.priceNote}</div>
                    </div>

                    {/* CTA */}
                    <div className="pc-course-ctas">
                      <button
                        className="pc-cta-primary"
                        style={{ background: `linear-gradient(135deg, ${course.accent} 0%, ${course.accentLight || course.accent} 100%)` }}
                        onClick={() => openEnroll(course.name)}
                        id={`join-${course.id}`}
                      >
                        Join Now
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7 ASPECTS ─────────────────────────────── */}
        <section className="pc-aspects-section" id="framework">
          <div className="pc-container">
            <div className="pc-section-header">
              <div className="pc-tag">Our Methodology</div>
              <h2 className="pc-section-title">The 7 Aspects of Training</h2>
              <p className="pc-section-sub">
                Every FI7 program is designed around our comprehensive 7-pillar training
                philosophy — the same system used by our elite athletes and everyday heroes.
              </p>
            </div>

            <div className="pc-aspects-grid">
              {SEVEN_ASPECTS.map((aspect, i) => (
                <div key={aspect.title} className="pc-aspect-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="pc-aspect-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="pc-aspect-icon">{aspect.icon}</div>
                  <h3 className="pc-aspect-title">{aspect.title}</h3>
                  <p className="pc-aspect-desc">{aspect.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────── */}
        <section className="pc-testi-section" id="testimonials">
          <div className="pc-container">
            <div className="pc-section-header">
              <div className="pc-tag">Success Stories</div>
              <h2 className="pc-section-title">Real Results. Real People.</h2>
            </div>
            <div className="pc-testi-grid">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="pc-testi-card">
                  <span className="pc-testi-quote-mark">&ldquo;</span>
                  <div className="pc-testi-stars">★★★★★</div>
                  <p className="pc-testi-text">&ldquo;{t.quote}&rdquo;</p>
                  <div className="pc-testi-author">
                    <div className="pc-testi-avatar">{t.initial}</div>
                    <div>
                      <div className="pc-testi-name">{t.name}</div>
                      <div className="pc-testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────── */}
        <section className="pc-faq-section" id="faq">
          <div className="pc-container pc-container--narrow">
            <div className="pc-section-header">
              <div className="pc-tag">Got Questions?</div>
              <h2 className="pc-section-title">Frequently Asked</h2>
            </div>
            <div className="pc-faq-list">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className={`pc-faq-item ${openFaq === i ? 'pc-faq-item--open' : ''}`}
                >
                  <button
                    className="pc-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    id={`faq-${i}`}
                  >
                    <span>{faq.q}</span>
                    <span className="pc-faq-icon">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  <div className="pc-faq-a">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────── */}
        <section className="pc-final-cta">
          <div className="pc-final-cta-rings" aria-hidden="true">
            <div className="pc-fcta-ring pc-fcta-ring--1" />
            <div className="pc-fcta-ring pc-fcta-ring--2" />
            <div className="pc-fcta-ring pc-fcta-ring--3" />
          </div>
          <div className="pc-final-cta-inner">
            <div className="pc-tag" style={{ justifyContent: 'center' }}>Start Today</div>
            <h2 className="pc-final-cta-title">
              Ready to Elevate <span className="pc-gold">Your Potential?</span>
            </h2>
            <p className="pc-final-cta-sub">
              Join hundreds of athletes and fitness enthusiasts already transforming with FI7 Premium Coaching.
            </p>
            <div className="pc-final-cta-btns">
              <button
                className="pc-btn-gold pc-btn-gold--lg"
                onClick={() => openEnroll(COURSES[0].name)}
                id="final-cta-join"
              >
                Join FI7 Premium Courses
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
