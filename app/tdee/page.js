'use client';

import { useState, useRef } from 'react';

export default function TDEECalculator() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activity: '1.2',
  });

  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const resultsRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const calculateTDEE = (e) => {
    e.preventDefault();
    
    // Validation
    const { name, age, height, weight, gender, activity } = formData;
    if (!name || !age || !height || !weight) {
      setError('Please fill in all fields correctly.');
      return;
    }

    setIsCalculating(true);

    // Simulate calculation delay for "Calculating..." effect
    setTimeout(() => {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const a = parseFloat(age);
      const mult = parseFloat(activity);

      // Mifflin-St Jeor BMR
      let bmr;
      if (gender === 'male') {
        bmr = 10 * w + 6.25 * h - 5 * a + 5;
      } else {
        bmr = 10 * w + 6.25 * h - 5 * a - 161;
      }

      const tdee = Math.round(bmr * mult);
      const fatLoss = tdee - 400;
      const muscleGain = tdee + 300;

      // Macros
      const proteinGrams = Math.round(w * 2);
      const proteinKcal = proteinGrams * 4;
      
      const fatKcal = tdee * 0.25;
      const fatGrams = Math.round(fatKcal / 9);
      
      const carbKcal = tdee - (proteinKcal + fatKcal);
      const carbGrams = Math.round(carbKcal / 4);

      setResults({
        name,
        tdee,
        fatLoss,
        muscleGain,
        macros: {
          protein: proteinGrams,
          fat: fatGrams,
          carbs: carbGrams,
        },
      });

      setIsCalculating(false);
      
      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 800);
  };

  return (
    <div className="container">
      <div className="calculator-card">
        <div className="header">
          <h1>TDEE <span className="accent">Calculator</span></h1>
          <p>Discover your daily energy expenditure and macro requirements.</p>
        </div>

        <form onSubmit={calculateTDEE} className="form-grid">
          <div className="input-group full">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Ashwin"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              placeholder="Years"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Gender</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                />
                <span>Male</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                <span>Female</span>
              </label>
            </div>
          </div>

          <div className="input-group">
            <label>Height (cm)</label>
            <input
              type="number"
              name="height"
              placeholder="cm"
              value={formData.height}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              name="weight"
              placeholder="kg"
              value={formData.weight}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group full">
            <label>Activity Level</label>
            <select name="activity" value={formData.activity} onChange={handleChange}>
              <option value="1.2">Sedentary (Office job, little exercise)</option>
              <option value="1.375">Light (Light exercise 1-3 days/week)</option>
              <option value="1.55">Moderate (Moderate exercise 3-5 days/week)</option>
              <option value="1.725">Active (Hard exercise 6-7 days/week)</option>
              <option value="1.9">Athlete (Professional athlete, physical job)</option>
            </select>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="submit-btn" disabled={isCalculating}>
            {isCalculating ? 'Calculating...' : 'Calculate My Results'}
          </button>
        </form>

        {results && (
          <div className="results-section" ref={resultsRef}>
            <div className="divider"></div>
            <h3>{results.name}, here’s your plan</h3>
            
            <div className="summary-grid">
              <div className="summary-item main">
                <span className="label">Maintenance (TDEE)</span>
                <span className="value">{results.tdee} kcal</span>
              </div>
              <div className="summary-item">
                <span className="label">Fat Loss (-400)</span>
                <span className="value">{results.fatLoss} kcal</span>
              </div>
              <div className="summary-item">
                <span className="label">Muscle Gain (+300)</span>
                <span className="value">{results.muscleGain} kcal</span>
              </div>
            </div>

            <div className="macros-card">
              <h4>Daily Macro Targets (Maintenance)</h4>
              <div className="macros-grid">
                <div className="macro-item protein">
                  <span className="macro-val">{results.macros.protein}g</span>
                  <span className="macro-label">Protein</span>
                </div>
                <div className="macro-item carbs">
                  <span className="macro-val">{results.macros.carbs}g</span>
                  <span className="macro-label">Carbs</span>
                </div>
                <div className="macro-item fat">
                  <span className="macro-val">{results.macros.fat}g</span>
                  <span className="macro-label">Fat</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: #0b1528;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #ffffff;
          font-family: 'Barlow', sans-serif;
        }

        .calculator-card {
          background-color: #112040;
          width: 100%;
          max-width: 600px;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }

        .accent {
          color: #f07c20;
        }

        .header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .input-group.full {
          grid-column: span 2;
        }

        label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
          color: #f07c20;
          font-weight: 700;
        }

        input, select {
          width: 100%;
          background-color: #0b1528;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 16px;
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        input:focus, select:focus {
          border-color: #f07c20;
        }

        .radio-group {
          display: flex;
          gap: 20px;
          height: 48px;
          align-items: center;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: white;
          text-transform: none;
          letter-spacing: normal;
          font-weight: 400;
          font-size: 0.9rem;
        }

        .radio-label input {
          width: auto;
          cursor: pointer;
        }

        .submit-btn {
          grid-column: span 2;
          background-color: #f07c20;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          margin-top: 10px;
          transition: transform 0.2s, background-color 0.2s;
        }

        .submit-btn:hover {
          background-color: #ff9c46;
          transform: translateY(-2px);
        }

        .submit-btn:disabled {
          background-color: #a05a10;
          cursor: not-allowed;
          transform: none;
        }

        .error {
          grid-column: span 2;
          color: #ff4d4d;
          font-size: 0.8rem;
          text-align: center;
        }

        .results-section {
          margin-top: 40px;
          animation: fadeIn 0.5s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin-bottom: 30px;
        }

        h3 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          text-align: center;
          margin-bottom: 24px;
          letter-spacing: 1px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .summary-item {
          background: #0b1528;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .summary-item.main {
          grid-column: span 2;
          border-color: rgba(240, 124, 32, 0.3);
          background: rgba(240, 124, 32, 0.05);
        }

        .summary-item .label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
        }

        .summary-item .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f07c20;
        }

        .summary-item.main .value {
          font-size: 2.2rem;
        }

        .macros-card {
          background: #1c3158;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        h4 {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
        }

        .macros-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .macro-item {
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          background: #0b1528;
        }

        .macro-val {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .macro-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.4);
        }

        .protein .macro-val { color: #f07c20; }
        .carbs .macro-val { color: #3498db; }
        .fat .macro-val { color: #f1c40f; }

        @media (max-width: 480px) {
          .form-grid { grid-template-columns: 1fr; }
          .input-group.full { grid-column: span 1; }
          .submit-btn { grid-column: span 1; }
          .calculator-card { padding: 24px; }
          h1 { font-size: 2.2rem; }
        }
      `}</style>
    </div>
  );
}
