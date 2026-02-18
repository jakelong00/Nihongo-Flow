export enum DataType {
  VOCAB = 'vocab',
  KANJI = 'kanji',
  GRAMMAR = 'grammar',
  STATS = 'stats'
}

export enum StorageProvider {
  LOCAL_FS = 'local-fs',
  BROWSER = 'browser',
  NONE = 'none'
}

export interface VocabItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
  jlpt: string;
  chapter: string;
  source?: string;
  te?: string;
  nai?: string;
  masu?: string;
  ta?: string;
  potential?: string;
  volitional?: string;
  passive?: string;
  causative?: string;
}

export interface KanjiItem {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  jlpt: string;
  strokes: string;
  chapter: string;
  source?: string;
}

export interface GrammarItem {
  id: string;
  rule: string;
  explanation: string;
  examples: string[];
  jlpt: string;
  chapter: string;
  source?: string;
}

export enum ReviewResult {
  EASY = 'easy',
  HARD = 'hard',
  FORGOT = 'forgot',
  MASTERED = 'mastered'
}

export interface StatItem {
  date: string;
  category: DataType;
  itemId: string;
  result: ReviewResult;
}

export enum LearningStage {
  NEW = 'new',
  LEARNING = 'learning',
  REVIEW = 'review',
  MASTERED = 'mastered'
}

export interface FileContextType {
  dirHandle: FileSystemDirectoryHandle | null;
  storageProvider: StorageProvider;
  isFileSystemSupported: boolean;
  filesStatus: Record<string, boolean>;
  vocabData: VocabItem[];
  kanjiData: KanjiItem[];
  grammarData: GrammarItem[];
  statsData: StatItem[];
  isLoading: boolean;
  selectDirectory: () => Promise<void>;
  useBrowserStorage: () => Promise<void>;
  
  addVocab: (item: Omit<VocabItem, 'id'>) => Promise<void>;
  updateVocab: (item: VocabItem) => Promise<void>;
  deleteVocab: (ids: string[]) => Promise<void>;

  addKanji: (item: Omit<KanjiItem, 'id'>) => Promise<void>;
  updateKanji: (item: KanjiItem) => Promise<void>;
  deleteKanji: (ids: string[]) => Promise<void>;

  addGrammar: (item: Omit<GrammarItem, 'id'>) => Promise<void>;
  updateGrammar: (item: GrammarItem) => Promise<void>;
  deleteGrammar: (ids: string[]) => Promise<void>;

  logReview: (category: DataType, itemId: string, result: ReviewResult) => Promise<void>;
  resetItemStats: (category: DataType, itemId: string) => Promise<void>;
  getLearningStage: (category: DataType, itemId: string) => LearningStage;
  getMasteryPercentage: (category: DataType, itemId: string) => number;
  
  resetDirectory: () => void;
}