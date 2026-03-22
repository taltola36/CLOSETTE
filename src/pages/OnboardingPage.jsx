import { useState } from 'react';
import { saveUserProfile, setOnboardingComplete } from '../services/storage';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import './OnboardingPage.css';

const STYLES = [
  { id: 'classic', label: 'קלאסי', emoji: '👔', desc: 'נקי, מינימליסטי ואלגנטי' },
  { id: 'casual', label: 'קז׳ואל', emoji: '👕', desc: 'נוח, יומיומי ורגוע' },
  { id: 'bohemian', label: 'בוהו', emoji: '🌸', desc: 'חופשי, רומנטי וטבעי' },
  { id: 'streetwear', label: 'סטריטוור', emoji: '🧢', desc: 'אורבני, טרנדי ואקספרסיבי' },
  { id: 'elegant', label: 'אלגנטי', emoji: '✨', desc: 'מתוחכם, יוקרתי ומלוטש' },
  { id: 'sporty', label: 'ספורטיבי', emoji: '🏃', desc: 'אתלטי, דינמי ונוח' },
  { id: 'romantic', label: 'רומנטי', emoji: '🌹', desc: 'נשי, עדין ומחמיא' },
  { id: 'minimalist', label: 'מינימליסטי', emoji: '◻️', desc: 'פשוט, נקי ומדויק' },
];

const BODY_TYPES = [
  { id: 'hourglass', label: 'שעון חול', desc: 'כתפיים וירכיים באותו רוחב, מותן צר' },
  { id: 'pear', label: 'אגס', desc: 'ירכיים רחבות יותר מהכתפיים' },
  { id: 'apple', label: 'תפוח', desc: 'חלק עליון רחב יותר, רגליים צרות' },
  { id: 'rectangle', label: 'מלבן', desc: 'מידות אחידות, ללא עיקול בולט' },
  { id: 'inverted-triangle', label: 'משולש הפוך', desc: 'כתפיים רחבות, ירכיים צרות' },
];

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    styles: [],
    bodyType: '',
    height: '',
    weight: '',
    gender: 'female',
  });

  const totalSteps = 4;

  const toggleStyle = (id) => {
    setProfile(prev => ({
      ...prev,
      styles: prev.styles.includes(id)
        ? prev.styles.filter(s => s !== id)
        : [...prev.styles, id],
    }));
  };

  const handleFinish = () => {
    saveUserProfile(profile);
    setOnboardingComplete();
    onComplete();
  };

  const canProceed = () => {
    if (step === 0) return profile.name.trim().length > 0;
    if (step === 1) return profile.styles.length > 0;
    return true;
  };

  return (
    <div className="onboarding">
      <div className="onboarding-header">
        <h1 className="onboarding-logo">CLOSETTE</h1>
        <div className="progress-bar">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      <div className="onboarding-content">
        {step === 0 && (
          <div className="onboarding-step fade-in">
            <h2>!שלום</h2>
            <p className="onboarding-subtitle">מה השם שלך?</p>
            <input
              type="text"
              className="onboarding-input"
              placeholder="השם שלי..."
              value={profile.name}
              onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
            <div className="gender-select">
              <button
                className={`gender-btn ${profile.gender === 'female' ? 'active' : ''}`}
                onClick={() => setProfile(prev => ({ ...prev, gender: 'female' }))}
              >
                נשי
              </button>
              <button
                className={`gender-btn ${profile.gender === 'male' ? 'active' : ''}`}
                onClick={() => setProfile(prev => ({ ...prev, gender: 'male' }))}
              >
                גברי
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step fade-in">
            <h2>מהו הסגנון שלך?</h2>
            <p className="onboarding-subtitle">בחר/י את הסגנונות שמדברים אליך (ניתן לבחור כמה)</p>
            <div className="styles-grid">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  className={`style-card ${profile.styles.includes(style.id) ? 'selected' : ''}`}
                  onClick={() => toggleStyle(style.id)}
                >
                  <span className="style-emoji">{style.emoji}</span>
                  <span className="style-label">{style.label}</span>
                  <span className="style-desc">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step fade-in">
            <h2>מבנה הגוף שלך</h2>
            <p className="onboarding-subtitle">זה עוזר לנו להתאים גזרות מחמיאות</p>
            <p className="onboarding-privacy">
              המידע הזה נשמר רק במכשיר שלך ומשמש אך ורק לשיפור ההמלצות
            </p>
            <div className="body-types">
              {BODY_TYPES.map(type => (
                <button
                  key={type.id}
                  className={`body-type-card ${profile.bodyType === type.id ? 'selected' : ''}`}
                  onClick={() => setProfile(prev => ({ ...prev, bodyType: type.id }))}
                >
                  <div className="body-type-icon">
                    <BodyTypeIcon type={type.id} />
                  </div>
                  <span className="body-type-label">{type.label}</span>
                  <span className="body-type-desc">{type.desc}</span>
                </button>
              ))}
            </div>
            <button className="skip-btn" onClick={() => setStep(3)}>
              <SkipForward size={16} />
              דלג/י
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step fade-in">
            <h2>עוד קצת פרטים</h2>
            <p className="onboarding-subtitle">ספר/י לנו על הגובה והמשקל שלך (אופציונלי)</p>
            <p className="onboarding-privacy">
              הנתונים שלך פרטיים לחלוטין ומשמשים רק להתאמה מדויקת יותר של הגזרות
            </p>
            <div className="measurements">
              <div className="measure-field">
                <label>גובה (ס״מ)</label>
                <input
                  type="number"
                  placeholder="165"
                  value={profile.height}
                  onChange={e => setProfile(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
              <div className="measure-field">
                <label>משקל (ק״ג)</label>
                <input
                  type="number"
                  placeholder="60"
                  value={profile.weight}
                  onChange={e => setProfile(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="onboarding-footer">
        {step > 0 && (
          <button className="onboarding-back" onClick={() => setStep(s => s - 1)}>
            <ChevronRight size={20} />
            חזרה
          </button>
        )}
        <button
          className="onboarding-next"
          onClick={step === totalSteps - 1 ? handleFinish : () => setStep(s => s + 1)}
          disabled={!canProceed()}
        >
          {step === totalSteps - 1 ? 'בואו נתחיל!' : 'הבא'}
          {step < totalSteps - 1 && <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
}

function BodyTypeIcon({ type }) {
  const icons = {
    hourglass: (
      <svg viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10,5 Q10,5 10,5 L30,5 Q30,5 30,5 L30,10 Q30,25 20,35 Q10,25 10,10 Z" />
        <path d="M10,75 Q10,75 10,75 L30,75 Q30,75 30,75 L30,70 Q30,55 20,45 Q10,55 10,70 Z" />
        <circle cx="20" cy="40" r="2" fill="currentColor" />
      </svg>
    ),
    pear: (
      <svg viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14,5 L26,5 L26,10 Q26,25 20,35 Q14,25 14,10 Z" />
        <path d="M6,75 L34,75 L34,70 Q34,50 20,42 Q6,50 6,70 Z" />
      </svg>
    ),
    apple: (
      <svg viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8,5 L32,5 L32,15 Q32,30 20,38 Q8,30 8,15 Z" />
        <path d="M14,75 L26,75 L26,65 Q26,50 20,42 Q14,50 14,65 Z" />
      </svg>
    ),
    rectangle: (
      <svg viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="12" y="5" width="16" height="70" rx="3" />
      </svg>
    ),
    'inverted-triangle': (
      <svg viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6,5 L34,5 L34,15 Q34,30 20,38 Q6,30 6,15 Z" />
        <path d="M15,75 L25,75 L25,65 Q25,50 20,42 Q15,50 15,65 Z" />
      </svg>
    ),
  };
  return <div className="body-svg">{icons[type]}</div>;
}
