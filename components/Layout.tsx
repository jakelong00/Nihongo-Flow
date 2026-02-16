import React, { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, LayoutDashboard, Settings, Languages, BrainCircuit, Database, Ghost, Menu, X, HelpCircle, Sparkle } from 'lucide-react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { StorageProvider } from '../types';
import { ThemedIcon } from './ThemedIcon';
import clsx from 'clsx';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { storageProvider } = useFileSystem();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isReady = storageProvider !== StorageProvider.NONE;

  React.useEffect(() => {
    if (!isReady && location.pathname !== '/') {
      navigate('/');
    }
  }, [isReady, location.pathname, navigate]);

  const navItems = [
    { name: 'DASHBOARD', path: '/dashboard', icon: LayoutDashboard, key: 'navDashboard' },
    { name: 'STUDY SESSION', path: '/learn', icon: BrainCircuit, key: 'navLearn' },
    { name: 'VOCABULARY', path: '/vocab', icon: BookOpen, key: 'navVocab' },
    { name: 'KANJI DOJO', path: '/kanji', icon: Languages, key: 'navKanji' },
    { name: 'GRAMMAR', path: '/grammar', icon: GraduationCap, key: 'navGrammar' },
    { name: 'USER GUIDE', path: '/about', icon: HelpCircle, key: 'navAbout' },
    { name: 'SYSTEM SETTINGS', path: '/settings', icon: Settings, key: 'navSettings' },
  ];

  // Zen decorative petals
  const petals = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 15}s`,
    duration: `${15 + Math.random() * 10}s`,
    size: `${8 + Math.random() * 8}px`,
  })), []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#FAF9F6]">
      <div className="p-7 flex-shrink-0 bg-[#78A2CC] text-white">
        <h1 className="text-xl font-black flex items-center gap-3 anime-title">
          <div className="p-1.5 bg-white/20 rounded-lg animate-wiggle">
             <ThemedIcon iconKey="appLogo" Fallback={Sparkle} size={20} className="text-white" />
          </div>
          <span className="tracking-tighter uppercase">Nihongo Flow</span>
        </h1>
        <p className="text-[10px] font-black opacity-60 mt-0.5 uppercase tracking-[0.3em]">Learning Engine</p>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-[11px] font-black anime-title uppercase tracking-widest",
                isActive
                  ? 'bg-[#FFB7C5] text-[#4A4E69] shadow-md scale-105'
                  : 'text-[#4A4E69]/50 hover:text-[#4A4E69] hover:bg-[#78A2CC]/5'
              )
            }
          >
            <ThemedIcon iconKey={item.key} Fallback={item.icon} size={18} className={clsx("transition-transform group-hover:rotate-12")} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-5 border-t border-[#4A4E69]/5 bg-white/40">
        <div className="p-3 bg-white rounded-2xl border border-[#4A4E69]/5 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-[#B4E4C3]/20 text-[#B4E4C3] rounded-xl">
                <Database size={14} className="animate-pulse" />
            </div>
            <div className="overflow-hidden">
                <div className="text-[9px] font-black text-[#4A4E69]/30 uppercase leading-none mb-0.5">Sync</div>
                <div className="text-[10px] font-black text-[#4A4E69] truncate uppercase">
                    {storageProvider === StorageProvider.LOCAL_FS ? 'Local Folder' : 'Browser Storage'}
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full bg-[#FAF9F6] overflow-hidden text-[#4A4E69] relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
          <span className="absolute top-[20%] left-[10%] text-9xl font-black jp-text animate-float select-none">学</span>
          <span className="absolute bottom-[20%] right-[10%] text-9xl font-black jp-text animate-float select-none" style={{ animationDelay: '1s' }}>心</span>
          <span className="absolute top-[10%] right-[30%] text-8xl font-black jp-text animate-float select-none" style={{ animationDelay: '2s' }}>力</span>
          {petals.map(p => (
            <div key={p.id} className="petal" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, width: p.size, height: p.size }}></div>
          ))}
      </div>

      {isReady && (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#78A2CC] text-white z-[70] flex items-center justify-between px-6 shadow-lg">
           <div className="flex items-center gap-3 font-black anime-title">
              <div className="p-1.5 bg-white/20 rounded-lg flex items-center justify-center">
                <ThemedIcon iconKey="appLogo" Fallback={Sparkle} size={18} className="text-white" />
              </div>
              <span className="tracking-tighter uppercase text-base">NIHONGO FLOW</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/20 rounded-xl active:scale-95 transition-transform">
             {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </header>
      )}

      {isReady && (
        <aside className={clsx(
          "fixed inset-y-0 left-0 w-64 bg-white z-[80] shadow-2xl transition-transform duration-500 lg:static lg:translate-x-0 lg:shadow-none border-r border-[#4A4E69]/5 shrink-0 h-full",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent />
        </aside>
      )}

      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[75] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <main className={clsx(
        "flex-1 relative flex flex-col h-full overflow-hidden z-10", 
        isReady && "pt-16 lg:pt-0"
      )}>
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;