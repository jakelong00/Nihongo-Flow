
import React, { useMemo, useEffect, useState } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { DataType } from '../types';
import { ShibaMascot } from '../components/ShibaMascot';
import { Flame, Calendar, CheckCircle2, TrendingUp, X, BarChart3, Clock, BookOpen, Languages, GraduationCap } from 'lucide-react';
import clsx from 'clsx';

const Dashboard: React.FC = () => {
  const { vocabData, kanjiData, grammarData, statsData } = useFileSystem();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getMastery = (type: DataType) => {
    const learnedItems = new Set(
      statsData
        .filter(s => s.category === type && (s.result === 'easy' || s.result === 'mastered'))
        .map(s => s.itemId)
    );
    return learnedItems.size;
  };

  const totalLearned = getMastery(DataType.VOCAB) + getMastery(DataType.KANJI) + getMastery(DataType.GRAMMAR);
  
  const getShibaQuote = () => {
    if (totalLearned === 0) return "Ready to start your journey? Let's go!";
    if (totalLearned > 100) return "Sugoi! Your power level is rising fast!";
    return "Great consistency! Keep training, Ganbatte!";
  };

  const stats = [
    { name: 'VOCABULARY', total: vocabData.length, learned: getMastery(DataType.VOCAB), color: '#78A2CC', jp: '語' },
    { name: 'KANJI DOJO', total: kanjiData.length, learned: getMastery(DataType.KANJI), color: '#FFB7C5', jp: '漢' },
    { name: 'GRAMMAR', total: grammarData.length, learned: getMastery(DataType.GRAMMAR), color: '#B4E4C3', jp: '文' },
  ];

  const { months, currentStreak, uniqueBreakdown } = useMemo(() => {
    const counts: Record<string, number> = {};
    const detailedCounts: Record<string, Record<DataType, number>> = {};
    const uniqueItems: Record<DataType, Set<string>> = {
        [DataType.VOCAB]: new Set(),
        [DataType.KANJI]: new Set(),
        [DataType.GRAMMAR]: new Set(),
        [DataType.STATS]: new Set()
    };

    statsData.forEach(stat => {
      const date = stat.date.split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
      
      if (!detailedCounts[date]) {
          detailedCounts[date] = { [DataType.VOCAB]: 0, [DataType.KANJI]: 0, [DataType.GRAMMAR]: 0, [DataType.STATS]: 0 };
      }
      detailedCounts[date][stat.category]++;
      uniqueItems[stat.category].add(stat.itemId);
    });

    // Calculate Streak
    let streak = 0;
    const sortedDates = Object.keys(counts).sort().reverse();
    const todayRef = new Date();
    const todayStr = todayRef.toISOString().split('T')[0];
    const yesterdayRef = new Date();
    yesterdayRef.setDate(todayRef.getDate() - 1);
    const yestStr = yesterdayRef.toISOString().split('T')[0];

    if (counts[todayStr] || counts[yestStr]) {
        for (const date of sortedDates) {
            if (counts[date]) streak++;
            else break;
        }
    }

    // Group into 12 months
    const today = new Date();
    const resultMonths = [];

    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthYear = d.getFullYear();
        
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const firstDayOfWeek = d.getDay(); // 0 (Sun) to 6 (Sat)
        
        const monthDays = [];
        // Add padding for the first week
        for (let p = 0; p < firstDayOfWeek; p++) {
            monthDays.push(null);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(d.getFullYear(), d.getMonth(), day);
            const dateStr = dateObj.toISOString().split('T')[0];
            monthDays.push({
                date: dateStr,
                count: counts[dateStr] || 0,
                details: detailedCounts[dateStr] || null
            });
        }

        // Split into weeks (columns)
        const monthWeeks = [];
        let currentWeek = [];
        for (const day of monthDays) {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                monthWeeks.push(currentWeek);
                currentWeek = [];
            }
        }
        if (currentWeek.length > 0) {
            // Pad end of last week
            while (currentWeek.length < 7) currentWeek.push(null);
            monthWeeks.push(currentWeek);
        }

        resultMonths.push({
            name: monthName,
            year: monthYear,
            weeks: monthWeeks
        });
    }

    return { 
        months: resultMonths,
        currentStreak: streak,
        uniqueBreakdown: {
            vocab: uniqueItems[DataType.VOCAB].size,
            kanji: uniqueItems[DataType.KANJI].size,
            grammar: uniqueItems[DataType.GRAMMAR].size
        }
    };
  }, [statsData]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-[#4A4E69]/5';
    if (count < 5) return 'bg-[#B4E4C3]/30';
    if (count < 15) return 'bg-[#B4E4C3]/60';
    return 'bg-[#B4E4C3]';
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    // Search across all months
    for (const m of months) {
        for (const w of m.weeks) {
            const found = w.find(d => d?.date === selectedDate);
            if (found) return found;
        }
    }
    return null;
  }, [selectedDate, months]);

  return (
    <div className="p-7 md:p-11 pt-28 md:pt-36 max-w-7xl mx-auto space-y-10 animate-soft-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[#4A4E69]/5 pb-10">
        <div className="flex items-center gap-8">
            <ShibaMascot size="md" message={getShibaQuote()} />
            <div>
                <h2 className="text-4xl font-black anime-title tracking-tight text-[#4A4E69] leading-none uppercase">MISSION LOG</h2>
                <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-black anime-title text-[#4A4E69]/30 uppercase tracking-[0.45em]">
                        {isLoaded ? "SYSTEMS SYNCHRONIZED" : "INITIALIZING..."}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B4E4C3] animate-pulse"></div>
                </div>
            </div>
        </div>
        <div className="flex gap-4">
            <div className="px-5 py-3 bg-white border border-[#4A4E69]/5 rounded-2xl shadow-sm flex items-center gap-3 transition-transform hover:scale-105">
                <Flame size={18} className="text-[#FFB7C5]" />
                <div className="leading-none">
                    <div className="text-[14px] font-black text-[#4A4E69]">{currentStreak} DAYS</div>
                    <div className="text-[8px] font-black text-[#4A4E69]/30 uppercase tracking-widest mt-1">CURRENT STREAK</div>
                </div>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, idx) => {
          const masteryPercent = Math.round((stat.learned / (stat.total || 1)) * 100);
          return (
            <div key={stat.name} className="bg-white border border-[#4A4E69]/5 p-10 rounded-[48px] shadow-sm hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 overflow-hidden relative" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="absolute right-4 top-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <span className="text-[140px] font-black jp-text leading-none select-none">{stat.jp}</span>
              </div>
              <div className="flex justify-between items-start mb-12 relative z-10">
                  <h3 className="anime-title text-[10px] font-black text-[#4A4E69]/30 uppercase tracking-[0.25em]">{stat.name}</h3>
                  <span className="text-[9px] font-black anime-title text-[#4A4E69]/40 bg-[#FAF9F6] px-3 py-1.5 rounded-full border border-[#4A4E69]/5">{stat.total} ITEMS</span>
              </div>
              <div className="flex items-baseline gap-2 mb-10 relative z-10">
                  <span className="text-7xl font-black text-[#4A4E69] anime-title tracking-tighter">
                      {isLoaded ? masteryPercent : '0'}<span className="text-2xl opacity-30 ml-1">%</span>
                  </span>
                  <span className="text-[11px] font-black anime-title text-[#4A4E69]/30 uppercase tracking-[0.2em] ml-2">MASTERY</span>
              </div>
              <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden shadow-inner relative z-10">
                  <div 
                      className="h-full transition-all duration-1000 ease-out rounded-full shadow-sm"
                      style={{ width: isLoaded ? `${masteryPercent}%` : '0%', backgroundColor: stat.color }}
                  ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-[#4A4E69]/5 p-6 md:p-10 rounded-[48px] shadow-sm overflow-hidden group">
        <div className="flex flex-col xl:flex-row gap-10">
            <div className="flex-1 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-[#78A2CC]" />
                        <h3 className="anime-title text-[12px] font-black text-[#4A4E69] uppercase tracking-[0.35em]">Activity Heatmap</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-[#4A4E69]/20 uppercase">Less</span>
                        {[0.05, 0.3, 0.6, 1].map(op => (
                            <div key={op} className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#B4E4C3', opacity: op }}></div>
                        ))}
                        <span className="text-[9px] font-black text-[#4A4E69]/20 uppercase">More</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {months.map((month, mIdx) => (
                        <div key={`${month.name}-${month.year}`} className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#4A4E69]/5 hover:shadow-md transition-all animate-soft-in flex flex-col items-center shrink-0" style={{ animationDelay: `${mIdx * 0.05}s` }}>
                            <div className="flex items-center justify-between w-full mb-2.5">
                                <span className="text-[9px] font-black text-[#4A4E69] uppercase tracking-widest">{month.name}</span>
                                <span className="text-[8px] font-black text-[#4A4E69]/20">{month.year}</span>
                            </div>
                            <div className="flex gap-1">
                                {month.weeks.map((week, wIdx) => (
                                    <div key={wIdx} className="flex flex-col gap-1">
                                        {week.map((day, dIdx) => (
                                            <button 
                                                key={dIdx}
                                                onClick={() => day && setSelectedDate(day.date)}
                                                title={day ? `${day.date}: ${day.count} activities` : ''}
                                                disabled={!day}
                                                className={clsx(
                                                    "w-2.5 h-2.5 rounded-sm transition-all duration-300",
                                                    day ? [getColorClass(day.count), "hover:scale-125 hover:z-10 cursor-pointer"] : "bg-transparent",
                                                    selectedDate === day?.date ? "ring-2 ring-[#78A2CC] scale-110 z-10" : ""
                                                )}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="xl:w-72 flex flex-col gap-6 shrink-0 xl:border-l xl:border-[#4A4E69]/5 xl:pl-10">
                <div className="p-6 bg-[#FAF9F6] rounded-[32px] border border-[#4A4E69]/5 relative overflow-hidden group/card">
                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover/card:scale-110 transition-transform">
                        <BarChart3 size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-5 relative z-10">
                        <TrendingUp size={16} className="text-[#78A2CC]" />
                        <span className="text-[10px] font-black text-[#4A4E69]/40 uppercase tracking-widest">Global Progress</span>
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpen size={12} className="text-[#78A2CC]" />
                                <span className="text-[11px] font-bold text-[#4A4E69]/60">Vocab</span>
                            </div>
                            <span className="text-xl font-black text-[#4A4E69] anime-title">{uniqueBreakdown.vocab}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Languages size={12} className="text-[#FFB7C5]" />
                                <span className="text-[11px] font-bold text-[#4A4E69]/60">Kanji</span>
                            </div>
                            <span className="text-xl font-black text-[#4A4E69] anime-title">{uniqueBreakdown.kanji}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={12} className="text-[#B4E4C3]" />
                                <span className="text-[11px] font-bold text-[#4A4E69]/60">Grammar</span>
                            </div>
                            <span className="text-xl font-black text-[#4A4E69] anime-title">{uniqueBreakdown.grammar}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {selectedDate && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#4A4E69]/30 backdrop-blur-md animate-soft-in">
              <div className="absolute inset-0" onClick={() => setSelectedDate(null)}></div>
              <div className="relative bg-white w-full max-w-md p-10 rounded-[48px] shadow-2xl border border-[#4A4E69]/10">
                  <button onClick={() => setSelectedDate(null)} className="absolute top-8 right-8 p-3 bg-[#FAF9F6] rounded-2xl text-[#4A4E69]/20 hover:text-[#FFB7C5] transition-all"><X size={20} /></button>
                  
                  <div className="flex items-center gap-5 mb-10">
                      <div className="p-4 bg-[#78A2CC]/10 text-[#78A2CC] rounded-[24px]">
                          <Clock size={28} />
                      </div>
                      <div>
                          <h3 className="text-[10px] font-black text-[#4A4E69]/30 uppercase tracking-[0.4em] mb-1">Activity Log</h3>
                          <p className="text-xl font-black text-[#4A4E69] anime-title uppercase">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                  </div>

                  {selectedDayData?.details ? (
                      <div className="space-y-4">
                          {[
                              { label: 'Vocabulary', count: selectedDayData.details[DataType.VOCAB], icon: 'Book', color: 'bg-[#78A2CC]/10 text-[#78A2CC]' },
                              { label: 'Kanji Dojo', count: selectedDayData.details[DataType.KANJI], icon: 'Languages', color: 'bg-[#FFB7C5]/10 text-[#FFB7C5]' },
                              { label: 'Grammar', count: selectedDayData.details[DataType.GRAMMAR], icon: 'GraduationCap', color: 'bg-[#B4E4C3]/10 text-[#B4E4C3]' }
                          ].map(row => (
                              <div key={row.label} className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-2xl border border-[#4A4E69]/5">
                                  <div className="flex items-center gap-3">
                                      <span className={clsx("p-2 rounded-xl text-xs font-black", row.color)}>{row.count}</span>
                                      <span className="text-xs font-black text-[#4A4E69] uppercase tracking-wider">{row.label}</span>
                                  </div>
                                  <div className="text-[9px] font-black text-[#4A4E69]/20 uppercase">Units Reviewed</div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="py-12 text-center opacity-30">
                          <Flame size={48} className="mx-auto mb-4" />
                          <p className="text-sm font-black uppercase tracking-widest">No activity recorded for this date.</p>
                      </div>
                  )}
              </div>
          </div>
      )}
      <div className="h-10"></div>
    </div>
  );
};

export default Dashboard;
