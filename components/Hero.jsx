import Image from 'next/image';
import FadeUp from './FadeUp';

export default function Hero() {
  return (
    <section id="hero">
      <div className="hero-bg"></div>
      <div className="hero-grid"></div>
      <div className="hero-ring-wrap">
        <div className="ring"></div>
        <div className="ring"></div>
        <div className="ring"></div>
        <div className="ring-arc"></div>
        <div className="ring-arc-inner"></div>
      </div>
      <div className="hero-content">
        <FadeUp>
          <div className="hero-eyebrow">
            Fitnessinfu Performance &amp; Wellness — Elakamon, Kerala
          </div>
        </FadeUp>
        <FadeUp delay="d1">
          <h1 className="hero-h1">
            Build Strength.<br />
            Elevate Performance.<br />
            <span className="accent">Live Better.</span>
          </h1>
        </FadeUp>
        <FadeUp delay="d2">
          <p className="hero-sub">
            Evidence-based strength &amp; conditioning integrated with traditional movement
            practices to develop resilient, powerful, and high-performing individuals.
          </p>
        </FadeUp>
        <FadeUp delay="d3">
          <div className="hero-btns">
            <a href="#contact" className="btn-primary">
              Book Your Performance Assessment
            </a>
            <a href="#services" className="btn-outline">
              Explore Our Programs
            </a>
          </div>
        </FadeUp>
        <FadeUp delay="d4">
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">4+</div>
              <div className="hero-stat-label">Specialized Programs</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">4–60</div>
              <div className="hero-stat-label">Age Range Served</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">100%</div>
              <div className="hero-stat-label">Science-Based</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">Est. 2020</div>
              <div className="hero-stat-label">High Performance</div>
            </div>
          </div>
        </FadeUp>
      </div>
      <FadeUp 
        delay="d4" 
        className="hero-image-bottom" 
        style={{ position: 'absolute', bottom: 0, right: 0, height: '90%', width: '50%' }}
      >
        <Image
          src="/image.png"
          alt="Fitness Coach"
          fill
          style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
          priority
        />
      </FadeUp>
      <div className="hero-scroll">
        <div className="scroll-line"></div>
        <span>Scroll</span>
      </div>
    </section>
  );
}
