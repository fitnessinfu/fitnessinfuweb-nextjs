import FadeUp from './FadeUp';

const testCards = [
  { icon: '🏋️', name: 'Strength Testing', desc: '1RM assessments, force production metrics, and bilateral symmetry analysis.', delay: 'd1' },
  { icon: '⚡', name: 'Speed & Agility', desc: 'Sprint protocols, reactive agility, and change-of-direction testing.', delay: 'd2' },
  { icon: '🧘', name: 'Mobility Screening', desc: 'Joint ROM and movement screen to identify restriction and injury risk.', delay: 'd3' },
  { icon: '📊', name: 'Body Composition', desc: 'Precise analysis of lean mass, body fat percentage, and metabolic indicators.', delay: 'd4' },
  { icon: '🎯', name: 'Movement Quality', desc: 'Functional movement assessment for motor control, stability, and coordination.', delay: '' },
];

const testFeatures = [
  { title: 'Structured Feedback', desc: 'Every assessment produces a detailed performance report with clear findings and priority action items for training.', delay: 'd1' },
  { title: 'Progress Tracking', desc: 'Benchmarks are revisited at regular intervals to quantify improvement and adjust your programming accordingly.', delay: 'd2' },
  { title: 'Measurable Improvement', desc: 'Data-driven decisions ensure every training block moves you closer to your defined performance targets.', delay: 'd3' },
];

export default function Testing() {
  return (
    <section id="testing">
      <div className="testing-watermark">MEASURE</div>
      <FadeUp>
        <div className="tag">Measure Everything</div>
      </FadeUp>
      <FadeUp className="testing-intro">
        <h2 className="section-title">
          You Cannot Improve<br />
          <span className="accent">What You Do Not Measure.</span>
        </h2>
        <p className="section-sub">
          Every client begins with a comprehensive performance assessment. Data drives every
          decision, and progress is quantified at every stage of the program.
        </p>
      </FadeUp>
      <div className="test-cards">
        {testCards.map((card) => (
          <FadeUp key={card.name} delay={card.delay} className="test-card">
            <span className="test-card-icon">{card.icon}</span>
            <h4 className="test-card-name">{card.name}</h4>
            <p className="test-card-desc">{card.desc}</p>
          </FadeUp>
        ))}
      </div>
      <div className="test-features">
        {testFeatures.map((feature) => (
          <FadeUp key={feature.title} delay={feature.delay} className="test-feature">
            <h4>{feature.title}</h4>
            <p>{feature.desc}</p>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
