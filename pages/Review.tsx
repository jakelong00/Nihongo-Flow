import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { DataType, ReviewResult, VocabItem, KanjiItem, GrammarItem } from '../types';
import { BrainCircuit, BookOpen, Languages, GraduationCap, Check, RefreshCw, X, SlidersHorizontal, Layers, Trophy, Sparkles, TrendingUp, BarChart3, ChevronRight, Tag } from 'lucide-react';
import clsx from 'clsx';
import { ShibaMascot } from '../components/ShibaMascot';

type ReviewItemUnion = (VocabItem | KanjiItem | GrammarItem) & { type: DataType; chapter?: string; source?: string };

const Review: React.FC = () => {
  const { vocabData, kanjiData, grammarData, logReview } = useFileSystem();
  
  const [sessionItems, setSessionItems] = useState<ReviewItemUnion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [config, setConfig] = useState({ levels: [] as string[], limit: 20, types: [DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR], sources: [] as string[] });
  const [mascotMessage, setMascotMessage] = useState("Let's train!");

  const allSources = useMemo(() => {
    const s = new Set<string>();
    vocabData.forEach(v => v.source && s.add(v.source));
    kanjiData.forEach(k => k.source && s.add(k.source));
    grammarData.forEach(g => g.source && s.add(g.source));
    return Array.from(s).sort();
  }, [vocabData, kanjiData, grammarData]);

  const [results, setResults] = useState<{
    correct: number;
    total: number;
    breakdown: Record<DataType, { correct: number; total: number }>;
  }>({
    correct: 0,
    total: 0,
    breakdown: {
        [DataType.VOCAB]: { correct: 0, total: 0 },
        [DataType.KANJI]: { correct: 0, total: 0 },
        [DataType.GRAMMAR]: { correct: 0, total: 0 },
        [DataType.STATS]: { correct: 0, total: 0 }
    }
  });

  const startSession = useCallback((typesToInclude?: DataType[]) => {
    const activeTypes = typesToInclude || config.types;
    let pool: ReviewItemUnion[] = [];
    if (activeTypes.includes(DataType.VOCAB)) pool = [...pool, ...vocabData.map(i => ({ ...i, type: DataType.VOCAB }))];
    if (activeTypes.includes(DataType.KANJI)) pool = [...pool, ...kanjiData.map(i => ({ ...i, type: DataType.KANJI }))];
    if (activeTypes.includes(DataType.GRAMMAR)) pool = [...pool, ...grammarData.map(i => ({ ...i, type: DataType.GRAMMAR }))];

    if (config.levels.length > 0) pool = pool.filter(i => config.levels.includes(i.jlpt));
    if (config.sources.length > 0) pool = pool.filter(i => i.source && config.sources.includes(i.source));

    const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, config.limit);
    if (selected.length === 0) return alert("NO ITEMS FOUND MATCHING FILTERS!");

    setSessionItems(selected);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStarted(true);
    setIsConfiguring(false);
    setIsTransitioning(false);
    setShowSummary(false);
    setResults({
        correct: 0,
        total: 0,
        breakdown: {
            [DataType.VOCAB]: { correct: 0, total: 0 },
            [DataType.KANJI]: { correct: 0, total: 0 },
            [DataType.GRAMMAR]: { correct: 0, total: 0 },
            [DataType.STATS]: { correct: 0, total: 0 }
        }
    });
    setMascotMessage("Ikuzo!");
  }, [vocabData, kanjiData, grammarData, config]);

  const handleResult = useCallback(async (result: ReviewResult) => {
    if (isTransitioning || !sessionItems[currentIndex]) return;
    setIsTransitioning(true);
    
    const currentItem = sessionItems[currentIndex];
    const isCorrect = result === ReviewResult.EASY || result === ReviewResult.MASTERED;

    setResults(prev => ({
        ...prev,
        total: prev.total + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        breakdown: {
            ...prev.breakdown,
            [currentItem.type]: {
                total: prev.breakdown[currentItem.type].total + 1,
                correct: isCorrect ? prev.breakdown[currentItem.type].correct + 1 : prev.breakdown[currentItem.type].correct
            }
        }
    }));

    if (isCorrect) setMascotMessage("Yatta!");
    else setMascotMessage("Don't worry!");

    await logReview(currentItem.type, currentItem.id, result);
    setIsFlipped(false);

    setTimeout(() => {
        if (currentIndex < sessionItems.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsTransitioning(false);
        } else {
            setShowSummary(true);
            setSessionStarted(false);
            setIsTransitioning(false);
        }
    }, 400); 
  }, [currentIndex, isTransitioning, sessionItems, logReview]);

  useEffect(() => {
    if (!sessionStarted || isConfiguring || showSummary) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped(f => !f);
      }
      if (isFlipped && !isTransitioning) {
        if (e.key === '1') handleResult(ReviewResult.FORGOT);
        if (e.key === '2') handleResult(ReviewResult.HARD);
        if (e.key === '3') handleResult(ReviewResult.EASY);
      }
      if (e.code === 'Escape') setSessionStarted(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sessionStarted, isConfiguring, isFlipped, isTransitioning, handleResult, showSummary]);

  if (showSummary) {
    const accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
    return (
        <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#FAF9F6] animate-soft-in">
            <div className="w-full max-w-2xl bg-white border border-[#4A4E69]/10 rounded-[56px] shadow-2xl overflow-hidden">
                <div className="bg-[#78A2CC] p-8 md:p-12 text-center text-white relative">
                    <ShibaMascot size="md" message="Dojo clear!" className="mb-4 mx-auto" />
                    <h2 className="anime-title text-2xl font-black uppercase tracking-tighter">Training Report</h2>
                </div>
                <div className="p-8 md:p-14 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[#FAF9F6] p-6 rounded-[32px] border border-[#4A4E69]/5 text-center">
                            <span className="text-[9px] font-black text-[#4A4E69]/30 uppercase tracking-widest block mb-2">Accuracy Rate</span>
                            <span className="text-4xl font-black text-[#4A4E69] anime-title">{accuracy}%</span>
                        </div>
                        <div className="bg-[#FAF9F6] p-6 rounded-[32px] border border-[#4A4E69]/5 text-center">
                            <span className="text-[9px] font-black text-[#4A4E69]/30 uppercase tracking-widest block mb-2">Items Reviewed</span>
                            <span className="text-4xl font-black text-[#4A4E69] anime-title">{results.total}</span>
                        </div>
                    </div>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setShowSummary(false)} className="flex-1 py-4 bg-[#78A2CC] text-white rounded-[24px] font-black anime-title uppercase tracking-widest text-[10px] shadow-lg">Return to Dojo</button>
                        <button onClick={() => startSession()} className="flex-1 py-4 bg-[#FAF9F6] border-2 border-[#4A4E69]/10 text-[#4A4E69] rounded-[24px] font-black anime-title uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                            <Sparkles size={16} className="text-[#FFB7C5]" /> Training Re-run
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (!sessionStarted) {
    return (
        <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 bg-[#FAF9F6] overflow-y-auto">
            <div className="w-full max-w-4xl bg-white border border-[#4A4E69]/10 rounded-[48px] shadow-2xl overflow-hidden animate-soft-in">
                <div className="pt-12 pb-8 px-8 text-center bg-gradient-to-b from-[#78A2CC]/5 to-transparent flex flex-col items-center">
                    <ShibaMascot size="md" message="Dojo is open!" className="mb-6" />
                    <h2 className="anime-title text-3xl font-black text-[#4A4E69] mb-3 tracking-tight uppercase">Mission Selection</h2>
                    <p className="text-[11px] font-black text-[#4A4E69]/40 uppercase tracking-[0.4em] mb-4">Choose your learning path</p>
                </div>

                <div className="px-8 md:px-12 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { type: DataType.VOCAB, label: 'Vocabulary', icon: BookOpen, color: 'bg-[#78A2CC]/10 text-[#78A2CC]' },
                          { type: DataType.KANJI, label: 'Kanji', icon: Languages, color: 'bg-[#FFB7C5]/15 text-[#FFB7C5]' },
                          { type: DataType.GRAMMAR, label: 'Grammar', icon: GraduationCap, color: 'bg-[#B4E4C3]/20 text-[#B4E4C3]' }
                        ].map(mod => (
                            <button 
                              key={mod.type}
                              onClick={() => startSession([mod.type])} 
                              className="group flex flex-col items-center justify-center p-8 bg-white border border-[#4A4E69]/5 rounded-[40px] hover:border-[#78A2CC]/20 hover:shadow-xl transition-all active:scale-95"
                            >
                                <div className={clsx("p-5 rounded-2xl mb-4 group-hover:scale-110 transition-transform", mod.color)}>
                                    <mod.icon size={28} />
                                </div>
                                <span className="font-black anime-title text-xs uppercase tracking-[0.15em] text-[#4A4E69]/70">{mod.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-8 md:px-12 pb-12 flex flex-col gap-4">
                    <button 
                        onClick={() => startSession()} 
                        className="group relative w-full overflow-hidden bg-[#78A2CC] text-white py-6 rounded-[32px] font-black anime-title text-sm tracking-[0.25em] shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-4 uppercase"
                    >
                        <Layers size={22} /> 
                        <span>[ Start Mixed Training ]</span>
                    </button>
                    
                    <button 
                        onClick={() => setIsConfiguring(true)} 
                        className="flex items-center justify-center gap-2.5 py-4 text-[11px] font-black uppercase tracking-[0.25em] text-[#4A4E69]/30 hover:text-[#78A2CC] transition-all bg-[#FAF9F6] rounded-[24px]"
                    >
                      <SlidersHorizontal size={14} /> 
                      Session Settings
                    </button>
                </div>
            </div>

            {isConfiguring && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#4A4E69]/40 backdrop-blur-md">
                <div className="absolute inset-0" onClick={() => setIsConfiguring(false)} />
                <div className="relative bg-white w-full max-w-lg p-10 rounded-[48px] shadow-2xl animate-soft-in max-h-[85vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-xl font-black text-[#4A4E69] anime-title uppercase mb-8 flex items-center gap-3">
                    <SlidersHorizontal size={20} className="text-[#78A2CC]" /> Settings
                  </h3>
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-[#4A4E69]/40 uppercase tracking-widest block mb-3">Include Levels</label>
                      <div className="flex flex-wrap gap-2">
                        {['N5', 'N4', 'N3', 'N2', 'N1'].map(l => (
                          <button 
                            key={l}
                            onClick={() => setConfig(prev => ({ 
                              ...prev, 
                              levels: prev.levels.includes(l) ? prev.levels.filter(x => x !== l) : [...prev.levels, l] 
                            }))}
                            className={clsx("px-4 py-2 rounded-xl font-black text-[10px] transition-all", 
                              config.levels.includes(l) ? "bg-[#78A2CC] text-white shadow-md" : "bg-[#FAF9F6] text-[#4A4E69]/30 border border-[#4A4E69]/5")}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-[#4A4E69]/40 uppercase tracking-widest block mb-3">Filter by Source</label>
                      <div className="flex flex-wrap gap-2">
                        {allSources.map(s => (
                          <button 
                            key={s}
                            onClick={() => setConfig(prev => ({ 
                              ...prev, 
                              sources: prev.sources.includes(s) ? prev.sources.filter(x => x !== s) : [...prev.sources, s] 
                            }))}
                            className={clsx("px-4 py-2 rounded-xl font-black text-[9px] transition-all flex items-center gap-2 truncate max-w-[150px]", 
                              config.sources.includes(s) ? "bg-[#B4E4C3] text-[#4A4E69] shadow-md" : "bg-[#FAF9F6] text-[#4A4E69]/30 border border-[#4A4E69]/5")}
                          >
                            <Tag size={10} /> {s}
                          </button>
                        ))}
                      </div>
                      {allSources.length === 0 && <p className="text-[9px] opacity-30 uppercase italic">No custom sources found</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-[#4A4E69]/40 uppercase tracking-widest block mb-3">Item Limit ({config.limit})</label>
                      <input 
                        type="range" min="10" max="100" step="10" 
                        value={config.limit} 
                        onChange={e => setConfig(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-[#FAF9F6] rounded-full appearance-none cursor-pointer accent-[#78A2CC]" 
                      />
                    </div>
                    <button 
                      onClick={() => setIsConfiguring(false)}
                      className="w-full py-4 bg-[#B4E4C3] text-[#4A4E69] rounded-[24px] font-black anime-title text-[11px] uppercase tracking-widest mt-4"
                    >
                      Apply Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
  }

  const item = sessionItems[currentIndex];
  if (!item) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-[#FAF9F6] relative overflow-hidden">
        <div className="fixed bottom-10 right-10 z-50 pointer-events-none hidden lg:block">
            <ShibaMascot size="md" message={mascotMessage} className="pointer-events-auto" />
        </div>

        <div className="w-full max-w-xl flex justify-between items-center mb-6 relative z-10">
             <div className="px-5 py-2 bg-white border border-[#4A4E69]/5 rounded-2xl text-[10px] font-black anime-title tracking-widest shadow-sm flex items-center gap-3">
                <BarChart3 size={14} className="text-[#78A2CC]" />
                {currentIndex + 1} / {sessionItems.length}
             </div>
             <button onClick={() => setSessionStarted(false)} className="px-4 py-2 bg-[#FFB7C5]/20 text-[#FFB7C5] rounded-xl text-[9px] font-black uppercase tracking-widest">EXIT</button>
        </div>

        <div 
            className="perspective-1000 w-full max-w-[min(90vw,480px)] h-[min(60vh,400px)] cursor-pointer group mb-10 relative z-10"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={clsx(
                "relative w-full h-full duration-500 preserve-3d transition-transform",
                isFlipped ? "rotate-y-minus-180" : ""
            )}>
                {/* Front Side */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 bg-white border border-[#4A4E69]/5 rounded-[40px] shadow-xl overflow-hidden">
                     <div className="absolute top-6 left-6 flex flex-col items-start gap-1.5">
                        <span className="text-[9px] font-black bg-[#78A2CC] text-white px-3 py-1 rounded-lg">{item.jlpt}</span>
                        {item.source && <span className="text-[7px] font-black text-[#78A2CC]/50 bg-[#78A2CC]/5 px-2 py-0.5 rounded border border-[#78A2CC]/10 uppercase tracking-tighter truncate max-w-[100px]">{item.source}</span>}
                     </div>
                     <div className="flex flex-col items-center w-full px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-black text-[#4A4E69] jp-text break-words line-clamp-3">
                           {'word' in item ? item.word : 'character' in item ? item.character : item.rule}
                        </h1>
                     </div>
                     <div className="absolute bottom-6 flex items-center gap-2 opacity-30">
                        <TrendingUp size={12} />
                        <p className="text-[#4A4E69] text-[8px] font-black uppercase tracking-[0.3em]">[ Tap to Reveal ]</p>
                     </div>
                </div>

                {/* Back Side - Rotating in opposite direction */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-minus-180 flex flex-col items-center justify-center p-8 bg-[#78A2CC] border border-[#4A4E69]/10 rounded-[40px] shadow-2xl overflow-hidden">
                    <div className="w-full text-center space-y-6 relative z-10 text-white animate-soft-in">
                        {'reading' in item && (
                            <div className="bg-white/10 p-4 rounded-[24px] border border-white/20 inline-block mb-2">
                                <p className="text-2xl md:text-4xl font-black jp-text tracking-tighter">{item.reading}</p>
                            </div>
                        )}
                        <div className="px-2">
                            <p className="text-xl md:text-2xl font-black uppercase leading-tight">
                                {'meaning' in item ? item.meaning : item.explanation}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className={clsx(
            "grid grid-cols-3 gap-4 w-full max-w-xl transition-all duration-500 relative z-10",
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-6"
        )}>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.FORGOT); }}
                className="group p-4 bg-white border border-[#4A4E69]/5 rounded-[28px] shadow-lg hover:bg-[#FFB7C5]/10 flex flex-col items-center gap-2"
            >
                <div className="p-3 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-xl"><X size={20} /></div>
                <span className="font-black text-[8px] uppercase tracking-widest text-[#4A4E69]/40">Forgot [1]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.HARD); }}
                className="group p-4 bg-white border border-[#4A4E69]/5 rounded-[28px] shadow-lg hover:bg-[#78A2CC]/10 flex flex-col items-center gap-2"
            >
                <div className="p-3 bg-[#78A2CC]/10 text-[#78A2CC] rounded-xl"><RefreshCw size={20} /></div>
                <span className="font-black text-[8px] uppercase tracking-widest text-[#4A4E69]/40">Hard [2]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.EASY); }}
                className="group p-4 bg-white border border-[#4A4E69]/5 rounded-[28px] shadow-lg hover:bg-[#B4E4C3]/10 flex flex-col items-center gap-2"
            >
                <div className="p-3 bg-[#B4E4C3]/20 text-[#B4E4C3] rounded-xl"><Check size={20} /></div>
                <span className="font-black text-[8px] uppercase tracking-widest text-[#4A4E69]/40">Easy [3]</span>
            </button>
        </div>
    </div>
  );
};

export default Review;