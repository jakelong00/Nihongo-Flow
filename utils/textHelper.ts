
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
 * A basic Romaji to Hiragana mapping and converter.
 * Covers standard syllables for input validation.
 */
const ROMAJI_MAP: Record<string, string> = {
    'a':'あ','i':'い','u':'う','e':'え','o':'お',
    'ka':'か','ki':'き','ku':'く','ke':'け','ko':'こ',
    'sa':'さ','shi':'し','su':'す','se':'せ','so':'そ',
    'ta':'た','chi':'ち','tsu':'つ','te':'て','to':'と',
    'na':'な','ni':'に','nu':'ぬ','ne':'ね','no':'の',
    'ha':'は','hi':'ひ','fu':'ふ','he':'へ','ho':'ほ',
    'ma':'ま','mi':'み','mu':'む','me':'め','mo':'も',
    'ya':'や','yu':'ゆ','yo':'よ',
    'ra':'ら','ri':'り','ru':'る','re':'れ','ro':'ろ',
    'wa':'わ','wo':'を','n':'ん',
    'ga':'が','gi':'ぎ','gu':'ぐ','ge':'げ','go':'ご',
    // Fixed duplicate 'so' key on line 29 (changed to 'zo')
    'za':'ざ','ji':'じ','zu':'ず','ze':'ぜ','zo':'ぞ',
    'da':'だ','di':'ぢ','du':'づ','de':'で','do':'ど',
    'ba':'ば','bi':'び','bu':'ぶ','be':'べ','bo':'ぼ',
    'pa':'ぱ','pi':'ぴ','pu':'ぷ','pe':'ぺ','po':'ぽ',
    'kya':'きゃ','kyu':'きゅ','kyo':'きょ',
    'sha':'しゃ','shu':'しゅ','sho':'しょ',
    'cha':'ちゃ','chu':'ちゅ','cho':'ちょ',
    'nya':'にゃ','nyu':'にゃ','nyo':'にょ',
    'hya':'ひゃ','hyu':'ひゃ','hyo':'ひょ',
    'mya':'みゃ','myu':'みゅ','myo':'みょ',
    'rya':'りゃ','ryu':'りゅ','ryo':'りょ',
    'gya':'ぎゃ','gyu':'ぎゅ','gyo':'ぎょ',
    'ja':'じゃ','ju':'じゅ','jo':'じょ',
    'bya':'びゃ','byu':'びゅ','byo':'びょ',
    'pya':'ぴゃ','pyu':'ぴゅ','pyo':'ぴょ',
    'tsu ':'っ'
};

export const romajiToHiragana = (romaji: string): string => {
    let result = '';
    let tmp = romaji.toLowerCase();
    
    // Handle double consonants (促音 - sokuon)
    tmp = tmp.replace(/([ksthmyrwgzdbp])\1/g, 'tsu $1');

    let i = 0;
    while (i < tmp.length) {
        let found = false;
        // Try to match 3-char chunks (kya, sha, etc)
        for (let len = 3; len >= 1; len--) {
            const chunk = tmp.substr(i, len);
            if (ROMAJI_MAP[chunk]) {
                result += ROMAJI_MAP[chunk];
                i += len;
                found = true;
                break;
            }
        }
        if (!found) {
            result += tmp[i];
            i++;
        }
    }
    return result;
};

/**
 * Normalizes text by lowercasing English and converting Katakana to Hiragana.
 */
export const normalizeText = (str: string): string => {
  if (!str) return '';
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
      if (target.toLowerCase().includes(rawQuery)) return true;
      const normalizedTarget = normalizeText(target);
      return normalizedTarget.includes(normalizedQuery);
  });
};