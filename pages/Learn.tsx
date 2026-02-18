import React, { useState, useMemo } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { DataType, ReviewResult } from '../types';
import { ChevronLeft, ChevronRight, Check, Tag } from 'lucide-react';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from '../components/ThemedIcon';
import clsx from 'clsx';

const Learn: React.FC = () => {
    const { vocabData, kanjiData, grammarData, logReview } = useFileSystem();
    const [selectedCategory, setSelectedCategory] = useState<DataType | null>(null);
    const [filterLevel, setFilterLevel] = useState<string>('All');
    const [filterChapter, setFilterChapter] = useState<string>('All');
    const [filterSource, setFilterSource] = useState<string>('All');
    const [filterLimit, setFilterLimit] = useState<number>(0);
    const [isStudying, setIsStudying] = useState(false);
    const [studyItems, setStudyItems] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const availableChapters = useMemo(() => {
        let items: any[] = [];
        if (selectedCategory === DataType.VOCAB) items = vocabData;
        if (selectedCategory === DataType.KANJI) items = kanjiData;
        if (selectedCategory === DataType.GRAMMAR) items = grammarData;
        
        const chapters = new Set<string>();
        items.forEach(i => i.chapter && chapters.add(i.chapter));
        return Array.from(chapters).sort((a, b) => parseInt(a) - parseInt(b));
    }, [selectedCategory, vocabData, kanjiData, grammarData]);

    const availableSources = useMemo(() => {
        let items: any[] = [];
        if (selectedCategory === DataType.VOCAB) items = vocabData;
        if (selectedCategory === DataType.KANJI) items = kanjiData;
        if (selectedCategory === DataType.GRAMMAR) items = grammarData;
        
        const s = new Set<string>();
        items.forEach(i => i.source && s.add(i.source));
        return Array.from(s).sort();
    }, [selectedCategory, vocabData, kanjiData, grammarData]);

    const startStudy = () => {
        let items: any[] = [];
        if (selectedCategory === DataType.VOCAB) items = vocabData;
        else if (selectedCategory === DataType.KANJI) items = kanjiData;
        else if (selectedCategory === DataType.GRAMMAR) items = grammarData;

        if (filterLevel !== 'All') items = items.filter(i => i.jlpt === filterLevel);
        if (filterChapter !== 'All') items = items.filter(i => i.chapter === filterChapter);
        if (filterSource !== 'All') items = items.filter(i => i.source === filterSource);
        if (filterLimit > 0) items = items.slice(0, filterLimit);

        if (items.length === 0) {
            alert(STRINGS.common.noItems);
            return;
        }

        setStudyItems(items);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsStudying(true);
    };

    const handleMarkMastered = async () => {
        const item = studyItems[currentIndex];
        if (selectedCategory && item.id) {
            await logReview(selectedCategory, item.id, ReviewResult.MASTERED);
        }
    };

    const nextItem = () => {
        if (currentIndex < studyItems.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(c => c + 1);
        }
    };

    const prevItem = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex(c => c - 1);
        }
    };

    if (!isStudying) {
        return (
            <div className="p-6 pt-24 max-w-4xl mx-auto min-h-full overflow-y-auto">
                <h2 className="text-2xl font-bold text-[#4A4E69] mb-1">{STRINGS.learn.title}</h2>
                <p className="text-slate-600 mb-6 text-sm">{STRINGS.learn.subtitle}</p>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#4A4E69]/40 mb-6">{STRINGS.learn.filterTitle}</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#4A4E69]/30 mb-3">{STRINGS.learn.selectCategory}</label>
                            <div className="flex gap-2">
                                {[DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedCategory(type)}
                                        className={clsx(
                                            "flex-1 py-3 px-3 rounded-xl border capitalize font-black transition-all text-[11px] uppercase tracking-wider",
                                            selectedCategory === type 
                                                ? "bg-[#78A2CC] text-white border-[#78A2CC] shadow-md" 
                                                : "bg-[#FAF9F6] text-[#4A4E69]/50 border-transparent hover:bg-slate-50"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedCategory && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-soft-in">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#4A4E69]/30 mb-2">{STRINGS.learn.filterLevel}</label>
                                    <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="w-full p-3 border border-[#4A4E69]/5 rounded-xl bg-[#FAF9F6] outline-none text-xs font-black">
                                        <option value="All">{STRINGS.learn.allLevels}</option>
                                        {['N5','N4','N3','N2','N1'].map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#4A4E69]/30 mb-2">Source / Textbook</label>
                                    <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="w-full p-3 border border-[#4A4E69]/5 rounded-xl bg-[#FAF9F6] outline-none text-xs font-black">
                                        <option value="All">All Sources</option>
                                        {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#4A4E69]/30 mb-2">{STRINGS.learn.filterChapter}</label>
                                    <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} className="w-full p-3 border border-[#4A4E69]/5 rounded-xl bg-[#FAF9F6] outline-none text-xs font-black">
                                        <option value="All">{STRINGS.learn.allChapters}</option>
                                        {availableChapters.map(c => <option key={c} value={c}>Ch. {c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#4A4E69]/30 mb-2">{STRINGS.learn.filterLimit}</label>
                                    <input type="number" min="0" value={filterLimit} onChange={e => setFilterLimit(parseInt(e.target.value) || 0)} className="w-full p-3 border border-[#4A4E69]/5 rounded-xl bg-[#FAF9F6] outline-none text-xs font-black" />
                                </div>
                            </div>
                        )}

                        <button 
                            disabled={!selectedCategory}
                            onClick={startStudy}
                            className="w-full py-4 mt-2 bg-[#B4E4C3] disabled:bg-slate-300 text-[#4A4E69] font-black rounded-2xl shadow-lg hover:bg-[#a3d9b4] disabled:shadow-none transition-all text-xs uppercase tracking-widest"
                        >
                            {STRINGS.learn.startBtn}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const item = studyItems[currentIndex];

    return (
        <div className="p-6 max-w-3xl mx-auto flex flex-col items-center h-full justify-center overflow-hidden">
            <div className="w-full flex justify-between items-center mb-6">
                <button onClick={() => setIsStudying(false)} className="text-[10px] font-black uppercase tracking-widest text-[#4A4E69]/30 hover:text-[#78A2CC] transition-all">
                     &larr; BACK
                </button>
                <span className="font-black text-[#4A4E69]/30 text-[10px] uppercase tracking-widest">{currentIndex + 1} / {studyItems.length}</span>
            </div>

            <div className="perspective-1000 w-full max-w-[min(90vw,480px)] h-[min(60vh,400px)] cursor-pointer group mb-10" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={clsx("relative w-full h-full duration-500 preserve-3d transition-transform shadow-2xl rounded-[40px] bg-white border border-slate-100", isFlipped ? "rotate-y-minus-180" : "")}>
                    <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 relative">
                        <div className="absolute top-6 left-6 flex flex-col items-start gap-1.5">
                            <div className="flex gap-2">
                                <span className="text-[10px] font-black text-[#78A2CC] bg-[#78A2CC]/10 px-2.5 py-1 rounded-lg">#{item.id}</span>
                                <span className="text-[10px] font-black text-[#FFB7C5] border border-[#FFB7C5]/30 px-2.5 py-1 rounded-lg uppercase">{item.jlpt}</span>
                            </div>
                            {item.source && <span className="text-[8px] font-black text-[#4A4E69]/30 uppercase tracking-widest bg-[#FAF9F6] px-2 py-0.5 rounded border border-[#4A4E69]/5">{item.source}</span>}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-[#4A4E69] jp-text text-center px-4 leading-tight break-words line-clamp-3">
                            {item.word || item.character || item.rule}
                        </h1>
                        <p className="absolute bottom-6 text-[#4A4E69]/20 text-[9px] font-black uppercase tracking-[0.4em]">{STRINGS.learn.flip}</p>
                    </div>

                    <div className="absolute w-full h-full backface-hidden rotate-y-minus-180 flex flex-col items-center justify-center p-10 bg-[#FAF9F6] rounded-[40px] overflow-y-auto custom-scrollbar">
                        <div className="text-center w-full space-y-4">
                            {(item.reading) && <p className="text-2xl md:text-3xl font-black text-[#4A4E69] jp-text mb-2 tracking-tighter">{item.reading}</p>}
                            <p className="text-xl md:text-2xl font-black text-[#4A4E69]/70 leading-tight uppercase">{item.meaning || item.explanation}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full max-w-xl justify-between">
                <button onClick={prevItem} disabled={currentIndex === 0} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-[#4A4E69]/5 text-[#4A4E69] hover:bg-[#FAF9F6] disabled:opacity-30 text-[10px] font-black uppercase tracking-widest shadow-sm">
                    <ThemedIcon iconKey="arrowLeft" Fallback={ChevronLeft} size={14} /> {STRINGS.learn.prev}
                </button>
                <button onClick={handleMarkMastered} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#B4E4C3]/20 text-[#4A4E69] border border-[#B4E4C3]/30 hover:bg-[#B4E4C3] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
                    <Check size={14} /> MASTERED
                </button>
                <button onClick={nextItem} disabled={currentIndex === studyItems.length - 1} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#78A2CC] text-white hover:bg-[#6b95c2] disabled:opacity-30 text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {STRINGS.learn.next} <ThemedIcon iconKey="arrowRight" Fallback={ChevronRight} size={14} />
                </button>
            </div>
        </div>
    );
};

export default Learn;