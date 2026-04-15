import FadeUp from './FadeUp';

const beliefs = [
  {
    num: '1',
    title: 'Strength is the foundation of performance',
    desc: 'Whether athlete or professional, building structural strength is the prerequisite for everything else — speed, endurance, resilience.',
    delay: 'd2',
  },
  {
    num: '2',
    title: 'Movement quality determines longevity',
    desc: 'How you move is how you live. Quality of movement reduces injury risk and extends your physical prime by decades.',
    delay: 'd3',
  },
  {
    num: '3',
    title: 'Recovery is as important as training',
    desc: 'Adaptation happens at rest. Sleep, nutrition, and breathwork are not extras — they are core training variables.',
    delay: '',
  },
  {
    num: '4',
    title: 'Education builds discipline',
    desc: 'When clients understand the why behind every decision, they become autonomous, self-directed, and disciplined performers.',
    delay: '',
  },
  {
    num: '5',
    title: 'Fitness is a lifelong practice, not a phase',
    desc: 'We build systems that survive life — not programs that expire after 12 weeks. The goal is a permanently higher baseline of health, strength, and capability that compounds over a lifetime.',
    delay: '',
    span2: true,
  },
];

export default function Philosophy() {
  return (
    <section id="philosophy">
      <FadeUp>
        <div className="tag">Our Approach</div>
      </FadeUp>
      <FadeUp>
        <h2 className="section-title">
          Science-Based. Human-Centered.<br />
          <span className="accent">Performance-Driven.</span>
        </h2>
      </FadeUp>
      <div className="phil-layout">
        <FadeUp delay="d1" className="phil-intro">
          <p>
            Performance is not an accident. It is the result of intelligent, consistent, and
            disciplined work guided by principles that have stood the test of time and science.
          </p>
          <p>
            These are the beliefs that shape every program, every session, and every interaction
            at Fitnessinfu Performance &amp; Wellness.
          </p>
        </FadeUp>
        <div className="beliefs">
          {beliefs.map((belief) => (
            <FadeUp
              key={belief.num}
              delay={belief.delay}
              className={`belief${belief.span2 ? ' span2' : ''}`}
            >
              <div className="belief-bg-num">{belief.num}</div>
              <h4>{belief.title}</h4>
              <p>{belief.desc}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
