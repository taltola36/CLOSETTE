import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getWardrobe, logOutfitWorn } from '../services/storage';
import { generateOutfits } from '../services/outfitGenerator';
import { Sparkles, RefreshCw, Check, Sun, Cloud, CloudRain, Menu, ShoppingBag } from 'lucide-react';
import OutfitCollage from '../components/common/OutfitCollage';
import InspirationCard from '../components/common/InspirationCard';
import './HomePage.css';

const TIPS = [
  '"אלגנטיות היא היכולת לומר לא." — היום בפריז קריר. השילוב בין הבלייזר הירוק לנעלי העור החומות שלך יוצר מראה מתוחכם ומינות שמתאימה לפגישות הבוקר שלך.',
  '"סטייל הוא דרך לומר מי את בלי לדבר." — נסי לשלב צבעים ניטרליים עם אקססורי אחד בולט ליצירת מראה מאוזן ואלגנטי.',
  '"פחות זה יותר." — הפריטים הקלאסיים בארון שלך הם הבסיס הטוב ביותר. חולצה לבנה ומכנסיים מחויטים תמיד עובדים.',
  '"אופנה משתנה, סטייל נשאר." — השקיעי בפריטי בסיס איכותיים ובני סביבם קומבינציות שונות.',
];

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
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

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
          <ShoppingBag size={22} className="header-icon" />
          <span className="home-logo">CLOSETTE</span>
          <Menu size={22} className="header-icon" />
        </div>
      </div>

      <div className="home-greeting">
        <h1>{getGreeting()},</h1>
        <h1 className="greeting-name">{profile.name || 'יפה שלי'}</h1>
      </div>

      <div className="weather-section">
        <div className="weather-info">
          <span className="weather-temp">{temperature}°</span>
          <span className="weather-location">פריז, צרפת</span>
        </div>
        {getWeatherIcon(temperature)}
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
                <h3>ההמלצת הלבוש היומית שלך</h3>
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

          {dailyOutfit && (
            <InspirationCard event="casual" count={3} />
          )}

          <button className="hero-cta" onClick={() => navigate('/generator')}>
            <HangerIcon />
            מה נלבש היום?
          </button>

          <div className="daily-tip-section">
            <span className="tip-label">תובנה יומית</span>
            <p className="tip-text">{tip}</p>
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

function HangerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3c0 1.6 1.3 2.1 2 3l1 1 1-1c.7-.9 2-1.4 2-3a3 3 0 0 0-3-3z" />
      <path d="M2 18l10-6 10 6" />
      <path d="M2 18h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2z" />
    </svg>
  );
}
