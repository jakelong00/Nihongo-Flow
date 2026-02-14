import React from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DataType } from '../types';
import { STRINGS } from '../constants/strings';
import { Trophy, TrendingUp, Book } from 'lucide-react';
import { ThemedIcon } from '../components/ThemedIcon';

const Dashboard: React.FC = () => {
  const { vocabData, kanjiData, grammarData, statsData } = useFileSystem();

  const getMastery = (type: DataType) => {
    const learnedItems = new Set(
      statsData
        .filter(s => s.category === type && s.result === 'easy')
        .map(s => s.itemId)
    );
    return learnedItems.size;
  };

  const stats = [
    { 
        name: 'Vocab', 
        total: vocabData.length, 
        learned: getMastery(DataType.VOCAB), 
        color: '#FFD500', // Hello Yellow
        bg: 'bg-[#FFD500]',
        textColor: 'text-black',
        icon: Book,
        key: 'dashBook'
    },
    { 
        name: 'Kanji', 
        total: kanjiData.length, 
        learned: getMastery(DataType.KANJI), 
        color: '#222222', // Hello Black
        bg: 'bg-[#222222]',
        textColor: 'text-white',
        icon: Trophy,
        key: 'dashTrophy'
    },
    { 
        name: 'Grammar', 
        total: grammarData.length, 
        learned: getMastery(DataType.GRAMMAR), 
        color: '#717171', // Hello Gray
        bg: 'bg-[#717171]',
        textColor: 'text-white',
        icon: TrendingUp,
        key: 'dashTrend'
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight">{STRINGS.dashboard.title}</h2>
            <p className="text-gray-500 text-xs md:text-sm">Track your journey.</p>
          </div>
      </div>
      
      {/* 1 col on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className={`relative overflow-hidden rounded-xl p-5 ${stat.textColor} shadow-md ${stat.bg} transition-transform hover:-translate-y-1`}>
            
            {/* Background Icon */}
            <div className="absolute -right-4 -bottom-4 opacity-10">
                <ThemedIcon iconKey={stat.key} Fallback={stat.icon} size={100} />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-bold opacity-90">{stat.name}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${stat.name === 'Vocab' ? 'border-black/10 bg-white/30 text-black' : 'border-white/20 bg-white/20 text-white'}`}>
                    {STRINGS.dashboard.totalPrefix}{stat.total}
                </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl md:text-4xl font-black">
                    {Math.round((stat.learned / (stat.total || 1)) * 100)}%
                    </span>
                    <span className="text-xs font-medium opacity-80">Mastery</span>
                </div>
                
                <div className="w-full bg-black/10 rounded-full h-2 mb-1 backdrop-blur-sm">
                <div 
                    className={`h-2 rounded-full shadow-lg transition-all duration-1000 ease-out ${stat.name === 'Vocab' ? 'bg-black' : 'bg-[#FFD500]'}`}
                    style={{ width: `${(stat.learned / (stat.total || 1)) * 100}%` }}
                ></div>
                </div>
                <p className="text-xs font-medium opacity-80">{stat.learned}{STRINGS.dashboard.learnedSuffix}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-base md:text-lg font-bold text-black mb-4 flex items-center gap-2">
            <ThemedIcon iconKey="dashTrend" Fallback={TrendingUp} size={20} className="text-[#FFD500]" />
            {STRINGS.dashboard.reviewActivity}
        </h3>
        <div className="h-56 md:h-64">
           {statsData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats} barSize={32}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11, fontWeight: 600}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                 <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', background: '#FFFFFF', color: '#000', fontSize: '12px' }}
                 />
                 <Bar dataKey="learned" name={STRINGS.dashboard.learnedItems} radius={[4, 4, 0, 0]}>
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="flex h-full items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
               {STRINGS.dashboard.noReviewData}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;