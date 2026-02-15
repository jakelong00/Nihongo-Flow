
import React from 'react';
import { HelpCircle, FolderCheck, BookOpen, BrainCircuit, CheckSquare, Info, ShieldCheck, Database } from 'lucide-react';
import { STRINGS } from '../constants/strings';
import { ThemedIcon } from '../components/ThemedIcon';

const About: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-[#FFD500] rounded-full mb-4 text-black shadow-lg">
          <ThemedIcon iconKey="navAbout" Fallback={HelpCircle} size={40} />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">{STRINGS.about.title}</h2>
        <p className="text-gray-500 mt-2 font-bold">{STRINGS.about.welcome}</p>
      </div>

      {/* Philosophy Section */}
      <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-5">
            <ShieldCheck size={160} />
        </div>
        <div className="relative z-10">
            <h3 className="text-xl font-black text-black mb-3 flex items-center gap-2">
                <ShieldCheck className="text-[#FFD500]" size={24} />
                {STRINGS.about.philosophyTitle}
            </h3>
            <p className="text-gray-600 leading-relaxed font-medium">
                {STRINGS.about.philosophyDesc}
            </p>
        </div>
      </section>

      {/* How to use section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-black px-2">{STRINGS.about.howToTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STRINGS.about.steps.map((step, idx) => {
            const Icons = [FolderCheck, BookOpen, BrainCircuit, CheckSquare];
            const Icon = Icons[idx];
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#FFD500] transition-colors group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-[#FFD500] group-hover:text-black transition-colors">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-black text-black">{step.title}</h4>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SRS Deep Dive */}
      <section className="bg-black text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
        <h3 className="text-xl font-black flex items-center gap-2">
            <BrainCircuit className="text-[#FFD500]" size={24} />
            Understanding the Learning Engine
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <div className="text-[#FFD500] font-black text-xs uppercase tracking-widest">Forgot</div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Resets the item completely. It will appear again in a few minutes or hours to rebuild the neural path.
                </p>
            </div>
            <div className="space-y-2">
                <div className="text-[#FFD500] font-black text-xs uppercase tracking-widest">Hard</div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Increases the interval slightly (1.2x). Use this if you remembered it but had to think for more than 5 seconds.
                </p>
            </div>
            <div className="space-y-2">
                <div className="text-[#FFD500] font-black text-xs uppercase tracking-widest">Easy</div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Aggressively increases the interval (2.5x). Use this for items you recall instantly without effort.
                </p>
            </div>
        </div>
      </section>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
        <Info className="text-blue-500 flex-shrink-0 mt-1" size={24} />
        <div>
            <h4 className="font-bold text-blue-900 mb-1">Pro Tip: Regular Backups</h4>
            <p className="text-sm text-blue-800 opacity-80 font-medium">
                Even though files are stored locally, it's good practice to use the <b>Download Backup</b> feature in Settings once a week. You can sync your learning across devices by moving the folder via Dropbox or Google Drive!
            </p>
        </div>
      </div>

      <div className="text-center py-6">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Happy Learning! 頑張ってください！</p>
      </div>
    </div>
  );
};

export default About;
