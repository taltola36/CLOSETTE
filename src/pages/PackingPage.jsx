import { useState } from 'react';
import { getPackingLists, savePackingList, updatePackingList, deletePackingList, getWardrobe } from '../services/storage';
import { generatePackingList } from '../services/outfitGenerator';
import { Plane, Plus, Check, Trash2, X, MapPin, Calendar, ChevronDown } from 'lucide-react';
import './PackingPage.css';

const TRIP_TYPES = [
  { id: 'vacation', label: 'חופשה', emoji: '🏖️' },
  { id: 'business', label: 'עסקים', emoji: '💼' },
  { id: 'weekend', label: 'סופש', emoji: '🌄' },
  { id: 'adventure', label: 'הרפתקה', emoji: '🏔️' },
];

export default function PackingPage({ showToast }) {
  const wardrobe = getWardrobe();
  const [lists, setLists] = useState(getPackingLists());
  const [showCreate, setShowCreate] = useState(false);
  const [activeList, setActiveList] = useState(null);

  // Create form state
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [tripType, setTripType] = useState('vacation');

  const handleCreate = () => {
    if (!destination) {
      showToast('יש להזין יעד');
      return;
    }

    const generated = generatePackingList({
      days,
      activities: [tripType === 'business' ? 'work' : 'casual'],
      temperature: 25,
    });

    const newList = savePackingList({
      destination,
      days,
      tripType,
      items: generated.items,
      outfits: generated.outfits,
    });

    setLists(getPackingLists());
    setShowCreate(false);
    setActiveList(newList);
    setDestination('');
    showToast('רשימת אריזה נוצרה!');
  };

  const togglePacked = (listId, itemId) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const updatedItems = list.items.map(item =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );
    updatePackingList(listId, { items: updatedItems });
    setLists(getPackingLists());
    if (activeList?.id === listId) {
      setActiveList({ ...activeList, items: updatedItems });
    }
  };

  const handleDelete = (id) => {
    deletePackingList(id);
    setLists(getPackingLists());
    if (activeList?.id === id) setActiveList(null);
    showToast('הרשימה נמחקה');
  };

  const packedCount = activeList?.items?.filter(i => i.packed).length || 0;
  const totalCount = activeList?.items?.length || 0;

  return (
    <div className="packing-page">
      <div className="packing-header">
        <h1>אריזה לחופשה</h1>
        <button className="new-list-btn" onClick={() => { setShowCreate(true); setActiveList(null); }}>
          <Plus size={18} />
          חדש
        </button>
      </div>

      {wardrobe.length < 3 && (
        <div className="packing-notice">
          <p>הוסיפ/י פריטים לארון כדי ליצור רשימות אריזה חכמות</p>
        </div>
      )}

      {showCreate && (
        <div className="create-form">
          <div className="form-header">
            <h3>חופשה חדשה</h3>
            <button onClick={() => setShowCreate(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="form-field">
            <label><MapPin size={14} /> יעד</label>
            <input
              type="text"
              placeholder="לאן נוסעים?"
              value={destination}
              onChange={e => setDestination(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label><Calendar size={14} /> מספר ימים</label>
            <div className="days-selector">
              {[2, 3, 5, 7, 10, 14].map(d => (
                <button
                  key={d}
                  className={`day-chip ${days === d ? 'active' : ''}`}
                  onClick={() => setDays(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>סוג הטיול</label>
            <div className="trip-types">
              {TRIP_TYPES.map(type => (
                <button
                  key={type.id}
                  className={`trip-type-btn ${tripType === type.id ? 'active' : ''}`}
                  onClick={() => setTripType(type.id)}
                >
                  <span>{type.emoji}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="generate-packing-btn" onClick={handleCreate}>
            <Plane size={18} />
            צור/י רשימת אריזה
          </button>
        </div>
      )}

      {!showCreate && !activeList && (
        <div className="lists-overview">
          {lists.length === 0 ? (
            <div className="packing-empty">
              <Plane size={48} />
              <h3>אין רשימות אריזה</h3>
              <p>צרו רשימת אריזה חכמה לטיול הבא</p>
            </div>
          ) : (
            <div className="lists-grid">
              {lists.map(list => (
                <button
                  key={list.id}
                  className="list-card"
                  onClick={() => setActiveList(list)}
                >
                  <div className="list-card-header">
                    <span className="list-destination">{list.destination}</span>
                    <button
                      className="list-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(list.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <span className="list-meta">
                    {list.days} ימים | {list.items?.length || 0} פריטים
                  </span>
                  <div className="list-progress">
                    <div
                      className="list-progress-bar"
                      style={{
                        width: `${list.items?.length ? (list.items.filter(i => i.packed).length / list.items.length * 100) : 0}%`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeList && !showCreate && (
        <div className="active-list">
          <div className="active-list-header">
            <button onClick={() => setActiveList(null)} className="back-link">
              חזרה לרשימות
            </button>
            <h3>{activeList.destination}</h3>
            <span className="pack-progress">{packedCount}/{totalCount} נארזו</span>
          </div>

          <div className="pack-progress-bar-wrapper">
            <div
              className="pack-progress-bar"
              style={{ width: `${totalCount ? (packedCount / totalCount * 100) : 0}%` }}
            />
          </div>

          <div className="packing-items">
            {(activeList.items || []).map(item => (
              <button
                key={item.id}
                className={`pack-item ${item.packed ? 'packed' : ''}`}
                onClick={() => togglePacked(activeList.id, item.id)}
              >
                <div className={`pack-check ${item.packed ? 'checked' : ''}`}>
                  {item.packed && <Check size={14} />}
                </div>
                <span className="pack-item-name">{item.name || item.category}</span>
                {item.color && <span className="pack-item-color">{item.color}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
