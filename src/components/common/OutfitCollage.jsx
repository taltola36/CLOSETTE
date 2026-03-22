import './OutfitCollage.css';

const ROLE_LABELS = {
  top: 'חולצה',
  bottom: 'תחתון',
  dress: 'שמלה',
  shoes: 'נעליים',
  bag: 'תיק',
  outerwear: 'שכבה עליונה',
  accessory: 'אקססורי',
};

const PLACEHOLDER_COLORS = [
  '#E8DDD3', '#D4B5A7', '#C9A494', '#C4A882',
  '#B8907A', '#A8C0B8', '#B0A8C0', '#C0B8A0',
];

export default function OutfitCollage({ outfit, onShuffleItem }) {
  if (!outfit || !outfit.items || outfit.items.length === 0) {
    return <div className="collage-empty">אין פריטים להצגה</div>;
  }

  const mainItems = outfit.items.filter(i => ['top', 'bottom', 'dress'].includes(i.role));
  const accessoryItems = outfit.items.filter(i => !['top', 'bottom', 'dress'].includes(i.role));

  return (
    <div className="outfit-collage">
      <div className="collage-main">
        {mainItems.map((item, idx) => (
          <CollageItem
            key={item.id || idx}
            item={item}
            colorIndex={idx}
            onShuffle={onShuffleItem ? () => onShuffleItem(item.role) : null}
          />
        ))}
      </div>
      {accessoryItems.length > 0 && (
        <div className="collage-accessories">
          {accessoryItems.map((item, idx) => (
            <CollageItem
              key={item.id || idx}
              item={item}
              colorIndex={idx + mainItems.length}
              small
              onShuffle={onShuffleItem ? () => onShuffleItem(item.role) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollageItem({ item, colorIndex, small, onShuffle }) {
  const bgColor = PLACEHOLDER_COLORS[colorIndex % PLACEHOLDER_COLORS.length];

  return (
    <div
      className={`collage-item ${small ? 'small' : ''}`}
      onClick={onShuffle}
      style={{ cursor: onShuffle ? 'pointer' : 'default' }}
    >
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name || ROLE_LABELS[item.role]} />
      ) : (
        <div className="collage-placeholder" style={{ backgroundColor: bgColor }}>
          <span className="placeholder-icon">
            {item.role === 'shoes' ? '👟' :
             item.role === 'bag' ? '👜' :
             item.role === 'accessory' ? '💍' :
             item.role === 'outerwear' ? '🧥' :
             item.role === 'dress' ? '👗' :
             item.role === 'top' ? '👚' : '👖'}
          </span>
        </div>
      )}
      <span className="collage-item-label">
        {item.name || ROLE_LABELS[item.role] || item.category}
      </span>
      {onShuffle && (
        <span className="shuffle-hint">🔄</span>
      )}
    </div>
  );
}
