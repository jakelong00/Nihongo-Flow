
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { DataType, ReviewResult, VocabItem, KanjiItem, GrammarItem, StatItem } from '../types';
import { BrainCircuit, BookOpen, Languages, GraduationCap, Check, RefreshCw, X, SlidersHorizontal, Layers, Trophy, Sparkles, HelpCircle, ArrowRight, BarChart3, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from '../components/ThemedIcon';
import { ShibaMascot } from '../components/ShibaMascot';

type ReviewItemUnion = (VocabItem | KanjiItem | GrammarItem) & { type: DataType; chapter?: string };

const Review: React.FC = () => {
  const { vocabData, kanjiData, grammarData, statsData, logReview } = useFileSystem();
  
  const [sessionItems, setSessionItems] = useState<ReviewItemUnion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [config, setConfig] = useState({ levels: [] as string[], chapters: [] as string[], limit: 20 });
  const [mascotMessage, setMascotMessage] = useState("Let's train!");

  // Session Stats
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

  const startSession = (types: DataType[]) => {
    let pool: ReviewItemUnion[] = [];
    if (types.includes(DataType.VOCAB)) pool = [...pool, ...vocabData.map(i => ({ ...i, type: DataType.VOCAB }))];
    if (types.includes(DataType.KANJI)) pool = [...pool, ...kanjiData.map(i => ({ ...i, type: DataType.KANJI }))];
    if (types.includes(DataType.GRAMMAR)) pool = [...pool, ...grammarData.map(i => ({ ...i, type: DataType.GRAMMAR }))];

    if (config.levels.length > 0) pool = pool.filter(i => config.levels.includes(i.jlpt));
    if (config.chapters.length > 0) pool = pool.filter(i => i.chapter && config.chapters.includes(i.chapter));

    const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, config.limit);
    if (selected.length === 0) return alert("NO ITEMS FOUND!");

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
  };

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

  // Session Statistics Summary View
  if (showSummary) {
    const accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
    return (
        <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#FAF9F6] animate-soft-in">
            <div className="w-full max-w-2xl bg-white border border-[#4A4E69]/10 rounded-[56px] shadow-2xl overflow-hidden">
                <div className="bg-[#78A2CC] p-12 text-center text-white relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    <ShibaMascot size="md" message="Dojo clear!" className="mb-6 mx-auto" />
                    <h2 className="anime-title text-3xl font-black uppercase tracking-tighter">Training Report</h2>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.4em] mt-2">Mission Parameters Completed</p>
                </div>

                <div className="p-10 md:p-14 space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-[#FAF9F6] p-8 rounded-[40px] border border-[#4A4E69]/5 text-center">
                            <span className="text-[9px] font-black text-[#4A4E69]/30 uppercase tracking-widest block mb-2">Accuracy Rate</span>
                            <span className="text-5xl font-black text-[#4A4E69] anime-title tracking-tighter">{accuracy}%</span>
                        </div>
                        <div className="bg-[#FAF9F6] p-8 rounded-[40px] border border-[#4A4E69]/5 text-center">
                            <span className="text-[9px] font-black text-[#4A4E69]/30 uppercase tracking-widest block mb-2">Items Reviewed</span>
                            <span className="text-5xl font-black text-[#4A4E69] anime-title tracking-tighter">{results.total}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-[#4A4E69]/20 uppercase tracking-[0.4em] text-center mb-6">Subject Breakdown</h4>
                        {[
                            { label: 'Vocabulary', type: DataType.VOCAB, color: 'bg-[#78A2CC]' },
                            { label: 'Kanji Dojo', type: DataType.KANJI, color: 'bg-[#FFB7C5]' },
                            { label: 'Grammar Hub', type: DataType.GRAMMAR, color: 'bg-[#B4E4C3]' }
                        ].map(sub => {
                            const data = results.breakdown[sub.type];
                            if (data.total === 0) return null;
                            const perc = Math.round((data.correct / data.total) * 100);
                            return (
                                <div key={sub.type} className="flex items-center gap-6 group">
                                    <div className="w-24 text-right">
                                        <span className="text-[10px] font-black text-[#4A4E69] uppercase tracking-wider">{sub.label}</span>
                                    </div>
                                    <div className="flex-1 h-3 bg-[#FAF9F6] rounded-full overflow-hidden shadow-inner border border-[#4A4E69]/5">
                                        <div className={clsx("h-full transition-all duration-1000", sub.color)} style={{ width: `${perc}%` }}></div>
                                    </div>
                                    <div className="w-12">
                                        <span className="text-[11px] font-black text-[#4A4E69]">{perc}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => setShowSummary(false)}
                            className="flex-1 py-5 bg-[#78A2CC] text-white rounded-[28px] font-black anime-title uppercase tracking-widest text-[11px] shadow-lg hover:bg-[#6b95c2] active:translate-y-1 transition-all"
                        >
                            Return to Dojo
                        </button>
                        <button 
                            onClick={() => startSession([DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR])}
                            className="flex-1 py-5 bg-[#FAF9F6] border-2 border-[#4A4E69]/10 text-[#4A4E69] rounded-[28px] font-black anime-title uppercase tracking-widest text-[11px] hover:bg-white transition-all flex items-center justify-center gap-3"
                        >
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
        <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 bg-[#FAF9F6]">
            <div className="w-full max-w-4xl bg-white border border-[#4A4E69]/10 rounded-[48px] shadow-[0_20px_50px_rgba(74,78,105,0.1)] overflow-hidden animate-soft-in">
                <div className="pt-12 pb-8 px-8 text-center bg-gradient-to-b from-[#78A2CC]/5 to-transparent flex flex-col items-center">
                    <ShibaMascot size="md" message="Dojo is open!" className="mb-6" />
                    <h2 className="anime-title text-3xl font-black text-[#4A4E69] mb-3 tracking-tight uppercase">Mission Selection</h2>
                    <p className="text-[11px] font-black text-[#4A4E69]/40 uppercase tracking-[0.4em] mb-4">Choose your learning path</p>
                    <div className="w-16 h-1 bg-[#FFB7C5] mx-auto rounded-full"></div>
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
                              className="group flex flex-col items-center justify-center p-10 bg-white border border-[#4A4E69]/5 rounded-[40px] hover:border-[#78A2CC]/20 hover:shadow-xl transition-all duration-500 relative overflow-hidden active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className={clsx("p-5 rounded-2xl mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-sm", mod.color)}>
                                    <mod.icon size={28} />
                                </div>
                                <span className="font-black anime-title text-xs uppercase tracking-[0.15em] text-[#4A4E69]/70 group-hover:text-[#4A4E69] transition-colors">{mod.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-8 md:px-12 pb-12">
                    <button 
                        onClick={() => startSession([DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR])} 
                        className="group relative w-full overflow-hidden bg-[#78A2CC] text-white py-7 rounded-[32px] font-black anime-title text-sm tracking-[0.25em] shadow-lg hover:shadow-[#78A2CC]/30 hover:-translate-y-1 active:translate-y-0.5 transition-all flex items-center justify-center gap-4 uppercase"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Layers size={22} className="group-hover:rotate-12 transition-transform" /> 
                        <span>[ Start Mixed Training ]</span>
                        <div className="absolute left-0 bottom-0 h-1 bg-white/20 w-full"></div>
                    </button>
                </div>
            </div>
            
            <div className="mt-10 flex gap-8 items-center animate-soft-in">
                <button 
                    onClick={() => setIsConfiguring(true)} 
                    className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-[#4A4E69]/30 hover:text-[#78A2CC] transition-all group"
                >
                  <SlidersHorizontal size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
                  Session Settings
                </button>
            </div>
        </div>
    );
  }

  const item = sessionItems[currentIndex];
  if (!item) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-[#FAF9F6] relative overflow-hidden">
        {/* Background Sparkles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
            <Sparkles className="absolute top-[15%] left-[10%] text-[#78A2CC] animate-pulse" size={40} />
            <Sparkles className="absolute bottom-[20%] right-[15%] text-[#FFB7C5] animate-pulse" size={60} style={{ animationDelay: '1s' }} />
        </div>

        <div className="fixed bottom-10 right-10 z-50 pointer-events-none hidden lg:block">
            <ShibaMascot size="md" message={mascotMessage} className="pointer-events-auto" />
        </div>

        <div className="w-full max-w-xl flex justify-between items-center mb-8 relative z-10">
             <div className="px-6 py-2.5 bg-white border border-[#4A4E69]/5 rounded-2xl text-[11px] font-black anime-title tracking-widest shadow-sm flex items-center gap-3">
                <BarChart3 size={14} className="text-[#78A2CC]" />
                PROGRESS: {currentIndex + 1} / {sessionItems.length}
             </div>
             <button onClick={() => setSessionStarted(false)} className="px-4 py-2.5 bg-[#FFB7C5]/20 text-[#FFB7C5] rounded-2xl text-[10px] font-black anime-title uppercase tracking-widest hover:bg-[#FFB7C5] hover:text-white transition-all">EXIT</button>
        </div>

        <div 
            className="perspective-1000 w-full max-w-xl aspect-[4/3] md:aspect-[5/4] cursor-pointer group mb-10 relative z-10"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={clsx(
                "relative w-full h-full duration-500 preserve-3d transition-transform",
                isFlipped ? "rotate-y-180" : ""
            )}>
                {/* Front Side */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-12 bg-white border border-[#4A4E69]/5 rounded-[40px] shadow-2xl overflow-hidden">
                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4A4E69 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                     <div className="absolute top-8 left-8 flex gap-3">
                        <span className="text-[10px] font-black bg-[#78A2CC] text-white px-3 py-1 rounded-full shadow-sm">{item.jlpt}</span>
                        {item.chapter && <span className="text-[10px] font-black bg-[#FAF9F6] text-[#4A4E69]/40 border border-[#4A4E69]/10 px-3 py-1 rounded-full uppercase tracking-wider">CH.{item.chapter}</span>}
                     </div>
                     <div className="flex flex-col items-center">
                        <h1 className="text-6xl md:text-8xl font-black text-[#4A4E69] jp-text text-center break-all transition-transform group-hover:scale-110 duration-500">
                           {'word' in item ? item.word : 'character' in item ? item.character : item.rule}
                        </h1>
                     </div>
                     <div className="absolute bottom-8 flex items-center gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
                        <TrendingUp size={14} />
                        <p className="text-[#4A4E69] text-[9px] font-black uppercase tracking-[0.4em]">
                           [ Tap to Reveal ]
                        </p>
                     </div>
                </div>

                {/* Back Side */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-12 bg-[#78A2CC] border border-[#4A4E69]/10 rounded-[40px] shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6-static.png")' }}></div>
                    <div className="w-full text-center space-y-8 relative z-10 text-white animate-soft-in">
                        {'reading' in item && (
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-[30px] border border-white/20 inline-block mb-4 shadow-xl">
                                <p className="text-3xl md:text-5xl font-black jp-text tracking-tighter">{item.reading}</p>
                            </div>
                        )}
                        <div className="px-4">
                            <p className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-tight drop-shadow-md">
                                {'meaning' in item ? item.meaning : item.explanation}
                            </p>
                        </div>
                        {item.type === DataType.GRAMMAR && 'examples' in item && (
                            <div className="pt-4 space-y-2 opacity-80">
                                {item.examples.slice(0, 1).map((ex: string, i: number) => (
                                    <p key={i} className="text-xs font-bold jp-text italic">"{ex}"</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className={clsx(
            "grid grid-cols-3 gap-5 w-full max-w-xl transition-all duration-500 relative z-10",
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-6"
        )}>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.FORGOT); }}
                className="group p-6 bg-white border border-[#4A4E69]/5 rounded-[30px] shadow-xl hover:bg-[#FFB7C5]/10 transition-all flex flex-col items-center gap-3 active:translate-y-1"
            >
                <div className="p-4 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-2xl group-hover:scale-110 transition-transform"><X size={24} /></div>
                <span className="font-black anime-title text-[9px] uppercase tracking-[0.2em] text-[#4A4E69]/40">Forgot [1]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.HARD); }}
                className="group p-6 bg-white border border-[#4A4E69]/5 rounded-[30px] shadow-xl hover:bg-[#78A2CC]/10 transition-all flex flex-col items-center gap-3 active:translate-y-1"
            >
                <div className="p-4 bg-[#78A2CC]/10 text-[#78A2CC] rounded-2xl group-hover:rotate-45 transition-transform"><RefreshCw size={24} /></div>
                <span className="font-black anime-title text-[9px] uppercase tracking-[0.2em] text-[#4A4E69]/40">Hard [2]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.EASY); }}
                className="group p-6 bg-white border border-[#4A4E69]/5 rounded-[30px] shadow-xl hover:bg-[#B4E4C3]/10 transition-all flex flex-col items-center gap-3 active:translate-y-1"
            >
                <div className="p-4 bg-[#B4E4C3]/20 text-[#B4E4C3] rounded-2xl group-hover:scale-110 transition-transform"><Check size={24} /></div>
                <span className="font-black anime-title text-[9px] uppercase tracking-[0.2em] text-[#4A4E69]/40">Master [3]</span>
            </button>
        </div>
    </div>
  );
};

export default Review;
