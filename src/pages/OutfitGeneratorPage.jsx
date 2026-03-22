import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateOutfits, shuffleSingleItem } from '../services/outfitGenerator';
import { logOutfitWorn, saveOutfit, getWardrobe } from '../services/storage';
import { Sparkles, Check, Heart, RefreshCw, ChevronRight, X } from 'lucide-react';
import OutfitCollage from '../components/common/OutfitCollage';
import './OutfitGeneratorPage.css';

const EVENTS = [
  { id: 'work', label: 'עבודה', emoji: '💼' },
  { id: 'casual', label: 'יומיומי', emoji: '☕' },
  { id: 'date', label: 'דייט', emoji: '🌹' },
  { id: 'bar', label: 'בר / מסיבה', emoji: '🍸' },
  { id: 'friday', label: 'שישי', emoji: '✡️' },
  { id: 'sport', label: 'ספורט', emoji: '🏃' },
];

const VIBES = [
  { id: 'chic', label: 'שיק' },
  { id: 'comfortable', label: 'נוח' },
  { id: 'bold', label: 'נועז' },
  { id: 'classic', label: 'קלאסי' },
  { id: 'playful', label: 'שובב' },
  { id: 'minimalist', label: 'מינימליסטי' },
];

export default function OutfitGeneratorPage({ showToast }) {
  const navigate = useNavigate();
  const wardrobe = getWardrobe();
  const [step, setStep] = useState('event'); // event -> vibe -> results
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('');
  const [outfits, setOutfits] = useState([]);
  const [activeOutfitIndex, setActiveOutfitIndex] = useState(0);

  const handleGenerate = () => {
    const results = generateOutfits({
      event: selectedEvent,
      count: 4,
      temperature: Math.floor(Math.random() * 15) + 18,
    });
    setOutfits(results);
    setActiveOutfitIndex(0);
    setStep('results');
  };

  const handleShuffle = (role) => {
    const updated = shuffleSingleItem(outfits[activeOutfitIndex], role);
    const newOutfits = [...outfits];
    newOutfits[activeOutfitIndex] = updated;
    setOutfits(newOutfits);
  };

  const handleWoreIt = () => {
    const outfit = outfits[activeOutfitIndex];
    if (outfit) {
      logOutfitWorn(outfit, selectedEvent);
      showToast('נשמר ביומן!');
    }
  };

  const handleSaveOutfit = () => {
    const outfit = outfits[activeOutfitIndex];
    if (outfit) {
      saveOutfit({ ...outfit, event: selectedEvent, vibe: selectedVibe });
      showToast('הלוק נשמר!');
    }
  };

  const handleRefreshAll = () => {
    const results = generateOutfits({
      event: selectedEvent,
      count: 4,
      temperature: Math.floor(Math.random() * 15) + 18,
    });
    setOutfits(results);
    setActiveOutfitIndex(0);
  };

  if (wardrobe.length < 3) {
    return (
      <div className="generator-page">
        <div className="generator-empty">
          <Sparkles size={48} />
          <h2>צריך עוד קצת פריטים</h2>
          <p>הוסיפ/י לפחות 3 פריטים לארון כדי שנוכל ליצור לוקים מושלמים</p>
          <button className="primary-btn" onClick={() => navigate('/closet/add')}>
            הוספת פריטים
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="generator-page">
      {step === 'event' && (
        <div className="generator-step fade-in">
          <div className="step-header">
            <h1>מה בתוכנית?</h1>
            <p>בחר/י את סוג האירוע</p>
          </div>
          <div className="event-grid">
            {EVENTS.map(event => (
              <button
                key={event.id}
                className={`event-card ${selectedEvent === event.id ? 'selected' : ''}`}
                onClick={() => setSelectedEvent(event.id)}
              >
                <span className="event-emoji">{event.emoji}</span>
                <span className="event-label">{event.label}</span>
              </button>
            ))}
          </div>
          <button
            className="generate-btn"
            disabled={!selectedEvent}
            onClick={() => setStep('vibe')}
          >
            הבא
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {step === 'vibe' && (
        <div className="generator-step fade-in">
          <div className="step-header">
            <h1>מה הווייב?</h1>
            <p>באיזו אווירה את/ה?</p>
          </div>
          <div className="vibe-grid">
            {VIBES.map(vibe => (
              <button
                key={vibe.id}
                className={`vibe-chip ${selectedVibe === vibe.id ? 'selected' : ''}`}
                onClick={() => setSelectedVibe(vibe.id)}
              >
                {vibe.label}
              </button>
            ))}
          </div>
          <div className="step-actions">
            <button className="back-link" onClick={() => setStep('event')}>
              חזרה
            </button>
            <button
              className="generate-btn"
              onClick={handleGenerate}
            >
              <Sparkles size={18} />
              צור/י לוקים
            </button>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="generator-results fade-in">
          <div className="results-header">
            <button className="close-results" onClick={() => setStep('event')}>
              <X size={24} />
            </button>
            <h2>הלוקים שלך</h2>
            <button className="refresh-all" onClick={handleRefreshAll}>
              <RefreshCw size={18} />
            </button>
          </div>

          {outfits.length > 0 ? (
            <>
              <div className="outfit-tabs">
                {outfits.map((_, idx) => (
                  <button
                    key={idx}
                    className={`outfit-tab ${activeOutfitIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveOutfitIndex(idx)}
                  >
                    לוק {idx + 1}
                  </button>
                ))}
              </div>

              <div className="outfit-display">
                <OutfitCollage
                  outfit={outfits[activeOutfitIndex]}
                  onShuffleItem={handleShuffle}
                />
                <p className="shuffle-tip">לחצ/י על פריט להחליף אותו (Shuffle)</p>
              </div>

              <div className="result-actions">
                <button className="action-btn wore-it" onClick={handleWoreIt}>
                  <Check size={18} />
                  לבשתי!
                </button>
                <button className="action-btn save" onClick={handleSaveOutfit}>
                  <Heart size={18} />
                  שמירה
                </button>
              </div>
            </>
          ) : (
            <div className="no-results">
              <p>לא הצלחנו ליצור לוקים מהפריטים הקיימים</p>
              <button className="primary-btn" onClick={() => navigate('/closet/add')}>
                הוספת פריטים
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
