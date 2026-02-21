
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  FileContextType, 
  DataType, 
  StorageProvider,
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
  { id: '1', word: '猫', reading: 'ねこ', meaning: 'Cat', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1', source: 'Genki I' },
  { id: '2', word: '食べる', reading: 'たべる', meaning: 'To eat', partOfSpeech: 'Ichidan Verb', jlpt: 'N5', chapter: '2', source: 'Genki I', te: '食べて', nai: '食べない', masu: '食べます', ta: '食べた', potential: '食べられる', volitional: '食べよう', passive: '食べられる', causative: '食べさせる' },
  { id: '3', word: '速い', reading: 'はやい', meaning: 'Fast', partOfSpeech: 'I-Adjective', jlpt: 'N5', chapter: '3', source: 'Genki I', te: '速くて', nai: '速くない', ta: '速かった', pastNegative: '速くなかった', adverbial: '速く', conditional: '速ければ', nounForm: '速さ' }
];

const SAMPLE_KANJI: KanjiItem[] = [
  { id: '1', character: '日', onyomi: 'ニチ, ジツ', kunyomi: 'ひ, -び', meaning: 'Day, Sun', jlpt: 'N5', strokes: '4', chapter: '1', source: 'Basic Kanji Vol. 1' }
];

const SAMPLE_GRAMMAR: GrammarItem[] = [
  { id: '1', rule: '〜は〜です', explanation: 'Topic marker (wa) and Copula (desu). Indicates X is Y.', examples: ['私は学生です。', 'これはペンです。'], jlpt: 'N5', chapter: '1', source: 'Genki I' }
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
  const [storageProvider, setStorageProvider] = useState<StorageProvider>(StorageProvider.NONE);
  const [filesStatus, setFilesStatus] = useState<Record<string, boolean>>({});
  const [vocabData, setVocabData] = useState<VocabItem[]>([]);
  const [kanjiData, setKanjiData] = useState<KanjiItem[]>([]);
  const [grammarData, setGrammarData] = useState<GrammarItem[]>([]);
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const isInitializing = useRef(false);
  
  // Detection for File System support and iframe restrictions
  const isFileSystemSupported = useMemo(() => {
    // Basic API check
    const supported = typeof window.showDirectoryPicker !== 'undefined';
    // Check if in a restricted environment (cross-origin iframe)
    try {
        // Simple test to see if we're in an iframe that might be restricted
        const inIframe = window.self !== window.top;
        return supported && !inIframe;
    } catch (e) {
        // If window.top access is blocked, we are definitely in a cross-origin iframe
        return false;
    }
  }, []);

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
    } else if (storageProvider === StorageProvider.BROWSER) {
      text = localStorage.getItem(`${STORAGE_PREFIX}${fileName}`) || '';
    }
    
    if (!text) return [];
    const parsed = parseCSV<any>(text);
    return hydrateData<T>(parsed, dataType);
  }, [storageProvider, hydrateData]);

  const writeFileData = useCallback(async (dataType: DataType, data: any[]) => {
    if (isInitializing.current || isLoading) return;
    const csvContent = toCSV(data);
    const fileName = FILE_NAMES[dataType];
    
    if (storageProvider === StorageProvider.LOCAL_FS && dirHandle) {
      try {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(csvContent);
        await writable.close();
      } catch (e) {
        console.error(`Failed to write ${fileName} to file system`, e);
      }
    } else if (storageProvider === StorageProvider.BROWSER) {
      localStorage.setItem(`${STORAGE_PREFIX}${fileName}`, csvContent);
    }
  }, [dirHandle, storageProvider, isLoading]);

  // Persistence effects
  useEffect(() => { if (vocabData.length > 0) writeFileData(DataType.VOCAB, vocabData); }, [vocabData, writeFileData]);
  useEffect(() => { if (kanjiData.length > 0) writeFileData(DataType.KANJI, kanjiData); }, [kanjiData, writeFileData]);
  useEffect(() => { if (grammarData.length > 0) writeFileData(DataType.GRAMMAR, grammarData); }, [grammarData, writeFileData]);
  useEffect(() => { if (statsData.length > 0) writeFileData(DataType.STATS, statsData); }, [statsData, writeFileData]);

  const loadAllFiles = useCallback(async (currentDirHandle: FileSystemDirectoryHandle | null) => {
    setIsLoading(true);
    isInitializing.current = true;
    const status: Record<string, boolean> = {};
    
    try {
      const load = async <T,>(type: DataType, sampleData: T[]): Promise<T[]> => {
        try {
          const handle = currentDirHandle ? await currentDirHandle.getFileHandle(FILE_NAMES[type]) : undefined;
          const data = await readFileData<T>(FILE_NAMES[type], type, handle);
          status[type] = true;
          return data.length > 0 ? data : sampleData;
        } catch (e) {
          status[type] = false;
          return sampleData;
        }
      };

      const sData = await load<StatItem>(DataType.STATS, []);
      const vData = await load<VocabItem>(DataType.VOCAB, SAMPLE_VOCAB);
      const kData = await load<KanjiItem>(DataType.KANJI, SAMPLE_KANJI);
      const gData = await load<GrammarItem>(DataType.GRAMMAR, SAMPLE_GRAMMAR);

      setStatsData(sData);
      setVocabData(vData);
      setKanjiData(kData);
      setGrammarData(gData);
      setFilesStatus(status);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setIsLoading(false);
      isInitializing.current = false;
    }
  }, [readFileData]);

  const selectDirectory = async () => {
    try {
      if (typeof window.showDirectoryPicker === 'undefined') {
          throw new Error("NOT_SUPPORTED");
      }
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      setStorageProvider(StorageProvider.LOCAL_FS);
      await loadAllFiles(handle);
    } catch (e: any) {
      console.error("Directory selection failed", e);
      if (e.name === 'SecurityError') {
          throw new Error("IFRAME_RESTRICTION");
      }
      if (e.name === 'AbortError') {
          return; // User cancelled
      }
      throw e;
    }
  };

  const useBrowserStorage = async () => {
    setStorageProvider(StorageProvider.BROWSER);
    setDirHandle(null);
    await loadAllFiles(null);
  };

  const addVocab = async (item: Omit<VocabItem, 'id'>) => {
    setVocabData(prev => [...prev, { ...item, id: generateNextId(prev) }]);
  };

  const updateVocab = async (item: VocabItem) => {
    setVocabData(prev => prev.map(v => v.id === item.id ? item : v));
  };

  const deleteVocab = async (ids: string[]) => {
    setVocabData(prev => prev.filter(v => !ids.includes(v.id)));
  };

  const addKanji = async (item: Omit<KanjiItem, 'id'>) => {
    setKanjiData(prev => [...prev, { ...item, id: generateNextId(prev) }]);
  };

  const updateKanji = async (item: KanjiItem) => {
    setKanjiData(prev => prev.map(k => k.id === item.id ? item : k));
  };

  const deleteKanji = async (ids: string[]) => {
    setKanjiData(prev => prev.filter(k => !ids.includes(k.id)));
  };

  const addGrammar = async (item: Omit<GrammarItem, 'id'>) => {
    setGrammarData(prev => [...prev, { ...item, id: generateNextId(prev) }]);
  };

  const updateGrammar = async (item: GrammarItem) => {
    setGrammarData(prev => prev.map(g => g.id === item.id ? item : g));
  };

  const deleteGrammar = async (ids: string[]) => {
    setGrammarData(prev => prev.filter(g => !ids.includes(g.id)));
  };

  const logReview = async (category: DataType, itemId: string, result: ReviewResult) => {
    setStatsData(prev => [...prev, { date: new Date().toISOString(), category, itemId, result }]);
  };

  const resetItemStats = async (category: DataType, itemId: string) => {
    setStatsData(prev => prev.filter(s => !(s.category === category && s.itemId === itemId)));
  };

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
    const lastResult = itemStats[itemStats.length - 1].result;
    if (lastResult === ReviewResult.MASTERED) return 100;
    const easyCount = itemStats.filter(s => s.result === ReviewResult.EASY).length;
    return Math.min(100, easyCount * 25);
  }, [statsData]);

  const resetDirectory = () => {
    setDirHandle(null);
    setStorageProvider(StorageProvider.NONE);
    setVocabData([]);
    setKanjiData([]);
    setGrammarData([]);
    setStatsData([]);
    setFilesStatus({});
  };

  const value = {
    dirHandle, storageProvider, isFileSystemSupported, filesStatus, vocabData, kanjiData, grammarData, statsData, isLoading,
    selectDirectory, useBrowserStorage, addVocab, updateVocab, deleteVocab, addKanji, updateKanji, deleteKanji,
    addGrammar, updateGrammar, deleteGrammar, logReview, resetItemStats, getLearningStage, getMasteryPercentage, resetDirectory
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

export const useFileSystem = () => {
  const context = useContext(FileContext);
  if (context === undefined) throw new Error('useFileSystem must be used within a FileProvider');
  return context;
};
