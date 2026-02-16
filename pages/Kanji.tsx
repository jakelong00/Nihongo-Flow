
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { Plus, Search, Trash2, Edit2, Check, X, RotateCcw, ArrowUpDown, Sparkles, Languages, Trophy } from 'lucide-react';
import { DataType, KanjiItem, LearningStage, ReviewResult } from '../types';
import { STRINGS } from '../constants/strings';
import { fuzzySearch } from '../utils/textHelper';
import { ShibaMascot } from '../components/ShibaMascot';
import clsx from 'clsx';

const EMPTY_FORM: Omit<KanjiItem, 'id'> = {
  character: '', onyomi: '', kunyomi: '', meaning: '', jlpt: 'N5', strokes: '', chapter: '1'
};

const Kanji: React.FC = () => {
  const { kanjiData, addKanji, updateKanji, deleteKanji, getLearningStage, getMasteryPercentage, logReview, resetItemStats } = useFileSystem();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'id' | 'mastery_asc' | 'mastery_desc' | 'strokes'>('id');
  const [formData, setFormData] = useState<Omit<KanjiItem, 'id'>>(EMPTY_FORM);

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

  const handleEdit = (e: React.MouseEvent, item: KanjiItem) => {
    e.stopPropagation();
    setFormData({ ...item });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleResetProgress = async () => {
    if (!editingId) return;
    if (window.confirm("Reset training progress for this Kanji?")) {
        await resetItemStats(DataType.KANJI, editingId);
        setIsFormOpen(false);
    }
  };

  const handleMarkMastered = async () => {
      if (!editingId) return;
      await logReview(DataType.KANJI, editingId, ReviewResult.MASTERED);
      setIsFormOpen(false);
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await updateKanji({ ...formData, id: editingId });
    else await addKanji(formData);
    setFormData(EMPTY_FORM);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const filteredData = useMemo(() => {
    let data = kanjiData.filter(k => {
        const matchSearch = fuzzySearch(searchTerm, k.character, k.meaning, k.onyomi, k.kunyomi);
        const matchLevel = filterLevel === 'All' || k.jlpt === filterLevel;
        const matchStatus = filterStatus === 'All' || getLearningStage(DataType.KANJI, k.id) === filterStatus;
        return matchSearch && matchLevel && matchStatus;
    });
    return data.sort((a, b) => {
        if (sortBy === 'mastery_asc') return getMasteryPercentage(DataType.KANJI, a.id) - getMasteryPercentage(DataType.KANJI, b.id);
        if (sortBy === 'mastery_desc') return getMasteryPercentage(DataType.KANJI, b.id) - getMasteryPercentage(DataType.KANJI, a.id);
        if (sortBy === 'strokes') return (parseInt(a.strokes) || 0) - (parseInt(b.strokes) || 0);
        return parseInt(b.id) - parseInt(a.id);
    });
  }, [kanjiData, searchTerm, filterLevel, filterStatus, sortBy, getMasteryPercentage, getLearningStage]);

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

  const getStatusColor = (id: string) => {
      const stage = getLearningStage(DataType.KANJI, id);
      switch (stage) {
        case LearningStage.MASTERED: return 'text-[#B4E4C3] bg-[#B4E4C3]/10';
        case LearningStage.REVIEW: return 'text-[#78A2CC] bg-[#78A2CC]/10';
        case LearningStage.LEARNING: return 'text-[#FFB7C5] bg-[#FFB7C5]/10';
        default: return 'text-[#4A4E69]/20 bg-[#FAF9F6]';
      }
  };

  return (
    <div className="p-7 md:p-11 pt-20 md:pt-24 max-w-7xl mx-auto space-y-9 animate-soft-in">
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-1 pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#4A4E69]/5 pb-8">
        <div className="flex items-center gap-6">
          <ShibaMascot size="sm" message={STRINGS.mascot.kanji} />
          <div>
            <h2 className="text-2xl font-black text-[#4A4E69] anime-title flex items-center gap-4">
                <div className="p-2 bg-[#FFB7C5]/10 rounded-xl text-[#FFB7C5]"><Languages size={24} /></div>
                {STRINGS.kanji.title}
            </h2>
            <p className="text-[10px] font-black text-[#4A4E69]/30 uppercase tracking-[0.45em] mt-3">{STRINGS.kanji.subtitle}</p>
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          {selectedIds.size > 0 && (
            <button onClick={() => { if(window.confirm(STRINGS.common.confirmMassDelete)) { deleteKanji(Array.from(selectedIds)); setSelectedIds(new Set()); } }} className="px-6 py-3 bg-[#FFB7C5]/10 text-[#4A4E69] border border-[#FFB7C5]/30 rounded-xl font-black text-[10px] anime-title uppercase hover:bg-[#FFB7C5] hover:text-white transition-all">
                {STRINGS.common.delete} ({selectedIds.size})
            </button>
          )}
          <button onClick={handleOpenAdd} className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl font-black anime-title text-[11px] tracking-[0.15em] transition-all bg-[#FFB7C5] text-white border-b-4 border-[#e091a1]">
            <Plus size={16} className="mr-2 inline"/> {STRINGS.kanji.addBtn}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#4A4E69]/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar p-8 rounded-[40px] shadow-2xl relative z-10 border border-[#4A4E69]/10 animate-soft-in">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 p-3 bg-[#FAF9F6] rounded-2xl text-[#4A4E69]/20 hover:text-[#FFB7C5] transition-all"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#FFB7C5] text-white rounded-[20px] shadow-lg"><Languages size={28} /></div>
                <h3 className="text-xl font-black text-[#4A4E69] anime-title uppercase">{editingId ? "Edit Kanji" : "Register Kanji"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Symbol</label>
                    <input value={formData.character} onChange={e => setFormData({...formData, character: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-2xl outline-none text-black font-black jp-text text-3xl text-center shadow-sm" required />
                </div>
                <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">On'yomi</label>
                    <input value={formData.onyomi} onChange={e => setFormData({...formData, onyomi: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none font-bold jp-text shadow-sm" />
                </div>
                <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Kun'yomi</label>
                    <input value={formData.kunyomi} onChange={e => setFormData({...formData, kunyomi: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none font-bold jp-text shadow-sm" />
                </div>
                <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Strokes</label>
                    <input type="number" value={formData.strokes} onChange={e => setFormData({...formData, strokes: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none font-bold shadow-sm" />
                </div>
              </div>
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Meaning</label>
                  <input value={formData.meaning} onChange={e => setFormData({...formData, meaning: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none font-bold shadow-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">JLPT Level</label>
                    <select value={formData.jlpt} onChange={e => setFormData({...formData, jlpt: e.target.value})} className="w-full p-4 bg-[#FAF9F6] rounded-xl outline-none font-bold text-sm shadow-sm">
                        {['N5','N4','N3','N2','N1'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Chapter</label>
                    <input value={formData.chapter} onChange={e => setFormData({...formData, chapter: e.target.value})} className="w-full p-4 bg-[#FAF9F6] rounded-xl outline-none font-bold text-sm shadow-sm" />
                </div>
              </div>

              {editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={handleMarkMastered} className="flex items-center justify-center gap-2 py-3 bg-[#B4E4C3]/10 text-[#4A4E69] border border-[#B4E4C3]/30 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#B4E4C3] hover:text-white transition-all">
                    <Trophy size={14} /> Mark Mastered
                  </button>
                  <button type="button" onClick={handleResetProgress} className="flex items-center justify-center gap-2 py-3 bg-[#FFB7C5]/10 text-[#FFB7C5] border border-[#FFB7C5]/30 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#FFB7C5] hover:text-white transition-all">
                    <RotateCcw size={14} /> Reset Training
                  </button>
                </div>
              )}

              <button type="submit" className="w-full py-5 bg-[#FFB7C5] text-white rounded-[24px] font-black anime-title tracking-widest border-b-6 border-[#e091a1] active:translate-y-1 transition-all uppercase text-[11px]">
                  {editingId ? "Update Kanji Scroll" : "Forge New Kanji"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#4A4E69]/20 group-focus-within:text-[#FFB7C5] transition-colors"><Search size={20} /></div>
            <input ref={searchInputRef} className="w-full pl-14 pr-8 py-5 bg-white border border-[#4A4E69]/10 rounded-2xl outline-none shadow-sm focus:shadow-xl focus:border-[#FFB7C5]/20 transition-all font-bold text-lg" placeholder={STRINGS.common.searchPlaceholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
             {[
               {label: 'LEVEL', val: filterLevel, set: setFilterLevel, opts: ['All','N5','N4','N3','N2','N1']},
               {label: 'STAT', val: filterStatus, set: setFilterStatus, opts: ['All', 'new', 'learning', 'review', 'mastered']}
             ].map(f => (
                 <div key={f.label} className="bg-white border border-[#4A4E69]/5 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm hover:border-[#FFB7C5]/20 transition-all cursor-pointer">
                     <span className="text-[9px] font-black text-[#4A4E69]/30 uppercase tracking-[0.2em]">{f.label}</span>
                     <select value={f.val} onChange={e => f.set(e.target.value)} className="bg-transparent outline-none font-black text-[#4A4E69] text-[10px] cursor-pointer">
                         {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                 </div>
             ))}
             <div className="ml-auto bg-white border border-[#4A4E69]/5 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                 <ArrowUpDown size={14} className="text-[#4A4E69]/20" />
                 <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent outline-none font-black text-[#4A4E69] text-[10px]">
                     <option value="id">Latest</option>
                     <option value="mastery_asc">Difficulty</option>
                     <option value="strokes">Strokes</option>
                 </select>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
        {filteredData.length > 0 ? filteredData.map(k => {
            const mastery = getMasteryPercentage(DataType.KANJI, k.id);
            const isSelected = selectedIds.has(k.id);
            return (
            <div key={k.id} className={clsx("relative group bg-white rounded-[40px] border transition-all shadow-sm hover:shadow-2xl hover:-translate-y-2 flex flex-col p-8", isSelected ? "border-[#FFB7C5] bg-[#FFB7C5]/5 ring-2 ring-[#FFB7C5]/20" : "border-[#4A4E69]/5")}>
                <button onClick={(e) => toggleSelection(e, k.id)} className={clsx("absolute top-6 left-6 p-2 rounded-xl transition-all shadow-sm z-20", isSelected ? "bg-[#FFB7C5] text-white" : "bg-[#FAF9F6] text-[#4A4E69]/10 group-hover:text-[#FFB7C5]")}>
                     {isSelected ? <Check size={16} /> : <div className="w-4 h-4 rounded-md border-2 border-current" />}
                </button>
                <div className="absolute top-6 right-6 text-[10px] bg-[#FAF9F6] text-[#4A4E69]/40 px-3 py-1.5 rounded-full font-black border border-[#4A4E69]/5 shadow-sm">{k.jlpt}</div>
                <div className="flex flex-col items-center mt-6 mb-6">
                    <div className="text-7xl font-black text-[#4A4E69] jp-text mb-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{k.character}</div>
                    <div className="text-sm font-black text-[#4A4E69] uppercase tracking-wider text-center line-clamp-1 h-5">{k.meaning}</div>
                </div>
                <div className="bg-[#FAF9F6] rounded-[24px] p-4 space-y-3 mb-6 flex-1 border border-[#4A4E69]/5">
                    <div className="space-y-1">
                        <div className="text-[8px] font-black text-[#4A4E69]/20 uppercase tracking-widest">On-yomi</div>
                        <div className="text-[11px] font-bold text-[#4A4E69] jp-text break-words">{k.onyomi || '—'}</div>
                    </div>
                    <div className="w-full h-px bg-[#4A4E69]/5" />
                    <div className="space-y-1">
                        <div className="text-[8px] font-black text-[#4A4E69]/20 uppercase tracking-widest">Kun-yomi</div>
                        <div className="text-[11px] font-bold text-[#4A4E69] jp-text break-words">{k.kunyomi || '—'}</div>
                    </div>
                </div>
                <div className="w-full mt-auto">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className={clsx("text-[9px] font-black uppercase tracking-widest", getStatusColor(k.id).split(' ')[0])}>{mastery >= 100 ? 'Mastered' : 'Learned'}</span>
                        <span className="text-[9px] font-black text-[#4A4E69]/20">{mastery}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#FAF9F6] rounded-full overflow-hidden shadow-inner border border-[#4A4E69]/5"><div className="h-full bg-[#B4E4C3] transition-all duration-1000" style={{ width: `${mastery}%` }}></div></div>
                </div>
                <div className="absolute inset-0 bg-white/95 p-8 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all rounded-[40px] z-30 backdrop-blur-md">
                    <button onClick={(e) => { e.stopPropagation(); logReview(DataType.KANJI, k.id, ReviewResult.MASTERED); }} className="w-full py-4 bg-[#B4E4C3]/10 text-[#4A4E69] rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#B4E4C3] hover:text-white transition-all shadow-md">Master Scroll</button>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button onClick={(e) => handleEdit(e, k)} className="py-4 bg-[#FAF9F6] text-[#4A4E69] rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-[#78A2CC] hover:text-white transition-all shadow-sm">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm(STRINGS.common.confirmDelete)) deleteKanji([k.id]); }} className="py-4 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-[#FFB7C5] hover:text-white transition-all shadow-sm">Discard</button>
                    </div>
                </div>
            </div>
        )}) : (
            <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30">
                <Sparkles size={64} className="text-[#4A4E69] mb-6" />
                <p className="font-black anime-title text-[#4A4E69] uppercase tracking-[0.4em] text-sm">No items found</p>
            </div>
        )}
      </div>

      <div className={clsx("fixed bottom-8 right-8 z-[150] flex flex-col items-end gap-4 transition-all duration-300 transform", showFAB ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none")}>
        <div className={clsx("flex flex-col items-end gap-3 transition-all", isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
          <button onClick={scrollToFilters} className="w-12 h-12 bg-white text-[#78A2CC] rounded-full flex items-center justify-center border border-[#4A4E69]/5 hover:bg-[#78A2CC] hover:text-white transition-all"><Search size={20}/></button>
          <button onClick={handleOpenAdd} className="w-12 h-12 bg-white text-[#FFB7C5] rounded-full flex items-center justify-center border border-[#4A4E69]/5 hover:bg-[#FFB7C5] hover:text-white transition-all"><Plus size={20}/></button>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#FFB7C5] hover:bg-[#e091a1] border-b-4 border-[#d17f8f] active:scale-95 transition-all">
            {isExpanded ? <X size={28}/> : <Plus size={28}/>}
        </button>
      </div>
      <div className="h-10"></div>
    </div>
  );
};

export default Kanji;
