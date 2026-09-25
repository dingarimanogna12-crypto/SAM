import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS, LanguageOption } from './languages';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currentLanguageInfo: LanguageOption;
  t: (key: string, fallback?: string) => string;
  speakText: (text: string, onEnd?: () => void) => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('amu_selected_language');
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved as SupportedLanguage;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguageState(lang);
    try {
      localStorage.setItem('amu_selected_language', lang);
    } catch {
      // ignore
    }
  }, []);

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const langDict = TRANSLATIONS[currentLanguage];
      if (langDict && langDict[key]) {
        return langDict[key];
      }
      // Fallback to English
      const enDict = TRANSLATIONS['en'];
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return fallback || key;
    },
    [currentLanguage]
  );

  // Speech synthesis for rural accessibility
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_~`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = currentLanguageInfo.speechCode;
      utterance.rate = 0.95; // Slightly slower for clear rural comprehension
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    },
    [currentLanguageInfo.speechCode]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        currentLanguageInfo,
        t,
        speakText,
        stopSpeech,
        isSpeaking,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
