import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWardrobe, deleteWardrobeItem } from '../services/storage';
import { Search, SlidersHorizontal, Plus, Trash2, X } from 'lucide-react';
import './ClosetPage.css';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'הכל' },
  { id: 'tops', label: 'חולצות' },
  { id: 'bottoms', label: 'מכנסיים' },
  { id: 'dresses', label: 'שמלות' },
  { id: 'shoes', label: 'נעליים' },
  { id: 'bags', label: 'תיקים' },
  { id: 'outerwear', label: 'שכבות' },
  { id: 'accessories', label: 'אקססוריז' },
];

const CATEGORY_MAP = {
  tops: ['חולצה', 'סוודר', 'חולצת כפתורים', 'גופייה', 'טופ', 'בלייזר', 'top', 'shirt', 'blouse', 'sweater', 'tshirt'],
  bottoms: ['מכנסיים', 'חצאית', 'ג׳ינס', 'שורטס', 'pants', 'jeans', 'skirt', 'shorts'],
  dresses: ['שמלה', 'dress'],
  shoes: ['נעליים', 'סנדלים', 'מגפיים', 'סניקרס', 'עקבים', 'shoes', 'sneakers', 'boots', 'sandals', 'heels'],
  bags: ['תיק', 'תיק יד', 'תיק גב', 'קלאץ׳', 'bag', 'purse', 'backpack', 'clutch'],
  outerwear: ['מעיל', 'ז׳קט', 'קרדיגן', 'וסט', 'coat', 'jacket', 'cardigan'],
  accessories: ['תכשיט', 'צעיף', 'כובע', 'חגורה', 'משקפיים', 'accessory', 'jewelry', 'scarf', 'hat', 'belt'],
};

function matchesCategory(item, filter) {
  if (filter === 'all') return true;
  const cat = (item.category || '').toLowerCase();
  const keywords = CATEGORY_MAP[filter] || [];
  return keywords.some(k => cat.includes(k) || k.includes(cat));
}

export default function ClosetPage({ showToast }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(getWardrobe());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems = items
    .filter(item => matchesCategory(item, filter))
    .filter(item => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (item.name || '').toLowerCase().includes(s) ||
             (item.category || '').toLowerCase().includes(s) ||
             (item.color || '').toLowerCase().includes(s);
    });

  const handleDelete = (id) => {
    deleteWardrobeItem(id);
    setItems(getWardrobe());
    setSelectedItem(null);
    showToast('הפריט נמחק');
  };

  return (
    <div className="closet-page">
      <div className="closet-header">
        <h1>הארון שלי</h1>
        <p className="closet-count">{items.length} פריטים</p>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="חיפוש פריט..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        {CATEGORY_FILTERS.map(cat => (
          <button
            key={cat.id}
            className={`filter-chip ${filter === cat.id ? 'active' : ''}`}
            onClick={() => setFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="closet-empty">
          <p>אין פריטים להצגה</p>
          <button className="primary-btn" onClick={() => navigate('/closet/add')}>
            <Plus size={18} />
            הוספת פריט
          </button>
        </div>
      ) : (
        <div className="closet-grid">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="closet-item"
              onClick={() => setSelectedItem(item)}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} />
              ) : (
                <div className="item-placeholder" style={{ backgroundColor: item.colorHex || '#E8DDD3' }}>
                  <span>{getCategoryEmoji(item.category)}</span>
                </div>
              )}
              <div className="item-info">
                <span className="item-name">{item.name || item.category}</span>
                {item.color && <span className="item-color">{item.color}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="fab-add"
        onClick={() => navigate('/closet/add')}
        aria-label="הוספת פריט"
      >
        <Plus size={28} />
      </button>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>
              <X size={24} />
            </button>
            <div className="item-detail">
              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="detail-image" />
              ) : (
                <div className="detail-placeholder" style={{ backgroundColor: selectedItem.colorHex || '#E8DDD3' }}>
                  <span>{getCategoryEmoji(selectedItem.category)}</span>
                </div>
              )}
              <h3>{selectedItem.name || selectedItem.category}</h3>
              <div className="detail-tags">
                {selectedItem.category && <span className="detail-tag">{selectedItem.category}</span>}
                {selectedItem.color && <span className="detail-tag">{selectedItem.color}</span>}
                {selectedItem.season && <span className="detail-tag">{selectedItem.season}</span>}
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(selectedItem.id)}
              >
                <Trash2 size={16} />
                מחיקת פריט
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryEmoji(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('שמלה') || cat.includes('dress')) return '👗';
  if (cat.includes('נעליים') || cat.includes('shoe')) return '👟';
  if (cat.includes('תיק') || cat.includes('bag')) return '👜';
  if (cat.includes('מעיל') || cat.includes('coat') || cat.includes('jacket')) return '🧥';
  if (cat.includes('מכנס') || cat.includes('pants') || cat.includes('jeans')) return '👖';
  if (cat.includes('חצאית') || cat.includes('skirt')) return '🩱';
  return '👚';
}
