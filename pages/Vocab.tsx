import React, { useState, useMemo } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { Plus, Search, AlertCircle, Edit2, Trash2, CheckSquare, Square, Check, X, Book, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';
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

const VERB_FORMS = ['te', 'ta', 'nai', 'masu', 'potential', 'volitional'];

const Vocab: React.FC = () => {
  const { vocabData, addVocab, updateVocab, deleteVocab, getLearningStage, getMasteryPercentage, logReview } = useFileSystem();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    conjugations: {},
    jlpt: 'N5',
    chapter: '1'
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

  const handleEdit = (e: React.MouseEvent, item: VocabItem) => {
    e.stopPropagation();
    setFormData({
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech || 'Noun',
      conjugations: item.conjugations || {},
      jlpt: item.jlpt,
      chapter: item.chapter
    });
    setEditingId(item.id);
    setIsFormOpen(true);
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
    await logReview(DataType.VOCAB, id, ReviewResult.FORGOT);
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

  const toggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(i => i.id)));
    }
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
      setFormData({ word: '', reading: '', meaning: '', partOfSpeech: 'Noun', conjugations: {}, jlpt: 'N5', chapter: '1' });
      setIsFormOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateConjugation = (key: string, value: string) => {
      setFormData(prev => ({
          ...prev,
          conjugations: { ...prev.conjugations, [key]: value }
      }));
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
        // Default: Sort by ID (usually creation time) descending
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
              <ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16} /> {STRINGS.common.deleteSelected} ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setFormData({ word: '', reading: '', meaning: '', partOfSpeech: 'Noun', conjugations: {}, jlpt: 'N5', chapter: '1' }); setError(null); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#FFD500] hover:bg-[#E6C000] text-black rounded-lg transition-colors shadow-sm text-sm font-bold border-b-2 border-[#D4B200]"
          >
            {isFormOpen && !editingId ? <ThemedIcon iconKey="actionClose" Fallback={X} size={18}/> : <ThemedIcon iconKey="actionAdd" Fallback={Plus} size={18} />} 
            {isFormOpen && !editingId ? STRINGS.common.cancel : STRINGS.vocab.addBtn}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 mb-8 animate-fade-in">
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

            {/* Conjugations Section */}
            {isVerb && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Verb Conjugations (Optional)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {VERB_FORMS.map(form => (
                            <div key={form}>
                                <label className="block text-xs font-semibold text-gray-400 mb-1 capitalize">{form}-form</label>
                                <input
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#FFD500] outline-none text-sm"
                                    value={formData.conjugations?.[form] || ''}
                                    onChange={e => updateConjugation(form, e.target.value)}
                                    placeholder={`e.g. ${form === 'te' ? '食べて' : '...'}`}
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
                        className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD500] outline-none bg-white"
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
                    <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="px-4 py-3 text-gray-500 hover:bg-gray-100 rounded font-bold">{STRINGS.common.cancel}</button>
                    <button type="submit" className="px-6 py-3 bg-[#FFD500] text-black rounded-lg hover:bg-[#E6C000] font-bold shadow-sm border-b-2 border-[#D4B200]">
                        {editingId ? STRINGS.common.update : STRINGS.common.save}
                    </button>
                 </div>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar: Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <ThemedIcon iconKey="actionSearch" Fallback={Search} size={20} />
            </div>
            <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#FFD500] shadow-sm transition-shadow text-black placeholder-gray-400 bg-white" 
                placeholder={STRINGS.vocab.searchPlaceholder} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
                 <Filter size={14} className="text-gray-500" />
                 <span className="font-bold text-xs uppercase text-gray-500 mr-1">Level:</span>
                 <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="bg-transparent outline-none font-medium">
                     <option value="All">All</option>
                     {['N5','N4','N3','N2','N1'].map(l => <option key={l} value={l}>{l}</option>)}
                 </select>
             </div>

             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
                 <Filter size={14} className="text-gray-500" />
                 <span className="font-bold text-xs uppercase text-gray-500 mr-1">POS:</span>
                 <select value={filterPos} onChange={e => setFilterPos(e.target.value)} className="bg-transparent outline-none font-medium max-w-[100px]">
                     <option value="All">All</option>
                     {POS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
             </div>

             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
                 <Filter size={14} className="text-gray-500" />
                 <span className="font-bold text-xs uppercase text-gray-500 mr-1">Status:</span>
                 <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none font-medium">
                     <option value="All">All</option>
                     <option value={LearningStage.NEW}>New</option>
                     <option value={LearningStage.LEARNING}>Learning</option>
                     <option value={LearningStage.REVIEW}>Review</option>
                     <option value={LearningStage.MASTERED}>Mastered</option>
                 </select>
             </div>

             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm ml-auto">
                 <ArrowUpDown size={14} className="text-gray-500" />
                 <span className="font-bold text-xs uppercase text-gray-500 mr-1">Sort:</span>
                 <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent outline-none font-medium">
                     <option value="id">Default (Newest)</option>
                     <option value="mastery_asc">Mastery (Low-High)</option>
                     <option value="mastery_desc">Mastery (High-Low)</option>
                     <option value="level">Level (N1-N5)</option>
                 </select>
             </div>
        </div>
      </div>

      {/* Card View (Visible on Mobile AND Tablet up to LG) */}
      <div className="lg:hidden space-y-4">
        {filteredData.length > 0 ? filteredData.map(item => {
             const mastery = getMasteryPercentage(DataType.VOCAB, item.id);
             return (
                 <div key={item.id} className={clsx("bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative", selectedIds.has(item.id) && "ring-2 ring-[#FFD500]")}>
                     <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                             <button onClick={(e) => toggleSelection(e, item.id)} className={clsx("text-gray-400", selectedIds.has(item.id) && "text-[#FFD500]")}>
                                 {selectedIds.has(item.id) ? 
                                    <ThemedIcon iconKey="checkboxChecked" Fallback={CheckSquare} size={24} /> : 
                                    <ThemedIcon iconKey="checkboxUnchecked" Fallback={Square} size={24} />
                                 }
                             </button>
                             <div>
                                 <div className="text-xl font-bold text-black jp-text">{item.word}</div>
                                 <div className="text-sm text-gray-500 jp-text">{item.reading}</div>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="text-xs font-bold text-gray-300">#{item.id}</div>
                             <div className={clsx("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block border", getStatusColor(item.id))}>
                                 {getLearningStage(DataType.VOCAB, item.id)}
                             </div>
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-2 pl-9 mb-1">
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                            {item.partOfSpeech || 'Noun'}
                        </span>
                     </div>
                     <div className="text-black font-medium mb-3 pl-9">{item.meaning}</div>
                     
                     <div className="flex justify-between items-center pl-9">
                         <div className="flex gap-2">
                             <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600 font-bold">{item.jlpt}</span>
                             {item.chapter && <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600">Ch. {item.chapter}</span>}
                         </div>
                         <div className="flex gap-1">
                             <button onClick={(e) => handleMarkLearned(e, item.id)} className="p-2 bg-green-50 text-green-600 rounded-lg"><ThemedIcon iconKey="actionCheck" Fallback={Check} size={16}/></button>
                             <button onClick={(e) => handleResetProgress(e, item.id)} className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ThemedIcon iconKey="actionReset" Fallback={RotateCcw} size={16}/></button>
                             <button onClick={(e) => handleEdit(e, item)} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><ThemedIcon iconKey="actionEdit" Fallback={Edit2} size={16}/></button>
                             <button onClick={(e) => handleDelete(e, item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16}/></button>
                         </div>
                     </div>
                     {/* Mobile Mastery Bar */}
                     <div className="absolute bottom-0 left-4 right-4 h-1 bg-gray-100">
                        <div 
                            className={clsx("h-full rounded-full transition-all duration-500", 
                                mastery >= 100 ? "bg-[#FFD500]" : 
                                mastery > 20 ? "bg-black" : "bg-gray-400"
                            )}
                            style={{ width: `${mastery}%` }}
                        ></div>
                     </div>
                 </div>
             )
        }) : (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">{STRINGS.common.noItems}</div>
        )}
      </div>

      {/* Table View (Hidden on Mobile/Tablet, visible on LG+) */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-[#FFD500]">
                    {selectedIds.size > 0 && selectedIds.size === filteredData.length ? <ThemedIcon iconKey="checkboxChecked" Fallback={CheckSquare} size={16} /> : <ThemedIcon iconKey="checkboxUnchecked" Fallback={Square} size={16} />}
                  </button>
                </th>
                <th className="px-3 py-3 font-semibold text-center w-14">{STRINGS.common.id}</th>
                <th className="px-3 py-3 font-semibold min-w-[120px]">{STRINGS.vocab.tableHeaders.word}</th>
                <th className="px-3 py-3 font-semibold min-w-[120px]">{STRINGS.vocab.tableHeaders.reading}</th>
                <th className="px-3 py-3 font-semibold min-w-[150px]">{STRINGS.vocab.tableHeaders.meaning}</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">POS</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">{STRINGS.vocab.tableHeaders.level}</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">{STRINGS.vocab.tableHeaders.chapter}</th>
                <th className="px-3 py-3 font-semibold text-right whitespace-nowrap w-32">{STRINGS.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredData.length > 0 ? filteredData.map((item) => {
                const mastery = getMasteryPercentage(DataType.VOCAB, item.id);
                return (
                  <tr key={item.id} className={clsx("hover:bg-gray-50 transition-colors group", selectedIds.has(item.id) && "bg-yellow-50")}>
                    <td className="px-3 py-3">
                      <button onClick={(e) => toggleSelection(e, item.id)} className={clsx("text-gray-400 hover:text-[#FFD500]", selectedIds.has(item.id) && "text-[#FFD500]")}>
                        {selectedIds.has(item.id) ? <ThemedIcon iconKey="checkboxChecked" Fallback={CheckSquare} size={16} /> : <ThemedIcon iconKey="checkboxUnchecked" Fallback={Square} size={16} />}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-gray-400 font-mono text-center">{item.id}</td>
                    <td className="px-3 py-3 font-bold text-black jp-text text-base flex items-center gap-2">
                      <span className={clsx("w-2 h-2 rounded-full flex-shrink-0 border", getStatusColor(item.id).split(' ')[0].replace('bg-', 'bg-'))}></span>
                      {item.word}
                    </td>
                    <td className="px-3 py-3 text-gray-600 jp-text">{item.reading}</td>
                    <td className="px-3 py-3 text-black max-w-[200px] truncate" title={item.meaning}>{item.meaning}</td>
                    <td className="px-3 py-3">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 whitespace-nowrap">
                            {item.partOfSpeech || 'Noun'}
                        </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1 items-start w-20">
                          <div className="flex justify-between w-full">
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold border border-gray-200">
                                {item.jlpt}
                            </span>
                            <span className={clsx("text-[8px] px-1 py-0.5 rounded border uppercase tracking-wider font-bold", getStatusColor(item.id))}>
                                {getLearningStage(DataType.VOCAB, item.id).substring(0, 4)}
                            </span>
                          </div>
                          {/* Mastery Bar */}
                          <div className="w-full h-1 bg-gray-200 rounded-full mt-0.5 overflow-hidden" title={`Mastery: ${mastery}%`}>
                              <div 
                                className={clsx("h-full rounded-full transition-all duration-500", 
                                    mastery >= 100 ? "bg-[#FFD500]" : 
                                    mastery > 20 ? "bg-black" : "bg-gray-400"
                                )}
                                style={{ width: `${mastery}%` }}
                              ></div>
                          </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {item.chapter && (
                          <span className="px-2 py-0.5 bg-white text-gray-500 rounded text-xs border border-gray-200 whitespace-nowrap">
                              Ch. {item.chapter}
                          </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-100">
                        <button onClick={(e) => handleMarkLearned(e, item.id)} title={STRINGS.common.markLearned} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                          <ThemedIcon iconKey="actionCheck" Fallback={Check} size={16} />
                        </button>
                        <button onClick={(e) => handleResetProgress(e, item.id)} title="Reset Progress" className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg">
                          <ThemedIcon iconKey="actionReset" Fallback={RotateCcw} size={16} />
                        </button>
                        <button onClick={(e) => handleEdit(e, item)} title={STRINGS.common.edit} className="p-1.5 text-gray-400 hover:text-[#FFD500] hover:bg-yellow-50 rounded-lg">
                          <ThemedIcon iconKey="actionEdit" Fallback={Edit2} size={16} />
                        </button>
                        <button onClick={(e) => handleDelete(e, item.id)} title={STRINGS.common.delete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">{STRINGS.common.noItems}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vocab;