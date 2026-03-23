/**
 * Pinterest-style inspiration service
 * Provides curated fashion inspiration images mapped to events and vibes.
 * Uses Unsplash free images as inspiration sources.
 */

const INSPIRATION_IMAGES = {
  work: [
    { url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop', caption: 'אלגנטיות משרדית' },
    { url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=600&fit=crop', caption: 'סטייל עבודה מודרני' },
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop', caption: 'קלאסי ומקצועי' },
    { url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=400&h=600&fit=crop', caption: 'שיק משרדי' },
    { url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&h=600&fit=crop', caption: 'מינימליזם בעבודה' },
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', caption: 'אופנה עסקית' },
  ],
  casual: [
    { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop', caption: 'קז׳ואל שיק' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', caption: 'סטייל יומיומי' },
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', caption: 'לוק רחוב נינוח' },
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a37?w=400&h=600&fit=crop', caption: 'נוח ומסוגנן' },
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', caption: 'סטייל של סוף שבוע' },
    { url: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=600&fit=crop', caption: 'פשוט ויפה' },
  ],
  date: [
    { url: 'https://images.unsplash.com/photo-1502716119720-b23a1e3b3c35?w=400&h=600&fit=crop', caption: 'רומנטי ומיוחד' },
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop', caption: 'אלגנטי לערב' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop', caption: 'לוק דייט מושלם' },
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop', caption: 'שיק ונשי' },
    { url: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop', caption: 'מרגש ומחמיא' },
    { url: 'https://images.unsplash.com/photo-1518577915332-c2a19f149a75?w=400&h=600&fit=crop', caption: 'מסתורי ויפה' },
  ],
  bar: [
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop', caption: 'לוק מסיבה' },
    { url: 'https://images.unsplash.com/photo-1536243298747-ea8874136d64?w=400&h=600&fit=crop', caption: 'גלאם לילי' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop', caption: 'נועז ומגניב' },
    { url: 'https://images.unsplash.com/photo-1518577915332-c2a19f149a75?w=400&h=600&fit=crop', caption: 'סטייל של לילה בעיר' },
    { url: 'https://images.unsplash.com/photo-1502716119720-b23a1e3b3c35?w=400&h=600&fit=crop', caption: 'ברק ונוצץ' },
    { url: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop', caption: 'אופנה לילית' },
  ],
  friday: [
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop', caption: 'אלגנטי לשישי' },
    { url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop', caption: 'שיק חגיגי' },
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop', caption: 'לוק שבת מושלם' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', caption: 'נקי ומיוחד' },
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', caption: 'קלאסי וחם' },
    { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a37?w=400&h=600&fit=crop', caption: 'סטייל חגיגי' },
  ],
  sport: [
    { url: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=400&h=600&fit=crop', caption: 'ספורט אלגנטי' },
    { url: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=400&h=600&fit=crop', caption: 'אתלטי ומגניב' },
    { url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=600&fit=crop', caption: 'אקטיבי ומסוגנן' },
    { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop', caption: 'ספורטיבי שיק' },
    { url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=600&fit=crop', caption: 'אנרגטי וחזק' },
    { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop', caption: 'ספורט מודרני' },
  ],
};

/**
 * Get inspiration images for a given event type.
 * Returns a shuffled subset of images.
 */
export function getInspirationForEvent(event, count = 3) {
  const images = INSPIRATION_IMAGES[event] || INSPIRATION_IMAGES.casual;
  const shuffled = [...images].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get a single random inspiration image for a given event.
 */
export function getRandomInspiration(event) {
  const images = INSPIRATION_IMAGES[event] || INSPIRATION_IMAGES.casual;
  return images[Math.floor(Math.random() * images.length)];
}
