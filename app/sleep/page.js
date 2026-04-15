'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

const questions = [
  {
    question: 'What time would you ideally wake up if you had no obligations?',
    options: [
      { text: 'Before 6:00 AM', value: 'A' },
      { text: '6:00 AM – 7:30 AM', value: 'B' },
      { text: '7:30 AM – 9:30 AM', value: 'C' },
      { text: 'After 9:30 AM', value: 'D' },
    ],
  },
  {
    question: 'When do you feel most alert and productive?',
    options: [
      { text: 'Early morning (6–9 AM)', value: 'A' },
      { text: 'Late morning (9 AM–12 PM)', value: 'B' },
      { text: 'Afternoon (12–5 PM)', value: 'C' },
      { text: 'Evening/Night (after 6 PM)', value: 'D' },
    ],
  },
  {
    question: 'If you had to do intense physical exercise, when would you prefer?',
    options: [
      { text: 'Early morning (before 8 AM)', value: 'A' },
      { text: 'Mid-morning (8–11 AM)', value: 'B' },
      { text: 'Afternoon (2–5 PM)', value: 'C' },
      { text: 'Evening (after 6 PM)', value: 'D' },
    ],
  },
  {
    question: 'How easy is it for you to wake up early in the morning?',
    options: [
      { text: 'Very easy — I wake naturally before the alarm', value: 'A' },
      { text: 'Fairly easy — takes a few minutes', value: 'B' },
      { text: 'Difficult — I need multiple alarms', value: 'C' },
      { text: 'Extremely difficult — I feel terrible in the morning', value: 'D' },
    ],
  },
  {
    question: 'At what time do you naturally start feeling sleepy at night?',
    options: [
      { text: 'Before 9:00 PM', value: 'A' },
      { text: '9:00 PM – 10:30 PM', value: 'B' },
      { text: '10:30 PM – 12:00 AM', value: 'C' },
      { text: 'After midnight', value: 'D' },
    ],
  },
  {
    question: 'How would you describe your energy levels throughout the day?',
    options: [
      { text: 'Peak in the morning, decline by evening', value: 'A' },
      { text: 'Steady through the morning, moderate afternoon dip', value: 'B' },
      { text: 'Slow start, peak in the afternoon', value: 'C' },
      { text: 'Low energy until evening, peak energy at night', value: 'D' },
    ],
  },
  {
    question: 'How do you feel about morning routines and schedules?',
    options: [
      { text: 'I thrive on early, structured routines', value: 'A' },
      { text: 'I prefer reasonable morning starts with structure', value: 'B' },
      { text: 'I prefer flexibility and later starts', value: 'C' },
      { text: 'I actively avoid early mornings whenever possible', value: 'D' },
    ],
  },
];

const results = {
  A: {
    icon: '🌅',
    type: 'The Lion',
    label: 'Early Chronotype',
    description:
      'You are a natural early riser. Your body clock is tuned to wake at dawn, and your peak cognitive and physical performance window is in the early morning hours. You tend to feel drowsy by early evening. This chronotype thrives with early training sessions, morning meal timing, and an early bedtime.',
    tips: [
      'Schedule high-intensity training between 6–9 AM',
      'Front-load your most demanding cognitive work in the morning',
      'Avoid caffeine after 12 PM',
      'Begin wind-down routine by 8 PM for optimal sleep onset',
      'Prioritize consistent wake times — even on weekends',
    ],
  },
  B: {
    icon: '🐻',
    type: 'The Bear',
    label: 'Moderate Morning Chronotype',
    description:
      'You follow a solar-based sleep schedule — rising with the sun and winding down in the evening. This is the most common chronotype. Your peak performance window is mid-morning to early afternoon. You adapt well to conventional schedules and training times.',
    tips: [
      'Best training window: 8–11 AM or 3–5 PM',
      'Use the mid-morning peak for complex decision-making',
      'Maintain a regular sleep schedule (10:30 PM – 6:30 AM)',
      'A short 20-minute nap after lunch can boost afternoon performance',
      'Avoid heavy meals close to bedtime',
    ],
  },
  C: {
    icon: '🐺',
    type: 'The Wolf',
    label: 'Late Afternoon Chronotype',
    description:
      'You are a later riser whose energy builds throughout the day, peaking in the afternoon and evening. Mornings are difficult, and forced early schedules can impair your performance. You do your best creative and physical work later in the day.',
    tips: [
      'Schedule training between 2–6 PM for best performance',
      'Allow yourself a gradual morning warm-up — avoid high-intensity early',
      'Your creative peak is often in the late afternoon/evening',
      'Target sleep between 11:30 PM – 7:30 AM',
      'Use morning light exposure to help regulate your rhythm',
    ],
  },
  D: {
    icon: '🦉',
    type: 'The Owl',
    label: 'Night Chronotype',
    description:
      'You are a true night person. Your energy, focus, and physical capacity peak in the evening and late night hours. Early mornings feel unnatural and forced. While society often works against this chronotype, understanding it allows you to optimize your training and recovery around your natural rhythm.',
    tips: [
      'Optimal training window: 5–8 PM or later',
      'Protect your sleep — aim for 12:30 AM to 8:30 AM',
      'Use blackout curtains and minimize morning light disruption',
      'Front-load recovery practices (breathwork, stretching) to your morning',
      'Seek employment or schedules that accommodate later starts when possible',
    ],
  },
};

export default function SleepTestPage() {
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const totalQuestions = questions.length;
  const progress = ((currentQ + 1) / totalQuestions) * 100;

  const selectAnswer = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const goNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      setCurrentQ((prev) => prev - 1);
    }
  };

  const calculateResult = () => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    Object.values(answers).forEach((val) => {
      counts[val]++;
    });
    // Find the highest count
    let maxKey = 'B';
    let maxVal = 0;
    Object.entries(counts).forEach(([key, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxKey = key;
      }
    });
    return maxKey;
  };

  const handleFinish = () => {
    setShowResult(true);
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQ(0);
    setShowResult(false);
  };

  const resultType = useMemo(() => {
    if (!showResult) return null;
    return results[calculateResult()];
  }, [showResult, answers]);

  const allAnswered = Object.keys(answers).length === totalQuestions;
  const currentAnswered = answers[currentQ] !== undefined;

  if (showResult && resultType) {
    return (
      <main className="sleep-page">
        <div className="sleep-result">
          <span className="sleep-result-icon">{resultType.icon}</span>
          <h1 className="sleep-result-type">{resultType.type}</h1>
          <div className="sleep-result-label">{resultType.label}</div>
          <p className="sleep-result-desc">{resultType.description}</p>
          <div className="sleep-result-card">
            <h4>Optimization Tips</h4>
            <ul>
              {resultType.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
          <div className="sleep-retake">
            <button className="btn-primary" onClick={handleRetake}>
              Retake Assessment
            </button>
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/" className="btn-outline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const q = questions[currentQ];

  return (
    <main className="sleep-page">
      <div className="sleep-header">
        <div className="tag">Sleep Assessment</div>
        <h1 className="section-title">
          Sleep Chronotype<br />
          <span className="accent">Assessment</span>
        </h1>
        <p className="section-sub">
          Discover your natural sleep chronotype to optimize your training schedule, recovery,
          and daily performance. Answer all {totalQuestions} questions to get your result.
        </p>
      </div>

      <div className="sleep-progress">
        <div
          className="sleep-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="sleep-question-container">
        <div className="sleep-question-card">
          <div className="sleep-q-number">
            Question {currentQ + 1} of {totalQuestions}
          </div>
          <h2 className="sleep-q-text">{q.question}</h2>
          <div className="sleep-options">
            {q.options.map((opt) => (
              <div
                key={opt.value}
                className={`sleep-option${answers[currentQ] === opt.value ? ' selected' : ''}`}
                onClick={() => selectAnswer(currentQ, opt.value)}
              >
                {opt.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sleep-nav">
        <button
          className="sleep-nav-btn"
          onClick={goPrev}
          disabled={currentQ === 0}
        >
          ← Previous
        </button>

        {currentQ === totalQuestions - 1 ? (
          <button
            className="sleep-nav-btn primary"
            onClick={handleFinish}
            disabled={!allAnswered}
          >
            See My Result →
          </button>
        ) : (
          <button
            className="sleep-nav-btn primary"
            onClick={goNext}
            disabled={!currentAnswered}
          >
            Next →
          </button>
        )}
      </div>
    </main>
  );
}
