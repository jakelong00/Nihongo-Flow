
import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { CUSTOM_ICON_PATHS } from '../config/customIcons';
import clsx from 'clsx';

interface ShibaMascotProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ShibaMascot: React.FC<ShibaMascotProps> = ({ 
  message, 
  className, 
  size = 'md'
}) => {
  // Static image resolution logic:
  // 1. User provided mascot image
  // 2. User provided app logo
  // 3. CSS Fallback (if both are empty)
  const mascotImg = CUSTOM_ICON_PATHS.appMascot || CUSTOM_ICON_PATHS.appLogo;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-44 h-44'
  };

  // Adjust bubble offset based on mascot size
  const bubbleOffsets = {
    sm: '-top-10',
    md: '-top-12',
    lg: '-top-14'
  };

  return (
    <div className={clsx(
      "relative flex flex-col items-center transition-all", 
      className
    )}>
      {message && (
        <div className={clsx(
          "absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border-2 border-[#4A4E69]/10 px-4 py-2 rounded-2xl shadow-xl animate-soft-in z-[50]",
          bubbleOffsets[size]
        )}>
          <p className="text-[9px] font-black anime-title text-[#4A4E69] uppercase tracking-wider">
            {message}
          </p>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-[#4A4E69]/10 rotate-45"></div>
        </div>
      )}
      
      <div className={clsx(
        "rounded-full bg-white border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-1000 ring-4 ring-[#78A2CC]/5",
        "animate-float", // Constant breathing animation
        sizeClasses[size]
      )}>
        {mascotImg ? (
          <img src={mascotImg} alt="Dojo Mascot" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
        ) : (
          /* HIGH FIDELITY CSS SHIBA FALLBACK */
          <div className="relative w-full h-full bg-[#FFD166]/30 flex items-center justify-center">
             <div className="relative w-[75%] h-[75%] bg-[#F4A261] rounded-[45%] flex items-center justify-center border-b-4 border-[#264653]/10">
                {/* Ears */}
                <div className="absolute -top-2 -left-2 w-10 h-10 bg-[#F4A261] rotate-[-15deg] rounded-tl-[100%] border-t-4 border-l-4 border-[#264653]/10"></div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#F4A261] rotate-[15deg] rounded-tr-[100%] border-t-4 border-r-4 border-[#264653]/10"></div>
                {/* Face white area */}
                <div className="absolute bottom-0 w-[85%] h-[55%] bg-white rounded-t-[50%] rounded-b-[45%]"></div>
                {/* Eyes */}
                <div className="absolute top-[35%] left-[28%] w-2 h-2 bg-[#264653] rounded-full"></div>
                <div className="absolute top-[35%] right-[28%] w-2 h-2 bg-[#264653] rounded-full"></div>
                {/* Blushes */}
                <div className="absolute top-[50%] left-[15%] w-4 h-2 bg-[#FFB7C5]/40 rounded-full blur-[1px]"></div>
                <div className="absolute top-[50%] right-[15%] w-4 h-2 bg-[#FFB7C5]/40 rounded-full blur-[1px]"></div>
                {/* Nose */}
                <div className="absolute top-[52%] left-1/2 -translate-x-1/2 w-3 h-2 bg-[#264653] rounded-full"></div>
                {/* Heart badge */}
                <Heart size={size === 'lg' ? 14 : 8} className="absolute bottom-4 text-[#FFB7C5] fill-current opacity-40" />
             </div>
             <Sparkles size={size === 'lg' ? 24 : 12} className="absolute top-4 right-4 text-[#F4A261] animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
};
