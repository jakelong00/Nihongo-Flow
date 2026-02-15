
import React, { useState, useMemo } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { Plus, Search, AlertCircle, Edit2, Trash2, CheckSquare, Square, Check, X, Book, RotateCcw, Filter, ArrowUpDown, Info, Eye } from 'lucide-react';
import { DataType, LearningStage, ReviewResult, VocabItem } from '../types';
import { STRINGS } from '../constants/strings';
import { fuzzySearch } from '../utils/textHelper';
import { ThemedIcon } from '../components/ThemedIcon';
import clsx from 'clsx';

const POS_OPTIONS = [
    'Noun', 
    'Godan Verb', 
    'Ichidan Verb', 
    'Suru Verb', 
    'I-Adjective', 
    'Na-Adjective', 
    'Adverb', 
    'Particle', 
    'Expression',
    'Other'
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

const Vocab: React.FC = () => {
  const { vocabData, addVocab, updateVocab, deleteVocab, getLearningStage, getMasteryPercentage, logReview } = useFileSystem();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<VocabItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters & Sort State
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterPos, setFilterPos] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'id' | 'mastery_asc' | 'mastery_desc' | 'level'>('id');
  
  const [formData, setFormData] = useState<Omit<VocabItem, 'id'>>({
    word: '',
    reading: '',
    meaning: '',
    partOfSpeech: 'Noun',
    jlpt: 'N5',
    chapter: '1',
    te: '',
    nai: '',
    masu: '',
    ta: '',
    potential: '',
    volitional: '',
    passive: '',
    causative: ''
  });

  const getStatusColor = (id: string) => {
    const stage = getLearningStage(DataType.VOCAB, id);
    switch (stage) {
      case LearningStage.MASTERED: return 'bg-[#FFD500] text-black border-[#FFD500]';
      case LearningStage.REVIEW: return 'bg-gray-800 text-white border-gray-800';
      case LearningStage.LEARNING: return 'bg-gray-200 text-black border-gray-200';
      default: return 'bg-white text-gray-500 border-gray-300';
    }
  };

  const getPOSColor = (pos: string) => {
    const lowerPos = pos.toLowerCase();
    if (lowerPos.includes('verb')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (lowerPos.includes('adjective')) return 'bg-purple-50 text-purple-700 border-purple-100';
    if (lowerPos.includes('noun')) return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const handleEdit = (e: React.MouseEvent, item: VocabItem) => {
    e.stopPropagation();
    setFormData({
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech || 'Noun',
      jlpt: item.jlpt,
      chapter: item.chapter,
      te: item.te || '',
      nai: item.nai || '',
      masu: item.masu || '',
      ta: item.ta || '',
      potential: item.potential || '',
      volitional: item.volitional || '',
      passive: item.passive || '',
      causative: item.causative || ''
    });
    setEditingId(item.id);
    setIsFormOpen(true);
    setViewingItem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(STRINGS.common.confirmDelete)) {
      try {
        await deleteVocab([id]);
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      } catch (err) {
        console.error("Delete failed:", err);
        setError("Failed to delete item.");
      }
    }
  };

  const handleMassDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(STRINGS.common.confirmMassDelete)) {
      await deleteVocab(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleMarkLearned = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await logReview(DataType.VOCAB, id, ReviewResult.MASTERED);
  };

  const handleResetProgress = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Reset learning progress for this word?")) {
        await logReview(DataType.VOCAB, id, ReviewResult.FORGOT);
    }
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

  const handleRowClick = (item: VocabItem) => {
    setViewingItem(item);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await updateVocab({ ...formData, id: editingId });
      } else {
        await addVocab(formData);
      }
      setFormData({ 
          word: '', reading: '', meaning: '', partOfSpeech: 'Noun', jlpt: 'N5', chapter: '1',
          te: '', nai: '', masu: '', ta: '', potential: '', volitional: '', passive: '', causative: ''
      });
      setIsFormOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredData = useMemo(() => {
    let data = vocabData.filter(v => {
        const matchSearch = fuzzySearch(searchTerm, v.word, v.reading, v.meaning);
        const matchLevel = filterLevel === 'All' || v.jlpt === filterLevel;
        const matchPos = filterPos === 'All' || v.partOfSpeech === filterPos;
        const matchStatus = filterStatus === 'All' || getLearningStage(DataType.VOCAB, v.id) === filterStatus;
        return matchSearch && matchLevel && matchPos && matchStatus;
    });

    return data.sort((a, b) => {
        if (sortBy === 'mastery_asc') {
            return getMasteryPercentage(DataType.VOCAB, a.id) - getMasteryPercentage(DataType.VOCAB, b.id);
        }
        if (sortBy === 'mastery_desc') {
            return getMasteryPercentage(DataType.VOCAB, b.id) - getMasteryPercentage(DataType.VOCAB, a.id);
        }
        if (sortBy === 'level') {
            return a.jlpt.localeCompare(b.jlpt);
        }
        return parseInt(b.id) - parseInt(a.id);
    });
  }, [vocabData, searchTerm, filterLevel, filterPos, filterStatus, sortBy, getMasteryPercentage, getLearningStage]);

  const isVerb = formData.partOfSpeech.toLowerCase().includes('verb');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-black flex items-center gap-2">
            <ThemedIcon iconKey="navVocab" Fallback={Book} size={28} className="text-[#FFD500]" /> {STRINGS.vocab.title}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.size > 0 && (
            <button 
              onClick={handleMassDelete}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-bold border border-red-200 text-sm"
            >
              <ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16} /> Delete ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setViewingItem(null); setError(null); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#FFD500] hover:bg-[#E6C000] text-black rounded-lg transition-colors shadow-sm text-sm font-bold border-b-2 border-[#D4B200]"
          >
            {isFormOpen && !editingId ? <ThemedIcon iconKey="actionClose" Fallback={X} size={18}/> : <ThemedIcon iconKey="actionAdd" Fallback={Plus} size={18} />} 
            {isFormOpen && !editingId ? STRINGS.common.cancel : STRINGS.vocab.addBtn}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 mb-8 animate-fade-in overflow-hidden">
          <h3 className="font-bold text-lg mb-4 text-black flex items-center gap-2">
            {editingId ? <ThemedIcon iconKey="actionEdit" Fallback={Edit2} size={18}/> : <ThemedIcon iconKey="actionAdd" Fallback={Plus} size={18}/>}
            {editingId ? STRINGS.common.edit : STRINGS.vocab.formTitle}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
               <ThemedIcon iconKey="statusError" Fallback={AlertCircle} size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                    placeholder={STRINGS.vocab.placeholders.word}
                    value={formData.word}
                    onChange={e => setFormData({...formData, word: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none"
                    required
                />
                <input
                    placeholder={STRINGS.vocab.placeholders.reading}
                    value={formData.reading}
                    onChange={e => setFormData({...formData, reading: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none"
                    required
                />
                <input
                    placeholder={STRINGS.vocab.placeholders.meaning}
                    value={formData.meaning}
                    onChange={e => setFormData({...formData, meaning: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none"
                    required
                />
                <select
                    value={formData.partOfSpeech}
                    onChange={e => setFormData({...formData, partOfSpeech: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none bg-white"
                >
                    {POS_OPTIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
            </div>

            {isVerb && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-black text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                        <ThemedIcon iconKey="navGrammar" Fallback={Book} size={16} /> Verb Conjugations
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {VERB_FORMS.map(form => (
                            <div key={form.key}>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tight">{form.label}</label>
                                <input
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none text-sm bg-white"
                                    value={(formData as any)[form.key] || ''}
                                    onChange={e => setFormData({...formData, [form.key]: e.target.value})}
                                    placeholder="..."
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex gap-2">
                    <select
                        value={formData.jlpt}
                        onChange={e => setFormData({...formData, jlpt: e.target.value})}
                        className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none bg-white font-bold"
                    >
                        {['N5','N4','N3','N2','N1'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <input
                        placeholder={STRINGS.vocab.placeholders.chapter}
                        value={formData.chapter}
                        onChange={e => setFormData({...formData, chapter: e.target.value})}
                        className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none"
                    />
                 </div>
                 
                 <div className="flex justify-end gap-2 items-center">
                    <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">{STRINGS.common.cancel}</button>
                    <button type="submit" className="px-8 py-3 bg-[#FFD500] text-black rounded-lg hover:bg-[#E6C000] font-black shadow-md border-b-4 border-[#D4B200] transition-all active:scale-95">
                        {editingId ? STRINGS.common.update : STRINGS.common.save}
                    </button>
                 </div>
            </div>
          </form>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="mb-6 space-y-3">
        <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <ThemedIcon iconKey="actionSearch" Fallback={Search} size={20} />
            </div>
            <input 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#FFD500] shadow-sm transition-all text-black placeholder-gray-400 bg-white" 
                placeholder={STRINGS.vocab.searchPlaceholder} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
             {[{label: 'Level', val: filterLevel, set: setFilterLevel, opts: ['All','N5','N4','N3','N2','N1']},
               {label: 'POS', val: filterPos, set: setFilterPos, opts: ['All', ...POS_OPTIONS]},
               {label: 'Status', val: filterStatus, set: setFilterStatus, opts: ['All', 'new', 'learning', 'review', 'mastered']}
             ].map(filter => (
                 <div key={filter.label} className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-2 text-xs shadow-sm">
                     <Filter size={14} className="text-gray-400" />
                     <span className="font-black text-gray-400 uppercase tracking-tighter mr-1">{filter.label}</span>
                     <select value={filter.val} onChange={e => filter.set(e.target.value)} className="bg-transparent outline-none font-bold text-black cursor-pointer">
                         {filter.opts.map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                 </div>
             ))}

             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-2 text-xs shadow-sm ml-auto">
                 <ArrowUpDown size={14} className="text-gray-400" />
                 <span className="font-black text-gray-400 uppercase tracking-tighter mr-1">Sort</span>
                 <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent outline-none font-bold text-black cursor-pointer">
                     <option value="id">Newest First</option>
                     <option value="mastery_asc">Progress (Low)</option>
                     <option value="mastery_desc">Progress (High)</option>
                     <option value="level">Level (N1-N5)</option>
                 </select>
             </div>
        </div>
      </div>

      {/* List Header (Desktop only) */}
      <div className="hidden md:grid grid-cols-[48px_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div></div>
          <div>Word / Reading</div>
          <div>Part of Speech</div>
          <div>Meaning</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
      </div>

      {/* Detail Drawer Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingItem(null)} />
            <div className="relative w-full max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up md:animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="text-5xl font-black text-black jp-text">{viewingItem.word}</div>
                        <div>
                            <div className="text-xl text-gray-500 jp-text mb-1">{viewingItem.reading}</div>
                            <span className={clsx("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border", getPOSColor(viewingItem.partOfSpeech))}>
                                {viewingItem.partOfSpeech}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-black">
                        <ThemedIcon iconKey="actionClose" Fallback={X} size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Mastery Section */}
                    <div className="flex items-center justify-between bg-[#FFD500]/10 p-4 rounded-2xl border border-[#FFD500]/30">
                        <div>
                            <div className="text-[10px] font-black text-[#887700] uppercase tracking-widest mb-1">Dojo Status</div>
                            <div className="text-xl font-black text-black capitalize">{getLearningStage(DataType.VOCAB, viewingItem.id)}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] font-black text-[#887700] uppercase tracking-widest mb-1">Mastery</div>
                             <div className="text-xl font-black text-black">{getMasteryPercentage(DataType.VOCAB, viewingItem.id)}%</div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Meaning</div>
                             <div className="text-lg font-bold text-black">{viewingItem.meaning}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Metadata</div>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded font-bold text-xs">{viewingItem.jlpt}</span>
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded font-bold text-xs">Ch. {viewingItem.chapter}</span>
                             </div>
                        </div>
                    </div>

                    {/* Conjugations */}
                    {viewingItem.partOfSpeech.toLowerCase().includes('verb') && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-black uppercase tracking-widest border-b-2 border-black pb-2 flex items-center gap-2">
                                <ThemedIcon iconKey="navGrammar" Fallback={Book} size={16} /> Conjugation Guide
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {VERB_FORMS.map(form => (
                                    <div key={form.key} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-[#FFD500] transition-colors shadow-sm">
                                        <div className="text-[9px] font-black text-gray-400 uppercase mb-1">{form.label}</div>
                                        <div className="text-base font-bold text-black jp-text">{(viewingItem as any)[form.key] || '—'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button 
                        onClick={(e) => { setViewingItem(null); handleEdit(e, viewingItem); }} 
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-black rounded-xl font-black hover:bg-gray-100 transition-all shadow-sm"
                    >
                        <ThemedIcon iconKey="actionEdit" Fallback={Edit2} size={18} /> Edit Word
                    </button>
                    <button 
                        onClick={() => setViewingItem(null)} 
                        className="flex-1 py-3 bg-black text-white rounded-xl font-black hover:bg-gray-800 transition-all shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Card/Table Views */}
      <div className="space-y-3">
        {filteredData.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredData.map(item => {
                 const mastery = getMasteryPercentage(DataType.VOCAB, item.id);
                 const stage = getLearningStage(DataType.VOCAB, item.id);
                 return (
                     <div 
                        key={item.id} 
                        onClick={() => handleRowClick(item)}
                        className={clsx(
                            "bg-white rounded-2xl shadow-sm border-2 transition-all cursor-pointer group hover:-translate-y-0.5 overflow-hidden",
                            selectedIds.has(item.id) ? "border-[#FFD500]" : "border-gray-100 hover:border-gray-300"
                        )}
                     >
                        {/* Grid container: Mobile is flex, Desktop is grid */}
                        <div className="p-4 md:p-0 md:h-16 flex flex-col md:grid md:grid-cols-[48px_1fr_1fr_1.5fr_1fr_1.5fr] md:items-center md:gap-4">
                            
                            {/* Checkbox (MD: First Column) */}
                            <div className="hidden md:flex justify-center items-center h-full border-r border-gray-50">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(e, item.id); }} 
                                    className={clsx("transition-transform hover:scale-110", selectedIds.has(item.id) ? "text-[#FFD500]" : "text-gray-200")}
                                >
                                    {selectedIds.has(item.id) ? 
                                        <ThemedIcon iconKey="checkboxChecked" Fallback={CheckSquare} size={20} /> : 
                                        <ThemedIcon iconKey="checkboxUnchecked" Fallback={Square} size={20} />
                                    }
                                </button>
                            </div>

                            {/* Word & Reading */}
                            <div className="flex items-center gap-3">
                                <div className="md:hidden">
                                    <button onClick={(e) => { e.stopPropagation(); toggleSelection(e, item.id); }} className={clsx("transition-transform", selectedIds.has(item.id) ? "text-[#FFD500]" : "text-gray-200")}>
                                        {selectedIds.has(item.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-baseline md:gap-2 overflow-hidden">
                                    <span className="text-xl font-black text-black jp-text truncate">{item.word}</span>
                                    <span className="text-xs font-bold text-gray-400 jp-text truncate">{item.reading}</span>
                                </div>
                            </div>

                            {/* Part of Speech (Now aligned in list) */}
                            <div className="mt-2 md:mt-0">
                                <span className={clsx(
                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                    getPOSColor(item.partOfSpeech)
                                )}>
                                    {item.partOfSpeech}
                                </span>
                            </div>

                            {/* Meaning (Aligned) */}
                            <div className="mt-1 md:mt-0 md:px-2">
                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.meaning}</p>
                            </div>

                            {/* Level / Status */}
                            <div className="mt-3 md:mt-0 flex items-center gap-2">
                                <div className="hidden lg:flex gap-1 mr-2">
                                    <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[9px] font-black border border-gray-100">{item.jlpt}</span>
                                </div>
                                <div className={clsx(
                                    "px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    getStatusColor(item.id)
                                )}>
                                    {stage}
                                </div>
                            </div>

                            {/* Actions (MD: End Column) */}
                            <div className="mt-4 md:mt-0 flex justify-end gap-1 md:px-5">
                                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Progress Action Button (Toggle based on Stage) */}
                                    {stage === LearningStage.MASTERED ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleResetProgress(e, item.id); }} 
                                            className="p-2 hover:bg-orange-50 text-gray-300 hover:text-orange-600 rounded-lg transition-colors" 
                                            title="Reset Progress"
                                        >
                                            <ThemedIcon iconKey="actionReset" Fallback={RotateCcw} size={16}/>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleMarkLearned(e, item.id); }} 
                                            className="p-2 hover:bg-green-50 text-gray-300 hover:text-green-600 rounded-lg transition-colors" 
                                            title="Mark Learned"
                                        >
                                            <ThemedIcon iconKey="actionCheck" Fallback={Check} size={16}/>
                                        </button>
                                    )}
                                    
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(e, item); }} className="p-2 hover:bg-yellow-50 text-gray-300 hover:text-yellow-600 rounded-lg transition-colors" title="Edit"><ThemedIcon iconKey="actionEdit" Fallback={Edit2} size={16}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(e, item.id); }} className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg transition-colors" title="Delete"><ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16}/></button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Progress Bar (Full width at bottom) */}
                        <div className="h-1 w-full bg-gray-50 overflow-hidden">
                            <div 
                                className={clsx("h-full transition-all duration-700", mastery >= 100 ? "bg-[#FFD500]" : "bg-black")} 
                                style={{ width: `${mastery}%` }} 
                            />
                        </div>
                     </div>
                 )
            })}
          </div>
        ) : (
            <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border-4 border-dashed border-gray-100">
                <ThemedIcon iconKey="navVocab" Fallback={Book} size={64} className="mx-auto mb-4 opacity-10" />
                <p className="font-bold">{STRINGS.common.noItems}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Vocab;
