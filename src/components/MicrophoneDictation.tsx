import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Check, AlertCircle, RefreshCw, X, Radio, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface MicrophoneDictationProps {
  isOpen: boolean;
  onClose: () => void;
  onDictationComplete: (transcript: string) => void;
}

// Window type extension for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const MicrophoneDictation: React.FC<MicrophoneDictationProps> = ({
  isOpen,
  onClose,
  onDictationComplete,
}) => {
  const { currentLanguageInfo, currentLanguage } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      return;
    }

    // Safely check if speech recognition or media devices are supported without triggering prompts
    checkSupportSilently();

    return () => {
      stopRecording();
    };
  }, [isOpen]);

  const checkSupportSilently = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        if (status.state === 'granted') {
          setHasMicPermission(true);
        } else if (status.state === 'denied') {
          setHasMicPermission(false);
          setErrorMessage("Microphone permission is currently blocked in browser settings. You can select a clinical sample below or type your prescription directly.");
        }
      }
    } catch {
      // Permission query not supported on this platform, will be determined on user interaction
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setInterimTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Speech Recognition is not supported by your browser engine. You can select a clinical voice sample below or type your prescription.");
      return;
    }

    try {
      // Optional mediaDevices check with graceful permission check
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasMicPermission(true);
          // Release test stream tracks
          stream.getTracks().forEach((track) => track.stop());
        } catch (mediaErr: any) {
          const isDenied = mediaErr?.name === 'NotAllowedError' || 
                           mediaErr?.name === 'PermissionDeniedError' || 
                           mediaErr?.message?.toLowerCase().includes('denied') ||
                           mediaErr?.message?.toLowerCase().includes('permission');
          if (isDenied) {
            setHasMicPermission(false);
            setErrorMessage("Microphone permission was denied or is blocked by browser/iframe policy. You can choose a simulated clinical voice sample below to continue immediately.");
            setIsRecording(false);
            return;
          }
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentLanguageInfo.speechCode || 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setHasMicPermission(true);
        setRecordingSeconds(0);
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript + ' ';
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => (prev ? prev + ' ' + currentFinal.trim() : currentFinal.trim()));
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage("Microphone access was not allowed by the browser. You can click any clinical sample below or type directly.");
          setHasMicPermission(false);
        } else if (event.error === 'no-speech') {
          // Normal timeout if user was quiet
        } else {
          setErrorMessage(`Audio input notice: ${event.error}`);
        }
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const isDenied = err?.name === 'NotAllowedError' || 
                       err?.name === 'PermissionDeniedError' || 
                       err?.message?.toLowerCase().includes('denied') ||
                       err?.message?.toLowerCase().includes('permission');
      if (isDenied) {
        setHasMicPermission(false);
        setErrorMessage("Microphone permission was denied. You can select one of the clinical voice samples below to test the workflow.");
      } else {
        setErrorMessage("Could not initialize microphone. Please choose a simulated clinical voice sample below.");
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const handleApplyTranscript = () => {
    const full = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
    if (!full) {
      setErrorMessage("Please dictate or select a sample prescription statement below before applying.");
      return;
    }
    onDictationComplete(full);
    onClose();
  };

  const handleSampleDictation = (sampleText: string) => {
    setTranscript(sampleText);
    setInterimTranscript('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#fffef2] border-3 border-[#2b2b2b] rounded-2xl w-full max-w-xl shadow-[12px_12px_0px_#2b2b2b] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b2b2b] text-white p-5 flex items-center justify-between border-b-2 border-[#2b2b2b]">
          <div className="flex items-center gap-2.5">
            <Mic className="w-5 h-5 text-[#ff5f3d]" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-sans font-bold text-base leading-tight">
                  Clinical Voice Dictation
                </h3>
                <span className="font-mono text-[9px] uppercase font-bold bg-[#ff5f3d] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>{currentLanguageInfo.flag}</span>
                  <span>{currentLanguageInfo.nativeName}</span>
                </span>
              </div>
              <p className="font-mono text-[11px] text-white/70">
                Dictate prescriptions & clinical notes directly in {currentLanguageInfo.name} ({currentLanguageInfo.nativeName})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-100 border-2 border-red-500 text-red-900 rounded-lg font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Voice Visualizer / Controls */}
          <div className="bg-white border-2 border-[#2b2b2b] rounded-2xl p-6 text-center space-y-4 shadow-[4px_4px_0px_#2b2b2b]">
            <div className="flex items-center justify-center">
              {isRecording ? (
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 rounded-full bg-[#ff5f3d]/20 animate-ping" />
                  <div className="absolute w-20 h-20 rounded-full bg-[#ff5f3d]/40 animate-pulse" />
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="relative w-16 h-16 rounded-full bg-[#ff5f3d] text-white flex items-center justify-center border-2 border-[#2b2b2b] shadow-md hover:scale-105 cursor-pointer transition-all"
                  >
                    <Mic className="w-7 h-7 animate-bounce" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-[#2b2b2b] text-white flex items-center justify-center border-2 border-[#2b2b2b] shadow-md hover:bg-[#ff5f3d] hover:scale-105 cursor-pointer transition-all"
                >
                  <Mic className="w-7 h-7" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase">
                {isRecording ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[#ff5f3d]">Listening... ({formatTime(recordingSeconds)})</span>
                  </>
                ) : (
                  <span className="text-[#2b2b2b]/70">Tap microphone to dictate prescription</span>
                )}
              </div>
              <p className="font-sans text-xs text-[#2b2b2b]/60">
                Speak patient diagnosis, age, weight, antimicrobial name, dosage, and frequency.
              </p>
            </div>

            {/* Sound Wave Animation Bars */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[12, 24, 32, 16, 28, 20, 36, 18, 30, 14, 22].map((height, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${Math.max(6, Math.min(32, height * (Math.sin(recordingSeconds + i) * 0.5 + 0.8)))}px`,
                      animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                    }}
                    className="w-1.5 bg-[#ff5f3d] rounded-full transition-all animate-pulse"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Transcript Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[10px] font-bold uppercase text-[#2b2b2b]">
                Real-time Spoken Transcript:
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="font-mono text-[10px] font-bold text-[#ff5f3d] hover:underline"
                >
                  Clear Transcript
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={transcript + (interimTranscript ? ' ' + interimTranscript : '')}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Spoken words will appear here in real-time as you talk..."
                rows={4}
                className="w-full bg-white border-2 border-[#2b2b2b] rounded-xl p-3 font-mono text-xs text-[#2b2b2b] outline-none focus:border-[#ff5f3d]"
              />
            </div>
          </div>

          {/* Quick Preset Voice Transcripts */}
          <div className="bg-[#fffef2] p-3.5 rounded-xl border-2 border-[#2b2b2b]/30 space-y-2">
            <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#2b2b2b]/70 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#ff5f3d]" />
              <span>Or click a simulated clinical voice dictation sample ({currentLanguageInfo.nativeName}):</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {currentLanguage === 'hi' && (
                <button
                  type="button"
                  onClick={() =>
                    handleSampleDictation(
                      "मरीज़ 68 वर्षीय पुरुष, वजन 55 किग्रा, निमोनिया और गुर्दे की हल्की समस्या। दवा: लेवोफ़्लोक्सासिन 750mg मुंह से दिन में एक बार 10 दिनों के लिए और जेलुसिल एंटासिड सिरप 15ml।"
                    )
                  }
                  className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer text-orange-950 font-bold"
                >
                  🇮🇳 हिन्दी आवाज नमूना: निमोनिया व लेवोफ़्लोक्सासिन 750mg पर्चा
                </button>
              )}

              {currentLanguage === 'te' && (
                <button
                  type="button"
                  onClick={() =>
                    handleSampleDictation(
                      "రోగి వయస్సు 68 సంవత్సరాలు, బరువు 55 కేజీలు, న్యుమోనియా మరియు కిడ్నీ సమస్య. లెవోఫ్లోక్సాసిన్ 750mg నోటి ద్వారా రోజుకు ఒకసారి 10 రోజులు మరియు జెలుసిల్ 15ml."
                    )
                  }
                  className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer text-orange-950 font-bold"
                >
                  🇮🇳 తెలుగు వాయిస్ నమూనా: న్యుమోనియా & లెవోఫ్లోక్సాసిన్ 750mg ప్రిస్క్రిప్షన్
                </button>
              )}

              {currentLanguage === 'ta' && (
                <button
                  type="button"
                  onClick={() =>
                    handleSampleDictation(
                      "நோயாளி 68 வயது ஆண், 55 கிலோ எடை, நிமோனியா மற்றும் சிறுநீரக பாதிப்பு. லெவோஃப்ளோக்சசின் 750mg வாய்வழியாக தினமும் ஒருமுறை 10 நாட்கள்."
                    )
                  }
                  className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer text-orange-950 font-bold"
                >
                  🇮🇳 தமிழ் குரல் மாதிரி: நிமோனியா & லெவோஃப்ளோக்சசின் 750mg மருந்துச்சீட்டு
                </button>
              )}

              {currentLanguage === 'bn' && (
                <button
                  type="button"
                  onClick={() =>
                    handleSampleDictation(
                      "রোগী ৬৮ বছর বয়সী পুরুষ, ওজন ৫৫ কেজি, নিউমোনিয়া ও কিডনির সমস্যা। লেভোফ্লক্সাসিন ৭৫০ মিলিগ্রাম দিনে একবার ১০ দিন এবং অ্যান্টাসিড সিরাপ ১৫ মিলি।"
                    )
                  }
                  className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer text-orange-950 font-bold"
                >
                  🇮🇳 বাংলা ভয়েস নমুনা: নিউমোনিয়া ও লেভোফ্লক্সাসিন ৭৫০ মিলিগ্রাম
                </button>
              )}

              {currentLanguage === 'es' && (
                <button
                  type="button"
                  onClick={() =>
                    handleSampleDictation(
                      "Paciente varón de 68 años con 55 kg, neumonía adquirida en la comunidad y aclaramiento renal moderado. Levofloxacino 750 mg vía oral cada 24 horas por 10 días y antiácido 15 ml cada 8 horas."
                    )
                  }
                  className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer text-orange-950 font-bold"
                >
                  🌎 Muestra en Español: Neumonía y Levofloxacino 750mg
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleSampleDictation(
                    "Patient is a 68-year-old human male, 55 kilograms with moderate renal impairment and community acquired pneumonia. Prescribing Levofloxacin 750 milligrams oral once daily for 10 days and Gelusil antacid 15ml TDS."
                  )
                }
                className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer"
              >
                👤 Human: Levofloxacin 750mg in Renal Impairment (Pneumonia)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSampleDictation(
                    "Patient is a 5-year-old female canine, 18 kilograms with severe septic peritonitis. Prescribing Vancomycin 500 milligrams IV every 12 hours for 14 days and Enrofloxacin 100 milligrams oral daily."
                  )
                }
                className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer"
              >
                🐾 Veterinary: Canine Vancomycin + Enrofloxacin (WOAH Alert)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSampleDictation(
                    "Patient is a 32-year-old pregnant human female, 64 kilograms in second trimester diagnosed with acute pyelonephritis. Prescribing Ciprofloxacin 500 milligrams oral twice daily for 7 days."
                  )
                }
                className="text-left font-mono text-[11px] p-2 bg-white border border-[#2b2b2b] rounded hover:bg-orange-50 transition-colors cursor-pointer"
              >
                ⚠️ Contraindication: Fluoroquinolone in Pregnancy
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t-2 border-[#2b2b2b] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="font-mono text-xs font-bold uppercase px-4 py-2 border-2 border-[#2b2b2b] rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyTranscript}
            disabled={!transcript.trim() && !interimTranscript.trim()}
            className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] px-5 py-2.5 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Apply Voice Dictation to Prescription Form</span>
          </button>
        </div>
      </div>
    </div>
  );
};
