// LocalStorage service for CLOSETTE
const KEYS = {
  USER_PROFILE: 'closette_user_profile',
  WARDROBE: 'closette_wardrobe',
  OUTFITS: 'closette_outfits',
  OUTFIT_LOG: 'closette_outfit_log',
  PACKING_LISTS: 'closette_packing_lists',
  ONBOARDING_COMPLETE: 'closette_onboarding_complete',
  PROCESSING_VERSION: 'closette_processing_version',
};

function get(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  localStorage.removeItem(key);
}

// User Profile
export function getUserProfile() {
  return get(KEYS.USER_PROFILE) || {
    name: '',
    styles: [],
    bodyType: '',
    height: '',
    weight: '',
    gender: '',
  };
}

export function saveUserProfile(profile) {
  return set(KEYS.USER_PROFILE, profile);
}

// Wardrobe
export function getWardrobe() {
  return get(KEYS.WARDROBE) || [];
}

export function saveWardrobe(items) {
  return set(KEYS.WARDROBE, items);
}

export function addWardrobeItem(item) {
  const items = getWardrobe();
  const newItem = {
    ...item,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  items.push(newItem);
  saveWardrobe(items);
  return newItem;
}

export function updateWardrobeItem(id, updates) {
  const items = getWardrobe();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveWardrobe(items);
    return items[index];
  }
  return null;
}

export function deleteWardrobeItem(id) {
  const items = getWardrobe().filter(i => i.id !== id);
  saveWardrobe(items);
}

// Outfits (saved/generated)
export function getSavedOutfits() {
  return get(KEYS.OUTFITS) || [];
}

export function saveOutfit(outfit) {
  const outfits = getSavedOutfits();
  const newOutfit = {
    ...outfit,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  outfits.push(newOutfit);
  set(KEYS.OUTFITS, outfits);
  return newOutfit;
}

export function deleteOutfit(id) {
  const outfits = getSavedOutfits().filter(o => o.id !== id);
  set(KEYS.OUTFITS, outfits);
}

// Outfit Log (worn history)
export function getOutfitLog() {
  return get(KEYS.OUTFIT_LOG) || [];
}

export function logOutfitWorn(outfit, event) {
  const log = getOutfitLog();
  log.push({
    id: Date.now().toString(),
    outfitId: outfit.id,
    items: outfit.items,
    event,
    date: new Date().toISOString(),
  });
  set(KEYS.OUTFIT_LOG, log);
}

// Packing Lists
export function getPackingLists() {
  return get(KEYS.PACKING_LISTS) || [];
}

export function savePackingList(list) {
  const lists = getPackingLists();
  const newList = {
    ...list,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  lists.push(newList);
  set(KEYS.PACKING_LISTS, lists);
  return newList;
}

export function updatePackingList(id, updates) {
  const lists = getPackingLists();
  const index = lists.findIndex(l => l.id === id);
  if (index !== -1) {
    lists[index] = { ...lists[index], ...updates };
    set(KEYS.PACKING_LISTS, lists);
    return lists[index];
  }
  return null;
}

export function deletePackingList(id) {
  const lists = getPackingLists().filter(l => l.id !== id);
  set(KEYS.PACKING_LISTS, lists);
}

// Onboarding
export function isOnboardingComplete() {
  return get(KEYS.ONBOARDING_COMPLETE) === true;
}

export function setOnboardingComplete() {
  set(KEYS.ONBOARDING_COMPLETE, true);
}

export function resetOnboarding() {
  remove(KEYS.ONBOARDING_COMPLETE);
}

// Processing version
export function getProcessingVersion() {
  return get(KEYS.PROCESSING_VERSION) || 0;
}

export function setProcessingVersion(version) {
  set(KEYS.PROCESSING_VERSION, version);
}

// Clear all data
export function clearAllData() {
  Object.values(KEYS).forEach(remove);
}
