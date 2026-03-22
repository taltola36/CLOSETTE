// Outfit generation logic for CLOSETTE
import { getWardrobe } from './storage';
import { getOutfitLog } from './storage';

const CATEGORIES = {
  tops: ['חולצה', 'סוודר', 'חולצת כפתורים', 'גופייה', 'טופ', 'בלייזר'],
  bottoms: ['מכנסיים', 'חצאית', 'ג׳ינס', 'שורטס', 'מכנסיים קצרים'],
  dresses: ['שמלה'],
  shoes: ['נעליים', 'סנדלים', 'מגפיים', 'סניקרס', 'עקבים'],
  bags: ['תיק', 'תיק יד', 'תיק גב', 'קלאץ׳'],
  accessories: ['תכשיט', 'צעיף', 'כובע', 'חגורה', 'משקפיים'],
  outerwear: ['מעיל', 'ז׳קט', 'קרדיגן', 'וסט'],
};

const EVENT_STYLES = {
  work: { formality: 'smart', colors: ['שחור', 'לבן', 'כחול', 'אפור', 'בז׳', 'חום'] },
  casual: { formality: 'casual', colors: null },
  date: { formality: 'elegant', colors: ['שחור', 'אדום', 'לבן', 'ורוד'] },
  bar: { formality: 'party', colors: ['שחור', 'זהב', 'כסף', 'אדום'] },
  sport: { formality: 'sporty', colors: null },
  friday: { formality: 'smart-casual', colors: null },
};

const SEASON_TEMPS = {
  summer: { min: 25, max: 45 },
  winter: { min: 0, max: 15 },
  'spring/fall': { min: 15, max: 25 },
  all: { min: 0, max: 45 },
};

function categorizeItem(item) {
  const cat = (item.category || '').toLowerCase();
  for (const [group, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => cat.includes(k) || k.includes(cat))) {
      return group;
    }
  }
  // Fallback based on common English categories
  if (['top', 'shirt', 'blouse', 'sweater', 'tshirt'].some(k => cat.includes(k))) return 'tops';
  if (['pants', 'jeans', 'skirt', 'shorts', 'bottom'].some(k => cat.includes(k))) return 'bottoms';
  if (['dress'].some(k => cat.includes(k))) return 'dresses';
  if (['shoe', 'sneaker', 'boot', 'sandal', 'heel'].some(k => cat.includes(k))) return 'shoes';
  if (['bag', 'purse', 'backpack', 'clutch'].some(k => cat.includes(k))) return 'bags';
  if (['coat', 'jacket', 'cardigan', 'blazer'].some(k => cat.includes(k))) return 'outerwear';
  if (['accessory', 'jewelry', 'scarf', 'hat', 'belt'].some(k => cat.includes(k))) return 'accessories';
  return 'tops'; // default
}

function filterBySeason(items, temperature) {
  if (temperature === null || temperature === undefined) return items;
  return items.filter(item => {
    const season = item.season || 'all';
    const range = SEASON_TEMPS[season] || SEASON_TEMPS.all;
    return temperature >= range.min && temperature <= range.max;
  });
}

function getRecentlyWorn(days = 7) {
  const log = getOutfitLog();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recentItems = new Set();
  log
    .filter(entry => new Date(entry.date) > cutoff)
    .forEach(entry => {
      (entry.items || []).forEach(itemId => recentItems.add(itemId));
    });
  return recentItems;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOutfits(options = {}) {
  const {
    event = 'casual',
    temperature = null,
    count = 4,
  } = options;

  const wardrobe = getWardrobe();
  if (wardrobe.length === 0) return [];

  const recentlyWorn = getRecentlyWorn();

  // Categorize all items
  const categorized = {};
  wardrobe.forEach(item => {
    const group = categorizeItem(item);
    if (!categorized[group]) categorized[group] = [];
    categorized[group].push(item);
  });

  // Filter by season/temperature
  Object.keys(categorized).forEach(group => {
    categorized[group] = filterBySeason(categorized[group], temperature);
  });

  // Deprioritize recently worn (but don't exclude if wardrobe is small)
  Object.keys(categorized).forEach(group => {
    const available = categorized[group].filter(i => !recentlyWorn.has(i.id));
    if (available.length > 0) {
      // Put non-recent first, then recent
      categorized[group] = [...shuffle(available), ...shuffle(categorized[group].filter(i => recentlyWorn.has(i.id)))];
    } else {
      categorized[group] = shuffle(categorized[group]);
    }
  });

  const outfits = [];
  for (let i = 0; i < count; i++) {
    const outfit = { items: [] };

    // Decide: dress or top+bottom
    const useDress = categorized.dresses?.length > 0 && Math.random() > 0.6;
    if (useDress) {
      const dress = categorized.dresses[i % categorized.dresses.length];
      if (dress) outfit.items.push({ ...dress, role: 'dress' });
    } else {
      const top = categorized.tops?.[i % (categorized.tops?.length || 1)];
      const bottom = categorized.bottoms?.[i % (categorized.bottoms?.length || 1)];
      if (top) outfit.items.push({ ...top, role: 'top' });
      if (bottom) outfit.items.push({ ...bottom, role: 'bottom' });
    }

    // Add shoes
    const shoe = categorized.shoes?.[i % (categorized.shoes?.length || 1)];
    if (shoe) outfit.items.push({ ...shoe, role: 'shoes' });

    // Maybe add bag
    if (categorized.bags?.length > 0 && Math.random() > 0.3) {
      const bag = pickRandom(categorized.bags);
      if (bag) outfit.items.push({ ...bag, role: 'bag' });
    }

    // Maybe add outerwear (based on temperature)
    if (temperature !== null && temperature < 20 && categorized.outerwear?.length > 0) {
      const outer = pickRandom(categorized.outerwear);
      if (outer) outfit.items.push({ ...outer, role: 'outerwear' });
    }

    // Maybe add accessory
    if (categorized.accessories?.length > 0 && Math.random() > 0.5) {
      const acc = pickRandom(categorized.accessories);
      if (acc) outfit.items.push({ ...acc, role: 'accessory' });
    }

    if (outfit.items.length >= 2) {
      outfit.id = `generated_${Date.now()}_${i}`;
      outfit.event = event;
      outfits.push(outfit);
    }
  }

  return outfits;
}

export function shuffleSingleItem(outfit, role) {
  const wardrobe = getWardrobe();
  const currentItemId = outfit.items.find(i => i.role === role)?.id;

  const group = role === 'top' || role === 'dress' ? (role === 'dress' ? 'dresses' : 'tops') :
    role === 'bottom' ? 'bottoms' :
    role === 'shoes' ? 'shoes' :
    role === 'bag' ? 'bags' :
    role === 'outerwear' ? 'outerwear' : 'accessories';

  const candidates = wardrobe.filter(item => {
    const itemGroup = categorizeItem(item);
    return itemGroup === group && item.id !== currentItemId;
  });

  if (candidates.length === 0) return outfit;

  const newItem = pickRandom(candidates);
  const newItems = outfit.items.map(item =>
    item.role === role ? { ...newItem, role } : item
  );

  return { ...outfit, items: newItems };
}

export function generatePackingList(options = {}) {
  const { days = 3, activities = ['casual'], temperature = 22 } = options;

  const outfitsNeeded = Math.min(days + 1, 7);
  const allOutfits = [];

  activities.forEach(activity => {
    const outfits = generateOutfits({
      event: activity,
      temperature,
      count: Math.ceil(outfitsNeeded / activities.length),
    });
    allOutfits.push(...outfits);
  });

  // Deduplicate items
  const itemMap = new Map();
  allOutfits.forEach(outfit => {
    outfit.items.forEach(item => {
      if (!itemMap.has(item.id)) {
        itemMap.set(item.id, { ...item, packed: false });
      }
    });
  });

  return {
    outfits: allOutfits.slice(0, outfitsNeeded),
    items: Array.from(itemMap.values()),
  };
}
