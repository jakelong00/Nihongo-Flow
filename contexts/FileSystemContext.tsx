
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
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

const SAMPLE_VOCAB: VocabItem[] = [
  { id: '1', word: '猫', reading: 'ねこ', meaning: 'Cat', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1' },
  { id: '2', word: '食べる', reading: 'たべる', meaning: 'To eat', partOfSpeech: 'Ichidan Verb', jlpt: 'N5', chapter: '2', te: '食べなくて', nai: '食べない', masu: '食べます', ta: '食べた', potential: '食べられる', volitional: '食べよう', passive: '食べられる', causative: '食べさせる' },
  { id: '3', word: '速い', reading: 'はやい', meaning: 'Fast', partOfSpeech: 'I-Adjective', jlpt: 'N5', chapter: '3' },
  { id: '4', word: '綺麗', reading: 'きれい', meaning: 'Beautiful / Clean', partOfSpeech: 'Na-Adjective', jlpt: 'N5', chapter: '4' },
  { id: '5', word: '昨日', reading: 'きのう', meaning: 'Yesterday', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1' },
  { id: '6', word: '読む', reading: 'よむ', meaning: 'To read', partOfSpeech: 'Godan Verb', jlpt: 'N5', chapter: '5', te: '読んで', nai: '読まない', masu: '読みます', ta: '読んだ', potential: '読める', volitional: '読もう', passive: '読まれる', causative: '読ませる' },
  { id: '7', word: '全然', reading: 'ぜんぜん', meaning: 'Not at all', partOfSpeech: 'Adverb', jlpt: 'N4', chapter: '10' }
];

const SAMPLE_KANJI: KanjiItem[] = [
  { id: '1', character: '日', onyomi: 'ニチ, ジツ', kunyomi: 'ひ, -び', meaning: 'Day, Sun', jlpt: 'N5', strokes: '4', chapter: '1' },
  { id: '2', character: '本', onyomi: 'ホン', kunyomi: 'もと', meaning: 'Book, Origin', jlpt: 'N5', strokes: '5', chapter: '1' },
  { id: '3', character: '月', onyomi: 'ゲツ, ガツ', kunyomi: 'つき', meaning: 'Moon, Month', jlpt: 'N5', strokes: '4', chapter: '2' },
  { id: '4', character: '火', onyomi: 'カ', kunyomi: 'ひ', meaning: 'Fire', jlpt: 'N5', strokes: '4', chapter: '2' },
  { id: '5', character: '水', onyomi: 'スイ', kunyomi: 'みず', meaning: 'Water', jlpt: 'N5', strokes: '4', chapter: '2' }
];

const SAMPLE_GRAMMAR: GrammarItem[] = [
  { id: '1', rule: '〜は〜です', explanation: 'Topic marker (wa) and Copula (desu). Indicates X is Y.', examples: ['私は学生です。', 'これはペンです。'], jlpt: 'N5', chapter: '1' },
  { id: '2', rule: '〜てください', explanation: 'Used to make a polite request.', examples: ['座ってください。', '食べてください。'], jlpt: 'N5', chapter: '3' }
];

const STORAGE_PREFIX = 'nihongo_flow_';

const generateNextId = (items: { id: string }[]): string => {
    if (items.length === 0) return "1";
    const maxIds = items.map(item => parseInt(item.id, 10)).filter(n => !isNaN(n));
    if (maxIds.length === 0) return (items.length + 1).toString();
    return (Math.max(...maxIds) + 1).toString();
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

  const isFileSystemSupported = useMemo(() => typeof window.showDirectoryPicker !== 'undefined', []);

  const hydrateData = useCallback(<T,>(data: any[], type: DataType): T[] => {
      if (type === DataType.GRAMMAR) {
          return data.map(item => {
              let examples = item.examples;
              if (typeof examples === 'string') {
                  try {
                      examples = JSON.parse(examples);
                  } catch (e) {
                      examples = item.example ? [item.example] : [];
                  }
              }
              return { ...item, examples: Array.isArray(examples) ? examples : [] };
          }) as unknown as T[];
      }
      return data as T[];
  }, []);

  const readFileData = useCallback(async <T,>(fileName: string, dataType: DataType, handle?: FileSystemFileHandle): Promise<T[]> => {
    let text = '';
    if (handle) {
      const file = await handle.getFile();
      text = await file.text();
    } else if (isLocalMode) {
      text = localStorage.getItem(`${STORAGE_PREFIX}${fileName}`) || '';
    }
    
    if (!text) return [];
    const parsed = parseCSV<any>(text);
    return hydrateData<T>(parsed, dataType);
  }, [isLocalMode, hydrateData]);

  const writeFileData = useCallback(async (dataType: DataType, data: any[]) => {
    const csvContent = toCSV(data);
    const fileName = FILE_NAMES[dataType];
    
    if (dirHandle) {
      try {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(csvContent);
        await writable.close();
      } catch (e) {
        console.error("Failed to write to file system", e);
      }
    } else if (isLocalMode) {
      localStorage.setItem(`${STORAGE_PREFIX}${fileName}`, csvContent);
    }
  }, [dirHandle, isLocalMode]);

  const loadAllFiles = useCallback(async (currentDirHandle: FileSystemDirectoryHandle | null) => {
    setIsLoading(true);
    const status: Record<string, boolean> = {};
    
    try {
      const load = async <T,>(type: DataType, sampleData: T[]): Promise<T[]> => {
        try {
          const handle = currentDirHandle ? await currentDirHandle.getFileHandle(FILE_NAMES[type]) : undefined;
          const data = await readFileData<T>(FILE_NAMES[type], type, handle);
          status[type] = true;
          return data;
        } catch (e) {
          status[type] = false;
          await writeFileData(type, sampleData);
          return sampleData;
        }
      };

      setStatsData(await load<StatItem>(DataType.STATS, []));
      setVocabData(await load<VocabItem>(DataType.VOCAB, SAMPLE_VOCAB));
      setKanjiData(await load<KanjiItem>(DataType.KANJI, SAMPLE_KANJI));
      setGrammarData(await load<GrammarItem>(DataType.GRAMMAR, SAMPLE_GRAMMAR));
      setFilesStatus(status);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setIsLoading(false);
    }
  }, [readFileData, writeFileData]);

  const selectDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      setIsLocalMode(false);
      await loadAllFiles(handle);
    } catch (e) {
      console.error("Directory selection failed", e);
      throw e;
    }
  };

  const useBrowserStorage = async () => {
    setIsLocalMode(true);
    setDirHandle(null);
    await loadAllFiles(null);
  };

  const addVocab = async (item: Omit<VocabItem, 'id'>) => {
    const newItem = { ...item, id: generateNextId(vocabData) };
    const newData = [...vocabData, newItem];
    setVocabData(newData);
    await writeFileData(DataType.VOCAB, newData);
  };

  const updateVocab = async (item: VocabItem) => {
    const newData = vocabData.map(v => v.id === item.id ? item : v);
    setVocabData(newData);
    await writeFileData(DataType.VOCAB, newData);
  };

  const deleteVocab = async (ids: string[]) => {
    const newData = vocabData.filter(v => !ids.includes(v.id));
    setVocabData(newData);
    await writeFileData(DataType.VOCAB, newData);
  };

  const addKanji = async (item: Omit<KanjiItem, 'id'>) => {
    const newItem = { ...item, id: generateNextId(kanjiData) };
    const newData = [...kanjiData, newItem];
    setKanjiData(newData);
    await writeFileData(DataType.KANJI, newData);
  };

  const updateKanji = async (item: KanjiItem) => {
    const newData = kanjiData.map(k => k.id === item.id ? item : k);
    setKanjiData(newData);
    await writeFileData(DataType.KANJI, newData);
  };

  const deleteKanji = async (ids: string[]) => {
    const newData = kanjiData.filter(k => !ids.includes(k.id));
    setKanjiData(newData);
    await writeFileData(DataType.KANJI, newData);
  };

  const addGrammar = async (item: Omit<GrammarItem, 'id'>) => {
    const newItem = { ...item, id: generateNextId(grammarData) };
    const newData = [...grammarData, newItem];
    setGrammarData(newData);
    await writeFileData(DataType.GRAMMAR, newData);
  };

  const updateGrammar = async (item: GrammarItem) => {
    const newData = grammarData.map(g => g.id === item.id ? item : g);
    setGrammarData(newData);
    await writeFileData(DataType.GRAMMAR, newData);
  };

  const deleteGrammar = async (ids: string[]) => {
    const newData = grammarData.filter(g => !ids.includes(g.id));
    setGrammarData(newData);
    await writeFileData(DataType.GRAMMAR, newData);
  };

  const logReview = async (category: DataType, itemId: string, result: ReviewResult) => {
    const newStat: StatItem = {
        date: new Date().toISOString(),
        category,
        itemId,
        result
    };
    const newData = [...statsData, newStat];
    setStatsData(newData);
    await writeFileData(DataType.STATS, newData);
  };

  const resetItemStats = async (category: DataType, itemId: string) => {
    const newData = statsData.filter(s => !(s.category === category && s.itemId === itemId));
    setStatsData(newData);
    await writeFileData(DataType.STATS, newData);
  };

  // Memoize helpers to ensure consumers react to statsData changes
  const getLearningStage = useCallback((category: DataType, itemId: string): LearningStage => {
    const itemStats = statsData.filter(s => s.category === category && s.itemId === itemId);
    if (itemStats.length === 0) return LearningStage.NEW;
    const lastResult = itemStats[itemStats.length - 1].result;
    if (lastResult === ReviewResult.MASTERED) return LearningStage.MASTERED;
    return LearningStage.LEARNING;
  }, [statsData]);

  const getMasteryPercentage = useCallback((category: DataType, itemId: string): number => {
    const itemStats = statsData.filter(s => s.category === category && s.itemId === itemId);
    if (itemStats.length === 0) return 0;
    
    // Most recent status check
    const lastResult = itemStats[itemStats.length - 1].result;
    if (lastResult === ReviewResult.MASTERED) return 100;
    
    // Calculation for non-mastered
    const easyCount = itemStats.filter(s => s.result === ReviewResult.EASY || s.result === ReviewResult.MASTERED).length;
    return Math.min(100, easyCount * 25);
  }, [statsData]);

  const resetDirectory = () => {
    setDirHandle(null);
    setIsLocalMode(false);
    setVocabData([]);
    setKanjiData([]);
    setGrammarData([]);
    setStatsData([]);
    setFilesStatus({});
  };

  const value = {
    dirHandle,
    isLocalMode,
    isFileSystemSupported,
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
    resetItemStats,
    getLearningStage,
    getMasteryPercentage,
    resetDirectory
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

export const useFileSystem = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileProvider');
  }
  return context;
};
