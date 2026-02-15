
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, FolderOpen, GraduationCap, LayoutDashboard, Settings, Languages, BrainCircuit, Database, Leaf, Menu, X, HelpCircle } from 'lucide-react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from './ThemedIcon';
import clsx from 'clsx';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dirHandle, isLocalMode } = useFileSystem();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isReady = dirHandle || isLocalMode;

  React.useEffect(() => {
    if (!isReady && location.pathname !== '/') {
      navigate('/');
    }
  }, [isReady, location.pathname, navigate]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, key: 'navDashboard' },
    { name: 'Learn', path: '/learn', icon: BrainCircuit, key: 'navLearn' },
    { name: 'Vocabulary', path: '/vocab', icon: BookOpen, key: 'navVocab' },
    { name: 'Kanji', path: '/kanji', icon: Languages, key: 'navKanji' },
    { name: 'Grammar', path: '/grammar', icon: GraduationCap, key: 'navGrammar' },
    { name: 'About', path: '/about', icon: HelpCircle, key: 'navAbout' },
    { name: 'Settings', path: '/settings', icon: Settings, key: 'navSettings' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 md:p-6 flex-shrink-0 border-b border-gray-100">
        <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2 tracking-tight text-black">
          <div className="p-1.5 bg-[#FFD500] rounded-lg text-black">
             <ThemedIcon iconKey="appLogo" Fallback={Leaf} size={20} className="text-black" />
          </div>
          <span>{STRINGS.common.appName}</span>
        </h1>
        <p className="text-[10px] text-gray-500 mt-1 font-bold tracking-wide uppercase opacity-80 ml-1">
          {STRINGS.common.appSubtitle}
        </p>
      </div>
      
      <nav className="flex-1 px-3 space-y-1 md:space-y-2 mt-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-bold",
                isActive
                  ? 'bg-[#FFD500] text-black shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              )
            }
          >
            <ThemedIcon iconKey={item.key} Fallback={item.icon} size={20} className={clsx("transition-transform group-hover:scale-110 flex-shrink-0", ({ isActive }: any) => isActive ? "text-black" : "text-gray-400 group-hover:text-black")} />
            <span className="tracking-wide text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 mt-auto flex-shrink-0">
        <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600 font-bold">
            {isLocalMode ? 
                <ThemedIcon iconKey="homeStorageLocal" Fallback={Database} size={16} className="text-[#FFD500] flex-shrink-0" /> : 
                <ThemedIcon iconKey="homeStorageLocal" Fallback={FolderOpen} size={16} className="text-[#FFD500] flex-shrink-0" />
            }
            <span className="truncate opacity-90">{dirHandle ? dirHandle.name : STRINGS.home.localStorageBadge}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden">
      
      {/* Mobile/Tablet Header (Visible up to LG) */}
      {isReady && (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white z-40 flex items-center justify-between px-4 shadow-sm border-b border-gray-200">
           <div className="flex items-center gap-2 text-black font-extrabold">
              <div className="p-1 bg-[#FFD500] rounded-md text-black">
                <ThemedIcon iconKey="appLogo" Fallback={Leaf} size={18} className="text-black" />
              </div>
              <span className="text-lg">{STRINGS.common.appName}</span>
           </div>
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="text-black p-2 rounded-lg hover:bg-gray-100 transition-colors"
           >
             {isMobileMenuOpen ? 
                <ThemedIcon iconKey="actionClose" Fallback={X} size={24} /> : 
                <ThemedIcon iconKey="actionMenu" Fallback={Menu} size={24} />
             }
           </button>
        </header>
      )}

      {/* Sidebar Overlay (Visible up to LG) */}
      {isReady && isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar Drawer (Visible up to LG) */}
      {isReady && (
        <aside 
          className={clsx(
            "fixed inset-y-0 left-0 w-64 bg-white text-black z-40 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Desktop Sidebar (Visible LG+) */}
      {isReady && (
        <aside className="hidden lg:flex w-64 bg-white text-black flex-shrink-0 flex-col border-r border-gray-200 shadow-sm z-20">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main className={clsx("flex-1 overflow-auto relative z-10 scroll-smooth", isReady && "mt-14 lg:mt-0")}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
