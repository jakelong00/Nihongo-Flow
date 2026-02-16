
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { Plus, Search, Trash2, Edit2, Check, X, RotateCcw, GraduationCap, Sparkles, Trophy, ArrowUpDown } from 'lucide-react';
import { DataType, GrammarItem, LearningStage, ReviewResult } from '../types';
import { STRINGS } from '../constants/strings';
import { fuzzySearch } from '../utils/textHelper';
import { ShibaMascot } from '../components/ShibaMascot';
import clsx from 'clsx';

const EMPTY_FORM: Omit<GrammarItem, 'id'> = {
  rule: '', explanation: '', examples: [''], jlpt: 'N5', chapter: '1'
};

const Grammar: React.FC = () => {
  const { grammarData, addGrammar, updateGrammar, deleteGrammar, getLearningStage, getMasteryPercentage, logReview, resetItemStats } = useFileSystem();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'id' | 'mastery_asc' | 'mastery_desc'>('id');
  const [formData, setFormData] = useState<Omit<GrammarItem, 'id'>>(EMPTY_FORM);

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

  const handleEdit = (e: React.MouseEvent, item: GrammarItem) => {
    e.stopPropagation();
    setFormData({ ...item, examples: item.examples.length > 0 ? item.examples : [''] });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleResetProgress = async () => {
    if (!editingId) return;
    if (window.confirm("Reset all training stats for this grammar rule?")) {
        await resetItemStats(DataType.GRAMMAR, editingId);
        setIsFormOpen(false);
    }
  };

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData({ ...formData, examples: newExamples });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanExamples = formData.examples.filter(ex => ex.trim() !== '');
    if (editingId) await updateGrammar({ ...formData, id: editingId, examples: cleanExamples });
    else await addGrammar({ ...formData, examples: cleanExamples });
    setFormData(EMPTY_FORM);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const filteredData = useMemo(() => {
    let data = grammarData.filter(g => {
        const matchSearch = fuzzySearch(searchTerm, g.rule, g.explanation);
        const matchLevel = filterLevel === 'All' || g.jlpt === filterLevel;
        const matchStatus = filterStatus === 'All' || getLearningStage(DataType.GRAMMAR, g.id) === filterStatus;
        return matchSearch && matchLevel && matchStatus;
    });
    return data.sort((a, b) => {
        if (sortBy === 'mastery_asc') return getMasteryPercentage(DataType.GRAMMAR, a.id) - getMasteryPercentage(DataType.GRAMMAR, b.id);
        if (sortBy === 'mastery_desc') return getMasteryPercentage(DataType.GRAMMAR, b.id) - getMasteryPercentage(DataType.GRAMMAR, a.id);
        return parseInt(b.id) - parseInt(a.id);
    });
  }, [grammarData, searchTerm, filterLevel, filterStatus, sortBy, getMasteryPercentage, getLearningStage]);

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

  const handleMarkMastered = async () => {
      if (!editingId) return;
      await logReview(DataType.GRAMMAR, editingId, ReviewResult.MASTERED);
      setIsFormOpen(false);
  };

  return (
    <div className="p-7 md:p-11 pt-28 md:pt-36 max-w-7xl mx-auto space-y-9 animate-soft-in">
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-1 pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#4A4E69]/5 pb-8">
        <div className="flex items-center gap-6">
          <ShibaMascot size="sm" message={STRINGS.mascot.grammar} />
          <div>
            <h2 className="text-2xl font-black text-[#4A4E69] anime-title flex items-center gap-4">
                <div className="p-2 bg-[#B4E4C3]/30 rounded-xl text-[#B4E4C3]"><GraduationCap size={24} /></div>
                {STRINGS.grammar.title}
            </h2>
            <p className="text-[10px] font-black text-[#4A4E69]/30 uppercase tracking-[0.45em] mt-3">{STRINGS.grammar.subtitle}</p>
          </div>
        </div>
        <button onClick={handleOpenAdd} className="px-8 py-3.5 rounded-2xl font-black anime-title text-[11px] tracking-[0.15em] transition-all bg-[#B4E4C3] text-[#4A4E69] border-b-4 border-[#93c7a3]">
          <Plus size={16} className="mr-2 inline" /> {STRINGS.grammar.addBtn}
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#4A4E69]/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar p-8 rounded-[40px] shadow-2xl relative z-10 border border-[#4A4E69]/10 animate-soft-in">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 p-3 bg-[#FAF9F6] rounded-2xl text-[#4A4E69]/20 hover:text-[#FFB7C5] transition-all"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#B4E4C3] text-[#4A4E69] rounded-[20px] shadow-lg"><GraduationCap size={28} /></div>
                <h3 className="text-xl font-black text-[#4A4E69] anime-title uppercase">{editingId ? "Edit Rule" : "Forge Rule"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Grammar Rule</label>
                      <input value={formData.rule} onChange={e => setFormData({...formData, rule: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-2xl outline-none text-black font-black jp-text text-xl shadow-sm" required />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px) font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">JLPT Level</label>
                      <select value={formData.jlpt} onChange={e => setFormData({...formData, jlpt: e.target.value})} className="w-full p-4 bg-[#FAF9F6] rounded-2xl outline-none font-bold border border-[#4A4E69]/5 text-xs cursor-pointer">
                          {['N5','N4','N3','N2','N1'].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                  </div>
              </div>
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Explanation</label>
                  <textarea value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} className="w-full p-4 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-2xl outline-none font-bold text-sm h-24 shadow-sm" required />
              </div>
              
              <div className="space-y-3">
                  <label className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest ml-1">Examples</label>
                  {formData.examples.map((ex, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input value={ex} onChange={e => handleExampleChange(idx, e.target.value)} className="flex-1 p-3 bg-[#FAF9F6] border border-[#4A4E69]/5 rounded-xl outline-none font-bold jp-text text-xs" />
                      {formData.examples.length > 1 && (
                        <button type="button" onClick={() => setFormData({...formData, examples: formData.examples.filter((_, i) => i !== idx)})} className="p-3 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-xl hover:bg-[#FFB7C5] hover:text-white transition-all"><X size={14}/></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormData({...formData, examples: [...formData.examples, '']})} className="text-[9px] font-black uppercase text-[#78A2CC] tracking-widest hover:opacity-80 transition-all flex items-center gap-2">+ Add Example</button>
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

              <button type="submit" className="w-full py-5 bg-[#B4E4C3] text-[#4A4E69] rounded-[24px] font-black anime-title tracking-widest border-b-6 border-[#93c7a3] active:translate-y-1 transition-all uppercase text-[11px]">
                  {editingId ? "Update Grammar Data" : "Store Grammar Rule"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#4A4E69]/20 group-focus-within:text-[#B4E4C3] transition-colors"><Search size={20} /></div>
            <input ref={searchInputRef} className="w-full pl-14 pr-8 py-5 bg-white border border-[#4A4E69]/10 rounded-2xl outline-none shadow-sm focus:shadow-xl focus:border-[#B4E4C3]/20 transition-all font-bold text-lg" placeholder={STRINGS.common.searchPlaceholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        <div className="flex gap-4 flex-wrap items-center">
            {[
              { label: 'Level', val: filterLevel, set: setFilterLevel, opts: ['All', 'N5','N4','N3','N2','N1'] },
              { label: 'Stat', val: filterStatus, set: setFilterStatus, opts: ['All', 'new', 'learning', 'review', 'mastered'] }
            ].map(f => (
                <div key={f.label} className="bg-white border border-[#4A4E69]/5 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm hover:border-[#B4E4C3]/20 transition-all cursor-pointer">
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
                    <option value="mastery_desc">Progress</option>
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {filteredData.length > 0 ? filteredData.map(g => {
            const mastery = getMasteryPercentage(DataType.GRAMMAR, g.id);
            return (
            <div key={g.id} className="group relative bg-white p-10 rounded-[40px] border border-[#4A4E69]/5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-[#FAF9F6] text-[#4A4E69]/30 rounded-full text-[9px] font-black uppercase border border-[#4A4E69]/5 tracking-widest">CH.{g.chapter}</span>
                        <h3 className="text-2xl font-black text-[#4A4E69] jp-text">{g.rule}</h3>
                    </div>
                    <span className="px-3 py-1 bg-[#B4E4C3]/10 text-[#B4E4C3] rounded-full text-[9px] font-black border border-[#B4E4C3]/20 tracking-widest">{g.jlpt}</span>
                </div>
                <p className="text-[#4A4E69]/60 font-bold text-[13px] leading-relaxed mb-8">{g.explanation}</p>
                {g.examples.length > 0 && (
                    <div className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#4A4E69]/5 space-y-3 mb-6 flex-1 shadow-inner">
                        {g.examples.slice(0, 3).map((ex, i) => (
                            <p key={i} className="text-[13px] font-bold text-[#4A4E69] jp-text flex gap-3"><span className="opacity-20 text-[11px] font-black">{i+1}</span> {ex}</p>
                        ))}
                    </div>
                )}
                <div className="mt-auto pt-8 border-t border-[#4A4E69]/5 flex items-center justify-between">
                    <div className="flex-1 max-w-[120px]">
                        <div className="text-[8px] font-black text-[#4A4E69]/20 uppercase tracking-[0.2em] mb-2">{mastery}% Mastery</div>
                        <div className="w-full h-1.5 bg-[#FAF9F6] rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#B4E4C3] transition-all duration-1000" style={{ width: `${mastery}%` }}></div></div>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={(e) => handleEdit(e, g)} className="p-3 bg-[#78A2CC]/10 text-[#78A2CC] rounded-xl hover:bg-[#78A2CC] hover:text-white transition-all shadow-sm"><Edit2 size={20}/></button>
                         <button onClick={(e) => { if(window.confirm(STRINGS.common.confirmDelete)) deleteGrammar([g.id]); }} className="p-3 bg-[#FFB7C5]/10 text-[#FFB7C5] rounded-xl hover:bg-[#FFB7C5] hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
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
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#B4E4C3] hover:bg-[#a3d9b4] border-b-4 border-[#93c7a3] active:scale-95 transition-all">
            {isExpanded ? <X size={28}/> : <Plus size={28}/>}
        </button>
      </div>
      <div className="h-10"></div>
    </div>
  );
};

export default Grammar;
