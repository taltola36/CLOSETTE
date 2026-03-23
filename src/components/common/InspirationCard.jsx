import { useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { getInspirationForEvent, getRandomInspiration } from '../../services/pinterestInspiration';
import './InspirationCard.css';

export default function InspirationCard({ event, count = 3 }) {
  const [images, setImages] = useState(() => getInspirationForEvent(event, count));

  const refreshImages = () => {
    setImages(getInspirationForEvent(event, count));
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="inspiration-card">
      <div className="inspiration-header">
        <div className="inspiration-title">
          <span className="pinterest-icon">📌</span>
          <h4>השראה מהרשת</h4>
        </div>
        <button className="inspiration-refresh" onClick={refreshImages} aria-label="רענון השראות">
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="inspiration-grid">
        {images.map((img, idx) => (
          <div key={`${img.url}-${idx}`} className="inspiration-item">
            <img
              src={img.url}
              alt={img.caption}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="inspiration-fallback" style={{ display: 'none' }}>
              <span>📸</span>
            </div>
            <span className="inspiration-caption">{img.caption}</span>
          </div>
        ))}
      </div>
      <p className="inspiration-hint">לוקים דומים לפריטים שבארון שלך</p>
    </div>
  );
}
