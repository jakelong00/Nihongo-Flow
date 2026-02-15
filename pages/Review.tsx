import React, { useState, useMemo } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { DataType, ReviewResult, VocabItem, KanjiItem, GrammarItem, StatItem } from '../types';
import { BrainCircuit, BookOpen, Languages, GraduationCap, Check, RefreshCw, X, Clock, Sparkles, SlidersHorizontal, Info, HelpCircle, Layers, Play } from 'lucide-react';
import clsx from 'clsx';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from '../components/ThemedIcon';

type ReviewItemUnion = (VocabItem | KanjiItem | GrammarItem) & { type: DataType; chapter?: string };

// --- SRS Logic ---
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface ItemSRSStatus {
  interval: number; // in days
  dueDate: Date;
  isNew: boolean;
  isDue: boolean;
}

const calculateSRSStatus = (category: DataType, itemId: string, stats: StatItem[]): ItemSRSStatus => {
  const itemStats = stats
    .filter(s => s.category === category && s.itemId === itemId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (itemStats.length === 0) {
    return { interval: 0, dueDate: new Date(), isNew: true, isDue: false };
  }

  let interval = 0; 
  for (const stat of itemStats) {
    switch (stat.result) {
      case ReviewResult.MASTERED: interval = 999; break;
      case ReviewResult.EASY: interval = interval === 0 ? 1 : interval * 2.5; break;
      case ReviewResult.HARD: interval = interval === 0 ? 0.5 : interval * 1.2; break;
      case ReviewResult.FORGOT: interval = 0; break;
    }
  }

  // If interval is 999, it's effectively mastered
  if (interval >= 999) {
      return { interval: 999, dueDate: new Date(Date.now() + 999 * ONE_DAY_MS), isNew: false, isDue: false };
  }

  const lastReview = new Date(itemStats[itemStats.length - 1].date);
  const dueDate = new Date(lastReview.getTime() + interval * ONE_DAY_MS);
  
  return { interval, dueDate, isNew: false, isDue: dueDate.getTime() <= Date.now() };
};

const Review: React.FC = () => {
  const { vocabData, kanjiData, grammarData, statsData, logReview } = useFileSystem();
  const [sessionItems, setSessionItems] = useState<ReviewItemUnion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [, setSessionStats] = useState({ correct: 0, total: 0 });
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [config, setConfig] = useState({ levels: [] as string[], chapters: [] as string[], limit: 20 });

  const itemStatuses = useMemo(() => {
    const statuses = new Map<string, ItemSRSStatus>();
    const processItems = (items: { id: string }[], type: DataType) => {
      items.forEach(item => statuses.set(`${type}_${item.id}`, calculateSRSStatus(type, item.id, statsData)));
    };
    processItems(vocabData, DataType.VOCAB);
    processItems(kanjiData, DataType.KANJI);
    processItems(grammarData, DataType.GRAMMAR);
    return statuses;
  }, [vocabData, kanjiData, grammarData, statsData]);

  const availableLevels = useMemo(() => ['N5', 'N4', 'N3', 'N2', 'N1'], []);
  const availableChapters = useMemo(() => {
      const chapters = new Set<string>();
      [...vocabData, ...kanjiData, ...grammarData].forEach(i => i.chapter && chapters.add(i.chapter));
      return Array.from(chapters).sort((a, b) => parseInt(a) - parseInt(b));
  }, [vocabData, kanjiData, grammarData]);

  const getCategoryCounts = (type: DataType, data: { id: string }[]) => {
    let due = 0;
    let newItems = 0;
    data.forEach(item => {
      const status = itemStatuses.get(`${type}_${item.id}`);
      if (status?.isNew) newItems++;
      else if (status?.isDue) due++;
    });
    return { due, newItems, total: data.length };
  };

  const vocabCounts = getCategoryCounts(DataType.VOCAB, vocabData);
  const kanjiCounts = getCategoryCounts(DataType.KANJI, kanjiData);
  const grammarCounts = getCategoryCounts(DataType.GRAMMAR, grammarData);

  const startSession = (types: DataType[]) => {
    let pool: ReviewItemUnion[] = [];
    if (types.includes(DataType.VOCAB)) pool = [...pool, ...vocabData.map(i => ({ ...i, type: DataType.VOCAB }))];
    if (types.includes(DataType.KANJI)) pool = [...pool, ...kanjiData.map(i => ({ ...i, type: DataType.KANJI }))];
    if (types.includes(DataType.GRAMMAR)) pool = [...pool, ...grammarData.map(i => ({ ...i, type: DataType.GRAMMAR }))];

    if (config.levels.length > 0) pool = pool.filter(i => config.levels.includes(i.jlpt));
    if (config.chapters.length > 0) pool = pool.filter(i => i.chapter && config.chapters.includes(i.chapter));

    const dueItems = pool.filter(i => itemStatuses.get(`${i.type}_${i.id}`)?.isDue);
    const newItems = pool.filter(i => itemStatuses.get(`${i.type}_${i.id}`)?.isNew);
    
    const shuffledDue = [...dueItems].sort(() => 0.5 - Math.random());
    const shuffledNew = [...newItems].sort(() => 0.5 - Math.random());
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());

    let selected: ReviewItemUnion[] = [];
    const limit = config.limit;

    selected = shuffledDue.slice(0, limit);
    if (selected.length < limit) selected = [...selected, ...shuffledNew.slice(0, limit - selected.length)];
    if (selected.length === 0 && pool.length > 0) selected = shuffledPool.slice(0, limit);
    
    if (selected.length === 0) {
        alert(STRINGS.review.noItemsAlert);
        return;
    }

    setSessionItems(selected);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, total: 0 });
    setSessionStarted(true);
    setIsConfiguring(false);
  };

  const handleResult = async (result: ReviewResult) => {
    const currentItem = sessionItems[currentIndex];
    await logReview(currentItem.type, currentItem.id, result);
    
    setSessionStats(prev => ({
        total: prev.total + 1,
        correct: result === ReviewResult.EASY ? prev.correct + 1 : prev.correct
    }));

    if (currentIndex < sessionItems.length - 1) {
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        }, 150);
    } else {
        setSessionStarted(false);
        setSessionItems([]);
    }
  };

  const toggleConfig = (field: 'levels' | 'chapters', value: string) => {
      setConfig(prev => {
          const current = prev[field];
          if (current.includes(value)) return { ...prev, [field]: current.filter(v => v !== value) };
          else return { ...prev, [field]: [...current, value] };
      });
  };

  if (isConfiguring) {
      return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto h-full overflow-auto">
              <div className="flex items-center gap-2 mb-4 cursor-pointer text-[#FFD500] font-bold" onClick={() => setIsConfiguring(false)}>
                  <span>&larr; Back</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-black mb-6 tracking-tight">{STRINGS.review.configTitle}</h2>
              
              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 space-y-6">
                  <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <ThemedIcon iconKey="iconLayers" Fallback={Layers} size={14}/> Cards per Session
                      </h3>
                      <div className="flex flex-wrap gap-2">
                          {[10, 20, 30, 50].map(limit => (
                              <button
                                key={limit}
                                onClick={() => setConfig(prev => ({ ...prev, limit }))}
                                className={clsx(
                                    "px-3 py-1.5 md:px-4 md:py-2 rounded-lg border-2 transition-all font-bold text-sm min-w-[50px]",
                                    config.limit === limit 
                                        ? "bg-[#FFD500] text-black border-[#FFD500] shadow-sm" 
                                        : "bg-white text-gray-500 border-gray-200 hover:border-[#FFD500] hover:text-black"
                                )}
                              >
                                  {limit}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <ThemedIcon iconKey="navGrammar" Fallback={GraduationCap} size={14}/> JLPT Level
                      </h3>
                      <div className="flex flex-wrap gap-2">
                          {availableLevels.map(level => (
                              <button
                                key={level}
                                onClick={() => toggleConfig('levels', level)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-full border-2 transition-all font-semibold text-xs",
                                    config.levels.includes(level) 
                                        ? "bg-[#FFD500] text-black border-[#FFD500] shadow-sm" 
                                        : "bg-white text-gray-500 border-gray-200 hover:border-[#FFD500]"
                                )}
                              >
                                  {level}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <ThemedIcon iconKey="navVocab" Fallback={BookOpen} size={14}/> Chapters
                      </h3>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {availableChapters.map(ch => (
                              <button
                                key={ch}
                                onClick={() => toggleConfig('chapters', ch)}
                                className={clsx(
                                    "px-2 py-1 rounded-lg border text-xs transition-all font-medium",
                                    config.chapters.includes(ch) 
                                        ? "bg-[#FFD500] text-black border-[#FFD500] shadow-sm" 
                                        : "bg-white text-gray-500 border-gray-200 hover:border-[#FFD500]"
                                )}
                              >
                                  Ch. {ch}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
              
              <div className="mt-6 p-5 bg-gray-100 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-black mb-4 text-lg">Ready to start?</h3>
                  <div className="flex gap-3 flex-wrap">
                      <button onClick={() => startSession([DataType.VOCAB])} className="flex-1 min-w-[100px] px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-all hover:-translate-y-1 shadow-sm text-sm">Vocab</button>
                      <button onClick={() => startSession([DataType.KANJI])} className="flex-1 min-w-[100px] px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-all hover:-translate-y-1 shadow-sm text-sm">Kanji</button>
                      <button onClick={() => startSession([DataType.GRAMMAR])} className="flex-1 min-w-[100px] px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-all hover:-translate-y-1 shadow-sm text-sm">Grammar</button>
                      <button onClick={() => startSession([DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR])} className="w-full md:w-auto px-8 py-3 bg-[#FFD500] text-black rounded-lg hover:bg-[#E6C000] font-bold shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2 border-b-4 border-[#D4B200] text-sm">
                          <ThemedIcon iconKey="iconPlay" Fallback={Play} fill="currentColor" size={18}/> Start Mix
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (!sessionStarted) {
    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 mb-8 text-center">
                <div className="bg-white p-3 rounded-full shadow-lg mb-1 border border-gray-200">
                    <ThemedIcon iconKey="iconBrain" Fallback={BrainCircuit} size={32} className="text-[#FFD500]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">{STRINGS.review.title}</h2>
                <p className="text-gray-500 text-sm md:text-base max-w-lg leading-relaxed">{STRINGS.review.description}</p>
                
                <div className="flex gap-2 mt-2 flex-wrap justify-center">
                     <button 
                        onClick={() => setIsConfiguring(true)}
                        className="text-xs md:text-sm text-black flex items-center gap-2 font-bold bg-[#FFD500] hover:bg-[#E6C000] px-4 py-2 rounded-full transition-colors shadow-md"
                    >
                        <ThemedIcon iconKey="iconConfig" Fallback={SlidersHorizontal} size={14} /> {STRINGS.review.configureBtn}
                    </button>
                    <button 
                        onClick={() => setShowInfo(true)} 
                        className="text-xs md:text-sm text-gray-600 hover:text-black flex items-center gap-2 font-bold bg-white hover:bg-gray-50 px-4 py-2 rounded-full transition-colors border border-gray-300"
                    >
                        <ThemedIcon iconKey="iconInfo" Fallback={Info} size={14} /> How it works
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8 max-w-5xl px-0 md:px-4">
                {/* Vocab Card */}
                <button 
                    onClick={() => startSession([DataType.VOCAB])}
                    className="relative group p-5 bg-white border border-gray-200 rounded-xl hover:shadow-xl shadow-sm transition-all text-left overflow-hidden hover:-translate-y-1 duration-300"
                >
                    <div className="absolute top-[-20%] right-[-20%] p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity rotate-12">
                        <ThemedIcon iconKey="navVocab" Fallback={BookOpen} size={120} className="text-black" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#FFD500] text-black rounded-lg group-hover:scale-110 transition-transform"><ThemedIcon iconKey="navVocab" Fallback={BookOpen} size={20}/></div>
                        <div className="font-bold text-xl text-black">Vocabulary</div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="flex items-center gap-2 text-gray-500 font-bold"><ThemedIcon iconKey="iconClock" Fallback={Clock} size={14} /> {STRINGS.review.labels.due}</span>
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-md font-bold">{vocabCounts.due}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="flex items-center gap-2 text-gray-500 font-bold"><ThemedIcon iconKey="iconSparkles" Fallback={Sparkles} size={14} /> {STRINGS.review.labels.new}</span>
                            <span className="bg-[#FFD500] text-black px-2 py-0.5 rounded-md font-bold">{vocabCounts.newItems}</span>
                        </div>
                    </div>
                </button>

                {/* Kanji Card */}
                 <button 
                    onClick={() => startSession([DataType.KANJI])}
                    className="relative group p-5 bg-white border border-gray-200 rounded-xl hover:shadow-xl shadow-sm transition-all text-left overflow-hidden hover:-translate-y-1 duration-300"
                >
                     <div className="absolute top-[-20%] right-[-20%] p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity rotate-12">
                        <ThemedIcon iconKey="navKanji" Fallback={Languages} size={120} className="text-black" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-black text-white rounded-lg group-hover:scale-110 transition-transform"><ThemedIcon iconKey="navKanji" Fallback={Languages} size={20}/></div>
                        <div className="font-bold text-xl text-black">Kanji</div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="flex items-center gap-2 text-gray-500 font-bold"><ThemedIcon iconKey="iconClock" Fallback={Clock} size={14} /> {STRINGS.review.labels.due}</span>
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-md font-bold">{kanjiCounts.due}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="flex items-center gap-2 text-gray-500 font-bold"><ThemedIcon iconKey="iconSparkles" Fallback={Sparkles} size={14} /> {STRINGS.review.labels.new}</span>
                            <span className="bg-black text-white px-2 py-0.5 rounded-md font-bold">{kanjiCounts.newItems}</span>
                        </div>
                    </div>
                </button>

                {/* Grammar Card */}
                 <button 
                    onClick={() => startSession([DataType.GRAMMAR])}
                    className="relative group p-5 bg-white border border-gray-200 rounded-xl hover:shadow-xl shadow-sm transition-all text-left overflow-hidden hover:-translate-y-1 duration-300"
                >
                     <div className="absolute top-[-20%] right-[-20%] p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity rotate-12">
                        <ThemedIcon iconKey="navGrammar" Fallback={GraduationCap} size={120} className="text-black" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gray-500 text-white rounded-lg group-hover:scale-110 transition-transform"><ThemedIcon iconKey="navGrammar" Fallback={GraduationCap} size={20}/></div>
                        <div className="font-bold text-xl text-black">Grammar</div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="flex items-center gap-2 text-gray-500 font-bold"><ThemedIcon iconKey="iconClock" Fallback={Clock} size={14} /> {STRINGS.review.labels.due}</span>
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-md font-bold">{grammarCounts.due}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="flex items-center gap-2 text-gray-500 font-bold"><ThemedIcon iconKey="iconSparkles" Fallback={Sparkles} size={14} /> {STRINGS.review.labels.new}</span>
                            <span className="bg-gray-500 text-white px-2 py-0.5 rounded-md font-bold">{grammarCounts.newItems}</span>
                        </div>
                    </div>
                </button>
            </div>
             
             <button 
                onClick={() => startSession([DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR])}
                className="mt-2 px-8 py-4 bg-[#FFD500] hover:bg-[#E6C000] text-black font-extrabold text-base rounded-xl shadow-lg hover:scale-105 flex items-center gap-2 animate-pulse border-b-4 border-[#D4B200]"
            >
                <ThemedIcon iconKey="iconLayers" Fallback={Layers} size={20} />
                {STRINGS.review.mixReviewBtn}
            </button>

            {/* SRS Info Modal */}
            {showInfo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInfo(false)}>
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl animate-fade-in border border-gray-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-black text-black flex items-center gap-2">
                                <ThemedIcon iconKey="navLearn" Fallback={BrainCircuit} className="text-[#FFD500]" size={24} /> 
                                {STRINGS.review.guide.title}
                            </h3>
                            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <ThemedIcon iconKey="actionClose" Fallback={X} size={20}/>
                            </button>
                        </div>
                        
                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{STRINGS.review.guide.intro}</p>

                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-black mb-2 pb-2 border-b border-gray-200 flex items-center gap-2 text-sm">
                                    <ThemedIcon iconKey="iconClock" Fallback={Clock} size={16} className="text-gray-500" /> Stages
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex gap-2 items-start">
                                        <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-bold text-black text-xs">{STRINGS.review.guide.stages.new.title}</div>
                                            <div className="text-xs text-gray-500">{STRINGS.review.guide.stages.new.desc}</div>
                                        </div>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <div className="w-2 h-2 rounded-full bg-[#FFD500] mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-bold text-black text-xs">{STRINGS.review.guide.stages.learning.title}</div>
                                            <div className="text-xs text-gray-500">{STRINGS.review.guide.stages.learning.desc}</div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-black mb-2 pb-2 border-b border-gray-200 flex items-center gap-2 text-sm">
                                    <ThemedIcon iconKey="iconInfo" Fallback={HelpCircle} size={16} className="text-gray-500" /> Actions
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex gap-2 items-start">
                                        <ThemedIcon iconKey="actionClose" Fallback={X} size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="font-bold text-black text-xs">{STRINGS.review.guide.actions.forgot.title}</div>
                                            <div className="text-xs text-gray-500">{STRINGS.review.guide.actions.forgot.desc}</div>
                                        </div>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <ThemedIcon iconKey="actionCheck" Fallback={Check} size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="font-bold text-black text-xs">{STRINGS.review.guide.actions.easy.title}</div>
                                            <div className="text-xs text-gray-500">{STRINGS.review.guide.actions.easy.desc}</div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  const item = sessionItems[currentIndex];

  return (
    <div className="p-4 flex flex-col items-center h-full justify-center relative">
        <div className="w-full flex justify-between items-center text-gray-500 mb-4 px-2 max-w-3xl">
            <button onClick={() => setSessionStarted(false)} className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors bg-white px-2 py-1 rounded-lg border border-gray-200">
                &times; {STRINGS.review.quitSession}
            </button>
            <div className="font-bold text-black bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200 text-xs">
                {currentIndex + 1} <span className="text-gray-300">/</span> {sessionItems.length}
            </div>
        </div>

        {/* Flashcard Container */}
        <div 
            className="perspective-1000 w-full max-w-2xl h-[400px] md:h-[500px] cursor-pointer group relative"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={clsx(
                "relative w-full h-full duration-700 preserve-3d transition-transform",
                isFlipped ? "rotate-y-180" : ""
            )}>
                {/* Front */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6 relative bg-white rounded-xl shadow-lg border border-gray-200">
                     {/* Metadata Badges */}
                     <div className="absolute top-4 left-4 flex gap-2">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">#{item.id}</span>
                        <span className="text-[10px] font-bold text-gray-500 border border-gray-300 px-2 py-0.5 rounded-md">{item.jlpt}</span>
                        {item.chapter && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">Ch. {item.chapter}</span>}
                     </div>

                     <span className={clsx(
                         "px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-widest mb-4 shadow-sm",
                         item.type === DataType.VOCAB ? "bg-black text-white" :
                         item.type === DataType.KANJI ? "bg-[#FFD500] text-black" :
                         "bg-gray-500 text-white"
                     )}>
                        {item.type}
                     </span>
                     
                     <div className="flex-1 flex items-center justify-center w-full">
                        <h1 className="text-4xl md:text-6xl font-black text-black jp-text text-center text-shadow-sm leading-tight break-all px-4">
                            {'word' in item ? item.word : 'character' in item ? item.character : item.rule}
                        </h1>
                     </div>

                     <p className="mt-auto text-gray-400 text-xs font-medium flex items-center gap-2 animate-pulse">
                        {STRINGS.review.tapToReveal}
                     </p>
                </div>

                {/* Back */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center space-y-3 w-full overflow-y-auto custom-scrollbar flex flex-col items-center">
                        {'reading' in item && (
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 inline-block">
                                <p className="text-xl md:text-2xl text-black jp-text font-bold">{item.reading}</p>
                            </div>
                        )}
                        {'onyomi' in item && (
                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 text-sm w-full max-w-xs">
                                <div>
                                    <div className="text-[10px] font-bold text-[#FFD500] uppercase tracking-wider mb-1">Onyomi</div>
                                    <div className="text-black font-medium">{item.onyomi}</div>
                                </div>
                                <div className="border-l border-gray-300 pl-2">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kunyomi</div>
                                    <div className="text-black font-medium">{item.kunyomi}</div>
                                </div>
                            </div>
                        )}
                        
                        <div className="w-8 h-1 bg-[#FFD500] rounded-full mx-auto my-2"></div>
                        
                        <p className="text-lg md:text-xl font-bold text-black leading-snug">
                            {'meaning' in item ? item.meaning : item.explanation}
                        </p>
                        
                        {/* Part of Speech for Vocab */}
                        {'partOfSpeech' in item && (
                            <div className="mt-1">
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wide">
                                    {item.partOfSpeech}
                                </span>
                            </div>
                        )}

                        {/* Conjugations Display */}
                        {'conjugations' in item && item.conjugations && Object.keys(item.conjugations).length > 0 && (
                             <div className="mt-3 w-full bg-gray-50 rounded-lg border border-gray-200 p-2">
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Conjugations</p>
                                 <div className="grid grid-cols-2 gap-2 text-sm">
                                     {Object.entries(item.conjugations).map(([form, value]) => (
                                         <div key={form} className="text-left bg-white p-1 rounded border border-gray-100">
                                             <span className="text-[10px] text-gray-400 font-bold capitalize block">{form}</span>
                                             <span className="text-black jp-text">{value}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        )}

                        {'example' in item && (
                             <p className="text-gray-600 italic mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm w-full">
                                 "{(item as any).example}"
                             </p>
                         )}
                         {'examples' in item && item.examples && (
                             <ul className="text-gray-600 italic mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left list-disc list-inside space-y-1 text-sm w-full">
                                 {(item as GrammarItem).examples.map((ex, i) => <li key={i}>{ex}</li>)}
                             </ul>
                         )}
                    </div>
                </div>
            </div>
            
            {/* Card Shadow/Reflection */}
            <div className="absolute -bottom-8 left-10 right-10 h-6 bg-black/10 blur-lg rounded-[100%] transition-all duration-500 scale-90 group-hover:scale-75 group-hover:opacity-50"></div>
        </div>

        {/* Controls */}
        <div className={clsx(
            "mt-8 grid grid-cols-3 gap-3 w-full max-w-lg transition-all duration-500 z-10",
            isFlipped ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4"
        )}>
            <button 
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.FORGOT); }}
                className="group flex flex-col items-center justify-center py-2 bg-white hover:bg-red-500 text-gray-400 hover:text-white rounded-xl shadow-md hover:shadow-red-200 transition-all active:scale-95 border border-gray-200"
            >
                <ThemedIcon iconKey="actionClose" Fallback={X} className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" />
                <span className="font-extrabold text-[10px] uppercase tracking-wide text-gray-600 group-hover:text-white">{STRINGS.review.buttons.forgot}</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.HARD); }}
                 className="group flex flex-col items-center justify-center py-2 bg-white hover:bg-[#FFD500] text-gray-400 hover:text-black rounded-xl shadow-md hover:shadow-yellow-200 transition-all active:scale-95 border border-gray-200"
            >
                <ThemedIcon iconKey="actionRefresh" Fallback={RefreshCw} className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" />
                <span className="font-extrabold text-[10px] uppercase tracking-wide text-gray-600 group-hover:text-black">{STRINGS.review.buttons.hard}</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.EASY); }}
                 className="group flex flex-col items-center justify-center py-2 bg-white hover:bg-green-500 text-gray-400 hover:text-white rounded-xl shadow-md hover:shadow-green-200 transition-all active:scale-95 border border-gray-200"
            >
                <ThemedIcon iconKey="actionCheck" Fallback={Check} className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" />
                <span className="font-extrabold text-[10px] uppercase tracking-wide text-gray-600 group-hover:text-white">{STRINGS.review.buttons.easy}</span>
            </button>
        </div>
    </div>
  );
};

export default Review;