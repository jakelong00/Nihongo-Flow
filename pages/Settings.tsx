import React from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { FolderX, Download } from 'lucide-react';
import { toCSV } from '../utils/csvHelper';
import { DataType } from '../types';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from '../components/ThemedIcon';

const Settings: React.FC = () => {
  const { resetDirectory, vocabData, kanjiData, grammarData, statsData } = useFileSystem();

  const handleBackup = () => {
    const backupData = {
        vocab: toCSV(vocabData),
        kanji: toCSV(kanjiData),
        grammar: toCSV(grammarData),
        stats: toCSV(statsData)
    };
    
    // Create a simple blob download for vocab as an example
    const blob = new Blob([backupData.vocab], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab_backup_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">{STRINGS.settings.title}</h2>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{STRINGS.settings.fileManagement}</h3>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                        <div className="font-medium text-slate-700">{STRINGS.settings.backupTitle}</div>
                        <div className="text-sm text-slate-500">{STRINGS.settings.backupDesc}</div>
                    </div>
                    <button onClick={handleBackup} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <ThemedIcon iconKey="actionDownload" Fallback={Download} size={20} />
                    </button>
                </div>
                
                 <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                    <div>
                        <div className="font-medium text-red-800">{STRINGS.settings.disconnectTitle}</div>
                        <div className="text-sm text-red-600">{STRINGS.settings.disconnectDesc}</div>
                    </div>
                    <button onClick={resetDirectory} className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
                        <ThemedIcon iconKey="actionDisconnect" Fallback={FolderX} size={16} /> {STRINGS.settings.btnDisconnect}
                    </button>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{STRINGS.settings.appInfo}</h3>
            <div className="text-sm text-slate-500 space-y-2">
                <p>{STRINGS.settings.labels.version}</p>
                <p>{STRINGS.settings.labels.engine}</p>
                <p>{STRINGS.settings.labels.theme}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;