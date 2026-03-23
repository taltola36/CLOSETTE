/**
 * Pinterest-style inspiration service
 * Provides curated women's fashion inspiration images that match
 * the actual outfit items (garment types, colors, style).
 */

// Each image is tagged with garment combo + color tones for smart matching
const INSPIRATION_POOL = [
  // --- Dress outfits ---
  { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop', caption: 'שמלה אלגנטית', tags: ['dress'], colors: ['שחור', 'כהה'] },
  { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', caption: 'שמלה קייצית', tags: ['dress'], colors: ['לבן', 'בהיר', 'קרם'] },
  { url: 'https://images.unsplash.com/photo-1502716119720-b23a1e3b3c35?w=400&h=600&fit=crop', caption: 'שמלה רומנטית', tags: ['dress'], colors: ['ורוד', 'אדום', 'סגול'] },
  { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop', caption: 'שמלת ערב', tags: ['dress'], colors: ['שחור', 'כהה', 'זהב'] },
  { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop', caption: 'שמלה יומיומית', tags: ['dress'], colors: ['כחול', 'תכלת'] },
  { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop', caption: 'שמלה פרחונית', tags: ['dress'], colors: ['ירוק', 'צבעוני'] },

  // --- Top + Jeans/Pants ---
  { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', caption: 'ג׳ינס וחולצה', tags: ['top', 'jeans', 'pants'], colors: ['כחול', 'לבן'] },
  { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop', caption: 'לוק קז׳ואל עם ג׳ינס', tags: ['top', 'jeans', 'pants'], colors: ['כחול', 'בז׳', 'חום'] },
  { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', caption: 'מכנסיים וחולצה אלגנטית', tags: ['top', 'pants'], colors: ['שחור', 'לבן', 'אפור'] },
  { url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop', caption: 'סטייל נקי עם מכנסיים', tags: ['top', 'pants'], colors: ['בז׳', 'חום', 'קרם'] },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop', caption: 'חולצה ומכנסיים קלאסיים', tags: ['top', 'pants'], colors: ['שחור', 'לבן'] },
  { url: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=600&fit=crop', caption: 'לוק יומיומי נוח', tags: ['top', 'jeans', 'pants'], colors: ['כחול', 'אפור'] },

  // --- Top + Skirt ---
  { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop', caption: 'חצאית וחולצה', tags: ['top', 'skirt'], colors: ['שחור', 'לבן', 'אדום'] },
  { url: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop', caption: 'חצאית מידי אלגנטית', tags: ['top', 'skirt'], colors: ['בז׳', 'חום', 'קרם'] },
  { url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=400&h=600&fit=crop', caption: 'לוק נשי עם חצאית', tags: ['top', 'skirt'], colors: ['ורוד', 'לבן', 'בהיר'] },

  // --- Blazer / Outerwear looks ---
  { url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=600&fit=crop', caption: 'בלייזר אלגנטי', tags: ['outerwear', 'blazer'], colors: ['שחור', 'אפור', 'כהה'] },
  { url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&h=600&fit=crop', caption: 'מעיל וסטייל שכבות', tags: ['outerwear', 'coat'], colors: ['בז׳', 'חום', 'קרם'] },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop', caption: 'ז׳קט קלאסי', tags: ['outerwear'], colors: ['שחור', 'לבן'] },

  // --- Sporty ---
  { url: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=400&h=600&fit=crop', caption: 'ספורט אלגנטי', tags: ['sporty'], colors: ['שחור', 'לבן', 'אפור'] },
  { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop', caption: 'אתלטית ומסוגננת', tags: ['sporty'], colors: ['שחור', 'ורוד'] },
  { url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=600&fit=crop', caption: 'לוק ספורטיבי שיק', tags: ['sporty'], colors: ['לבן', 'תכלת', 'כחול'] },

  // --- Sneakers / casual shoes looks ---
  { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop', caption: 'סניקרס וסטייל', tags: ['sneakers', 'casual-shoes'], colors: ['לבן', 'כחול'] },
  { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', caption: 'נעלי ספורט ושמלה', tags: ['sneakers', 'dress'], colors: ['לבן', 'צבעוני'] },

  // --- Heels / elegant shoes looks ---
  { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop', caption: 'עקבים ואלגנטיות', tags: ['heels', 'elegant-shoes'], colors: ['שחור', 'אדום'] },
  { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop', caption: 'נעלי עקב ושמלה', tags: ['heels', 'dress'], colors: ['שחור', 'כהה'] },

  // --- Bag focused ---
  { url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=600&fit=crop', caption: 'תיק יד ולוק מלא', tags: ['bag'], colors: ['חום', 'בז׳', 'קרם'] },
  { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', caption: 'אקססוריז ותיק', tags: ['bag', 'accessories'], colors: ['שחור', 'זהב'] },
];

// Map outfit item categories to tags
const CATEGORY_TO_TAGS = {
  dress: ['dress'],
  top: ['top'],
  bottom: ['pants', 'jeans', 'skirt'],
  shoes: ['sneakers', 'heels', 'casual-shoes', 'elegant-shoes'],
  outerwear: ['outerwear', 'blazer', 'coat'],
  bag: ['bag'],
  accessory: ['accessories'],
};

// Map Hebrew category names to more specific tags
const CATEGORY_NAME_TAGS = {
  'ג׳ינס': ['jeans'],
  'מכנסיים': ['pants'],
  'חצאית': ['skirt'],
  'שמלה': ['dress'],
  'סניקרס': ['sneakers'],
  'עקבים': ['heels', 'elegant-shoes'],
  'סנדלים': ['casual-shoes'],
  'נעליים': ['casual-shoes'],
  'מגפיים': ['heels'],
  'בלייזר': ['blazer'],
  'מעיל': ['coat'],
  'ז׳קט': ['outerwear'],
  'קרדיגן': ['outerwear'],
  'תיק': ['bag'],
  'תיק יד': ['bag'],
};

// Color grouping for matching
const COLOR_GROUPS = {
  'שחור': 'כהה', 'כחול כהה': 'כהה', 'ירוק כהה': 'כהה',
  'לבן': 'בהיר', 'קרם': 'בהיר', 'בז׳': 'בהיר',
  'כחול': 'כחול', 'תכלת': 'כחול',
  'אדום': 'אדום', 'ורוד': 'ורוד',
  'ירוק': 'ירוק',
  'חום': 'חום', 'זהב': 'חום',
  'אפור': 'אפור', 'כסף': 'אפור',
  'סגול': 'סגול',
  'צהוב': 'צבעוני', 'כתום': 'צבעוני',
};

function getOutfitTags(outfit) {
  if (!outfit || !outfit.items) return [];
  const tags = [];
  outfit.items.forEach(item => {
    // Add role-based tags
    if (item.role && CATEGORY_TO_TAGS[item.role]) {
      tags.push(...CATEGORY_TO_TAGS[item.role]);
    }
    // Add specific category name tags
    const cat = (item.category || '').toLowerCase();
    for (const [keyword, kwTags] of Object.entries(CATEGORY_NAME_TAGS)) {
      if (cat.includes(keyword)) {
        tags.push(...kwTags);
      }
    }
  });
  return [...new Set(tags)];
}

function getOutfitColors(outfit) {
  if (!outfit || !outfit.items) return [];
  const colors = [];
  outfit.items.forEach(item => {
    if (item.color) {
      colors.push(item.color);
      const group = COLOR_GROUPS[item.color];
      if (group) colors.push(group);
    }
  });
  return [...new Set(colors)];
}

function scoreImage(image, outfitTags, outfitColors) {
  let score = 0;

  // Tag matching (garment type is most important)
  const tagMatches = image.tags.filter(t => outfitTags.includes(t)).length;
  score += tagMatches * 3;

  // Color matching
  const colorMatches = image.colors.filter(c => outfitColors.includes(c)).length;
  score += colorMatches * 2;

  // Small random factor to vary results
  score += Math.random() * 1.5;

  return score;
}

/**
 * Get inspiration images that match a specific outfit.
 * Analyzes the outfit's items (types, colors) and finds visually similar looks.
 */
export function getInspirationForOutfit(outfit, count = 3) {
  const tags = getOutfitTags(outfit);
  const colors = getOutfitColors(outfit);

  const scored = INSPIRATION_POOL.map(img => ({
    ...img,
    score: scoreImage(img, tags, colors),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Return top matches, avoiding duplicates
  const results = [];
  const usedUrls = new Set();
  for (const img of scored) {
    if (!usedUrls.has(img.url)) {
      results.push({ url: img.url, caption: img.caption });
      usedUrls.add(img.url);
    }
    if (results.length >= count) break;
  }

  return results;
}

/**
 * Fallback: get inspiration by event type (less accurate).
 */
export function getInspirationForEvent(event, count = 3) {
  const eventTagMap = {
    work: ['top', 'pants', 'blazer', 'outerwear'],
    casual: ['top', 'jeans', 'sneakers'],
    date: ['dress', 'heels'],
    bar: ['dress', 'heels'],
    friday: ['top', 'skirt', 'dress'],
    sport: ['sporty'],
  };
  const tags = eventTagMap[event] || eventTagMap.casual;
  const colors = [];

  const scored = INSPIRATION_POOL.map(img => ({
    ...img,
    score: scoreImage(img, tags, colors),
  }));
  scored.sort((a, b) => b.score - a.score);

  const results = [];
  const usedUrls = new Set();
  for (const img of scored) {
    if (!usedUrls.has(img.url)) {
      results.push({ url: img.url, caption: img.caption });
      usedUrls.add(img.url);
    }
    if (results.length >= count) break;
  }
  return results;
}
