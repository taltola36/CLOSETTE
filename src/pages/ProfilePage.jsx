import { useState } from 'react';
import { getUserProfile, saveUserProfile, getWardrobe, getOutfitLog, resetOnboarding, clearAllData } from '../services/storage';
import { User, Edit3, Save, Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import './ProfilePage.css';

const STYLES = [
  { id: 'classic', label: 'קלאסי' },
  { id: 'casual', label: 'קז׳ואל' },
  { id: 'bohemian', label: 'בוהו' },
  { id: 'streetwear', label: 'סטריטוור' },
  { id: 'elegant', label: 'אלגנטי' },
  { id: 'sporty', label: 'ספורטיבי' },
  { id: 'romantic', label: 'רומנטי' },
  { id: 'minimalist', label: 'מינימליסטי' },
];

const BODY_TYPES = [
  { id: 'hourglass', label: 'שעון חול' },
  { id: 'pear', label: 'אגס' },
  { id: 'apple', label: 'תפוח' },
  { id: 'rectangle', label: 'מלבן' },
  { id: 'inverted-triangle', label: 'משולש הפוך' },
];

export default function ProfilePage({ showToast }) {
  const [profile, setProfile] = useState(getUserProfile());
  const [editing, setEditing] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const wardrobe = getWardrobe();
  const outfitLog = getOutfitLog();

  const handleSave = () => {
    saveUserProfile(profile);
    setEditing(false);
    showToast('הפרופיל עודכן!');
  };

  const toggleStyle = (id) => {
    setProfile(prev => ({
      ...prev,
      styles: prev.styles.includes(id)
        ? prev.styles.filter(s => s !== id)
        : [...prev.styles, id],
    }));
  };

  const handleReset = () => {
    if (window.confirm('את בטוחה? כל הנתונים יימחקו.')) {
      clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>הפרופיל שלי</h1>
        {!editing ? (
          <button className="edit-btn" onClick={() => setEditing(true)}>
            <Edit3 size={16} />
            עריכה
          </button>
        ) : (
          <button className="save-edit-btn" onClick={handleSave}>
            <Save size={16} />
            שמירה
          </button>
        )}
      </div>

      <div className="profile-avatar">
        <div className="avatar-circle">
          <User size={40} />
        </div>
        <h2>{profile.name || 'שם לא הוגדר'}</h2>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-num">{wardrobe.length}</span>
          <span className="stat-lbl">פריטים</span>
        </div>
        <div className="profile-stat">
          <span className="stat-num">{outfitLog.length}</span>
          <span className="stat-lbl">לוקים נלבשו</span>
        </div>
        <div className="profile-stat">
          <span className="stat-num">{new Set(wardrobe.map(i => i.category)).size}</span>
          <span className="stat-lbl">קטגוריות</span>
        </div>
      </div>

      <div className="profile-section">
        <h3>פרטים אישיים</h3>
        {editing ? (
          <div className="edit-fields">
            <div className="edit-field">
              <label>שם</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="edit-row">
              <div className="edit-field">
                <label>גובה (ס״מ)</label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={e => setProfile(p => ({ ...p, height: e.target.value }))}
                />
              </div>
              <div className="edit-field">
                <label>משקל (ק״ג)</label>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))}
                />
              </div>
            </div>
            <div className="edit-field">
              <label>מבנה גוף</label>
              <div className="body-type-chips">
                {BODY_TYPES.map(bt => (
                  <button
                    key={bt.id}
                    className={`chip ${profile.bodyType === bt.id ? 'active' : ''}`}
                    onClick={() => setProfile(p => ({ ...p, bodyType: bt.id }))}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">שם</span>
              <span className="detail-value">{profile.name || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">גובה</span>
              <span className="detail-value">{profile.height ? `${profile.height} ס״מ` : '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">משקל</span>
              <span className="detail-value">{profile.weight ? `${profile.weight} ק״ג` : '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">מבנה גוף</span>
              <span className="detail-value">
                {BODY_TYPES.find(bt => bt.id === profile.bodyType)?.label || '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>סגנונות מועדפים</h3>
        <div className="style-chips">
          {STYLES.map(style => (
            <button
              key={style.id}
              className={`chip ${profile.styles.includes(style.id) ? 'active' : ''}`}
              onClick={editing ? () => toggleStyle(style.id) : undefined}
              style={{ cursor: editing ? 'pointer' : 'default' }}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="danger-zone">
        <button
          className="danger-header"
          onClick={() => setShowDanger(!showDanger)}
        >
          <span>אזור מסוכן</span>
          {showDanger ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showDanger && (
          <div className="danger-actions">
            <button className="danger-btn" onClick={handleReset}>
              <Trash2 size={16} />
              מחיקת כל הנתונים ואיפוס
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
