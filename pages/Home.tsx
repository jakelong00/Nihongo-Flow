
import React, { useState } from 'react';
import { FolderPlus, CheckCircle, AlertCircle, ArrowRight, Database, AlertTriangle, Leaf, Info, X, HelpCircle, ShieldCheck, FolderCheck, BookOpen, BrainCircuit, CheckSquare } from 'lucide-react';
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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
      <div className="max-w-lg w-full bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-200 my-4 relative">
        <button 
          onClick={() => setIsGuideOpen(true)}
          className="absolute top-6 right-6 text-gray-400 hover:text-[#FFD500] transition-colors p-1"
          title="How it works"
        >
          <HelpCircle size={20} />
        </button>

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
            {/* Folder Selection Card */}
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
              
              <button 
                onClick={() => setIsGuideOpen(true)}
                className="block mx-auto mt-4 text-[10px] font-bold text-gray-400 hover:text-black transition-colors underline underline-offset-4"
              >
                Wait, how does this work?
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

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-red-700 animate-fade-in mt-4">
                    <ThemedIcon iconKey="statusError" Fallback={AlertTriangle} className="flex-shrink-0 mt-0.5" size={16} />
                    <p>{errorMsg}</p>
                </div>
            )}
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

      {/* About/Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setIsGuideOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FFD500] rounded-xl text-black">
                  <ThemedIcon iconKey="navAbout" Fallback={HelpCircle} size={24} />
                </div>
                <h2 className="text-xl font-black text-black tracking-tight">{STRINGS.about.title}</h2>
              </div>
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              <section className="space-y-3">
                <h3 className="text-lg font-black text-black flex items-center gap-2">
                  <ShieldCheck className="text-[#FFD500]" size={20} />
                  {STRINGS.about.philosophyTitle}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  {STRINGS.about.philosophyDesc}
                </p>
              </section>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-black">{STRINGS.about.howToTitle}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {STRINGS.about.steps.map((step, idx) => {
                    const Icons = [FolderCheck, BookOpen, BrainCircuit, CheckSquare];
                    const Icon = Icons[idx];
                    return (
                      <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50">
                        <div className="flex-shrink-0 p-2 h-fit bg-white rounded-lg text-gray-400 shadow-sm">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-black text-sm mb-1">{step.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="w-full py-4 bg-black text-white rounded-xl font-black hover:bg-gray-800 transition-all shadow-lg active:scale-95"
              >
                Got it, let's go!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
