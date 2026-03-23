import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addWardrobeItem } from '../services/storage';
import { processImage } from '../services/imageProcessor';
import { Camera, Upload, X, Check, ChevronDown, Loader, ArrowRight } from 'lucide-react';
import './AddItemPage.css';

const CATEGORIES = [
  'חולצה', 'סוודר', 'חולצת כפתורים', 'גופייה', 'טופ',
  'מכנסיים', 'ג׳ינס', 'חצאית', 'שורטס',
  'שמלה',
  'נעליים', 'סנדלים', 'מגפיים', 'סניקרס', 'עקבים',
  'תיק', 'תיק יד', 'תיק גב',
  'מעיל', 'ז׳קט', 'קרדיגן', 'בלייזר',
  'תכשיט', 'צעיף', 'כובע', 'חגורה',
];

const COLORS = [
  { name: 'שחור', hex: '#2C2C2C' },
  { name: 'לבן', hex: '#F5F5F5' },
  { name: 'אפור', hex: '#9B9B9B' },
  { name: 'כחול', hex: '#4A6FA5' },
  { name: 'כחול כהה', hex: '#2C3E6B' },
  { name: 'תכלת', hex: '#87CEEB' },
  { name: 'אדום', hex: '#C0392B' },
  { name: 'ורוד', hex: '#E8A0BF' },
  { name: 'ירוק', hex: '#6B8E6B' },
  { name: 'ירוק כהה', hex: '#2D5A3D' },
  { name: 'צהוב', hex: '#F0C040' },
  { name: 'כתום', hex: '#E67E22' },
  { name: 'סגול', hex: '#8E6B8E' },
  { name: 'חום', hex: '#8B6F5E' },
  { name: 'בז׳', hex: '#D4B896' },
  { name: 'קרם', hex: '#F5F0EB' },
  { name: 'זהב', hex: '#D4A843' },
  { name: 'כסף', hex: '#C0C0C0' },
];

const SEASONS = [
  { id: 'summer', label: 'קיץ' },
  { id: 'winter', label: 'חורף' },
  { id: 'spring/fall', label: 'אביב/סתיו' },
  { id: 'all', label: 'כל העונות' },
];

export default function AddItemPage({ showToast }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('');
  const [season, setSeason] = useState('all');
  const [showCategories, setShowCategories] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [viewStep, setViewStep] = useState('capture'); // capture | details

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessingImage(true);
    try {
      const processed = await processImage(file);
      setImageUrl(processed);
      setViewStep('details');
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageUrl(ev.target.result);
        setViewStep('details');
      };
      reader.readAsDataURL(file);
    } finally {
      setProcessingImage(false);
    }
  };

  const handleColorSelect = (c) => {
    setColor(c.name);
    setColorHex(c.hex);
  };

  const handleSave = () => {
    if (!category) {
      showToast('יש לבחור קטגוריה');
      return;
    }

    addWardrobeItem({
      name: name || category,
      category,
      color,
      colorHex,
      season,
      imageUrl,
    });

    showToast('הפריט נוסף בהצלחה!');
    navigate('/closet');
  };

  const handleSkipToDetails = () => {
    setViewStep('details');
  };

  return (
    <div className="add-item-page">
      <div className="add-item-header">
        <button className="close-btn" onClick={() => navigate(-1)}>
          <X size={24} />
        </button>
        <h2>{viewStep === 'capture' ? 'צילום פריט' : 'פרטי הפריט'}</h2>
        {viewStep === 'details' ? (
          <button className="save-btn" onClick={handleSave} disabled={!category}>
            שמירה ✓
          </button>
        ) : (
          <div style={{ width: 60 }} />
        )}
      </div>

      {viewStep === 'capture' && (
        <div className="capture-section">
          <div className="smart-capture-label">
            <span>SMART CAPTURE</span>
            <p>צלמי את הפריט במרכז</p>
          </div>

          {processingImage ? (
            <div className="capture-area processing">
              <div className="processing-overlay">
                <Loader size={32} className="spinner" />
                <span>AI PROCESSED</span>
                <span className="process-sub">מעבד/ת תמונה...</span>
              </div>
            </div>
          ) : (
            <div className="capture-area" onClick={() => fileInputRef.current?.click()}>
              <div className="capture-frame">
                <div className="frame-corner tl" />
                <div className="frame-corner tr" />
                <div className="frame-corner bl" />
                <div className="frame-corner br" />
                <Camera size={48} />
                <span>לחצי לצילום או העלאה</span>
              </div>
            </div>
          )}

          <button className="capture-main-btn" onClick={() => fileInputRef.current?.click()}>
            <div className="capture-circle">
              <Camera size={24} />
            </div>
          </button>

          <div className="capture-bottom-actions">
            <button className="text-link" onClick={handleSkipToDetails}>
              דלגי לפרטים ←
            </button>
          </div>
        </div>
      )}

      {viewStep === 'details' && (
        <div className="details-section">
          {imageUrl && (
            <div className="detail-image-preview">
              <img src={imageUrl} alt="preview" />
              <button className="change-image" onClick={() => { setViewStep('capture'); setImageUrl(''); }}>
                החלפת תמונה
              </button>
            </div>
          )}

          <div className="form-section">
            <div className="form-field">
              <label>שם הפריט (אופציונלי)</label>
              <input
                type="text"
                placeholder="למשל: חולצה לבנה של זארה"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>קטגוריה *</label>
              <button
                className="category-selector"
                onClick={() => setShowCategories(!showCategories)}
              >
                {category || 'בחר/י קטגוריה'}
                <ChevronDown size={16} />
              </button>
              {showCategories && (
                <div className="category-dropdown">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`category-option ${category === cat ? 'selected' : ''}`}
                      onClick={() => { setCategory(cat); setShowCategories(false); }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-field">
              <label>צבע</label>
              <div className="color-grid">
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    className={`color-swatch ${color === c.name ? 'selected' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => handleColorSelect(c)}
                    title={c.name}
                  />
                ))}
              </div>
              {color && <span className="selected-color">{color}</span>}
            </div>

            <div className="form-field">
              <label>עונה</label>
              <div className="season-options">
                {SEASONS.map(s => (
                  <button
                    key={s.id}
                    className={`season-btn ${season === s.id ? 'active' : ''}`}
                    onClick={() => setSeason(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-footer">
            <button className="save-main-btn" onClick={handleSave} disabled={!category}>
              שמירה ✓
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
