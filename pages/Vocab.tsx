import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { Plus, Search, Edit2, Trash2, Check, X, Book, RotateCcw, ArrowUpDown, Sparkles, ChevronDown, ChevronUp, Trophy, Tag, Eye } from 'lucide-react';
import { DataType, LearningStage, ReviewResult, VocabItem } from '../types';
import { STRINGS } from '../constants/strings';
import { fuzzySearch } from '../utils/textHelper';
import { ShibaMascot } from '../components/ShibaMascot';
import clsx from 'clsx';

const POS_OPTIONS = [
    'Noun', 'Godan Verb', 'Ichidan Verb', 'Suru Verb', 'I-Adjective', 'Na-Adjective', 
    'Adverb', 'Particle', 'Expression', 'Other'
];

const VERB_FORMS = [
  { key: 'te', label: 'Te-form' },
  { key: 'nai', label: 'Nai-form' },
  { key: 'masu', label: 'Masu-form' },
  { key: 'ta', label: 'Ta-form (Past)' },
  { key: 'potential', label: 'Potential' },
  { key: 'volitional', label: 'Volitional' },
  { key: 'passive', label: 'Passive' },
  { key: 'causative', label: 'Causative' }
];

const ADJECTIVE_FORMS = [
  { key: 'te', label: 'Te-form' },
  { key: 'nai', label: 'Negative' },
  { key: 'ta', label: 'Past Affirm.' },
  { key: 'pastNegative', label: 'Past Neg.' },
  { key: 'adverbial', label: 'Adverbial' },
  { key: 'conditional', label: 'Conditional' },
  { key: 'nounForm', label: 'Noun Form' }
];

const EMPTY_FORM: Omit<VocabItem, 'id'> = {
  word: '', reading: '', meaning: '', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1', source: '',
  te: '', nai: '', masu: '', ta: '', potential: '', volitional: '', passive: '', causative: '',
  pastNegative: '', adverbial: '', nounForm: '', conditional: ''
};

const GRID_COLS = "grid-cols-[48px_1.4fr_0.9fr_1.3fr_110px_100px]";

// Optimized list item component with expansion for conjugations
const VocabItemRow = React.memo(({ 
  item, 
  mastery, 
  stage, 
  onEdit, 
  onDelete 
}: { 
  item: VocabItem; 
  mastery: number; 
  stage: LearningStage; 
  onEdit: (e: React.MouseEvent, item: VocabItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusStyle = (stage: LearningStage) => {
    switch (stage) {
      case LearningStage.MASTERED: return 'bg-[#B4E4C3]/30 text-[#4A4E69] border-[#B4E4C3]';
      case LearningStage.REVIEW: return 'bg-[#78A2CC]/20 text-[#4A4E69] border-[#78A2CC]';
      case LearningStage.LEARNING: return 'bg-[#FFB7C5]/20 text-[#4A4E69] border-[#FFB7C5]';
      default: return 'bg-white text-[#4A4E69]/40 border-[#4A4E69]/10';
    }
  };

  const getPOSStyle = (pos: string) => {
    const lowerPos = pos.toLowerCase();
    if (lowerPos.includes('verb')) return 'bg-[#78A2CC]/10 text-[#78A2CC] border-[#78A2CC]/20';
    if (lowerPos.includes('adjective')) return 'bg-[#FFB7C5]/10 text-[#FFB7C5] border-[#FFB7C5]/20';
    if (lowerPos.includes('noun')) return 'bg-[#B4E4C3]/20 text-[#4A4E69] border-[#B4E4C3]/20';
    return 'bg-white text-[#4A4E69]/40 border-[#4A4E69]/10';
  };

  const isVerb = item.partOfSpeech.toLowerCase().includes('verb');
  const isAdjective = item.partOfSpeech.toLowerCase().includes('adjective');
  const formsToDisplay = isVerb ? VERB_FORMS : isAdjective ? ADJECTIVE_FORMS : [];
  const hasConjugations = formsToDisplay.some(f => !!(item as any)[f.key]);

  return (
    <div className="flex flex-col group bg-white rounded-[28px] border border-[#4A4E69]/5 transition-all shadow-sm hover:shadow-xl relative overflow-hidden mb-4">
      <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        className={clsx("p-5 grid items-center gap-6 cursor-pointer transition-colors hover:bg-[#FAF9F6]/50", GRID_COLS)}
      >
          <div className="flex justify-center">
              <div className={clsx("w-8 h-8 rounded-full border-2 border-[#78A2CC]/10 flex items-center justify-center font-black text-[10px] text-[#78A2CC]", mastery === 100 && "bg-[#B4E4C3] border-none text-white")}>
                  {mastery === 100 ? <Check size={14} /> : `${mastery}%`}
              </div>
          </div>
          <div className="overflow-hidden min-w-0">
              <div className="text-xl font-black text-[#4A4E69] jp-text truncate mb-0.5 leading-tight">{item.word}</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[10px] font-bold text-[#4A4E69]/30 jp-text truncate uppercase tracking-wider">{item.reading}</div>
                <span className="text-[7px] font-black text-[#78A2CC] border border-[#78A2CC]/20 bg-[#78A2CC]/5 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                  {item.jlpt}
                </span>
                {hasConjugations && (
                  <span className="text-[7px] font-black text-[#B4E4C3] border border-[#B4E4C3]/20 bg-[#B4E4C3]/5 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm flex items-center gap-1">
                    <Sparkles size={8} /> Forms
                  </span>
                )}
              </div>
          </div>
          <div className="flex items-center min-w-0 justify-center">
              <span className={clsx("px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border truncate text-center shadow-sm", getPOSStyle(item.partOfSpeech))}>
                  {item.partOfSpeech}
              </span>
          </div>
          <div className="hidden lg:block overflow-hidden"><p className="text-sm font-bold text-[#4A4E69]/60 truncate">{item.meaning}</p></div>
          <div className="flex items-center justify-center"><div className={clsx("w-full py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border text-center shadow-sm", getStatusStyle(stage))}>{stage}</div></div>
          <div className="flex justify-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); onEdit(e, item); }} className="p-2 bg-[#FAF9F6] text-[#4A4E69]/20 hover:text-[#78A2CC] rounded-xl transition-all"><Edit2 size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(e, item.id); }} className="p-2 bg-[#FAF9F6] text-[#4A4E69]/20 hover:text-[#FFB7C5] rounded-xl transition-all"><Trash2 size={16} /></button>
          </div>
      </div>

      {isExpanded && (
        <div className="px-10 pb-8 pt-2 border-t border-[#4A4E69]/5 animate-soft-in">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {formsToDisplay.map(form => {
                const val = (item as any)[form.key];
                if (!val) return null;
                return (
                  <div key={form.key} className="space-y-1">
                    <span className="text-[8px] font-black text-[#4A4E69]/30 uppercase tracking-widest">{form.label}</span>
                    <p className="text-sm font-black text-[#4A4E69] jp-text">{val}</p>
                  </div>
                );
              })}
           </div>
           {!hasConjugations && <p className="text-[10px] italic text-[#4A4E69]/30">No special forms registered.</p>}
        </div>
      )}
    </div>
  );
});

const Vocab: React.FC = () => {
  const { vocabData, addVocab, updateVocab, deleteVocab, getLearningStage, getMasteryPercentage, logReview, resetItemStats } = useFileSystem();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPOS, setFilterPOS] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [sortBy, setSortBy] = useState<'id' | 'mastery_asc' | 'mastery_desc'>('id');
  const [formData, setFormData] = useState<Omit<VocabItem, 'id'>>(EMPTY_FORM);

  const [showFAB, setShowFAB] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowFAB(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const sources = useMemo(() => {
    const s = new Set<string>();
    vocabData.forEach(v => v.source && s.add(v.source));
    return Array.from(s).sort();
  }, [vocabData]);

  const handleEdit = useCallback((e: React.MouseEvent, item: VocabItem) => {
    e.stopPropagation();
    setFormData({ ...item });
    setEditingId(item.id);
    setIsFormOpen(true);
  }, []);

  const handleResetProgress = async () => {
    if (!editingId) return;
    if (window.confirm("Reset training progress for this word?")) {
        await resetItemStats(DataType.VOCAB, editingId);
        setIsFormOpen(false);
    }
  };

  const handleMarkMastered = async () => {
      if (!editingId) return;
      await logReview(DataType.VOCAB, editingId, ReviewResult.MASTERED);
      setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await updateVocab({ ...formData, id: editingId });
    else await addVocab(formData);
    setFormData(EMPTY_FORM);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const filteredData = useMemo(() => {
    let data = vocabData.filter(v => {
        const matchSearch = fuzzySearch(searchTerm, v.word, v.meaning, v.reading, v.source);
        const matchLevel = filterLevel === 'All' || v.jlpt === filterLevel;
        const matchStatus = filterStatus === 'All' || getLearningStage(DataType.VOCAB, v.id) === filterStatus;
        const matchPOS = filterPOS === 'All' || v.partOfSpeech === filterPOS;
        const matchSource = filterSource === 'All' || v.source === filterSource;
        return matchSearch && matchLevel && matchStatus && matchPOS && matchSource;
    });
    return data.sort((a, b) => {
        if (sortBy === 'mastery_asc') return getMasteryPercentage(DataType.VOCAB, a.id) - getMasteryPercentage(DataType.VOCAB, b.id);
        if (sortBy === 'mastery_desc') return getMasteryPercentage(DataType.VOCAB, b.id) - getMasteryPercentage(DataType.VOCAB, a.id);
        return parseInt(b.id) - parseInt(a.id);
    });
  }, [vocabData, searchTerm, filterLevel, filterStatus, filterPOS, filterSource, sortBy, getMasteryPercentage, getLearningStage]);

  const scrollToFilters = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsExpanded(false);
    setTimeout(() => searchInputRef.current?.focus(), 500);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
    setIsExpanded(false);
  };

  return (
    <div className="p-7 md:p-11 pt-28 md:pt-36 max-w-7xl mx-auto space-y-9 animate-soft-in">
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-1 pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#4A4E69]/5 pb-8">
        <div className="flex items-center gap-6">
          <ShibaMascot size="sm" message={STRINGS.mascot.vocab} />
          <div>
            <h2 className="text-2xl font-black text-[#4A4E69] anime-title flex items-center gap-4">
                <div className="p-2 bg-[#78A2CC]/10 rounded-xl text-[#78A2CC]"><Book size={24} /></div>
                {STRINGS.vocab.title}
            </h2>
            <p className="text-[10px] font-black text-[#4A4E69]/30 uppercase tracking-[0.45em] mt-3">{STRINGS.vocab.subtitle}</p>
          </div>
        </div>
        
        <button onClick={handleOpenAdd} className="w-full md:w-auto px-8 py-3.5 rounded-2xl font-black anime-title text-[11px] tracking-[0.15em] transition-all bg-[#78A2CC] text-white border-b-4 border-[#608cb8]">
          <Plus size={16} className="mr-2 inline"/> {STRINGS.vocab.addBtn}
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#4A4E69]/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8 rounded-[40px] shadow-2xl relative z-10 border border-[#4A4E69]/10 animate-soft-in">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 p-3 bg-[#FAF9F6] rounded-2xl text-[#4A4E69]/20 hover:text-[#FFB7C5] transition-all"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#78A2CC] text-white rounded-[20px] shadow-lg"><Book size={28} /></div>
                <h3 className="text-xl font-black text-[#4A4E69] anime-title uppercase">{editingId ? "Edit Record" : "Add Vocabulary"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Word (Kanji/Kana)</label>
                    <input value={formData.word} onChange={e => setFormData({...formData, word: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none text-black font-black jp-text text-xl shadow-sm" required />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Reading (Furigana)</label>
                    <input value={formData.reading} onChange={e => setFormData({...formData, reading: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none font-bold jp-text shadow-sm" required />
                </div>
              </div>
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Meaning</label>
                  <input value={formData.meaning} onChange={e => setFormData({...formData, meaning: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none font-bold shadow-sm" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Part of Speech</label>
                    <select value={formData.partOfSpeech} onChange={e => setFormData({...formData, partOfSpeech: e.target.value})} className="w-full p-4 bg-[#FAF9F6] rounded-xl outline-none font-bold text-sm shadow-sm">
                        {POS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">JLPT Level</label>
                    <select value={formData.jlpt} onChange={e => setFormData({...formData, jlpt: e.target.value})} className="w-full p-4 bg-[#FAF9F6] rounded-xl outline-none font-bold text-sm shadow-sm">
                        {['N5','N4','N3','N2','N1'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Source / Textbook</label>
                      <input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full p-4 bg-[#FAF9F6] rounded-xl outline-none font-bold text-xs shadow-sm" list="vocab-source-list" />
                      <datalist id="vocab-source-list">
                         {sources.map(s => <option key={s} value={s} />)}
                      </datalist>
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Chapter</label>
                      <input value={formData.chapter} onChange={e => setFormData({...formData, chapter: e.target.value})} className="w-full p-4 bg-[#FAF9F6] rounded-xl outline-none font-bold text-xs shadow-sm" />
                  </div>
              </div>

              {/* Advanced Forms / Conjugations */}
              {(formData.partOfSpeech.toLowerCase().includes('verb') || formData.partOfSpeech.toLowerCase().includes('adjective')) && (
                <div className="space-y-4 pt-4 border-t border-[#4A4E69]/5">
                   <h4 className="text-[10px] font-black text-[#78A2CC] uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Sparkles size={14}/> Inflections & Forms</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(formData.partOfSpeech.toLowerCase().includes('verb') ? VERB_FORMS : ADJECTIVE_FORMS).map(form => (
                        <div key={form.key} className="space-y-1">
                          <label className="text-[8px] font-black text-[#4A4E69]/30 uppercase tracking-widest ml-1">{form.label}</label>
                          <input 
                            value={(formData as any)[form.key] || ''} 
                            onChange={e => setFormData({...formData, [form.key]: e.target.value})} 
                            className="w-full p-3 bg-[#FAF9F6] rounded-xl outline-none font-bold jp-text text-xs shadow-inner" 
                          />
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {editingId && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button type="button" onClick={handleMarkMastered} className="flex items-center justify-center gap-2 py-3 bg-[#B4E4C3]/10 text-[#4A4E69] border border-[#B4E4C3]/30 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#B4E4C3] hover:text-white transition-all">
                    <Trophy size={14} /> Mark Mastered
                  </button>
                  <button type="button" onClick={handleResetProgress} className="flex items-center justify-center gap-2 py-3 bg-[#FFB7C5]/10 text-[#FFB7C5] border border-[#FFB7C5]/30 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#FFB7C5] hover:text-white transition-all">
                    <RotateCcw size={14} /> Reset Training
                  </button>
                </div>
              )}

              <button type="submit" className="w-full py-5 bg-[#78A2CC] text-white rounded-[24px] font-black anime-title tracking-widest border-b-6 border-[#608cb8] active:translate-y-1 transition-all uppercase text-[11px]">
                  {editingId ? "Update Word" : "Add to Dictionary"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#4A4E69]/20 group-focus-within:text-[#78A2CC] transition-colors"><Search size={20} /></div>
            <input ref={searchInputRef} className="w-full pl-14 pr-8 py-5 bg-white border border-[#4A4E69]/10 rounded-2xl outline-none shadow-sm focus:shadow-xl focus:border-[#78A2CC]/20 transition-all font-bold text-lg" placeholder={STRINGS.common.searchPlaceholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
             {[
               {label: 'LEVEL', val: filterLevel, set: setFilterLevel, opts: ['All','N5','N4','N3','N2','N1']},
               {label: 'STAT', val: filterStatus, set: setFilterStatus, opts: ['All', 'new', 'learning', 'review', 'mastered']},
               {label: 'POS', val: filterPOS, set: setFilterPOS, opts: ['All', ...POS_OPTIONS]},
               {label: 'SOURCE', val: filterSource, set: setFilterSource, opts: ['All', ...sources]}
             ].map(f => (
                 <div key={f.label} className="bg-white border border-[#4A4E69]/5 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm hover:border-[#78A2CC]/20 transition-all cursor-pointer">
                     <span className="text-[9px] font-black text-[#4A4E69]/30 uppercase tracking-[0.2em]">{f.label}</span>
                     <select value={f.val} onChange={e => f.set(e.target.value)} className="bg-transparent outline-none font-black text-[#4A4E69] text-[10px] cursor-pointer max-w-[100px]">
                         {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                 </div>
             ))}
             <div className="ml-auto bg-white border border-[#4A4E69]/5 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                 <ArrowUpDown size={14} className="text-[#4A4E69]/20" />
                 <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent outline-none font-black text-[#4A4E69] text-[10px]">
                     <option value="id">Latest</option>
                     <option value="mastery_asc">Difficulty</option>
                 </select>
             </div>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        {filteredData.length > 0 ? filteredData.map(v => (
          <VocabItemRow 
            key={v.id} 
            item={v} 
            mastery={getMasteryPercentage(DataType.VOCAB, v.id)} 
            stage={getLearningStage(DataType.VOCAB, v.id)}
            onEdit={handleEdit}
            onDelete={() => { if(window.confirm(STRINGS.common.confirmDelete)) deleteVocab([v.id]); }}
          />
        )) : (
            <div className="py-40 flex flex-col items-center justify-center opacity-30">
                <Sparkles size={64} className="text-[#4A4E69] mb-6" />
                <p className="font-black anime-title text-[#4A4E69] uppercase tracking-[0.4em] text-sm">No results found</p>
            </div>
        )}
      </div>

      <div className={clsx("fixed bottom-8 right-8 z-[150] flex flex-col items-end gap-4 transition-all duration-300 transform", showFAB ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none")}>
        <div className={clsx("flex flex-col items-end gap-3 transition-all", isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
          <button onClick={scrollToFilters} className="w-12 h-12 bg-white text-[#78A2CC] rounded-full flex items-center justify-center border border-[#4A4E69]/5 hover:bg-[#78A2CC] hover:text-white transition-all"><Search size={20}/></button>
          <button onClick={handleOpenAdd} className="w-12 h-12 bg-white text-[#FFB7C5] rounded-full flex items-center justify-center border border-[#4A4E69]/5 hover:bg-[#FFB7C5] hover:text-white transition-all"><Plus size={20}/></button>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#78A2CC] hover:bg-[#608cb8] border-b-4 border-[#608cb8] active:scale-95 transition-all">
            {isExpanded ? <X size={28}/> : <Plus size={28}/>}
        </button>
      </div>
      <div className="h-10"></div>
    </div>
  );
};

export default Vocab;
