'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FadeUp from './FadeUp';

const testimonials = [
  {
    text: "In 16 weeks I went from struggling with basic compound lifts to hitting a 120kg deadlift. My posture improved, my back pain disappeared, and my on-field performance has measurably improved. This is a completely different level of coaching.",
    avatar: 'A',
    name: 'Arjun M.',
    role: 'Competitive Footballer · Athlete Program',
  },
  {
    text: "As a woman in my 30s juggling work and family, I thought real strength training wasn't for me. Fitnessinfu changed that completely. I've lost 9kg, built lean muscle, and feel more confident and energetic than I did at 24.",
    avatar: 'P',
    name: 'Priya S.',
    role: 'Working Professional · General Population',
  },
  {
    text: "My son joined the youth program at age 10. The emphasis on movement quality and multi-sport development rather than early specialization was exactly what we were looking for. His coordination, discipline, and confidence are exceptional now.",
    avatar: 'R',
    name: 'Rajan K.',
    role: 'Parent · Youth Development Program',
  },
  {
    text: "After my knee surgery I was nervous about training again. The return-to-sport protocol was methodical, safe, and progressive. I'm now fully back to competition — stronger and more resilient than before the injury.",
    avatar: 'S',
    name: 'Sreelakshmi T.',
    role: 'Track Athlete · Post-Rehab Program',
  },
  {
    text: "The performance testing at the start showed me exactly where I was deficient. Six months later the re-test numbers don't lie — 22% increase in squat strength, dramatically improved mobility, and I've cut 18 seconds off my sprint time.",
    avatar: 'V',
    name: 'Vishnu N.',
    role: 'Basketball Player · Athlete Program',
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef(null);
  const autoSlideRef = useRef(null);

  const getVisibleCount = useCallback(() => {
    if (typeof window === 'undefined') return 3;
    return window.innerWidth < 860 ? 1 : 3;
  }, []);

  const getMaxIndex = useCallback(() => {
    return testimonials.length - getVisibleCount();
  }, [getVisibleCount]);

  const goTo = useCallback(
    (n) => {
      const max = getMaxIndex();
      const idx = Math.max(0, Math.min(n, max));
      setCurrent(idx);
    },
    [getMaxIndex]
  );

  // Calculate track transform
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll('.testi-card');
    if (cards.length === 0) return;
    const cardWidth = cards[0].offsetWidth + 24; // 24px gap
    track.style.transform = `translateX(-${current * cardWidth}px)`;
  }, [current]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => goTo(current);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [current, goTo]);

  // Auto-slide
  const startAutoSlide = useCallback(() => {
    autoSlideRef.current = setInterval(() => {
      setCurrent((prev) => {
        const max = testimonials.length - (typeof window !== 'undefined' && window.innerWidth < 860 ? 1 : 3);
        return prev + 1 > max ? 0 : prev + 1;
      });
    }, 5000);
  }, []);

  const stopAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  }, []);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  const handleNext = () => {
    goTo(current + 1 > getMaxIndex() ? 0 : current + 1);
  };

  const handlePrev = () => {
    goTo(current - 1 < 0 ? getMaxIndex() : current - 1);
  };

  return (
    <section id="testimonials">
      <FadeUp>
        <div className="tag">Client Results</div>
      </FadeUp>
      <FadeUp>
        <h2 className="section-title">
          Real People.<br />
          <span className="accent">Measurable Results.</span>
        </h2>
      </FadeUp>
      <FadeUp className="testi-wrap">
        <div
          className="testi-track-outer"
          onMouseEnter={stopAutoSlide}
          onMouseLeave={startAutoSlide}
        >
          <div className="testi-track" ref={trackRef}>
            {testimonials.map((t, i) => (
              <div className="testi-card" key={i}>
                <span className="testi-quote">&quot;</span>
                <div className="testi-stars">★★★★★</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.avatar}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="testi-controls">
          <button className="testi-btn" onClick={handlePrev} aria-label="Previous testimonial">
            ←
          </button>
          <button className="testi-btn" onClick={handleNext} aria-label="Next testimonial">
            →
          </button>
          <div className="testi-dots">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`testi-dot${i === current ? ' active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
