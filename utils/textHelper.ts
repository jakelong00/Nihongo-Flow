
/**
 * Converts Katakana characters in a string to Hiragana.
 * Useful for normalizing search inputs.
 */
export const toHiragana = (str: string): string => {
  // Convert Katakana range \u30a1-\u30f6 to Hiragana \u3041-\u3096
  return str.replace(/[\u30a1-\u30f6]/g, function(match) {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
  });
};

/**
 * Normalizes text by lowercasing English and converting Katakana to Hiragana.
 */
export const normalizeText = (str: string): string => {
  if (!str) return '';
  // 1. Lowercase (for English meanings)
  // 2. Convert to Hiragana (to unify Japanese scripts)
  return toHiragana(str.toLowerCase().trim());
};

/**
 * Checks if a search query matches any of the target strings.
 * Handles script conversion (Katakana <-> Hiragana).
 */
export const fuzzySearch = (query: string, ...targets: (string | undefined)[]): boolean => {
  if (!query) return true;
  const normalizedQuery = normalizeText(query);
  const rawQuery = query.trim().toLowerCase();
  
  return targets.some(target => {
      if (!target) return false;
      
      // Check 1: Direct substring match (Case insensitive)
      // This handles:
      // - English matching English ("Cat" matches "Cat")
      // - Kanji matching Kanji ("猫" matches "猫")
      // - Romaji matching Romaji ("neko" matches "neko" inside a meaning field)
      if (target.toLowerCase().includes(rawQuery)) return true;
      
      // Check 2: Normalized match
      // This handles:
      // - Hiragana input matching Katakana target ("ねこ" matches "ネコ")
      // - Katakana input matching Hiragana target ("ネコ" matches "ねこ")
      // - Hiragana input matching Kanji's READING ("ねこ" matches "猫" because we pass the reading field)
      const normalizedTarget = normalizeText(target);
      return normalizedTarget.includes(normalizedQuery);
  });
};
