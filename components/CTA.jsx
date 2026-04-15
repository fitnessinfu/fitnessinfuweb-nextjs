import FadeUp from './FadeUp';

export default function CTA() {
  return (
    <section id="cta">
      <div className="cta-rings">
        <div className="cta-ring"></div>
        <div className="cta-ring"></div>
        <div className="cta-ring"></div>
      </div>
      <FadeUp className="cta-inner">
        <div className="tag">Take the First Step</div>
        <h2 className="cta-title">
          Ready to Unlock<br />
          <span className="accent">Your Peak Potential?</span>
        </h2>
        <p className="cta-sub">
          Your performance assessment is the beginning of a structured, measurable, and permanent
          transformation. No guesswork. Just results.
        </p>
        <div className="cta-btns">
          <a href="#contact" className="btn-primary">
            Book Your Assessment
          </a>
          <a
            href="https://wa.me/917012450410"
            className="btn-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Speak to a Coach on WhatsApp
          </a>
        </div>
      </FadeUp>
    </section>
  );
}
