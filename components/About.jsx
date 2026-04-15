import FadeUp from './FadeUp';

const pillars = [
  {
    num: '01',
    title: 'Science-Based Training',
    desc: 'Every program is grounded in current strength & conditioning research and periodization principles.',
  },
  {
    num: '02',
    title: 'Integrated Systems',
    desc: 'Modern S&C science meets traditional practices — yoga, breathwork, and Indian club training.',
  },
  {
    num: '03',
    title: 'Measurable Outcomes',
    desc: 'Structured testing, tracking, and feedback ensure every client progresses with purpose and clarity.',
  },
  {
    num: '04',
    title: 'Long-Term Development',
    desc: 'We build resilient humans — not short-term results. Sustainable performance is the only goal.',
  },
];

export default function About() {
  return (
    <section id="about">
      <FadeUp>
        <div className="tag">Who We Are</div>
      </FadeUp>
      <FadeUp>
        <h2 className="section-title">
          Movement Is a Lifestyle.<br />
          <span className="accent">Performance Is a Standard.</span>
        </h2>
      </FadeUp>
      <div className="about-grid">
        <FadeUp delay="d1" className="about-text">
          <p>
            Fitnessinfu Performance &amp; Wellness develops athletes and individuals who demand
            more from their bodies and lives.
          </p>
          <p>
            We combine modern strength and conditioning science with traditional systems such as
            yoga, breathwork, and Indian clubs to create structured, sustainable, results-driven
            programs. This is not a commercial gym — it is a performance center built for those
            who take their physical development seriously.
          </p>
          <p>
            Our approach is methodical. Every training decision is evidence-based, every program
            is individualized, and every client is held to a standard of disciplined, long-term
            growth.
          </p>
          <div className="about-mission">
            <p>
              &quot;To help youth athletes, competitive performers, working professionals, and
              women build strength, improve performance, and achieve long-term physical and
              mental resilience through education and disciplined training.&quot;
            </p>
          </div>
        </FadeUp>
        <FadeUp delay="d2" className="about-pillars">
          {pillars.map((pillar) => (
            <div className="pillar" key={pillar.num}>
              <div className="pillar-num">{pillar.num}</div>
              <div>
                <h4>{pillar.title}</h4>
                <p>{pillar.desc}</p>
              </div>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
