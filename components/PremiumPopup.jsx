'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COURSES = [
  {
    id: 'elevate',
    name: 'FI7 Elevate',
    tagline: 'Build a Strong Foundation for Life',
    duration: '12 Weeks',
    price: '₹14,999',
    icon: '🏋️',
  },
  {
    id: 'peak',
    name: 'FI7 Elevate Peak Performance',
    tagline: 'Performance Coaching for Athletes',
    duration: '16 Weeks',
    price: '₹24,999',
    icon: '⚡',
  },
  {
    id: 'running',
    name: 'FI7 Running Club',
    tagline: 'Run Strong. Run Smart. Run Together.',
    duration: 'Ongoing',
    price: '₹2,999/mo',
    icon: '🏃',
  },
];

export default function PremiumPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem('fi7_popup_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const hoursElapsed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      if (hoursElapsed < 24) return; // Still within 24hr window
    }
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem('fi7_popup_dismissed', Date.now().toString());
    setVisible(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`popup-overlay ${visible ? 'popup-overlay--visible' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`premium-popup ${visible ? 'premium-popup--visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Premium Courses Available"
      >
        {/* Close Button */}
        <button
          className="popup-close"
          onClick={handleClose}
          aria-label="Close popup"
        >
          ✕
        </button>

        {/* Gold glow orb */}
        <div className="popup-orb" aria-hidden="true" />

        {/* Header */}
        <div className="popup-header">
          <div className="popup-badge">🏆 Premium Programs</div>
          <h2 className="popup-headline">
            🚀 New Premium Courses Now Available
          </h2>
          <p className="popup-desc">
            Transform your fitness, performance, and running journey with our
            exclusive <strong>FI7 Premium Programs.</strong>
          </p>
        </div>

        {/* Course Cards */}
        <div className="popup-courses">
          {COURSES.map((course, i) => (
            <div
              key={course.id}
              className="popup-course-card"
              style={{ animationDelay: `${0.1 * (i + 1)}s` }}
            >
              <span className="popup-course-icon">{course.icon}</span>
              <div className="popup-course-info">
                <div className="popup-course-name">{course.name}</div>
                <div className="popup-course-tagline">{course.tagline}</div>
              </div>
              <div className="popup-course-meta">
                <div className="popup-course-price">{course.price}</div>
                <div className="popup-course-duration">{course.duration}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="popup-cta-wrap">
          <Link href="/premium-courses" className="popup-cta-btn" onClick={handleClose}>
            Join Premium Course →
          </Link>
          <button className="popup-skip" onClick={handleClose}>
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}
