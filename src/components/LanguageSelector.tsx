import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/languages';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-white border-2 border-[#2b2b2b] px-2.5 sm:px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer text-xs font-mono font-bold text-[#2b2b2b]"
        title="Change Language / भाषा बदलें / భాషను మార్చండి / மொழியை மாற்றவும்"
      >
        <span className="text-sm">{currentLanguageInfo.flag}</span>
        <span className="font-sans font-bold">{currentLanguageInfo.nativeName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#2b2b2b]/70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#fffef2] border-2 border-[#2b2b2b] rounded-2xl shadow-[6px_6px_0px_#2b2b2b] p-2 z-50 space-y-1 font-sans">
          <div className="px-3 py-2 border-b border-[#2b2b2b]/15 mb-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#ff5f3d]">
              <Globe className="w-3.5 h-3.5" />
              <span>Select Language / भाषा चुनें</span>
            </div>
            <p className="text-[10px] font-mono text-[#2b2b2b]/60 mt-0.5">
              Optimized for rural healthcare centers & local communities
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff5f3d] text-white border-[#2b2b2b] shadow-xs'
                      : 'bg-white hover:bg-orange-50/70 border-transparent text-[#2b2b2b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{lang.flag}</span>
                    <div>
                      <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                        <span>{lang.nativeName}</span>
                        <span className={`text-[11px] font-mono ${isSelected ? 'text-white/80' : 'text-[#2b2b2b]/60'}`}>
                          ({lang.name})
                        </span>
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/90' : 'text-[#2b2b2b]/60'}`}>
                        {lang.region}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
