
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { DataType, ReviewResult, VocabItem, KanjiItem, GrammarItem } from '../types';
import { BrainCircuit, BookOpen, Languages, GraduationCap, Check, RefreshCw, X, SlidersHorizontal, Layers, Trophy, Sparkles, TrendingUp, BarChart3, ChevronRight, Tag, Keyboard, Zap, Ghost, ListChecks, Info, ExternalLink, PenTool } from 'lucide-react';
import clsx from 'clsx';
import { ShibaMascot } from '../components/ShibaMascot';
import { romajiToHiragana } from '../utils/textHelper';
import { KanjiCanvas } from '../components/KanjiCanvas';
// Fixed: Added missing import for STRINGS
import { STRINGS } from '../constants/strings';

type ReviewItemUnion = (VocabItem | KanjiItem | GrammarItem) & { type: DataType; chapter?: string; source?: string };

interface SessionLogEntry {
    item: ReviewItemUnion;
    targetFormLabel?: string;
    userInput: string;
    isCorrect: boolean;
    correctValue: string;
}

const VERB_FORM_MAP: Record<string, string> = {
  v_masu: 'Masu-form',
  v_short_pres_pos: 'Short Form (Pres. +)',
  v_short_pres_neg: 'Short Form (Pres. -)',
  v_short_past_pos: 'Short Form (Past +)',
  v_short_past_neg: 'Short Form (Past -)',
  v_potential: 'Potential',
  v_volitional: 'Volitional',
  v_passive: 'Passive',
  v_causative: 'Causative'
};

const ADJ_FORM_MAP: Record<string, string> = {
  a_te: 'Te-form',
  a_nai: 'Negative',
  a_ta: 'Past Affirmative',
  a_pastNegative: 'Past Negative',
  a_adverbial: 'Adverbial',
  a_conditional: 'Conditional',
  a_nounForm: 'Noun Form'
};

const Review: React.FC = () => {
  const { vocabData, kanjiData, grammarData, logReview } = useFileSystem();
  
  const [sessionMode, setSessionMode] = useState<'flashcard' | 'conjugator' | 'writing'>('flashcard');
  const [sessionItems, setSessionItems] = useState<ReviewItemUnion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showNoItemsError, setShowNoItemsError] = useState(false);
  const [config, setConfig] = useState({ levels: [] as string[], limit: 20, types: [DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR], sources: [] as string[] });
  const [mascotMessage, setMascotMessage] = useState("Let's train!");
  
  // Conjugator Game State
  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [targetForm, setTargetForm] = useState<{ key: string; label: string } | null>(null);
  const [combo, setCombo] = useState(0);
  const [sessionLog, setSessionLog] = useState<SessionLogEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const pickRandomForm = (item: VocabItem) => {
    const isVerb = item.partOfSpeech.toLowerCase().includes('verb');
    const isAdjective = item.partOfSpeech.toLowerCase().includes('adjective');
    const map = isVerb ? VERB_FORM_MAP : ADJ_FORM_MAP;
    
    const availableForms = Object.keys(map).filter(key => !!(item as any)[key]);
    if (availableForms.length === 0) return null;
    
    const randomKey = availableForms[Math.floor(Math.random() * availableForms.length)];
    return { key: randomKey, label: map[randomKey] };
  };

  /**
   * Advanced Heuristic to extract reading of a conjugation even if it contains Kanji.
   * e.g. 食べる (たべる) -> 食 (た). Thus 食べて -> たべて
   */
  const getConjugationReading = (vocab: VocabItem, conjugatedValue: string): string => {
      if (!vocab.reading || !vocab.word) return conjugatedValue;
      
      // Find the Kanji/Root part by removing the trailing kana
      // This is a simplified approach that works for common genki-style entries
      let i = vocab.word.length - 1;
      while (i >= 0 && vocab.word[i].match(/[\u3040-\u309f\u30a0-\u30ff]/)) {
          i--;
      }
      const kanjiRoot = vocab.word.substring(0, i + 1);
      if (!kanjiRoot) return conjugatedValue;

      const suffixLen = vocab.word.length - kanjiRoot.length;
      const readingRoot = vocab.reading.substring(0, vocab.reading.length - suffixLen);
      
      // If the conjugation starts with the same Kanji root, replace it with reading
      if (conjugatedValue.startsWith(kanjiRoot)) {
          return readingRoot + conjugatedValue.substring(kanjiRoot.length);
      }
      
      return conjugatedValue;
  };

  const startSession = useCallback((mode: 'flashcard' | 'conjugator' | 'writing' = 'flashcard', typesToInclude?: DataType[]) => {
    const activeTypes = typesToInclude || config.types;
    let pool: ReviewItemUnion[] = [];
    
    if (mode === 'conjugator') {
      pool = vocabData
        .filter(v => (v.partOfSpeech.toLowerCase().includes('verb') || v.partOfSpeech.toLowerCase().includes('adjective')))
        .filter(v => !!(v.v_masu || v.v_short_pres_pos || v.v_short_pres_neg || v.v_short_past_pos || v.v_short_past_neg || v.v_potential || v.v_volitional || v.v_passive || v.v_causative || v.a_te || v.a_nai || v.a_ta || v.a_pastNegative || v.a_adverbial || v.a_nounForm || v.a_conditional))
        .map(i => ({ ...i, type: DataType.VOCAB }));
    } else if (mode === 'writing') {
      pool = kanjiData.map(i => ({ ...i, type: DataType.KANJI }));
    } else {
      if (activeTypes.includes(DataType.VOCAB)) pool = [...pool, ...vocabData.map(i => ({ ...i, type: DataType.VOCAB }))];
      if (activeTypes.includes(DataType.KANJI)) pool = [...pool, ...kanjiData.map(i => ({ ...i, type: DataType.KANJI }))];
      if (activeTypes.includes(DataType.GRAMMAR)) pool = [...pool, ...grammarData.map(i => ({ ...i, type: DataType.GRAMMAR }))];
    }

    if (config.levels.length > 0) pool = pool.filter(i => config.levels.includes(i.jlpt));
    if (config.sources.length > 0) pool = pool.filter(i => i.source && config.sources.includes(i.source));

    const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, config.limit);
    if (selected.length === 0) {
      setShowNoItemsError(true);
      return;
    }

    setSessionMode(mode);
    setSessionItems(selected);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStarted(true);
    setIsConfiguring(false);
    setIsTransitioning(false);
    setShowSummary(false);
    setCombo(0);
    setUserInput('');
    setShowFeedback('none');
    setSessionLog([]);
    
    if (mode === 'conjugator') {
      const form = pickRandomForm(selected[0] as VocabItem);
      setTargetForm(form);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setTargetForm(null);
    }

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

  const handleResult = useCallback(async (result: ReviewResult, flashcardUserInput?: string, correctValue?: string) => {
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

    setSessionLog(prev => [...prev, {
        item: currentItem,
        targetFormLabel: targetForm?.label,
        userInput: sessionMode === 'conjugator' ? userInput : flashcardUserInput || '',
        isCorrect,
        correctValue: correctValue || ''
    }]);

    if (isCorrect) setMascotMessage("Yatta!");
    else setMascotMessage("Don't worry!");

    // Skip mastery updates for conjugator game sessions to keep data pure
    if (sessionMode !== 'conjugator') {
        await logReview(currentItem.type, currentItem.id, result);
    }
    
    setIsFlipped(false);

    // Feedback duration increased (2.5s for conjugator correct/wrong display)
    const delay = sessionMode === 'conjugator' ? 2500 : 400;

    setTimeout(() => {
        if (currentIndex < sessionItems.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            if (sessionMode === 'conjugator') {
              setTargetForm(pickRandomForm(sessionItems[nextIdx] as VocabItem));
              setUserInput('');
              setShowFeedback('none');
              setTimeout(() => inputRef.current?.focus(), 50);
            }
            setIsTransitioning(false);
        } else {
            setShowSummary(true);
            setSessionStarted(false);
            setIsTransitioning(false);
        }
    }, delay); 
  }, [currentIndex, isTransitioning, sessionItems, logReview, sessionMode, targetForm, userInput]);

  const checkConjugation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isTransitioning || showFeedback !== 'none' || !targetForm) return;

    const vocab = sessionItems[currentIndex] as VocabItem;
    const correctValue = (vocab as any)[targetForm.key];
    
    const cleanedInput = userInput.trim().toLowerCase();
    const hiraganaInput = romajiToHiragana(cleanedInput);
    
    // Get the reading of the correct conjugation (stem logic)
    const readingOfCorrection = getConjugationReading(vocab, correctValue);

    // Validation checks:
    // 1. Raw input matches (Kanji/Kana)
    // 2. Hiragana conversion matches (Kana)
    // 3. Hiragana conversion matches the "reading" of the Kanji-based correct value
    const isCorrect = (cleanedInput === correctValue.toLowerCase()) || 
                      (hiraganaInput === correctValue) ||
                      (hiraganaInput === readingOfCorrection);

    if (isCorrect) {
      setShowFeedback('correct');
      setCombo(prev => prev + 1);
      handleResult(ReviewResult.EASY, userInput, correctValue);
    } else {
      setShowFeedback('incorrect');
      setCombo(0);
      handleResult(ReviewResult.HARD, userInput, correctValue);
    }
  };

  useEffect(() => {
    if (!sessionStarted || isConfiguring || showSummary) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (sessionMode === 'conjugator' && e.key === 'Enter' && showFeedback === 'none') {
          checkConjugation();
        }
        return;
      }

      if (sessionMode === 'flashcard') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          setIsFlipped(f => !f);
        }
        if (isFlipped && !isTransitioning) {
          if (e.key === '1') handleResult(ReviewResult.FORGOT, 'No answer', 'Reveal');
          if (e.key === '2') handleResult(ReviewResult.HARD, 'No answer', 'Reveal');
          if (e.key === '3') handleResult(ReviewResult.EASY, 'No answer', 'Reveal');
        }
      }
      
      if (e.code === 'Escape') setSessionStarted(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sessionStarted, isConfiguring, isFlipped, isTransitioning, handleResult, showSummary, sessionMode, userInput, showFeedback, targetForm]);

  if (showSummary) {
    const accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
    return (
        <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#FAF9F6] animate-soft-in">
            <div className="w-full max-w-4xl bg-white border border-[#4A4E69]/10 rounded-[56px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-[#78A2CC] p-8 text-center text-white relative shrink-0">
                    <ShibaMascot size="md" message="Dojo clear!" className="mb-4 mx-auto" />
                    <h2 className="anime-title text-2xl font-black uppercase tracking-tighter">Training Report</h2>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                         {sessionMode === 'conjugator' ? <Zap size={12} className="text-[#FFB7C5]" /> : sessionMode === 'writing' ? <PenTool size={12} /> : <ListChecks size={12} />} 
                         {sessionMode === 'conjugator' ? 'Conjugation Dojo' : sessionMode === 'writing' ? 'Writing Dojo' : 'Flashcard Study'}
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-10">
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

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#4A4E69]/40 uppercase tracking-[0.3em] mb-4">Detailed Performance Log</h3>
                        <div className="border border-[#4A4E69]/5 rounded-3xl overflow-hidden bg-[#FAF9F6]/50 shadow-inner">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#4A4E69]/5">
                                    <tr>
                                        <th className="px-6 py-3 text-[9px] font-black text-[#4A4E69]/40 uppercase">Item</th>
                                        {sessionMode === 'conjugator' && <th className="px-6 py-3 text-[9px] font-black text-[#4A4E69]/40 uppercase">Target</th>}
                                        <th className="px-6 py-3 text-[9px] font-black text-[#4A4E69]/40 uppercase">Your Answer</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-[#4A4E69]/40 uppercase text-center">Result</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-[#4A4E69]/40 uppercase">Correction</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#4A4E69]/5">
                                    {sessionLog.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-white transition-colors">
                                            <td className="px-6 py-4 font-black text-[#4A4E69] jp-text">
                                                {'word' in log.item ? log.item.word : 'character' in log.item ? log.item.character : log.item.rule}
                                            </td>
                                            {sessionMode === 'conjugator' && <td className="px-6 py-4 text-[10px] font-black text-[#78A2CC] uppercase">{log.targetFormLabel}</td>}
                                            <td className="px-6 py-4 text-[11px] font-bold text-[#4A4E69]/60 jp-text">{log.userInput || '—'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={clsx(
                                                    "inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xl",
                                                    log.isCorrect ? "bg-[#B4E4C3]/20 text-[#4A4E69]" : "bg-[#FFB7C5]/20 text-[#FFB7C5]"
                                                )}>
                                                    {log.isCorrect ? '○' : '×'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-bold text-[#78A2CC] jp-text">
                                                {log.isCorrect ? <span className="opacity-10">—</span> : log.correctValue}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setShowSummary(false)} className="flex-1 py-4 bg-[#78A2CC] text-white rounded-[24px] font-black anime-title uppercase tracking-widest text-[10px] shadow-lg">Return to Dojo</button>
                        <button onClick={() => startSession(sessionMode)} className="flex-1 py-4 bg-[#FAF9F6] border-2 border-[#4A4E69]/10 text-[#4A4E69] rounded-[24px] font-black anime-title uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { mode: 'flashcard' as const, type: DataType.VOCAB, label: 'Vocabulary', icon: BookOpen, color: 'bg-[#78A2CC]/10 text-[#78A2CC]' },
                          { mode: 'flashcard' as const, type: DataType.KANJI, label: 'Kanji', icon: Languages, color: 'bg-[#FFB7C5]/15 text-[#FFB7C5]' },
                          { mode: 'flashcard' as const, type: DataType.GRAMMAR, label: 'Grammar', icon: GraduationCap, color: 'bg-[#B4E4C3]/20 text-[#B4E4C3]' },
                          { mode: 'writing' as const, type: DataType.KANJI, label: 'Writing', icon: PenTool, color: 'bg-amber-100 text-amber-600', special: true },
                          { mode: 'conjugator' as const, type: DataType.VOCAB, label: 'Conjugator', icon: Keyboard, color: 'bg-[#4A4E69]/10 text-[#4A4E69]', special: true }
                        ].map(mod => (
                            <button 
                              key={mod.label}
                              onClick={() => startSession(mod.mode, [mod.type])} 
                              className={clsx(
                                "group flex flex-col items-center justify-center p-8 bg-white border rounded-[40px] transition-all active:scale-95",
                                mod.special ? "border-[#FFB7C5] shadow-md hover:shadow-2xl" : "border-[#4A4E69]/5 hover:border-[#78A2CC]/20 hover:shadow-xl"
                              )}
                            >
                                <div className={clsx("p-5 rounded-2xl mb-4 group-hover:scale-110 transition-transform relative", mod.color)}>
                                    <mod.icon size={28} />
                                    {mod.special && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFB7C5] rounded-full animate-pulse"></div>}
                                </div>
                                <span className="font-black anime-title text-xs uppercase tracking-[0.15em] text-[#4A4E69]/70">{mod.label}</span>
                                {mod.special && <span className="text-[7px] font-black text-[#FFB7C5] uppercase mt-2">Mini-Game</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-8 md:px-12 pb-12 flex flex-col gap-4">
                    <button 
                        onClick={() => startSession('flashcard')} 
                        className="group relative w-full overflow-hidden bg-[#78A2CC] text-white py-6 rounded-[32px] font-black anime-title text-sm tracking-[0.25em] shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-4 uppercase"
                    >
                        <Layers size={22} /> 
                        <span>[ Start Mixed Flashcards ]</span>
                    </button>
                    
                    <button 
                        onClick={() => setIsConfiguring(true)} 
                        className="flex items-center justify-center gap-2.5 py-4 text-[11px] font-black uppercase tracking-[0.25em] text-[#4A4E69]/30 hover:text-[#78A2CC] transition-all bg-[#FAF9F6] rounded-[24px]"
                    >
                      <SlidersHorizontal size={14} /> 
                      Session Settings
                    </button>
                </div>

                {showNoItemsError && (
                  <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-[#4A4E69]/40 backdrop-blur-md">
                    <div className="absolute inset-0" onClick={() => setShowNoItemsError(false)} />
                    <div className="relative bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl animate-soft-in text-center space-y-6">
                      <div className="w-20 h-20 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-full flex items-center justify-center mx-auto">
                        <Ghost size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-[#4A4E69] anime-title uppercase">Empty Dojo</h3>
                        <p className="text-xs font-bold text-[#4A4E69]/50 leading-relaxed">
                          No items match your current session filters. Try adjusting the JLPT levels or sources in settings!
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setShowNoItemsError(false);
                          setIsConfiguring(true);
                        }}
                        className="w-full py-4 bg-[#78A2CC] text-white rounded-2xl font-black anime-title text-[10px] uppercase tracking-widest shadow-lg"
                      >
                        Open Settings
                      </button>
                    </div>
                  </div>
                )}
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

  // Writing Dojo Mode
  if (sessionMode === 'writing') {
    const kanji = item as KanjiItem;
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 bg-[#FAF9F6] relative overflow-hidden">
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none hidden lg:block">
            <ShibaMascot size="sm" message={mascotMessage} className="pointer-events-auto" />
        </div>

        <div className="w-full max-w-xl flex justify-between items-center mb-4 relative z-10">
             <div className="flex items-center gap-4">
                <div className="px-4 py-1.5 bg-white border border-[#4A4E69]/5 rounded-xl text-[9px] font-black anime-title tracking-widest shadow-sm flex items-center gap-2">
                    <BarChart3 size={12} className="text-[#78A2CC]" />
                    {currentIndex + 1} / {sessionItems.length}
                </div>
             </div>
             <button onClick={() => setSessionStarted(false)} className="px-3 py-1.5 bg-[#FFB7C5]/20 text-[#FFB7C5] rounded-lg text-[8px] font-black uppercase tracking-widest">EXIT</button>
        </div>

        <div className="w-full max-w-[min(95vw,780px)] grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch animate-soft-in relative z-10">
           {/* Prompt Side */}
           <div className="bg-white border border-[#4A4E69]/10 rounded-[32px] shadow-xl p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[320px] md:min-h-[380px]">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-[#4A4E69]/30 uppercase tracking-[0.3em] block">DRAW THIS KANJI:</span>
                <h1 className="text-xl md:text-2xl font-black text-[#4A4E69] uppercase tracking-tight">{kanji.meaning}</h1>
              </div>
              
              <div className="w-full space-y-3 pt-3 border-t border-[#4A4E69]/5">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[8px] font-black text-[#4A4E69]/40 uppercase tracking-widest">Readings</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {kanji.onyomi && <span className="px-2.5 py-1 bg-[#78A2CC]/10 text-[#78A2CC] rounded-lg text-[10px] font-black jp-text">{kanji.onyomi}</span>}
                  {kanji.kunyomi && <span className="px-2.5 py-1 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-lg text-[10px] font-black jp-text">{kanji.kunyomi}</span>}
                </div>
              </div>

              <div className={clsx(
                "mt-4 p-4 rounded-2xl transition-all duration-500 w-full",
                isFlipped ? "bg-[#B4E4C3]/10 border-2 border-[#B4E4C3]" : "bg-[#FAF9F6] border-2 border-transparent"
              )}>
                {isFlipped ? (
                  <div className="animate-soft-in flex flex-col items-center">
                    <span className="text-[8px] font-black text-[#B4E4C3] uppercase tracking-widest mb-1">Reference</span>
                    <span className="text-6xl font-black text-[#4A4E69] jp-text leading-none">{kanji.character}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-3 bg-[#4A4E69]/5 text-[#4A4E69]/40 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#4A4E69]/10 transition-all"
                  >
                    Show Character
                  </button>
                )}
              </div>
           </div>

           {/* Canvas Side */}
           <div className="h-[320px] md:h-auto min-h-[320px] md:min-h-[380px]">
              <KanjiCanvas />
           </div>
        </div>

        {/* Action Buttons */}
        <div className={clsx(
            "mt-6 grid grid-cols-3 gap-3 w-full max-w-[min(90vw,420px)] transition-all duration-500 relative z-10",
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4"
        )}>
            <button 
                disabled={isTransitioning}
                onClick={() => handleResult(ReviewResult.FORGOT, 'Forgot', 'Reveal')}
                className="group p-3 bg-white border border-[#4A4E69]/5 rounded-2xl shadow-lg hover:bg-[#FFB7C5]/10 flex flex-col items-center gap-1.5"
            >
                <div className="p-2.5 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-xl"><X size={16} /></div>
                <span className="font-black text-[7px] uppercase tracking-widest text-[#4A4E69]/40">Forgot [1]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={() => handleResult(ReviewResult.HARD, 'Hard', 'Reveal')}
                className="group p-3 bg-white border border-[#4A4E69]/5 rounded-2xl shadow-lg hover:bg-[#78A2CC]/10 flex flex-col items-center gap-1.5"
            >
                <div className="p-2.5 bg-[#78A2CC]/10 text-[#78A2CC] rounded-xl"><RefreshCw size={16} /></div>
                <span className="font-black text-[7px] uppercase tracking-widest text-[#4A4E69]/40">Hard [2]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={() => handleResult(ReviewResult.EASY, 'Easy', 'Reveal')}
                className="group p-3 bg-white border border-[#4A4E69]/5 rounded-2xl shadow-lg hover:bg-[#B4E4C3]/10 flex flex-col items-center gap-1.5"
            >
                <div className="p-2.5 bg-[#B4E4C3]/20 text-[#B4E4C3] rounded-xl"><Check size={16} /></div>
                <span className="font-black text-[7px] uppercase tracking-widest text-[#4A4E69]/40">Easy [3]</span>
            </button>
        </div>
      </div>
    );
  }

  // Conjugator UI Mode
  if (sessionMode === 'conjugator' && targetForm) {
    const vocab = item as VocabItem;
    const isCorrect = showFeedback === 'correct';
    const isIncorrect = showFeedback === 'incorrect';

    return (
      <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 bg-[#FAF9F6] relative overflow-hidden">
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none hidden lg:block">
            <ShibaMascot size="sm" message={mascotMessage} className="pointer-events-auto" />
        </div>

        <div className="w-full max-w-xl flex justify-between items-center mb-4 relative z-10">
             <div className="flex items-center gap-4">
                <div className="px-4 py-1.5 bg-white border border-[#4A4E69]/5 rounded-xl text-[9px] font-black anime-title tracking-widest shadow-sm flex items-center gap-2">
                    <BarChart3 size={12} className="text-[#78A2CC]" />
                    {currentIndex + 1} / {sessionItems.length}
                </div>
                {combo > 1 && (
                  <div className="px-3 py-1.5 bg-[#FFB7C5] text-white rounded-xl text-[9px] font-black anime-title tracking-widest shadow-md animate-wiggle flex items-center gap-2">
                    <Zap size={12} /> {combo}
                  </div>
                )}
             </div>
             <button onClick={() => setSessionStarted(false)} className="px-3 py-1.5 bg-[#FFB7C5]/20 text-[#FFB7C5] rounded-lg text-[8px] font-black uppercase tracking-widest">EXIT</button>
        </div>

        <div className="w-full max-w-[min(90vw,420px)] bg-white border border-[#4A4E69]/10 rounded-[32px] shadow-2xl p-6 md:p-8 relative overflow-hidden animate-soft-in z-10">
           {/* Success/Error overlays */}
           {isCorrect && (
             <div className="absolute inset-0 bg-[#B4E4C3]/10 backdrop-blur-[2px] z-20 flex items-center justify-center animate-soft-in">
                <div className="p-5 bg-white rounded-full shadow-2xl scale-110">
                   <Check size={40} className="text-[#B4E4C3]" />
                </div>
             </div>
           )}

           <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div>
                <span className="px-2.5 py-0.5 bg-[#78A2CC]/10 text-[#78A2CC] rounded-full text-[8px] font-black uppercase tracking-[0.2em] mb-2 inline-block">
                  {vocab.partOfSpeech}
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-[#4A4E69] jp-text mb-0.5">{vocab.word}</h1>
                <p className="text-[11px] font-bold text-[#4A4E69]/40 uppercase tracking-widest">{vocab.meaning}</p>
              </div>

              <div className="w-full p-4 bg-[#FAF9F6] rounded-[24px] border border-[#4A4E69]/5 space-y-2.5">
                 <div>
                    <span className="text-[8px] font-black text-[#4A4E69]/30 uppercase tracking-[0.3em] mb-1 block">CONJUGATE TO:</span>
                    <h2 className="text-base font-black text-[#78A2CC] anime-title uppercase tracking-tighter">{targetForm.label}</h2>
                 </div>

                 <form onSubmit={checkConjugation} className="space-y-2.5">
                    <input 
                      ref={inputRef}
                      value={userInput}
                      disabled={showFeedback !== 'none'}
                      onChange={e => setUserInput(e.target.value)}
                      placeholder="Type Hiragana or Romaji..."
                      className={clsx(
                        "w-full p-3 text-center text-base font-black jp-text rounded-xl outline-none border-4 transition-all shadow-inner",
                        showFeedback === 'none' ? "bg-white border-transparent focus:border-[#78A2CC]/20" : "",
                        isCorrect ? "bg-[#B4E4C3]/10 border-[#B4E4C3] text-[#4A4E69]" : "",
                        isIncorrect ? "bg-[#FFB7C5]/10 border-[#FFB7C5] text-[#FFB7C5]" : ""
                      )}
                    />
                    
                    {isIncorrect && (
                      <div className="animate-soft-in">
                        <p className="text-[8px] font-black text-[#FFB7C5] uppercase mb-0.5 tracking-widest">Correct Form:</p>
                        <p className="text-base font-black text-[#4A4E69] jp-text">{(vocab as any)[targetForm.key]}</p>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={showFeedback !== 'none'}
                      className="w-full py-3 bg-[#78A2CC] text-white rounded-xl font-black anime-title tracking-widest shadow-lg active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all uppercase text-[9px]"
                    >
                      {showFeedback === 'none' ? 'Check Answer' : 'Processing...'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Default Flashcard Mode
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 bg-[#FAF9F6] relative overflow-hidden">
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none hidden lg:block">
            <ShibaMascot size="sm" message={mascotMessage} className="pointer-events-auto" />
        </div>

        <div className="w-full max-w-xl flex justify-between items-center mb-4 relative z-10">
             <div className="px-4 py-1.5 bg-white border border-[#4A4E69]/5 rounded-xl text-[9px] font-black anime-title tracking-widest shadow-sm flex items-center gap-2">
                <BarChart3 size={12} className="text-[#78A2CC]" />
                {currentIndex + 1} / {sessionItems.length}
             </div>
             <button onClick={() => setSessionStarted(false)} className="px-3 py-1.5 bg-[#FFB7C5]/20 text-[#FFB7C5] rounded-lg text-[8px] font-black uppercase tracking-widest">EXIT</button>
        </div>

        <div 
            className="perspective-1000 w-full max-w-[min(90vw,420px)] h-[min(55vh,360px)] cursor-pointer group mb-8 relative z-10"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={clsx(
                "relative w-full h-full duration-500 preserve-3d transition-transform",
                isFlipped ? "rotate-y-minus-180" : ""
            )}>
                {/* Front Side */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6 bg-white border border-[#4A4E69]/5 rounded-[32px] shadow-xl overflow-hidden">
                     <div className="absolute top-4 left-4 flex flex-col items-start gap-1">
                        <span className="text-[8px] font-black bg-[#78A2CC] text-white px-2 py-0.5 rounded-md">{item.jlpt}</span>
                        {item.source && <span className="text-[7px] font-black text-[#78A2CC]/50 bg-[#78A2CC]/5 px-1.5 py-0.5 rounded border border-[#78A2CC]/10 uppercase tracking-tighter truncate max-w-[80px]">{item.source}</span>}
                     </div>
                     <div className="flex flex-col items-center w-full px-4 text-center">
                        <h1 className="text-3xl md:text-5xl font-black text-[#4A4E69] jp-text break-words line-clamp-3">
                           {'word' in item ? item.word : 'character' in item ? item.character : item.rule}
                        </h1>
                     </div>
                     <div className="absolute bottom-4 flex items-center gap-1.5 opacity-30">
                        <TrendingUp size={10} />
                        <p className="text-[#4A4E69] text-[7px] font-black uppercase tracking-[0.3em]">[ Tap to Reveal ]</p>
                     </div>
                </div>

                {/* Back Side - Rotating in opposite direction */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-minus-180 flex flex-col items-center justify-center p-6 bg-[#78A2CC] border border-[#4A4E69]/10 rounded-[32px] shadow-2xl overflow-hidden">
                    <div className="w-full text-center space-y-4 relative z-10 text-white animate-soft-in">
                        {/* Readings for Vocab or Kanji */}
                        {item.type === DataType.VOCAB && 'reading' in item && (
                            <div className="bg-white/10 p-3 rounded-[20px] border border-white/20 inline-block mb-1">
                                <p className="text-xl md:text-3xl font-black jp-text tracking-tighter">{item.reading}</p>
                            </div>
                        )}
                        {item.type === DataType.KANJI && (
                            <div className="flex flex-wrap justify-center gap-2 mb-1">
                                {(item as KanjiItem).onyomi && (
                                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 min-w-[80px]">
                                        <span className="text-[7px] font-black uppercase tracking-widest block opacity-60 mb-0.5">On</span>
                                        <p className="text-lg md:text-xl font-black jp-text">{(item as KanjiItem).onyomi}</p>
                                    </div>
                                )}
                                {(item as KanjiItem).kunyomi && (
                                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 min-w-[80px]">
                                        <span className="text-[7px] font-black uppercase tracking-widest block opacity-60 mb-0.5">Kun</span>
                                        <p className="text-lg md:text-xl font-black jp-text">{(item as KanjiItem).kunyomi}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="px-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                            <div className="text-lg md:text-xl font-black uppercase leading-tight whitespace-pre-wrap">
                                {'meaning' in item ? item.meaning : item.explanation}
                            </div>
                            
                            {/* NEW: Show Usage Notes in review if it is a grammar item */}
                            {item.type === DataType.GRAMMAR && (item as GrammarItem).usageNotes && (
                                <div className="mt-3 p-3 bg-white/10 rounded-xl text-left border border-white/20">
                                    <div className="flex items-center gap-1.5 mb-0.5 opacity-60">
                                        <Info size={8} />
                                        <span className="text-[7px] font-black uppercase tracking-widest">{STRINGS.grammar.usageNotesLabel}</span>
                                    </div>
                                    <p className="text-[10px] font-bold leading-relaxed whitespace-pre-wrap italic">
                                        {(item as GrammarItem).usageNotes}
                                    </p>
                                </div>
                            )}

                            {/* RENDER EXTERNAL LINKS IN REVIEW BACK */}
                            {item.type === DataType.GRAMMAR && (item as GrammarItem).externalLinks && ((item as GrammarItem).externalLinks?.length || 0) > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-3 justify-center">
                                  {(item as GrammarItem).externalLinks?.map((link, i) => (
                                    <a 
                                      key={i} 
                                      href={link.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 rounded-lg text-[9px] font-black text-white hover:bg-white hover:text-[#78A2CC] transition-all shadow-sm"
                                    >
                                      <ExternalLink size={8} />
                                      {link.label}
                                    </a>
                                  ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className={clsx(
            "mt-6 grid grid-cols-3 gap-3 w-full max-w-[min(90vw,420px)] transition-all duration-500 relative z-10",
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4"
        )}>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.FORGOT, 'Forgot', 'Reveal'); }}
                className="group p-3 bg-white border border-[#4A4E69]/5 rounded-2xl shadow-lg hover:bg-[#FFB7C5]/10 flex flex-col items-center gap-1.5"
            >
                <div className="p-2.5 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-xl"><X size={16} /></div>
                <span className="font-black text-[7px] uppercase tracking-widest text-[#4A4E69]/40">Forgot [1]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.HARD, 'Hard', 'Reveal'); }}
                className="group p-3 bg-white border border-[#4A4E69]/5 rounded-2xl shadow-lg hover:bg-[#78A2CC]/10 flex flex-col items-center gap-1.5"
            >
                <div className="p-2.5 bg-[#78A2CC]/10 text-[#78A2CC] rounded-xl"><RefreshCw size={16} /></div>
                <span className="font-black text-[7px] uppercase tracking-widest text-[#4A4E69]/40">Hard [2]</span>
            </button>
            <button 
                disabled={isTransitioning}
                onClick={(e) => { e.stopPropagation(); handleResult(ReviewResult.EASY, 'Easy', 'Reveal'); }}
                className="group p-3 bg-white border border-[#4A4E69]/5 rounded-2xl shadow-lg hover:bg-[#B4E4C3]/10 flex flex-col items-center gap-1.5"
            >
                <div className="p-2.5 bg-[#B4E4C3]/20 text-[#B4E4C3] rounded-xl"><Check size={16} /></div>
                <span className="font-black text-[7px] uppercase tracking-widest text-[#4A4E69]/40">Easy [3]</span>
            </button>
        </div>

        {showNoItemsError && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-[#4A4E69]/40 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setShowNoItemsError(false)} />
            <div className="relative bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl animate-soft-in text-center space-y-6">
              <div className="w-20 h-20 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-full flex items-center justify-center mx-auto">
                <Ghost size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#4A4E69] anime-title uppercase">Empty Dojo</h3>
                <p className="text-xs font-bold text-[#4A4E69]/50 leading-relaxed">
                  No items match your current session filters. Try adjusting the JLPT levels or sources in settings!
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowNoItemsError(false);
                  setIsConfiguring(true);
                }}
                className="w-full py-4 bg-[#78A2CC] text-white rounded-2xl font-black anime-title text-[10px] uppercase tracking-widest shadow-lg"
              >
                Open Settings
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default Review;
