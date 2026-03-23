import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addWardrobeItem } from '../services/storage';
import { processImage } from '../services/imageProcessor';
import { Camera, Upload, X, Check, ChevronDown, Loader } from 'lucide-react';
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessingImage(true);
    try {
      const processed = await processImage(file);
      setImageUrl(processed);
    } catch {
      // Fallback to raw image if processing fails
      const reader = new FileReader();
      reader.onload = (ev) => setImageUrl(ev.target.result);
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

  return (
    <div className="add-item-page">
      <div className="add-item-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <X size={24} />
        </button>
        <h2>הוספת פריט</h2>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={!category}
        >
          <Check size={20} />
          שמירה
        </button>
      </div>

      <div className="image-upload-section">
        {processingImage ? (
          <div className="upload-area processing">
            <Loader size={32} className="spinner" />
            <span>מעבד/ת תמונה...</span>
            <span className="upload-hint">הסרת רקע, חידוד וחיתוך חכם</span>
          </div>
        ) : imageUrl ? (
          <div className="image-preview">
            <img src={imageUrl} alt="preview" />
            <button className="remove-image" onClick={() => setImageUrl('')}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
            <Camera size={32} />
            <span>צלמ/י או העל/י תמונה</span>
            <span className="upload-hint">לתוצאות הכי טובות, צלמ/י על רקע בהיר</span>
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
    </div>
  );
}
