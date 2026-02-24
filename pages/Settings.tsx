
import React from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { FolderX, Download, Settings as SettingsIcon, Info, ShieldCheck, Database } from 'lucide-react';
import { toCSV } from '../utils/csvHelper';
import { STRINGS } from '../constants/strings';
import { ShibaMascot } from '../components/ShibaMascot';
import { ExcelToCSVTool } from '../components/ExcelToCSVTool';

const Settings: React.FC = () => {
  const { resetDirectory, vocabData, kanjiData, grammarData, statsData } = useFileSystem();

  const handleBackup = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const downloadFile = (data: any[], filename: string) => {
      const csv = toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_backup_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    downloadFile(vocabData, 'vocab');
    downloadFile(kanjiData, 'kanji');
    downloadFile(grammarData, 'grammar');
  };

  return (
    <div className="p-6 md:p-10 pt-20 max-w-5xl mx-auto space-y-8 animate-soft-in">
      <div className="border-b border-[#4A4E69]/5 pb-6 flex items-end justify-between">
        <div className="flex items-center gap-6">
          <ShibaMascot size="sm" message={STRINGS.mascot.settings} />
          <div>
              <h2 className="text-2xl font-black anime-title tracking-tight text-[#4A4E69] uppercase">{STRINGS.settings.title}</h2>
              <p className="text-[10px] font-black anime-title text-[#4A4E69]/30 uppercase tracking-[0.3em] mt-1">{STRINGS.settings.subtitle}</p>
          </div>
        </div>
        <div className="p-2 bg-[#78A2CC]/10 text-[#78A2CC] rounded-xl">
            <SettingsIcon size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#4A4E69]/5 space-y-6 flex flex-col">
            <h3 className="anime-title text-[9px] font-black text-[#78A2CC] uppercase tracking-widest flex items-center gap-2">
                <Database size={14} /> {STRINGS.settings.backupTitle}
            </h3>
            <p className="text-xs font-bold text-[#4A4E69]/50 leading-relaxed">{STRINGS.settings.backupDesc}</p>
            <div className="mt-auto">
                <button onClick={handleBackup} className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#FAF9F6] border border-[#78A2CC]/20 text-[#78A2CC] rounded-xl font-black anime-title uppercase tracking-widest text-[9px] hover:bg-[#78A2CC] hover:text-white transition-all">
                    <Download size={16} /> {STRINGS.settings.backupBtn}
                </button>
            </div>
        </div>

        <ExcelToCSVTool />

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#4A4E69]/5 space-y-6 flex flex-col">
            <h3 className="anime-title text-[9px] font-black text-[#FFB7C5] uppercase tracking-widest flex items-center gap-2">
                <FolderX size={14} /> {STRINGS.settings.disconnectTitle}
            </h3>
            <p className="text-xs font-bold text-[#4A4E69]/50 leading-relaxed">{STRINGS.settings.disconnectDesc}</p>
            <div className="mt-auto">
                <button onClick={resetDirectory} className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#FFB7C5]/5 text-[#FFB7C5] rounded-xl font-black anime-title uppercase tracking-widest text-[9px] hover:bg-[#FFB7C5] hover:text-white transition-all border border-[#FFB7C5]/20">
                    <FolderX size={16} /> {STRINGS.settings.disconnectBtn}
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-[#4A4E69]/5 flex items-center gap-6">
            <div className="p-4 bg-[#B4E4C3]/10 text-[#B4E4C3] rounded-2xl border border-[#B4E4C3]/20">
                <ShieldCheck size={32} />
            </div>
            <div className="flex-1 space-y-1">
                <h3 className="anime-title text-[8px] font-black text-[#4A4E69]/30 uppercase tracking-[0.4em]">{STRINGS.settings.metaTitle}</h3>
                <div className="text-[10px] font-black text-[#4A4E69] space-y-0.5">
                    <p>BUILD {STRINGS.common.version}</p>
                    <p className="opacity-40 uppercase tracking-tighter">Local File Storage V2</p>
                </div>
            </div>
      </div>
    </div>
  );
};

export default Settings;
