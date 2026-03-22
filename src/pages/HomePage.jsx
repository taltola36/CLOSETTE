import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getWardrobe, logOutfitWorn } from '../services/storage';
import { generateOutfits } from '../services/outfitGenerator';
import { Sparkles, RefreshCw, Check, Sun, Cloud, CloudRain, ChevronLeft } from 'lucide-react';
import OutfitCollage from '../components/common/OutfitCollage';
import './HomePage.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function getWeatherIcon(temp) {
  if (temp > 30) return <Sun size={20} />;
  if (temp > 20) return <Cloud size={20} />;
  return <CloudRain size={20} />;
}

export default function HomePage({ showToast }) {
  const navigate = useNavigate();
  const profile = getUserProfile();
  const wardrobe = getWardrobe();
  const [temperature] = useState(() => Math.floor(Math.random() * 15) + 18);
  const [dailyOutfit, setDailyOutfit] = useState(null);

  useEffect(() => {
    if (wardrobe.length >= 3) {
      const outfits = generateOutfits({ event: 'casual', temperature, count: 1 });
      if (outfits.length > 0) setDailyOutfit(outfits[0]);
    }
  }, []);

  const refreshOutfit = () => {
    const outfits = generateOutfits({ event: 'casual', temperature, count: 1 });
    if (outfits.length > 0) setDailyOutfit(outfits[0]);
  };

  const handleWoreIt = () => {
    if (dailyOutfit) {
      logOutfitWorn(dailyOutfit, 'יומיומי');
      showToast('נשמר ביומן הלוקים!');
    }
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-top">
          <span className="home-logo">CLOSETTE</span>
          <div className="weather-badge">
            {getWeatherIcon(temperature)}
            <span>{temperature}°</span>
          </div>
        </div>
        <div className="home-greeting">
          <h1>{getGreeting()},</h1>
          <h1 className="greeting-name">{profile.name || 'יפה שלי'}</h1>
        </div>
      </div>

      {wardrobe.length < 3 ? (
        <div className="home-empty">
          <div className="empty-illustration">
            <ShoppingBagIcon />
          </div>
          <h3>בואי נתחיל למלא את הארון!</h3>
          <p>הוסיפי לפחות 3 פריטים כדי שנוכל להציע לך לוקים</p>
          <button className="primary-btn" onClick={() => navigate('/closet/add')}>
            הוספת פריט ראשון
          </button>
        </div>
      ) : (
        <>
          {dailyOutfit && (
            <div className="daily-outfit-section">
              <div className="section-header">
                <h3>ההמלצה של היום</h3>
                <span className="outfit-event-tag">יומיומי</span>
              </div>
              <OutfitCollage outfit={dailyOutfit} />
              <div className="outfit-actions">
                <button className="action-btn wore-it" onClick={handleWoreIt}>
                  <Check size={18} />
                  לבשתי!
                </button>
                <button className="action-btn refresh" onClick={refreshOutfit}>
                  <RefreshCw size={18} />
                  החלף הכל
                </button>
              </div>
            </div>
          )}

          <button className="hero-cta" onClick={() => navigate('/generator')}>
            <Sparkles size={22} />
            ?מה נלבש היום
          </button>

          <div className="quick-stats">
            <div className="stat-card">
              <span className="stat-number">{wardrobe.length}</span>
              <span className="stat-label">פריטים בארון</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {new Set(wardrobe.map(i => i.category)).size}
              </span>
              <span className="stat-label">קטגוריות</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ShoppingBagIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="15" y="25" width="50" height="45" rx="6" stroke="#C4A882" strokeWidth="2.5" />
      <path d="M28 25V20C28 13.4 33.4 8 40 8C46.6 8 52 13.4 52 20V25" stroke="#C4A882" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
