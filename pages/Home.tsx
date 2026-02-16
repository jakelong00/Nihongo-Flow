
import React, { useState } from 'react';
import { ArrowRight, HelpCircle, X, CheckSquare, Sparkles, FolderIcon, BookOpen, BrainCircuit } from 'lucide-react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useNavigate } from 'react-router-dom';
import { STRINGS } from '../constants/strings';
import { ShibaMascot } from '../components/ShibaMascot';
import clsx from 'clsx';

const Home: React.FC = () => {
  const { dirHandle, isLocalMode, selectDirectory, useBrowserStorage, filesStatus, isFileSystemSupported } = useFileSystem();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const isReady = dirHandle || isLocalMode;

  const handleEnter = () => navigate('/dashboard');

  const handleSelectDirectory = async () => {
    if (!isFileSystemSupported) return;
    try {
        await selectDirectory();
    } catch (error: any) {
        if (error.name !== 'AbortError') setErrorMsg(STRINGS.home.errors.generic + error.message);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-6 relative bg-[#FAF9F6] overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#78A2CC 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="max-w-md w-full relative z-10 animate-soft-in">
        <div className="bg-white border border-[#4A4E69]/10 p-8 pt-12 rounded-[40px] shadow-2xl relative">
          
          <button onClick={() => setIsGuideOpen(true)} className="absolute top-6 right-6 text-[#4A4E69]/40 hover:text-[#78A2CC] transition-colors z-10">
             <HelpCircle size={20} />
          </button>

          <div className="text-center mb-8">
            <ShibaMascot size="md" message="Konnichiwa!" className="mb-6" />
            <h1 className="text-2xl font-black text-[#4A4E69] anime-title tracking-tight leading-none uppercase">
              NIHONGO FLOW
            </h1>
            <p className="text-[#4A4E69]/50 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Local Study Dojo v1.1</p>
          </div>

          {!isReady ? (
            <div className="space-y-3">
              <button
                disabled={!isFileSystemSupported}
                onClick={handleSelectDirectory}
                className="w-full group flex flex-col items-center justify-center p-6 bg-[#78A2CC] text-white rounded-[28px] hover:bg-[#6b95c2] transition-all duration-300 shadow-lg active:scale-95"
              >
                <FolderIcon className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                <span className="font-black text-xs uppercase tracking-wider anime-title">Sync Local Folder</span>
                <span className="text-[9px] opacity-70 mt-1 font-bold">Recommended for persistence</span>
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#4A4E69]/5"></div></div>
                <div className="relative flex justify-center text-[9px] font-black uppercase text-[#4A4E69]/20 tracking-widest"><span className="bg-white px-3">or</span></div>
              </div>

              <button
                  onClick={useBrowserStorage}
                  className="w-full bg-white border-2 border-[#4A4E69]/10 text-[#4A4E69] py-4 rounded-[28px] font-black hover:bg-[#FAF9F6] transition-all shadow-sm flex items-center justify-center gap-3 text-xs anime-title"
              >
                  <Sparkles size={16} className="text-[#FFB7C5]" /> 
                  Guest Storage
              </button>

              {errorMsg && (
                <div className="bg-[#FFB7C5]/10 border border-[#FFB7C5]/30 p-3 rounded-xl text-[9px] font-bold text-[#4A4E69] mt-4 flex items-start gap-2">
                   <X size={14} className="text-[#FFB7C5] shrink-0" />
                   <p>{errorMsg}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-[#FAF9F6] p-5 rounded-3xl border border-[#4A4E69]/5">
                <h2 className="text-[9px] font-black text-[#4A4E69]/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B4E4C3]"></div> System Ready
                </h2>
                <div className="space-y-1.5">
                  {Object.entries(filesStatus).map(([key, exists]) => (
                    <div key={key} className="flex items-center justify-between text-[10px] font-black">
                      <span className="text-[#4A4E69] opacity-60 uppercase">{key}.csv</span>
                      <span className={exists ? "text-[#B4E4C3]" : "text-[#78A2CC]"}>
                        {exists ? "CONNECTED" : "INITIALIZED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEnter}
                className="w-full bg-[#B4E4C3] text-[#4A4E69] font-black py-4 rounded-[28px] shadow-xl hover:bg-[#a3d9b4] transition-all flex items-center justify-center gap-3 anime-title uppercase tracking-wider text-xs"
              >
                ENTER THE DOJO <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {isGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#4A4E69]/40 backdrop-blur-md" onClick={() => setIsGuideOpen(false)} />
          <div className="relative bg-[#FAF9F6] w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-[#4A4E69]/10 animate-soft-in">
            <div className="bg-[#78A2CC] p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <HelpCircle size={24} />
                <h3 className="anime-title text-lg font-black uppercase tracking-tight">Dojo Guide</h3>
              </div>
              <button onClick={() => setIsGuideOpen(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {STRINGS.about.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#B4E4C3]/20 flex items-center justify-center text-[#B4E4C3] font-black shrink-0">{idx+1}</div>
                  <div>
                    <div className="font-black text-xs text-[#4A4E69] mb-1 uppercase">{step.title}</div>
                    <div className="text-[10px] text-[#4A4E69]/60 leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
