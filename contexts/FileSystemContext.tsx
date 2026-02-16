
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
  { id: '2', word: '食べる', reading: 'たべる', meaning: 'To eat', partOfSpeech: 'Ichidan Verb', jlpt: 'N5', chapter: '2', te: '食べて', nai: '食べない', masu: '食べます', ta: '食べた', potential: '食べられる', volitional: '食べよう', passive: '食べられる', causative: '食べさせる' },
  { id: '3', word: '速い', reading: 'はやい', meaning: 'Fast', partOfSpeech: 'I-Adjective', jlpt: 'N5', chapter: '3' },
  { id: '4', word: '綺麗', reading: 'きれい', meaning: 'Beautiful / Clean', partOfSpeech: 'Na-Adjective', jlpt: 'N5', chapter: '4' },
  { id: '5', word: '昨日', reading: 'きのう', meaning: 'Yesterday', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1' },
  { id: '6', word: '読む', reading: 'よむ', meaning: 'To read', partOfSpeech: 'Godan Verb', jlpt: 'N5', chapter: '5', te: '読んで', nai: '読まない', masu: '読みます', ta: '読んだ', potential: '読める', volitional: '読もう', passive: '読まれる', causative: '読ませる' },
  { id: '7', word: '全然', reading: 'ぜんぜん', meaning: 'Not at all', partOfSpeech: 'Adverb', jlpt: 'N4', chapter: '10' },
  { id: '8', word: '学校', reading: 'がっこう', meaning: 'School', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1' },
  { id: '9', word: '泳ぐ', reading: 'およぐ', meaning: 'To swim', partOfSpeech: 'Godan Verb', jlpt: 'N5', chapter: '6', te: '泳いで', nai: '泳がない', masu: '泳ぎます', ta: '泳いだ', potential: '泳げる', volitional: '泳ごう', passive: '泳がれる', causative: '泳がせる' },
  { id: '10', word: '忙しい', reading: 'いそがしい', meaning: 'Busy', partOfSpeech: 'I-Adjective', jlpt: 'N5', chapter: '7' },
  { id: '11', word: '散歩する', reading: 'さんぽする', meaning: 'To take a walk', partOfSpeech: 'Suru Verb', jlpt: 'N5', chapter: '8' },
  { id: '12', word: '時々', reading: 'ときどき', meaning: 'Sometimes', partOfSpeech: 'Adverb', jlpt: 'N5', chapter: '9' },
  { id: '13', word: '先生', reading: 'せんせい', meaning: 'Teacher', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1' }
];

const SAMPLE_KANJI: KanjiItem[] = [
  { id: '1', character: '日', onyomi: 'ニチ, ジツ', kunyomi: 'ひ, -び', meaning: 'Day, Sun', jlpt: 'N5', strokes: '4', chapter: '1' },
  { id: '2', character: '本', onyomi: 'ホン', kunyomi: 'もと', meaning: 'Book, Origin', jlpt: 'N5', strokes: '5', chapter: '1' },
  { id: '3', character: '月', onyomi: 'ゲツ, ガツ', kunyomi: 'つき', meaning: 'Moon, Month', jlpt: 'N5', strokes: '4', chapter: '2' },
  { id: '4', character: '火', onyomi: 'カ', kunyomi: 'ひ', meaning: 'Fire', jlpt: 'N5', strokes: '4', chapter: '2' },
  { id: '5', character: '水', onyomi: 'スイ', kunyomi: 'みず', meaning: 'Water', jlpt: 'N5', strokes: '4', chapter: '2' },
  { id: '6', character: '木', onyomi: 'モク, ボク', kunyomi: 'き', meaning: 'Tree, Wood', jlpt: 'N5', strokes: '4', chapter: '3' },
  { id: '7', character: '金', onyomi: 'キン, コン', kunyomi: 'かね', meaning: 'Gold, Money', jlpt: 'N5', strokes: '8', chapter: '3' },
  { id: '8', character: '土', onyomi: 'ド, ト', kunyomi: 'つち', meaning: 'Earth, Soil', jlpt: 'N5', strokes: '3', chapter: '3' },
  { id: '9', character: '山', onyomi: 'サン', kunyomi: 'やま', meaning: 'Mountain', jlpt: 'N5', strokes: '3', chapter: '4' },
  { id: '10', character: '川', onyomi: 'セン', kunyomi: 'かわ', meaning: 'River', jlpt: 'N5', strokes: '3', chapter: '4' },
  { id: '11', character: '田', onyomi: 'デン', kunyomi: 'た', meaning: 'Rice field', jlpt: 'N5', strokes: '5', chapter: '4' },
  { id: '12', character: '人', onyomi: 'ジン, ニン', kunyomi: 'ひと', meaning: 'Person', jlpt: 'N5', strokes: '2', chapter: '5' },
  { id: '13', character: '女', onyomi: 'ジョ', kunyomi: 'おんな', meaning: 'Woman', jlpt: 'N5', strokes: '3', chapter: '5' }
];

const SAMPLE_GRAMMAR: GrammarItem[] = [
  { id: '1', rule: '〜は〜です', explanation: 'Topic marker (wa) and Copula (desu). Indicates X is Y.', examples: ['私は学生です。', 'これはペンです。'], jlpt: 'N5', chapter: '1' },
  { id: '2', rule: '〜てください', explanation: 'Used to make a polite request.', examples: ['座ってください。', '食べてください。'], jlpt: 'N5', chapter: '3' },
  { id: '3', rule: '〜ている', explanation: 'Present continuous or state of being.', examples: ['本を読んでいる。', '結婚している。'], jlpt: 'N5', chapter: '4' },
  { id: '4', rule: '〜ことがある', explanation: 'Indicates past experience.', examples: ['日本に行ったことがある。', 'お寿司を食べたことがある。'], jlpt: 'N5', chapter: '5' },
  { id: '5', rule: '〜ないでください', explanation: 'Please do not do [action].', examples: ['忘れないでください。', 'ここで泳がないでください。'], jlpt: 'N5', chapter: '6' },
  { id: '6', rule: '〜すぎる', explanation: 'Too much / Excessive.', examples: ['食べすぎた。', 'このカバンは高すぎる。'], jlpt: 'N4', chapter: '7' },
  { id: '7', rule: '〜たい', explanation: 'Want to do something.', examples: ['日本に行きたい。', 'コーヒーを飲みたい。'], jlpt: 'N5', chapter: '2' },
  { id: '8', rule: '〜つもり', explanation: 'Intention to do something.', examples: ['明日、買い物に行くつもりだ。', '勉強するつもりだ。'], jlpt: 'N4', chapter: '8' },
  { id: '9', rule: '〜ほうがいい', explanation: 'Giving advice (had better).', examples: ['早く寝たほうがいい。', '野菜を食べたほうがいい。'], jlpt: 'N4', chapter: '9' },
  { id: '10', rule: '〜たり〜たりする', explanation: 'Listing actions in no particular order.', examples: ['テレビを見たり、本を読んだりします。', '歌ったり踊ったりした。'], jlpt: 'N5', chapter: '10' },
  { id: '11', rule: '〜ながら', explanation: 'Doing two actions simultaneously.', examples: ['音楽を聴きながら勉強する。', '歩きながら話す。'], jlpt: 'N4', chapter: '10' },
  { id: '12', rule: '〜時', explanation: 'When [time/occasion].', examples: ['子供の時、よく遊んだ。', '暇な時、映画を見る。'], jlpt: 'N5', chapter: '4' },
  { id: '13', rule: '〜まえに', explanation: 'Before doing [action].', examples: ['寝るまえに、本を読む。', '食べるまえに、手を洗う。'], jlpt: 'N5', chapter: '2' }
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
