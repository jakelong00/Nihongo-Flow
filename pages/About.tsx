import React from 'react';
import { HelpCircle, FolderCheck, BookOpen, BrainCircuit, CheckSquare, Info, ShieldCheck, Database, Sparkles } from 'lucide-react';
import { STRINGS } from '../constants/strings';
import { ShibaMascot } from '../components/ShibaMascot';
import clsx from 'clsx';

const About: React.FC = () => {
  return (
    <div className="p-7 md:p-11 pt-56 max-w-5xl mx-auto space-y-14 animate-soft-in">
      {/* Page Header */}
      <div className="text-center space-y-5">
        <div className="inline-block relative">
          <ShibaMascot size="lg" message={STRINGS.mascot.about} />
        </div>
        <div>
            <h2 className="text-3xl font-black text-[#4A4E69] anime-title tracking-tight uppercase leading-none">{STRINGS.about.title}</h2>
            <p className="text-[11px] font-black text-[#4A4E69]/30 uppercase tracking-[0.45em] mt-3">{STRINGS.about.subtitle}</p>
        </div>
      </div>

      {/* Philosophy Section */}
      <section className="relative p-10 bg-white rounded-[40px] shadow-sm border border-[#4A4E69]/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#78A2CC]/5 rounded-full -mr-20 -mt-20 blur-[80px]"></div>
        <div className="relative z-10 space-y-5">
            <h3 className="anime-title text-lg font-black text-[#78A2CC] flex items-center gap-4 uppercase tracking-tighter">
                <ShieldCheck size={24} />
                {STRINGS.about.philosophyTitle}
            </h3>
            <p className="text-[15px] font-bold text-[#4A4E69] leading-relaxed italic opacity-85">
                "{STRINGS.about.philosophyDesc}"
            </p>
        </div>
      </section>

      {/* Steps Divider */}
      <div className="flex items-center gap-5 px-6">
          <div className="h-0.5 bg-[#4A4E69]/5 flex-1 rounded-full"></div>
          <h3 className="anime-title text-[10px] font-black text-[#4A4E69]/30 uppercase tracking-[0.4em]">{STRINGS.about.howToTitle}</h3>
          <div className="h-0.5 bg-[#4A4E69]/5 flex-1 rounded-full"></div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {STRINGS.about.steps.map((step, idx) => {
          const Icons = [FolderCheck, BookOpen, BrainCircuit, CheckSquare];
          const Colors = ['text-[#78A2CC]', 'text-[#FFB7C5]', 'text-[#B4E4C3]', 'text-[#4A4E69]'];
          const BgColors = ['bg-[#78A2CC]/10', 'bg-[#FFB7C5]/10', 'bg-[#B4E4C3]/10', 'bg-[#FAF9F6]'];
          const Icon = Icons[idx];
          return (
            <div key={idx} className="bg-white p-10 rounded-[40px] shadow-sm border border-[#4A4E69]/5 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="flex items-center gap-5 mb-6">
                <div className={clsx("p-4 rounded-2xl transition-transform group-hover:scale-110 shadow-sm", BgColors[idx], Colors[idx])}>
                  <Icon size={28} />
                </div>
                <div>
                  <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.25em] mb-1">MODULE 0{idx+1}</div>
                  <h4 className="font-black text-sm text-[#4A4E69] anime-title uppercase tracking-tight">{step.title}</h4>
                </div>
              </div>
              <p className="text-[12px] font-bold text-[#4A4E69]/60 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer Informational Card */}
      <div className="bg-[#78A2CC] p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6-static.png")' }}></div>
        <div className="p-6 bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/20 shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
            <Sparkles size={48} />
        </div>
        <div className="flex-1 text-center md:text-left space-y-3">
            <h4 className="anime-title text-xl font-black uppercase tracking-tight">{STRINGS.about.spiritTitle}</h4>
            <p className="font-bold opacity-90 leading-relaxed text-sm">{STRINGS.about.spiritDesc}</p>
            <div className="pt-3">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] opacity-50">頑張ってください! • GANBATTE</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default About;