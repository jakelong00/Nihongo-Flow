import React, { useState } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { Plus, AlertCircle, Search, Trash2, Edit2, Check, CheckSquare, Square, X, MinusCircle, RotateCcw } from 'lucide-react';
import { DataType, GrammarItem, LearningStage, ReviewResult } from '../types';
import { STRINGS } from '../constants/strings';
import { fuzzySearch } from '../utils/textHelper';
import { ThemedIcon } from '../components/ThemedIcon';
import clsx from 'clsx';

const Grammar: React.FC = () => {
  const { grammarData, addGrammar, updateGrammar, deleteGrammar, getLearningStage, getMasteryPercentage, logReview } = useFileSystem();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<Omit<GrammarItem, 'id'>>({
    rule: '',
    explanation: '',
    examples: [''],
    jlpt: 'N5',
    chapter: '1'
  });

  const handleEdit = (e: React.MouseEvent, item: GrammarItem) => {
    e.stopPropagation();
    setFormData({
      rule: item.rule,
      explanation: item.explanation,
      examples: item.examples && item.examples.length > 0 ? item.examples : [''],
      jlpt: item.jlpt,
      chapter: item.chapter || '1'
    });
    setEditingId(item.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData({ ...formData, examples: newExamples });
  };

  const addExampleField = () => {
    setFormData({ ...formData, examples: [...formData.examples, ''] });
  };

  const removeExampleField = (index: number) => {
    const newExamples = formData.examples.filter((_, i) => i !== index);
    setFormData({ ...formData, examples: newExamples });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(STRINGS.common.confirmDelete)) {
      try {
        await deleteGrammar([id]);
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
      await deleteGrammar(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleMarkLearned = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await logReview(DataType.GRAMMAR, id, ReviewResult.MASTERED);
  };

  const handleResetProgress = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await logReview(DataType.GRAMMAR, id, ReviewResult.FORGOT);
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
      const cleanExamples = formData.examples.filter(ex => ex.trim() !== '');
      const finalData = { ...formData, examples: cleanExamples };
      
      if (editingId) {
        await updateGrammar({ ...finalData, id: editingId });
      } else {
        await addGrammar(finalData);
      }
      setFormData({ rule: '', explanation: '', examples: [''], jlpt: 'N5', chapter: '1' });
      setIsFormOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Use fuzzySearch for grammar rules and explanations
  const filteredData = grammarData.filter(g => 
    fuzzySearch(searchTerm, g.rule, g.explanation)
  );

  const getStatusColor = (id: string) => {
    const stage = getLearningStage(DataType.GRAMMAR, id);
    switch (stage) {
      case LearningStage.MASTERED: return 'border-l-4 border-l-[#FFD500] bg-white';
      case LearningStage.REVIEW: return 'border-l-4 border-l-black bg-white';
      case LearningStage.LEARNING: return 'border-l-4 border-l-gray-300 bg-white';
      default: return 'border border-gray-200 bg-white opacity-90';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-black text-black">{STRINGS.grammar.title}</h2>
        <div className="flex gap-2 w-full md:w-auto">
            {selectedIds.size > 0 && (
                <button 
                  onClick={handleMassDelete}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium border border-red-200 text-sm"
                >
                  <ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16} /> {STRINGS.common.deleteSelected} ({selectedIds.size})
                </button>
            )}
            <button
            onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setFormData({ rule: '', explanation: '', examples: [''], jlpt: 'N5', chapter: '1' }); setError(null); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 hover:bg-black text-white rounded-lg transition-colors font-bold text-sm"
            >
             {isFormOpen && !editingId ? <ThemedIcon iconKey="actionClose" Fallback={X} size={18}/> : <ThemedIcon iconKey="actionAdd" Fallback={Plus} size={18}/>} 
             {isFormOpen && !editingId ? STRINGS.common.cancel : STRINGS.grammar.addBtn}
            </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <ThemedIcon iconKey="actionSearch" Fallback={Search} size={20} />
        </div>
        <input 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#FFD500] shadow-sm transition-shadow text-black bg-white placeholder-gray-400" 
            placeholder={STRINGS.grammar.searchPlaceholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isFormOpen && (
         <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 mb-8 animate-fade-in">
           <h3 className="font-bold text-lg mb-4 text-black">{editingId ? STRINGS.common.edit : STRINGS.grammar.addBtn}</h3>
           {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
               <ThemedIcon iconKey="statusError" Fallback={AlertCircle} size={16} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder={STRINGS.grammar.placeholders.rule} value={formData.rule} onChange={e => setFormData({...formData, rule: e.target.value})} className="p-3 border border-gray-300 rounded-lg" required />
                <select value={formData.jlpt} onChange={e => setFormData({...formData, jlpt: e.target.value})} className="p-3 border border-gray-300 rounded-lg bg-white">
                    {['N5','N4','N3','N2','N1'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input placeholder={STRINGS.grammar.placeholders.chapter} value={formData.chapter} onChange={e => setFormData({...formData, chapter: e.target.value})} className="p-3 border border-gray-300 rounded-lg" required />
             </div>
             <textarea placeholder={STRINGS.grammar.placeholders.explanation} value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg h-24" required />
             
             {/* Dynamic Examples */}
             <div className="space-y-2">
                 <label className="text-sm font-semibold text-gray-500">{STRINGS.grammar.exampleLabel}</label>
                 {formData.examples.map((ex, index) => (
                     <div key={index} className="flex gap-2">
                         <input 
                            placeholder={STRINGS.grammar.placeholders.example} 
                            value={ex} 
                            onChange={e => handleExampleChange(index, e.target.value)} 
                            className="flex-1 p-3 border border-gray-300 rounded-lg" 
                         />
                         {formData.examples.length > 1 && (
                            <button type="button" onClick={() => removeExampleField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                <ThemedIcon iconKey="actionDelete" Fallback={MinusCircle} size={20} />
                            </button>
                         )}
                     </div>
                 ))}
                 <button type="button" onClick={addExampleField} className="text-sm text-[#FFD500] hover:underline flex items-center gap-1 font-bold">
                     <ThemedIcon iconKey="actionAdd" Fallback={Plus} size={16} /> {STRINGS.grammar.addExample}
                 </button>
             </div>

             <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded font-medium">{STRINGS.common.cancel}</button>
                <button type="submit" className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-black font-bold">
                    {editingId ? STRINGS.common.update : STRINGS.common.save}
                </button>
             </div>
          </form>
         </div>
      )}

      <div className="space-y-4">
        {filteredData.map(g => {
            const mastery = getMasteryPercentage(DataType.GRAMMAR, g.id);
            return (
            <div key={g.id} className={clsx("group relative p-4 md:p-6 rounded-xl shadow-sm transition-all", getStatusColor(g.id))}>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-2 pl-8 md:pl-10 relative">
                    {/* Selection */}
                    <button 
                        onClick={(e) => toggleSelection(e, g.id)} 
                        className={clsx("absolute top-1 left-0 md:top-1 md:left-2 text-gray-300 hover:text-[#FFD500]", selectedIds.has(g.id) && "text-[#FFD500]")}
                    >
                         {selectedIds.has(g.id) ? <ThemedIcon iconKey="checkboxChecked" Fallback={CheckSquare} size={20} /> : <ThemedIcon iconKey="checkboxUnchecked" Fallback={Square} size={20} />}
                    </button>

                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <span className="text-xs font-mono text-gray-400">#{g.id}</span>
                        <h3 className="text-lg md:text-xl font-bold text-black jp-text">{g.rule}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex flex-col items-end w-24 gap-1">
                            <div className="flex gap-1">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] md:text-xs font-bold rounded border border-gray-200">{g.jlpt}</span>
                                {g.chapter && (
                                    <span className="px-2 py-1 bg-white text-gray-500 text-[10px] md:text-xs rounded border border-gray-200">Ch. {g.chapter}</span>
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

                        <div className="flex md:opacity-0 group-hover:opacity-100 transition-opacity gap-1 ml-2">
                             <button onClick={(e) => handleMarkLearned(e, g.id)} title={STRINGS.common.markLearned} className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded">
                                <ThemedIcon iconKey="actionCheck" Fallback={Check} size={16} />
                            </button>
                            <button onClick={(e) => handleResetProgress(e, g.id)} title="Reset Progress" className="p-1.5 hover:bg-orange-50 text-gray-400 hover:text-orange-600 rounded">
                                <ThemedIcon iconKey="actionReset" Fallback={RotateCcw} size={16} />
                            </button>
                            <button onClick={(e) => handleEdit(e, g)} title={STRINGS.common.edit} className="p-1.5 hover:bg-yellow-50 text-gray-400 hover:text-[#FFD500] rounded">
                                <ThemedIcon iconKey="actionEdit" Fallback={Edit2} size={16} />
                            </button>
                            <button onClick={(e) => handleDelete(e, g.id)} title={STRINGS.common.delete} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-700 rounded">
                                <ThemedIcon iconKey="actionDelete" Fallback={Trash2} size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-gray-600 mb-4 pl-0 md:pl-10 text-sm md:text-base">{g.explanation}</p>
                {g.examples && g.examples.length > 0 && (
                    <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200 md:ml-10">
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">{STRINGS.grammar.exampleLabel}</p>
                        <ul className="list-disc list-inside space-y-1">
                            {g.examples.map((ex, i) => (
                                <li key={i} className="text-base md:text-lg text-black jp-text">{ex}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )})}
      </div>
      
      {filteredData.length === 0 && (
         <div className="text-center py-12 text-gray-400">{STRINGS.common.noItems}</div>
      )}
    </div>
  );
};

export default Grammar;