import React, { useState } from 'react';
import { PatientFriendlySummary } from '../utils/patientSummaryGenerator';
import { useLanguage } from '../i18n/LanguageContext';
import {
  CheckCircle2,
  AlertTriangle,
  Pill,
  Clock,
  ShieldCheck,
  HelpCircle,
  AlertOctagon,
  Sparkles,
  HeartHandshake,
  Volume2,
  VolumeX,
  Languages
} from 'lucide-react';

interface PatientFriendlySummaryCardProps {
  summary: PatientFriendlySummary;
  onClose?: () => void;
}

export const PatientFriendlySummaryCard: React.FC<PatientFriendlySummaryCardProps> = ({ summary, onClose }) => {
  const { t, speakText, stopSpeech, isSpeaking, currentLanguageInfo } = useLanguage();
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);

  const isUrgent = summary.verdictBadge.status === 'urgent';
  const isCaution = summary.verdictBadge.status === 'caution';

  const badgeBg = isUrgent
    ? 'bg-red-500 text-white'
    : isCaution
    ? 'bg-amber-400 text-[#2b2b2b]'
    : 'bg-emerald-500 text-white';

  const borderAccent = isUrgent
    ? 'border-red-500 bg-red-50/50'
    : isCaution
    ? 'border-amber-400 bg-amber-50/40'
    : 'border-emerald-500 bg-emerald-50/40';

  const handleToggleAudio = () => {
    if (isSpeaking || isPlayingLocal) {
      stopSpeech();
      setIsPlayingLocal(false);
    } else {
      setIsPlayingLocal(true);
      speakText(summary.fullAudioScript, () => {
        setIsPlayingLocal(false);
      });
    }
  };

  return (
    <div className={`border-3 border-[#2b2b2b] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_#2b2b2b] space-y-6 transition-all ${borderAccent}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#2b2b2b]/15 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase bg-[#2b2b2b] text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <HeartHandshake className="w-3.5 h-3.5 text-[#ff5f3d]" />
              <span>{t('patient.simplifiedView', 'Simplified Patient-Friendly View')}</span>
            </span>
            <span className="font-mono text-xs font-bold bg-white text-[#2b2b2b] px-2.5 py-1 rounded-full border border-[#2b2b2b] flex items-center gap-1 shadow-xs">
              <Languages className="w-3 h-3 text-[#ff5f3d]" />
              <span>{currentLanguageInfo.nativeName}</span>
            </span>
            <span className={`font-mono text-xs font-bold uppercase px-3 py-1 rounded-full border-2 border-[#2b2b2b] shadow-xs flex items-center gap-1.5 ${badgeBg}`}>
              {isUrgent && <AlertOctagon className="w-3.5 h-3.5" />}
              {isCaution && <AlertTriangle className="w-3.5 h-3.5" />}
              {!isUrgent && !isCaution && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{summary.verdictBadge.label}</span>
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#2b2b2b]/70">
            {summary.verdictBadge.sublabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Read Aloud Voice Button for Rural Accessibility */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`font-mono text-xs font-bold uppercase px-3.5 py-1.5 rounded-xl border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-1.5 ${
              isSpeaking || isPlayingLocal
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[#ff5f3d] text-white hover:bg-[#e84f2f]'
            }`}
            title="Listen aloud in your language"
          >
            {isSpeaking || isPlayingLocal ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>{t('patient.stopAudio', 'Stop Audio')}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t('patient.listenAudio', '🔊 Listen Aloud')}</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="font-mono text-xs font-bold uppercase text-[#2b2b2b]/70 hover:text-[#2b2b2b] border border-[#2b2b2b]/40 hover:border-[#2b2b2b] px-3 py-1.5 rounded-xl bg-white cursor-pointer transition-colors"
            >
              &times; {t('patient.close', 'Close')}
            </button>
          )}
        </div>
      </div>

      {/* Audio playback notification banner if currently speaking */}
      {(isSpeaking || isPlayingLocal) && (
        <div className="p-3 bg-white border-2 border-[#ff5f3d] rounded-2xl flex items-center justify-between text-xs font-mono text-[#ff5f3d] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f3d] animate-ping" />
            <span className="font-bold">{t('patient.listening', 'Playing audio directions aloud...')}</span>
          </div>
          <button
            onClick={handleToggleAudio}
            className="text-xs font-bold underline hover:text-[#2b2b2b] cursor-pointer"
          >
            {t('patient.stopAudio', 'Stop')}
          </button>
        </div>
      )}

      {/* Headline & Simple Explanation */}
      <div className="space-y-2">
        <h3 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2b2b2b] leading-tight">
          {summary.headline}
        </h3>
        <p className="font-sans text-sm text-[#2b2b2b]/85 leading-relaxed bg-white/80 p-4 rounded-2xl border-2 border-[#2b2b2b]/20">
          {summary.simpleExplanation}
        </p>
      </div>

      {/* Medication Guidance Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#2b2b2b]">
          <Pill className="w-4 h-4 text-[#ff5f3d]" />
          <span>{t('patient.prescribedMeds', 'Your Prescribed Medicines')} ({summary.medicationGuidance.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.medicationGuidance.map((med, idx) => (
            <div key={idx} className="bg-white border-2 border-[#2b2b2b] rounded-2xl p-4 shadow-[3px_3px_0px_#2b2b2b] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-sans font-bold text-base text-[#2b2b2b]">{med.drugName}</h4>
                  <span className="font-mono text-[10px] text-[#2b2b2b]/60 block">{med.whatItIs}</span>
                </div>
                <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-300 shrink-0">
                  {med.categoryTag}
                </span>
              </div>

              <div className="text-xs font-sans text-[#2b2b2b] space-y-1 pt-1 border-t border-[#2b2b2b]/10">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#ff5f3d] shrink-0" />
                  <span><strong>{t('patient.schedule', 'How to Take:')}</strong> {med.howToTake}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#2b2b2b]/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{t('patient.duration', 'Total Duration:')}</strong> {med.duration}</span>
                </div>
                {med.timingTip && (
                  <p className="text-[11px] bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 font-sans mt-2">
                    💡 <strong>{t('patient.tip', 'Daily Tip:')}</strong> {med.timingTip}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Advice & Precautions */}
      {summary.safetyAdvice.length > 0 && (
        <div className="bg-white border-2 border-[#2b2b2b] p-5 rounded-2xl shadow-[4px_4px_0px_#2b2b2b] space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#2b2b2b]">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{t('patient.safetyReminders', 'Important Safety Reminders & Things to Avoid')}</span>
          </div>
          <ul className="space-y-2 font-sans text-xs text-[#2b2b2b]/85">
            {summary.safetyAdvice.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-[#fffef2] p-2.5 rounded-xl border border-[#2b2b2b]/15">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-[#2b2b2b] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  !
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Why finish the whole course box (Superbug prevention) */}
      <div className="bg-purple-50 border-2 border-purple-800/30 rounded-2xl p-5 space-y-2 shadow-xs">
        <div className="flex items-center gap-2 text-purple-950 font-bold font-sans text-sm">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>{t('patient.whyFinishCourse', 'Why You Must Finish Every Dose (Superbug Prevention)')}</span>
        </div>
        <p className="font-sans text-xs text-purple-950/80 leading-relaxed">
          {summary.whyFinishCourseText}
        </p>
      </div>

      {/* Action Steps & Questions to ask */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Steps */}
        <div className="bg-white border-2 border-[#2b2b2b] p-4 rounded-2xl shadow-xs space-y-2">
          <div className="font-mono text-xs font-bold uppercase text-[#2b2b2b] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ff5f3d]" />
            <span>{t('patient.nextSteps', 'What You Should Do Next:')}</span>
          </div>
          <ul className="space-y-1.5 text-xs font-sans text-[#2b2b2b]/80">
            {summary.actionSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Questions for doctor */}
        <div className="bg-white border-2 border-[#2b2b2b] p-4 rounded-2xl shadow-xs space-y-2">
          <div className="font-mono text-xs font-bold uppercase text-[#2b2b2b] flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>{t('patient.doctorQuestions', 'Helpful Questions for Your Doctor or Pharmacist:')}</span>
          </div>
          <ul className="space-y-1.5 text-xs font-sans text-[#2b2b2b]/80 italic">
            {summary.questionsForDoctor.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold shrink-0">•</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
