import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateOutfits, shuffleSingleItem } from '../services/outfitGenerator';
import { logOutfitWorn, saveOutfit, getWardrobe } from '../services/storage';
import { Sparkles, Check, Heart, RefreshCw, X, Sun, Cloud, CloudRain } from 'lucide-react';
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

function getWeatherIcon(temp) {
  if (temp > 30) return <Sun size={20} />;
  if (temp > 20) return <Cloud size={20} />;
  return <CloudRain size={20} />;
}

export default function OutfitGeneratorPage({ showToast }) {
  const navigate = useNavigate();
  const wardrobe = getWardrobe();
  const [step, setStep] = useState('event');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('');
  const [outfits, setOutfits] = useState([]);
  const [activeOutfitIndex, setActiveOutfitIndex] = useState(0);
  const [temperature] = useState(() => Math.floor(Math.random() * 15) + 18);

  const handleGenerate = () => {
    const results = generateOutfits({
      event: selectedEvent,
      count: 4,
      temperature,
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
      temperature,
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
          <div className="gen-header">
            <span className="gen-logo">CLOSETTE</span>
            <div className="gen-weather">
              {getWeatherIcon(temperature)}
              <span>{temperature}°</span>
            </div>
          </div>

          <div className="gen-progress">
            <span className="gen-step-text">שלב 1 מתוך 3</span>
          </div>

          <div className="step-header">
            <h1>כמעט סיימנו</h1>
            <p>הוסיפי האם ואת לדייק את המלצות הלבוש שלך עבורך</p>
          </div>

          <div className="gen-settings">
            <div className="gen-setting-row">
              <span className="setting-label">סוג אירוע</span>
              <div className="event-chips">
                {EVENTS.map(event => (
                  <button
                    key={event.id}
                    className={`event-chip ${selectedEvent === event.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    <span>{event.emoji}</span>
                    <span>{event.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="gen-setting-row">
              <span className="setting-label">סגנון ביד</span>
              <div className="vibe-chips">
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
            </div>

            <div className="gen-setting-row">
              <span className="setting-label">טמפרטורה</span>
              <span className="setting-value">{temperature}° מעלות</span>
            </div>

            <div className="gen-setting-row">
              <span className="setting-label">פורמליות</span>
              <span className="setting-value">65 מתוך 100</span>
            </div>
          </div>

          <div className="gen-hint">
            <Heart size={14} />
            <span>הפעל העדפות לבוש</span>
          </div>

          <button
            className="generate-main-btn"
            disabled={!selectedEvent}
            onClick={handleGenerate}
          >
            <Sparkles size={20} />
            הפתע אותי
          </button>

          <span className="gen-small-text">גר</span>
        </div>
      )}

      {step === 'results' && (
        <div className="generator-results fade-in">
          <div className="results-header">
            <button className="close-results" onClick={() => setStep('event')}>
              <X size={24} />
            </button>
            <h2>מחולל ההלבשה</h2>
            <button className="refresh-all" onClick={handleRefreshAll}>
              <RefreshCw size={18} />
            </button>
          </div>

          {outfits.length > 0 ? (
            <>
              <h3 className="results-title">מה תרצי ללבוש?</h3>

              <div className="outfit-display">
                <OutfitCollage
                  outfit={outfits[activeOutfitIndex]}
                  onShuffleItem={handleShuffle}
                />
              </div>

              {outfits.length > 1 && (
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
              )}

              <button className="shuffle-btn" onClick={handleRefreshAll}>
                <RefreshCw size={18} />
                ערבבי מחדש (Shuffle)
              </button>

              <div className="result-actions">
                <button className="approve-btn" onClick={handleWoreIt}>
                  <Check size={18} />
                  לאשר את זה
                </button>
                <button className="save-btn-outline" onClick={handleSaveOutfit}>
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
