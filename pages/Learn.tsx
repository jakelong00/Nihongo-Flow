import React, { useState, useMemo } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { DataType, ReviewResult } from '../types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from '../components/ThemedIcon';
import clsx from 'clsx';

const Learn: React.FC = () => {
    const { vocabData, kanjiData, grammarData, logReview } = useFileSystem();
    const [selectedCategory, setSelectedCategory] = useState<DataType | null>(null);
    const [filterLevel, setFilterLevel] = useState<string>('All');
    const [filterChapter, setFilterChapter] = useState<string>('All');
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

    const startStudy = () => {
        let items: any[] = [];
        if (selectedCategory === DataType.VOCAB) items = vocabData;
        else if (selectedCategory === DataType.KANJI) items = kanjiData;
        else if (selectedCategory === DataType.GRAMMAR) items = grammarData;

        if (filterLevel !== 'All') {
            items = items.filter(i => i.jlpt === filterLevel);
        }
        if (filterChapter !== 'All') {
            items = items.filter(i => i.chapter === filterChapter);
        }

        if (filterLimit > 0) {
            items = items.slice(0, filterLimit);
        }

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
            alert("Marked as learned!");
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
            <div className="p-6 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{STRINGS.learn.title}</h2>
                <p className="text-slate-600 mb-6 text-sm">{STRINGS.learn.subtitle}</p>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-base mb-4">{STRINGS.learn.filterTitle}</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">{STRINGS.learn.selectCategory}</label>
                            <div className="flex gap-2">
                                {[DataType.VOCAB, DataType.KANJI, DataType.GRAMMAR].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedCategory(type)}
                                        className={clsx(
                                            "flex-1 py-2 px-3 rounded-lg border capitalize font-medium transition-all text-sm",
                                            selectedCategory === type 
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                                                : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedCategory && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">{STRINGS.learn.filterLevel}</label>
                                    <select 
                                        value={filterLevel} 
                                        onChange={e => setFilterLevel(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="All">{STRINGS.learn.allLevels}</option>
                                        {['N5','N4','N3','N2','N1'].map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">{STRINGS.learn.filterChapter}</label>
                                    <select 
                                        value={filterChapter} 
                                        onChange={e => setFilterChapter(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="All">{STRINGS.learn.allChapters}</option>
                                        {availableChapters.map(c => <option key={c} value={c}>Ch. {c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">{STRINGS.learn.filterLimit}</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={filterLimit} 
                                        onChange={e => setFilterLimit(parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            disabled={!selectedCategory}
                            onClick={startStudy}
                            className="w-full py-3 mt-2 bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 disabled:shadow-none transition-all text-sm"
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
        <div className="p-4 max-w-3xl mx-auto flex flex-col items-center h-full justify-center">
            <div className="w-full flex justify-between items-center mb-4">
                <button onClick={() => setIsStudying(false)} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                     &larr; Back to Filters
                </button>
                <span className="font-mono text-slate-400 text-xs">{currentIndex + 1} / {studyItems.length}</span>
            </div>

            {/* Study Card */}
            <div 
                className="perspective-1000 w-full h-80 cursor-pointer group mb-6"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={clsx(
                    "relative w-full h-full duration-500 preserve-3d transition-transform shadow-xl rounded-2xl bg-white border border-slate-200",
                    isFlipped ? "rotate-y-180" : ""
                )}>
                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 relative">
                        {/* Metadata Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <span className="text-[10px] font-mono text-slate-400">#{item.id}</span>
                            <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">{item.jlpt}</span>
                            {item.chapter && <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Ch. {item.chapter}</span>}
                        </div>

                        <h1 className="text-5xl font-bold text-slate-900 jp-text text-center">
                            {item.word || item.character || item.rule}
                        </h1>
                        <p className="mt-6 text-slate-400 text-xs">{STRINGS.learn.flip}</p>
                    </div>

                    {/* Back */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl overflow-y-auto">
                        <div className="text-center w-full">
                            {(item.reading) && <p className="text-xl text-slate-600 jp-text mb-2">{item.reading}</p>}
                            {(item.onyomi) && <p className="text-slate-600 mb-1 text-sm">On: {item.onyomi}</p>}
                            {(item.kunyomi) && <p className="text-slate-600 mb-2 text-sm">Kun: {item.kunyomi}</p>}
                            
                            <p className="text-lg font-medium text-slate-800">{item.meaning || item.explanation}</p>
                            
                            {item.examples && item.examples.length > 0 && (
                                <ul className="mt-4 text-left list-disc list-inside bg-white p-3 rounded-lg border border-slate-100 text-slate-600 italic text-sm">
                                    {(item.examples as string[]).map((ex: string, i: number) => <li key={i}>{ex}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full justify-between">
                <button 
                    onClick={prevItem} 
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-sm"
                >
                    <ThemedIcon iconKey="arrowLeft" Fallback={ChevronLeft} size={16} /> {STRINGS.learn.prev}
                </button>

                <button 
                    onClick={handleMarkMastered}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-sm"
                >
                    <ThemedIcon iconKey="actionCheck" Fallback={Check} size={16} /> Mastered
                </button>

                <button 
                    onClick={nextItem} 
                    disabled={currentIndex === studyItems.length - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm"
                >
                    {STRINGS.learn.next} <ThemedIcon iconKey="arrowRight" Fallback={ChevronRight} size={16} />
                </button>
            </div>
        </div>
    );
};

export default Learn;