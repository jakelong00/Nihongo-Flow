import React, { useState } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { Plus, AlertCircle, Search, Trash2, Edit2, Check, CheckSquare, Square, X, RotateCcw } from 'lucide-react';
import { DataType, KanjiItem, LearningStage, ReviewResult } from '../types';
import { STRINGS } from '../constants/strings';
import { fuzzySearch } from '../utils/textHelper';
import { ThemedIcon } from '../components/ThemedIcon';
import clsx from 'clsx';

const Kanji: React.FC = () => {
  const { kanjiData, addKanji, updateKanji, deleteKanji, getLearningStage, getMasteryPercentage, logReview } = useFileSystem();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<Omit<KanjiItem, 'id'>>({
    character: '',
    onyomi: '',
    kunyomi: '',
    meaning: '',
    jlpt: 'N5',
    strokes: '',
    chapter: '1'
  });

  const handleEdit = (e: React.MouseEvent, item: KanjiItem) => {
    e.stopPropagation();
    setFormData({
      character: item.character,
      onyomi: item.onyomi,
      kunyomi: item.kunyomi,
      meaning: item.meaning,
      jlpt: item.jlpt,
      strokes: item.strokes,
      chapter: item.chapter || '1'
    });
    setEditingId(item.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(STRINGS.common.confirmDelete)) {
      try {
        await deleteKanji([id]);
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      } catch (err) {
        console.error("Delete failed", err);
        setError("Failed to delete item.");
      }
    }
  };

  const handleMassDelete = async () => {
      if (selectedIds.size === 0) return;
      if (window.confirm(STRINGS.common.confirmMassDelete)) {
        await deleteKanji(Array.from(selectedIds));
        setSelectedIds(new Set());
      }
    };
  
    const handleMarkLearned = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await logReview(DataType.KANJI, id, ReviewResult.MASTERED);
    };

    const handleResetProgress = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await logReview(DataType.KANJI, id, ReviewResult.FORGOT);
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
    setError(null);
    try {
      if (editingId) {
        await updateKanji({ ...formData, id: editingId });
      } else {
        await addKanji(formData);
      }
      setFormData({ character: '', onyomi: '', kunyomi: '', meaning: '', jlpt: 'N5', strokes: '', chapter: '1' });
      setIsFormOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Use fuzzySearch to check character, meaning, onyomi, AND kunyomi
  const filteredData = kanjiData.filter(k => 
    fuzzySearch(searchTerm, k.character, k.meaning, k.onyomi, k.kunyomi)
  );

  const getStatusBorder = (id: string) => {
      const stage = getLearningStage(DataType.KANJI, id);
      switch (stage) {
        case LearningStage.MASTERED: return 'border-[#FFD500] bg-white';
        case LearningStage.REVIEW: return 'border-black bg-white';
        case LearningStage.LEARNING: return 'border-gray-200 bg-white';
        default: return 'border-gray-200 bg-white opacity-80';
      }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-black text-black">{STRINGS.kanji.title}</h2>
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
            onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setFormData({ character: '', onyomi: '', kunyomi: '', meaning: '', jlpt: 'N5', strokes: '', chapter: '1' }); setError(null); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#FFD500] hover:bg-[#E6C000] text-black rounded-lg transition-colors font-bold text-sm border-b-2 border-[#D4B200]"
            >
             {isFormOpen && !editingId ? <ThemedIcon iconKey="actionClose" Fallback={X} size={18}/> : <ThemedIcon iconKey="actionAdd" Fallback={Plus} size={18}/>} 
             {isFormOpen && !editingId ? STRINGS.common.cancel : STRINGS.kanji.addBtn}
            </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <ThemedIcon iconKey="actionSearch" Fallback={Search} size={20} />
        </div>
        <input 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#FFD500] shadow-sm transition-shadow text-black bg-white placeholder-gray-400" 
            placeholder={STRINGS.kanji.searchPlaceholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isFormOpen && (
         <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 mb-8 animate-fade-in">
           <h3 className="font-bold text-lg mb-4 text-black">{editingId ? STRINGS.common.edit : STRINGS.kanji.addBtn}</h3>
           {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
               <ThemedIcon iconKey="statusError" Fallback={AlertCircle} size={16} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
             <input placeholder={STRINGS.kanji.placeholders.char} value={formData.character} onChange={e => setFormData({...formData, character: e.target.value})} className="p-3 border border-gray-300 rounded-lg" required />
             <input placeholder={STRINGS.kanji.placeholders.onyomi} value={formData.onyomi} onChange={e => setFormData({...formData, onyomi: e.target.value})} className="p-3 border border-gray-300 rounded-lg" />
             <input placeholder={STRINGS.kanji.placeholders.kunyomi} value={formData.kunyomi} onChange={e => setFormData({...formData, kunyomi: e.target.value})} className="p-3 border border-gray-300 rounded-lg" />
             <input placeholder={STRINGS.kanji.placeholders.meaning} value={formData.meaning} onChange={e => setFormData({...formData, meaning: e.target.value})} className="p-3 border border-gray-300 rounded-lg" required />
             <input placeholder={STRINGS.kanji.placeholders.strokes} type="number" value={formData.strokes} onChange={e => setFormData({...formData, strokes: e.target.value})} className="p-3 border border-gray-300 rounded-lg" />
             <input placeholder={STRINGS.kanji.placeholders.chapter} value={formData.chapter} onChange={e => setFormData({...formData, chapter: e.target.value})} className="p-3 border border-gray-300 rounded-lg" />
             <div className="flex flex-col md:flex-row gap-2 col-span-1 md:col-span-6">
                <select value={formData.jlpt} onChange={e => setFormData({...formData, jlpt: e.target.value})} className="p-3 border border-gray-300 rounded-lg flex-1 bg-white">
                    {['N5','N4','N3','N2','N1'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button type="submit" className="px-6 py-3 md:py-0 bg-[#FFD500] text-black rounded-lg hover:bg-[#E6C000] font-bold border-b-2 border-[#D4B200]">
                    {editingId ? STRINGS.common.update : STRINGS.common.save}
                </button>
             </div>
          </form>
         </div>
      )}

      {/* Grid: 2 cols on mobile, 3 on tablet, 4 on large, 6 on xl */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {filteredData.map(k => {
            const mastery = getMasteryPercentage(DataType.KANJI, k.id);
            return (
            <div 
                key={k.id} 
                className={clsx(
                    "relative group p-3 md:p-4 rounded-xl shadow-sm border transition-all flex flex-col items-center text-center cursor-default bg-white",
                    getStatusBorder(k.id),
                    selectedIds.has(k.id) ? "ring-2 ring-[#FFD500] ring-offset-2" : "hover:shadow-md"
                )}
            >
                {/* ID Badge */}
                <span className="absolute top-2 right-2 text-[10px] text-gray-300 font-mono">#{k.id}</span>
                
                {/* Selection Checkbox */}
                <button 
                    onClick={(e) => toggleSelection(e, k.id)} 
                    className={clsx("absolute top-2 left-2 text-gray-300 hover:text-[#FFD500]", selectedIds.has(k.id) && "text-[#FFD500]")}
                >
                     {selectedIds.has(k.id) ? <ThemedIcon iconKey="checkboxChecked" Fallback={CheckSquare} size={16} /> : <ThemedIcon iconKey="checkboxUnchecked" Fallback={Square} size={16} />}
                </button>

                <div className="text-3xl md:text-4xl font-bold text-black jp-text mb-2 mt-2">{k.character}</div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1 truncate w-full">On: {k.onyomi || '-'}</div>
                <div className="text-xs text-gray-400 mb-2 px-1 truncate w-full">Kun: {k.kunyomi || '-'}</div>
                <div className="text-sm font-medium text-black px-1 truncate w-full" title={k.meaning}>{k.meaning}</div>
                
                <div className="w-full px-2 mt-2 space-y-2">
                    <div className="flex gap-2 justify-center">
                        <div className="text-[10px] bg-gray-100 text-black px-2 py-0.5 rounded-full font-bold">{k.jlpt}</div>
                        {k.chapter && (
                            <div className="text-[10px] bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">Ch. {k.chapter}</div>
                        )}
                    </div>
                     {/* Mastery Bar */}
                     <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden" title={`Mastery: ${mastery}%`}>
                        <div 
                            className={clsx("h-full rounded-full transition-all duration-500", 
                                mastery >= 100 ? "bg-[#FFD500]" : 
                                mastery > 20 ? "bg-black" : "bg-gray-400"
                            )}
                            style={{ width: `${mastery}%` }}
                        ></div>
                    </div>
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-x-0 bottom-0 bg-white p-2 flex justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg border-t border-gray-100 z-10">
                    <button onClick={(e) => handleMarkLearned(e, k.id)} title={STRINGS.common.markLearned} className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded">
                        <ThemedIcon iconKey="actionCheck" Fallback={Check} size={16} />
                    </button>
                    <button onClick={(e) => handleResetProgress(e, k.id)} title="Reset Progress" className="p-1.5 hover:bg-orange-50 text-gray-400 hover:text-orange-600 rounded">
                        <ThemedIcon iconKey="actionReset" Fallback={RotateCcw} size={16} />
                    </button>
                    <button onClick={(e) => handleEdit(e, k)} title={STRINGS.common.edit} className="p-1.5 hover:bg-yellow-50 text-gray-400 hover:text-[#FFD500] rounded">
                        <ThemedIcon iconKey="actionEdit" Fallback={Edit2} size={16} />
                    </button>
                    <button onClick={(e) => handleDelete(e, k.id)} title={STRINGS.common.delete} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded">
                        <ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16} />
                    </button>
                </div>
            </div>
        )})}
      </div>
      
      {filteredData.length === 0 && (
         <div className="text-center py-12 text-gray-400">{STRINGS.common.noItems}</div>
      )}
    </div>
  );
};

export default Kanji;