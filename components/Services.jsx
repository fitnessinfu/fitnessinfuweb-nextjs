import FadeUp from './FadeUp';

const services = [
  {
    icon: '🏆',
    title: 'Athlete Performance Program',
    category: 'For Competitive Athletes',
    desc: 'Designed for athletes who need to perform at the highest level. Every variable — strength, speed, mobility, and recovery — is systematically trained and measured.',
    items: [
      'Strength & Conditioning',
      'Performance Testing & Benchmarking',
      'Return-to-Sport Training',
      'Injury Prevention Protocols',
      'Structured Recovery Systems',
    ],
    outcome: 'Outcome: Stronger, Faster, Competition-Ready Athletes',
    delay: 'd1',
  },
  {
    icon: '💪',
    title: 'General Population Program',
    category: 'Working Professionals & Adults',
    desc: 'Not just a transformation — a lifestyle overhaul. We combine strength development, body recomposition, and lifestyle coaching into a sustainable long-term system.',
    items: [
      'Fat Loss & Body Recomposition',
      'Progressive Strength Development',
      'Lifestyle & Habit Coaching',
      'Stress Management Integration',
      'Online & In-Person Coaching Options',
    ],
    outcome: 'Outcome: Sustainable Transformation. Lasting Strength.',
    delay: 'd2',
  },
  {
    icon: '⚡',
    title: 'Youth Development Program',
    category: 'Ages 4–16 · LTAD Framework',
    desc: 'Built on Long-Term Athletic Development principles. We prioritize movement quality and multi-sport athleticism over early specialization — building athletes for life.',
    items: [
      'LTAD-Based Periodization',
      'Multi-Sport Athletic Foundation',
      'Movement Quality & Coordination',
      'Confidence & Discipline Building',
      'Phase-Based Progress Tracking',
    ],
    outcome: null,
    phases: [
      { age: 'Ages 4–7', label: 'Movement Foundation' },
      { age: 'Ages 8–12', label: 'Skill Development' },
      { age: 'Ages 13–16', label: 'Performance Development' },
    ],
    delay: 'd3',
  },
  {
    icon: '🌿',
    title: 'Special Population Program',
    category: 'Women · Post-Rehab · Older Adults',
    desc: 'Highly individualized programming that accounts for unique physiological, hormonal, and medical considerations. Safety and long-term well-being are the non-negotiables.',
    items: [
      "Women's Health & Hormonal Fitness",
      'Post-Rehabilitation Training',
      'Older Adult Strength & Mobility',
      'Metabolic & Lifestyle Condition Management',
      'Fully Individualized Programming',
    ],
    outcome: 'Outcome: Safe, Empowering, Individualized Performance',
    delay: 'd4',
  },
];

export default function Services() {
  return (
    <section id="services">
      <FadeUp>
        <div className="tag">What We Offer</div>
      </FadeUp>
      <FadeUp>
        <h2 className="section-title">
          Programs Built for<br />
          <span className="accent">Every Performer.</span>
        </h2>
      </FadeUp>
      <div className="services-grid">
        {services.map((srv) => (
          <FadeUp key={srv.title} delay={srv.delay} className="srv">
            <span className="srv-icon">{srv.icon}</span>
            <h3 className="srv-title">{srv.title}</h3>
            <span className="srv-cat">{srv.category}</span>
            <p className="srv-desc">{srv.desc}</p>
            <ul className="srv-list">
              {srv.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {srv.outcome && <div className="srv-outcome">{srv.outcome}</div>}
            {srv.phases && (
              <div className="youth-phases">
                {srv.phases.map((phase) => (
                  <div className="youth-phase" key={phase.age}>
                    <h5>{phase.age}</h5>
                    <p>{phase.label}</p>
                  </div>
                ))}
              </div>
            )}
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
