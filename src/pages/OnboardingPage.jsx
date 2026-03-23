import { useState } from 'react';
import { saveUserProfile, setOnboardingComplete } from '../services/storage';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import './OnboardingPage.css';

const STYLES = [
  { id: 'classic', label: 'קלאסי', image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=300&h=400&fit=crop' },
  { id: 'bohemian', label: 'בוהו', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop' },
  { id: 'streetwear', label: 'סטריטוור', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop' },
  { id: 'elegant', label: 'אלגנטי', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop' },
  { id: 'romantic', label: 'רומנטי', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop' },
  { id: 'minimalist', label: 'מינימליסטי', image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=300&h=400&fit=crop' },
];

const BODY_TYPES = [
  { id: 'hourglass', label: 'שעון חול', labelEn: 'Hourglass', emoji: '⏳' },
  { id: 'pear', label: 'אגס', labelEn: 'Pear', emoji: '🍐' },
  { id: 'apple', label: 'תפוח', labelEn: 'Apple', emoji: '🍎' },
  { id: 'rectangle', label: 'מלבן', labelEn: 'Rectangle', emoji: '⬜' },
];

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    styles: [],
    bodyType: '',
  });

  const totalSteps = 3;

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
    if (step === 0) return profile.styles.length > 0;
    return true;
  };

  return (
    <div className="onboarding">
      <div className="onboarding-header">
        <div className="onboarding-top-row">
          {step > 0 ? (
            <button className="onboarding-arrow" onClick={() => setStep(s => s - 1)}>
              <ArrowRight size={20} />
            </button>
          ) : <div />}
          <span className="onboarding-logo">CLOSETTE</span>
          <div />
        </div>
        <div className="step-indicator">
          <span className="step-text">שלב {step + 1} מתוך {totalSteps}</span>
          <div className="step-progress-bar">
            <div className="step-progress-fill" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="onboarding-content">
        {step === 0 && (
          <div className="onboarding-step fade-in">
            <h2>מה הסטייל שלך?</h2>
            <p className="onboarding-subtitle">בחרי את הסגנונות שאת הכי מתחברת אליהם כדי שנוכל לדייק את ההמלצות עבורך</p>
            <div className="styles-grid">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  className={`style-card ${profile.styles.includes(style.id) ? 'selected' : ''}`}
                  onClick={() => toggleStyle(style.id)}
                >
                  <div className="style-image-wrap">
                    <img src={style.image} alt={style.label} loading="lazy" />
                    {profile.styles.includes(style.id) && (
                      <div className="style-check">✓</div>
                    )}
                  </div>
                  <span className="style-label">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step fade-in">
            <h2>מבנה הגוף שלך</h2>
            <p className="onboarding-subtitle">בחרי את המאפיין שהכי קרוב למבנה הגוף שלך. זה עוזר לנו להתאים לך את הגזרות הכי מחמיאות.</p>
            <div className="body-types-grid">
              {BODY_TYPES.map(type => (
                <button
                  key={type.id}
                  className={`body-type-card ${profile.bodyType === type.id ? 'selected' : ''}`}
                  onClick={() => setProfile(prev => ({ ...prev, bodyType: type.id }))}
                >
                  <span className="body-type-emoji">{type.emoji}</span>
                  <span className="body-type-label">{type.label}</span>
                  <span className="body-type-en">({type.labelEn})</span>
                </button>
              ))}
            </div>
            <p className="onboarding-privacy">
              הנתונים שלך פרטיים ומשמשים רק לשיפור ההמלצות האישיות שלך באפליקציה.
            </p>
          </div>
        )}

        {step === 2 && (
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
          </div>
        )}
      </div>

      <div className="onboarding-footer">
        <button
          className="onboarding-next"
          onClick={step === totalSteps - 1 ? handleFinish : () => setStep(s => s + 1)}
          disabled={!canProceed()}
        >
          {step === totalSteps - 1 ? 'סיום והתחלה' : 'הבא'}
          {step < totalSteps - 1 && <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
}
