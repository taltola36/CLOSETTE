/**
 * Pinterest-style inspiration service
 * Provides curated women's fashion inspiration images mapped to events and vibes.
 * Uses Unsplash free images as inspiration sources.
 */

const INSPIRATION_IMAGES = {
  work: [
    { url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop', caption: 'אלגנטיות משרדית' },
    { url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=600&fit=crop', caption: 'סטייל עבודה מודרני' },
    { url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=400&h=600&fit=crop', caption: 'שיק משרדי' },
    { url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&h=600&fit=crop', caption: 'מינימליזם בעבודה' },
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', caption: 'אופנה עסקית' },
    { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop', caption: 'קלאסית ומקצועית' },
  ],
  casual: [
    { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop', caption: 'קז׳ואל שיק' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', caption: 'סטייל יומיומי' },
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', caption: 'לוק רחוב נינוח' },
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', caption: 'סטייל של סוף שבוע' },
    { url: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=600&fit=crop', caption: 'פשוט ויפה' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop', caption: 'נוח ומסוגנן' },
  ],
  date: [
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop', caption: 'אלגנטית לערב' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop', caption: 'לוק דייט מושלם' },
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop', caption: 'שיק ונשי' },
    { url: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop', caption: 'מחמיאה ורומנטית' },
    { url: 'https://images.unsplash.com/photo-1502716119720-b23a1e3b3c35?w=400&h=600&fit=crop', caption: 'רומנטית ומיוחדת' },
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', caption: 'עדינה ויפה' },
  ],
  bar: [
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop', caption: 'לוק מסיבה' },
    { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop', caption: 'נועזת ומגניבה' },
    { url: 'https://images.unsplash.com/photo-1502716119720-b23a1e3b3c35?w=400&h=600&fit=crop', caption: 'נוצצת ויפה' },
    { url: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop', caption: 'אופנה לילית' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', caption: 'סטייל של לילה בעיר' },
    { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop', caption: 'גלאם לילי' },
  ],
  friday: [
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop', caption: 'אלגנטית לשישי' },
    { url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop', caption: 'שיק חגיגי' },
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', caption: 'נקייה ומיוחדת' },
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', caption: 'קלאסית וחמה' },
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop', caption: 'סטייל חגיגי' },
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', caption: 'מושלמת לערב שבת' },
  ],
  sport: [
    { url: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=400&h=600&fit=crop', caption: 'ספורט אלגנטי' },
    { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop', caption: 'ספורטיבית שיק' },
    { url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=600&fit=crop', caption: 'אתלטית ומגניבה' },
    { url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=600&fit=crop', caption: 'אקטיבית ומסוגננת' },
    { url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=600&fit=crop', caption: 'אנרגטית וחזקה' },
    { url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=600&fit=crop', caption: 'ספורט מודרני' },
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
