import React, { createContext, useContext, useState } from 'react';
import { 
  FileContextType, 
  DataType, 
  VocabItem, 
  KanjiItem, 
  GrammarItem, 
  StatItem,
  ReviewResult,
  LearningStage 
} from '../types';
import { parseCSV, toCSV } from '../utils/csvHelper';
import { STRINGS } from '../constants/strings';

// Add global declaration for File System Access API
declare global {
  interface Window {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
  }
}

const FileContext = createContext<FileContextType | undefined>(undefined);

const FILE_NAMES = {
  [DataType.VOCAB]: 'vocab.csv',
  [DataType.KANJI]: 'kanji.csv',
  [DataType.GRAMMAR]: 'grammar.csv',
  [DataType.STATS]: 'stats.csv'
};

const INITIAL_HEADERS = {
  [DataType.VOCAB]: 'id,word,reading,meaning,jlpt,chapter',
  [DataType.KANJI]: 'id,character,onyomi,kunyomi,meaning,jlpt,strokes,chapter',
  [DataType.GRAMMAR]: 'id,rule,explanation,examples,jlpt,chapter',
  [DataType.STATS]: 'date,category,itemId,result'
};

// --- Sample Data for Demo Mode ---
const SAMPLE_VOCAB: VocabItem[] = [
  { id: '1', word: '猫', reading: 'ねこ', meaning: 'Cat', jlpt: 'N5', chapter: '1' },
  { id: '2', word: '食べる', reading: 'たべる', meaning: 'To eat', jlpt: 'N5', chapter: '2' },
  { id: '3', word: '図書館', reading: 'としょかん', meaning: 'Library', jlpt: 'N4', chapter: '5' },
  { id: '4', word: '素晴らしい', reading: 'すばらしい', meaning: 'Wonderful', jlpt: 'N3', chapter: '10' },
  { id: '5', word: '冒険', reading: 'ぼうけん', meaning: 'Adventure', jlpt: 'N2', chapter: '15' },
];

const SAMPLE_KANJI: KanjiItem[] = [
  { id: '1', character: '日', onyomi: 'ニチ, ジツ', kunyomi: 'ひ, -び', meaning: 'Day, Sun', jlpt: 'N5', strokes: '4', chapter: '1' },
  { id: '2', character: '本', onyomi: 'ホン', kunyomi: 'もと', meaning: 'Book, Origin', jlpt: 'N5', strokes: '5', chapter: '1' },
  { id: '3', character: '学', onyomi: 'ガク', kunyomi: 'まな.ぶ', meaning: 'Study, Learning', jlpt: 'N5', strokes: '8', chapter: '2' },
  { id: '4', character: '雨', onyomi: 'ウ', kunyomi: 'あめ, -さめ', meaning: 'Rain', jlpt: 'N5', strokes: '8', chapter: '3' },
  { id: '5', character: '無', onyomi: 'ム, ブ', kunyomi: 'な.い', meaning: 'Nothingness', jlpt: 'N3', strokes: '12', chapter: '10' },
];

const SAMPLE_GRAMMAR: GrammarItem[] = [
  { id: '1', rule: '〜は〜です', explanation: 'Topic marker (wa) and Copula (desu). Indicates X is Y.', examples: ['私は学生です。', 'これはペンです。'], jlpt: 'N5', chapter: '1' },
  { id: '2', rule: '〜か', explanation: 'Question particle. Turns a sentence into a question.', examples: ['これは何ですか？'], jlpt: 'N5', chapter: '1' },
  { id: '3', rule: '〜たい', explanation: 'Expresses desire (I want to...).', examples: ['日本に行きたいです。', '寿司を食べたい。'], jlpt: 'N5', chapter: '4' },
  { id: '4', rule: '〜ている', explanation: 'Present continuous form (doing right now) or resultant state.', examples: ['今、ご飯を食べています。'], jlpt: 'N4', chapter: '8' },
];

const STORAGE_PREFIX = 'nihongo_flow_';

// --- ID Generation Helper ---
const generateNextId = (items: { id: string }[]): string => {
    if (items.length === 0) return "1";
    const maxId = items.reduce((max, item) => {
        const num = parseInt(item.id, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    return (maxId + 1).toString();
};

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [filesStatus, setFilesStatus] = useState<Record<string, boolean>>({});
  const [vocabData, setVocabData] = useState<VocabItem[]>([]);
  const [kanjiData, setKanjiData] = useState<KanjiItem[]>([]);
  const [grammarData, setGrammarData] = useState<GrammarItem[]>([]);
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to process raw CSV data (hydration)
  const hydrateData = <T,>(data: any[], type: DataType): T[] => {
      if (type === DataType.GRAMMAR) {
          return data.map(item => {
              // Parse examples if it's a string (from CSV)
              let examples = item.examples;
              if (typeof examples === 'string') {
                  try {
                      examples = JSON.parse(examples);
                  } catch (e) {
                      // Fallback for old data or errors
                      examples = item.example ? [item.example] : [];
                  }
              }
              return { ...item, examples: Array.isArray(examples) ? examples : [] };
          }) as unknown as T[];
      }
      return data as T[];
  };

  // Helper to read a file
  const readFileData = async <T,>(fileName: string, dataType: DataType, handle?: FileSystemFileHandle): Promise<T[]> => {
    let text = '';
    if (handle) {
      const file = await handle.getFile();
      text = await file.text();
    } else if (isLocalMode) {
      text = localStorage.getItem(`${STORAGE_PREFIX}${fileName}`) || '';
    }
    const rawData = parseCSV<any>(text);
    return hydrateData<T>(rawData, dataType);
  };

  // Helper to write a file
  const writeFileData = async (fileName: string, content: string) => {
    if (dirHandle) {
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } else if (isLocalMode) {
      localStorage.setItem(`${STORAGE_PREFIX}${fileName}`, content);
    }
  };

  // --- Core Loading Logic (FS & Local) ---
  const loadFsData = async (directory: FileSystemDirectoryHandle) => {
    setIsLoading(true);
    const status: Record<string, boolean> = {};
    const loadOrInit = async <T,>(dataType: DataType, setFn: (data: T[]) => void) => {
      const fileName = FILE_NAMES[dataType];
      try {
        const handle = await directory.getFileHandle(fileName);
        const data = await readFileData<T>(fileName, dataType, handle);
        setFn(data);
        status[dataType] = true;
      } catch (e) {
        console.log(`File not found, creating: ${fileName}`);
        const handle = await directory.getFileHandle(fileName, { create: true });
        const writable = await handle.createWritable();
        await writable.write(INITIAL_HEADERS[dataType]);
        await writable.close();
        status[dataType] = true;
        setFn([]);
      }
    };
    try {
      await loadOrInit<VocabItem>(DataType.VOCAB, setVocabData);
      await loadOrInit<KanjiItem>(DataType.KANJI, setKanjiData);
      await loadOrInit<GrammarItem>(DataType.GRAMMAR, setGrammarData);
      await loadOrInit<StatItem>(DataType.STATS, setStatsData);
      setFilesStatus(status);
    } catch (error) {
      console.error("Error loading FS files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalData = async () => {
    setIsLoading(true);
    const status: Record<string, boolean> = {};
    const loadOrInitLocal = (dataType: DataType, setFn: (data: any[]) => void, defaultData: any[] = []) => {
      const fileName = FILE_NAMES[dataType];
      const key = `${STORAGE_PREFIX}${fileName}`;
      const existing = localStorage.getItem(key);
      const isMeaningfulData = existing && (defaultData.length === 0 || existing.trim() !== INITIAL_HEADERS[dataType].trim());
      if (isMeaningfulData && existing) {
        const parsed = parseCSV<any>(existing);
        setFn(hydrateData(parsed, dataType));
        status[dataType] = true;
      } else {
        const initialContent = defaultData.length > 0 ? toCSV(defaultData) : INITIAL_HEADERS[dataType];
        localStorage.setItem(key, initialContent);
        setFn(defaultData);
        status[dataType] = true;
      }
    };
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      loadOrInitLocal(DataType.VOCAB, setVocabData, SAMPLE_VOCAB);
      loadOrInitLocal(DataType.KANJI, setKanjiData, SAMPLE_KANJI);
      loadOrInitLocal(DataType.GRAMMAR, setGrammarData, SAMPLE_GRAMMAR);
      loadOrInitLocal(DataType.STATS, setStatsData);
      setFilesStatus(status);
    } catch (error) {
      console.error("Error loading LocalStorage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Auth/Mode Switching ---
  const selectDirectory = async () => {
    if (typeof window.showDirectoryPicker === 'undefined') throw new Error('NOT_SUPPORTED');
    try {
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      setIsLocalMode(false);
      await loadFsData(handle);
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.name !== 'SecurityError') console.error(err);
      throw err;
    }
  };

  const useBrowserStorage = async () => {
    setDirHandle(null);
    setIsLocalMode(true);
    await loadLocalData();
  };

  // --- CRUD VOCAB ---
  const addVocab = async (item: Omit<VocabItem, 'id'>) => {
    if (vocabData.some(v => v.word === item.word)) throw new Error(STRINGS.errors.duplicateWord);
    const newItem: VocabItem = { ...item, id: generateNextId(vocabData) };
    const newData = [...vocabData, newItem];
    setVocabData(newData);
    await writeFileData(FILE_NAMES[DataType.VOCAB], toCSV(newData));
  };

  const updateVocab = async (item: VocabItem) => {
    const newData = vocabData.map(v => v.id === item.id ? item : v);
    setVocabData(newData);
    await writeFileData(FILE_NAMES[DataType.VOCAB], toCSV(newData));
  };

  const deleteVocab = async (ids: string[]) => {
    const newData = vocabData.filter(v => !ids.includes(v.id));
    setVocabData(newData);
    await writeFileData(FILE_NAMES[DataType.VOCAB], toCSV(newData));
  };

  // --- CRUD KANJI ---
  const addKanji = async (item: Omit<KanjiItem, 'id'>) => {
    if (kanjiData.some(k => k.character === item.character)) throw new Error(STRINGS.errors.duplicateKanji);
    const newItem: KanjiItem = { ...item, id: generateNextId(kanjiData) };
    const newData = [...kanjiData, newItem];
    setKanjiData(newData);
    await writeFileData(FILE_NAMES[DataType.KANJI], toCSV(newData));
  };

  const updateKanji = async (item: KanjiItem) => {
    const newData = kanjiData.map(k => k.id === item.id ? item : k);
    setKanjiData(newData);
    await writeFileData(FILE_NAMES[DataType.KANJI], toCSV(newData));
  };

  const deleteKanji = async (ids: string[]) => {
    const newData = kanjiData.filter(k => !ids.includes(k.id));
    setKanjiData(newData);
    await writeFileData(FILE_NAMES[DataType.KANJI], toCSV(newData));
  };

  // --- CRUD GRAMMAR ---
  const addGrammar = async (item: Omit<GrammarItem, 'id'>) => {
    if (grammarData.some(g => g.rule === item.rule)) throw new Error(STRINGS.errors.duplicateGrammar);
    const newItem: GrammarItem = { ...item, id: generateNextId(grammarData) };
    const newData = [...grammarData, newItem];
    setGrammarData(newData);
    await writeFileData(FILE_NAMES[DataType.GRAMMAR], toCSV(newData));
  };

  const updateGrammar = async (item: GrammarItem) => {
    const newData = grammarData.map(g => g.id === item.id ? item : g);
    setGrammarData(newData);
    await writeFileData(FILE_NAMES[DataType.GRAMMAR], toCSV(newData));
  };

  const deleteGrammar = async (ids: string[]) => {
    const newData = grammarData.filter(g => !ids.includes(g.id));
    setGrammarData(newData);
    await writeFileData(FILE_NAMES[DataType.GRAMMAR], toCSV(newData));
  };

  // --- Stats / Reviews ---
  const logReview = async (category: DataType, itemId: string, result: ReviewResult) => {
    const newStat: StatItem = {
      date: new Date().toISOString(),
      category,
      itemId,
      result
    };
    const newData = [...statsData, newStat];
    setStatsData(newData);
    await writeFileData(FILE_NAMES[DataType.STATS], toCSV(newData));
  };

  // Calculates the SRS interval
  const calculateInterval = (category: DataType, itemId: string): number => {
    const itemStats = statsData
      .filter(s => s.category === category && s.itemId === itemId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (itemStats.length === 0) return 0;

    let interval = 0;
    // Process chronologically so a later 'FORGOT' can reset a previous 'MASTERED'
    for (const stat of itemStats) {
      if (stat.result === ReviewResult.MASTERED) interval = 999;
      else if (stat.result === ReviewResult.EASY) interval = interval === 0 ? 1 : interval * 2.5;
      else if (stat.result === ReviewResult.HARD) interval = interval === 0 ? 0.5 : interval * 1.2;
      else if (stat.result === ReviewResult.FORGOT) interval = 0;
    }
    return interval;
  };

  const getLearningStage = (category: DataType, itemId: string): LearningStage => {
    const interval = calculateInterval(category, itemId);
    if (interval === 0) return LearningStage.NEW;
    if (interval > 21) return LearningStage.MASTERED;
    if (interval > 2) return LearningStage.REVIEW;
    return LearningStage.LEARNING;
  };

  const getMasteryPercentage = (category: DataType, itemId: string): number => {
      const interval = calculateInterval(category, itemId);
      // Threshold is 21 days for mastery
      const threshold = 21;
      if (interval >= threshold) return 100;
      // Linear progress to threshold
      return Math.min(100, Math.round((interval / threshold) * 100));
  };

  const resetDirectory = () => {
    setDirHandle(null);
    setIsLocalMode(false);
    setFilesStatus({});
    setVocabData([]);
    setKanjiData([]);
    setGrammarData([]);
    setStatsData([]);
  };

  return (
    <FileContext.Provider value={{
      dirHandle,
      isLocalMode,
      filesStatus,
      vocabData,
      kanjiData,
      grammarData,
      statsData,
      isLoading,
      selectDirectory,
      useBrowserStorage,
      addVocab,
      updateVocab,
      deleteVocab,
      addKanji,
      updateKanji,
      deleteKanji,
      addGrammar,
      updateGrammar,
      deleteGrammar,
      logReview,
      getLearningStage,
      getMasteryPercentage,
      resetDirectory
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileProvider');
  }
  return context;
};
