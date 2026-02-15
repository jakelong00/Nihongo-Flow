
import React, { useState } from 'react';
import { FolderPlus, CheckCircle, AlertCircle, ArrowRight, Database, AlertTriangle, Leaf, Info } from 'lucide-react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useNavigate } from 'react-router-dom';
import { DataType } from '../types';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from '../components/ThemedIcon';
import clsx from 'clsx';

const Home: React.FC = () => {
  const { dirHandle, isLocalMode, selectDirectory, useBrowserStorage, filesStatus, isLoading, isFileSystemSupported } = useFileSystem();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReady = dirHandle || isLocalMode;

  const allFilesReady = 
    filesStatus[DataType.VOCAB] && 
    filesStatus[DataType.KANJI] && 
    filesStatus[DataType.GRAMMAR] && 
    filesStatus[DataType.STATS];

  const handleEnter = () => {
    navigate('/dashboard');
  };

  const handleSelectDirectory = async () => {
    if (!isFileSystemSupported) return;
    setErrorMsg(null);
    try {
        await selectDirectory();
    } catch (error: any) {
        const isSecurityError = error.name === 'SecurityError' || 
                                (error.message && error.message.includes('sub frames'));
        const isAbort = error.name === 'AbortError';

        if (isSecurityError) {
            setErrorMsg(STRINGS.home.errors.security);
        } else if (!isAbort) {
            setErrorMsg(`${STRINGS.home.errors.generic}${error.message || 'Unknown error'}`);
        }
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-4 bg-[#F4F5F7] overflow-y-auto">
      <div className="max-w-lg w-full bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-200 my-4">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-block p-3 bg-[#FFD500] rounded-full mb-3 text-black shadow-md">
             <ThemedIcon iconKey="appLogo" Fallback={Leaf} className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-black mb-2 tracking-tight">
            {STRINGS.home.title}
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-bold">{STRINGS.home.subtitle}</p>
        </div>

        {!isReady ? (
          <div className="space-y-4">
            {/* Show info notice if FS API is not supported (iOS, Safari, etc.) */}
            {!isFileSystemSupported && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-blue-800 animate-fade-in mb-2">
                    <ThemedIcon iconKey="iconInfo" Fallback={Info} className="flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="font-bold mb-1">Device Support Note</p>
                        <p className="opacity-80">Direct folder access is restricted by your mobile browser. We recommend using <strong>Browser Storage</strong> below for the best experience on this device.</p>
                    </div>
                </div>
            )}

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-red-700 animate-fade-in">
                    <ThemedIcon iconKey="statusError" Fallback={AlertTriangle} className="flex-shrink-0 mt-0.5" size={16} />
                    <p>{errorMsg}</p>
                </div>
            )}

            {/* Folder Selection Card (Only prominent if supported) */}
            <div className={clsx(
                "border rounded-2xl p-6 text-center transition-all duration-300",
                isFileSystemSupported 
                    ? "bg-gray-50 border-gray-200 hover:bg-gray-100" 
                    : "bg-gray-50 border-gray-100 opacity-60 grayscale"
            )}>
              <div className="w-10 h-10 mx-auto mb-3 text-black">
                <ThemedIcon iconKey="homeFolderSelect" Fallback={FolderPlus} className="w-full h-full" />
              </div>
              <p className="text-gray-600 mb-4 font-medium text-xs md:text-sm">
                {STRINGS.home.selectFolderDesc}
              </p>
              <button
                disabled={!isFileSystemSupported}
                onClick={handleSelectDirectory}
                className={clsx(
                    "inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all transform text-sm shadow-md",
                    isFileSystemSupported 
                        ? "bg-[#FFD500] hover:bg-[#E6C000] text-black hover:scale-105" 
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                <ThemedIcon iconKey="homeFolderSelect" Fallback={FolderPlus} size={18} />
                {STRINGS.home.btnSelect}
              </button>
            </div>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-3 py-1 rounded-full bg-white text-gray-500 font-medium border border-gray-200">
                      {isFileSystemSupported ? STRINGS.home.browserStorageOption : "Recommended for this device"}
                    </span>
                </div>
            </div>

            <button
                onClick={useBrowserStorage}
                className={clsx(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-xl transition-all text-sm shadow-sm",
                    !isFileSystemSupported 
                        ? "bg-[#FFD500] hover:bg-[#E6C000] text-black border-2 border-[#D4B200]" 
                        : "bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-600 hover:border-gray-300"
                )}
            >
                <ThemedIcon iconKey="homeStorageBrowser" Fallback={Database} size={18} />
                {STRINGS.home.btnBrowserStorage}
            </button>

            <div className="text-[10px] text-center text-gray-400 mt-2 px-4 opacity-75">
              {STRINGS.home.browserStorageNote}
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base md:text-lg font-bold text-black border-b border-gray-200 pb-3 flex justify-between items-center">
                <span>{STRINGS.home.fileStatusTitle}</span>
                {isLocalMode && <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-full uppercase tracking-wider">{STRINGS.home.localStorageBadge}</span>}
            </h2>
            {isLoading ? (
              <div className="text-center py-8 text-[#FFD500] font-medium animate-pulse text-sm">{STRINGS.common.loading}</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(filesStatus).map(([key, exists]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                    <span className="capitalize font-bold text-black flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${exists ? 'bg-[#FFD500]' : 'bg-gray-300'}`}></div>
                        {key}.csv
                    </span>
                    {exists ? (
                      <span className="flex items-center gap-1 text-black text-xs font-bold bg-[#FFD500] px-2 py-1 rounded-full">
                        <ThemedIcon iconKey="statusSuccess" Fallback={CheckCircle} size={12} /> {STRINGS.home.statusReady}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-200 px-2 py-1 rounded-full">
                        <ThemedIcon iconKey="statusWarning" Fallback={AlertCircle} size={12} /> {STRINGS.home.statusCreated}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {allFilesReady && (
              <div className="mt-6 pt-2 text-center">
                <button
                  onClick={handleEnter}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FFD500] hover:bg-[#E6C000] text-black font-extrabold rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-md border-b-4 border-[#D4B200]"
                >
                  {STRINGS.home.enterDojo} <ThemedIcon iconKey="arrowRight" Fallback={ArrowRight} size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
