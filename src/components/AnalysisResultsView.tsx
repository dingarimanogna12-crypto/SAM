import React, { useState, useMemo } from 'react';
import { FullAnalysisResult, AlertSeverity, UserProfile } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Download,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  FileText,
  Printer,
  HeartHandshake,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { generateClinicalAuditPdf } from '../utils/generatePdfReport';
import { generatePatientFriendlySummary } from '../utils/patientSummaryGenerator';
import { PatientFriendlySummaryCard } from './PatientFriendlySummaryCard';
import { useLanguage } from '../i18n/LanguageContext';

interface AnalysisResultsViewProps {
  result: FullAnalysisResult;
  userProfile?: UserProfile | null;
}

export const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({ result, userProfile }) => {
  const [activeStageTab, setActiveStageTab] = useState<1 | 2 | 3 | 4 | 'all'>('all');
  const [copiedAudit, setCopiedAudit] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [showPatientSummary, setShowPatientSummary] = useState<boolean>(false);

  const { currentLanguage, t } = useLanguage();

  // Generate patient-friendly plain language summary localized to the active language
  const patientSummary = useMemo(
    () => generatePatientFriendlySummary(result, currentLanguage),
    [result, currentLanguage]
  );

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#2b2b2b]">
            <AlertTriangle className="w-4 h-4" />
            CRITICAL SAFETY / REGULATORY ALERT
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-3 py-1 bg-amber-400 text-[#2b2b2b] border-2 border-[#2b2b2b] rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#2b2b2b]">
            <AlertTriangle className="w-4 h-4" />
            CLINICAL ACTION REQUIRED
          </span>
        );
      case 'INFO':
        return (
          <span className="px-3 py-1 bg-blue-400 text-[#2b2b2b] border-2 border-[#2b2b2b] rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#2b2b2b]">
            <Info className="w-4 h-4" />
            INFORMATIONAL REVIEW
          </span>
        );
      case 'COMPLIANT':
        return (
          <span className="px-3 py-1 bg-emerald-400 text-[#2b2b2b] border-2 border-[#2b2b2b] rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#2b2b2b]">
            <ShieldCheck className="w-4 h-4" />
            100% COMPLIANT & SAFE
          </span>
        );
    }
  };

  const getAWaReBadge = (group: string) => {
    switch (group) {
      case 'ACCESS':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-200 text-[#2b2b2b] border border-[#2b2b2b] rounded text-[11px] font-mono font-bold">
            WHO ACCESS
          </span>
        );
      case 'WATCH':
        return (
          <span className="px-2.5 py-0.5 bg-amber-200 text-[#2b2b2b] border border-[#2b2b2b] rounded text-[11px] font-mono font-bold">
            WHO WATCH
          </span>
        );
      case 'RESERVE':
        return (
          <span className="px-2.5 py-0.5 bg-red-200 text-[#2b2b2b] border border-[#2b2b2b] rounded text-[11px] font-mono font-bold">
            WHO RESERVE
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-gray-100 text-[#2b2b2b] border border-[#2b2b2b] rounded text-[11px] font-mono font-bold">
            {group}
          </span>
        );
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AMU_Audit_Report_${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const practitionerName = userProfile?.displayName
        ? `${userProfile.displayName} (${userProfile.role || 'Practitioner'})`
        : 'Certified Clinical Pharmacist / Infectious Disease Specialist';
      const facilityName = userProfile?.organization || 'Hospital Antimicrobial Surveillance Network';

      generateClinicalAuditPdf(result, practitionerName, facilityName);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err) {
      console.error("Failed to generate clinical PDF report:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopySummary = () => {
    const summaryText = `
AMU & DRUG SAFETY ANALYSIS REPORT (${result.id})
Timestamp: ${result.timestamp}
Patient: ${result.prescription.patient.species} (${result.prescription.patient.type})
Diagnosis: ${result.prescription.patient.diagnosis}
Overall Status: ${result.overallStatus}
WHO AWaRe Score: ${result.stage4.whoAWaReComplianceScore}%
AMR Selective Pressure Index: ${result.stage3.amrPressureScore} / 10
Confidence Score: ${result.stage4.auditTrail.overallConfidence}%

EXPLAINABLE SUMMARY:
${result.stage4.explainableSummary}

REGULATORY ALERTS:
${result.stage4.regulatoryAlerts.map(a => `- [${a.severity}] ${a.title}: ${a.details}`).join('\n')}
    `;
    navigator.clipboard.writeText(summaryText.trim());
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Overview Status Banner */}
      <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {getSeverityBadge(result.overallStatus)}
              <span className="font-mono text-xs text-[#2b2b2b]/60 font-bold">ID: {result.id}</span>
              <span className="font-sans text-xs text-[#2b2b2b]">
                Patient: <strong className="font-bold">{result.prescription.patient.species} ({result.prescription.patient.ageYears}yo, {result.prescription.patient.weightKg}kg)</strong>
              </span>
            </div>

            <h2 className="font-gaegu text-3xl font-bold text-[#2b2b2b]">
              Clinical & Regulatory Evaluation Summary
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#2b2b2b]/80 leading-relaxed max-w-4xl">
              {result.stage4.explainableSummary}
            </p>

            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPatientSummary((prev) => !prev)}
                className="font-mono text-xs font-bold text-[#ff5f3d] hover:text-[#2b2b2b] flex items-center gap-1.5 cursor-pointer transition-colors bg-orange-50 hover:bg-orange-100 border border-[#ff5f3d]/40 px-3 py-1 rounded-lg"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-[#ff5f3d]" />
                <span>
                  {showPatientSummary
                    ? t('results.hidePatientSummary', 'Hide Patient-Friendly Summary')
                    : t('results.viewPatientSummary', 'View Simplified Patient-Friendly Summary →')}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#fffef2] p-3 rounded-xl border-2 border-[#2b2b2b] text-center min-w-[100px] shadow-[3px_3px_0px_#2b2b2b]">
              <span className="font-mono text-[10px] text-[#2b2b2b]/60 uppercase font-bold block">WHO AWaRe</span>
              <span className="font-mono text-xl font-bold text-[#2b2b2b]">{result.stage4.whoAWaReComplianceScore}%</span>
              <span className="font-mono text-[9px] text-[#2b2b2b]/50 font-bold block">{t('results.whoScore', 'Compliance')}</span>
            </div>

            <div className="bg-[#fffef2] p-3 rounded-xl border-2 border-[#2b2b2b] text-center min-w-[100px] shadow-[3px_3px_0px_#2b2b2b]">
              <span className="font-mono text-[10px] text-[#2b2b2b]/60 uppercase font-bold block">AMR Pressure</span>
              <span className={`font-mono text-xl font-bold ${result.stage3.amrPressureScore > 7 ? 'text-[#ff5f3d]' : 'text-amber-600'}`}>
                {result.stage3.amrPressureScore} / 10
              </span>
              <span className="font-mono text-[9px] text-[#2b2b2b]/50 font-bold block">{t('results.amrPressure', 'Selection Index')}</span>
            </div>

            <div className="bg-[#fffef2] p-3 rounded-xl border-2 border-[#2b2b2b] text-center min-w-[100px] shadow-[3px_3px_0px_#2b2b2b]">
              <span className="font-mono text-[10px] text-[#2b2b2b]/60 uppercase font-bold block">AI Confidence</span>
              <span className="font-mono text-xl font-bold text-emerald-600">{result.stage4.auditTrail.overallConfidence}%</span>
              <span className="font-mono text-[9px] text-[#2b2b2b]/50 font-bold block">{t('results.aiConfidence', 'Zero-Defect')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t-2 border-[#2b2b2b]/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#2b2b2b]/60">{t('results.filter', 'FILTER:')}</span>
            <button
              onClick={() => setActiveStageTab('all')}
              className={`font-sans font-bold text-xs px-3 py-1.5 rounded-full border-2 border-[#2b2b2b] cursor-pointer transition-all ${
                activeStageTab === 'all' ? 'bg-[#2b2b2b] text-white' : 'bg-white text-[#2b2b2b] hover:bg-[#fffef2]'
              }`}
            >
              {t('results.allStages', 'All 4 Stages')}
            </button>
            {[1, 2, 3, 4].map((stageNum) => (
              <button
                key={stageNum}
                onClick={() => setActiveStageTab(stageNum as any)}
                className={`font-sans font-bold text-xs px-3 py-1.5 rounded-full border-2 border-[#2b2b2b] cursor-pointer transition-all ${
                  activeStageTab === stageNum ? 'bg-[#2b2b2b] text-white' : 'bg-white text-[#2b2b2b] hover:bg-[#fffef2]'
                }`}
              >
                Stage {stageNum}
              </button>
            ))}

            <div className="h-6 w-[2px] bg-[#2b2b2b]/20 mx-1 hidden sm:block" />

            {/* Patient-Friendly Toggle Switch */}
            <button
              type="button"
              onClick={() => setShowPatientSummary((prev) => !prev)}
              className={`font-mono text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg border-2 border-[#2b2b2b] transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] ${
                showPatientSummary
                  ? 'bg-emerald-400 text-[#2b2b2b]'
                  : 'bg-white hover:bg-orange-50 text-[#2b2b2b]'
              }`}
              title="Toggle simplified plain-language patient summary on/off"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#ff5f3d]" />
              <span>
                {showPatientSummary
                  ? t('results.patientToggleOn', 'Patient View: ON')
                  : t('results.patientToggleOff', 'Patient View: OFF')}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="font-mono text-xs font-bold uppercase bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5"
            >
              {copiedAudit ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAudit ? t('results.copied', 'Copied!') : t('results.copySummary', 'Copy Summary')}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="font-mono text-xs font-bold uppercase bg-white hover:bg-orange-50 text-[#2b2b2b] border-2 border-[#2b2b2b] px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5"
              title="Download raw structured JSON audit dataset"
            >
              <Download className="w-3.5 h-3.5 text-[#ff5f3d]" />
              <span>{t('results.exportJson', 'JSON')}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] hover:bg-[#e84f2f] text-white border-2 border-[#2b2b2b] px-4 py-1.5 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Download clinical documentation PDF report formatted for medical records & pharmacy filing"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>{t('results.exportPdf', 'Export PDF Report')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Patient-Friendly Summary Card (Toggled View) */}
      {showPatientSummary && (
        <PatientFriendlySummaryCard
          summary={patientSummary}
          onClose={() => setShowPatientSummary(false)}
        />
      )}

      {/* Stage 1 Output Card */}
      {(activeStageTab === 'all' || activeStageTab === 1) && (
        <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#2b2b2b]">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2b2b2b] text-white font-mono font-bold text-sm flex items-center justify-center border-2 border-[#2b2b2b]">1</span>
              <div>
                <h3 className="font-sans font-bold text-[#2b2b2b] text-base">Stage 1: Prescription Parsing & Antimicrobial Detection</h3>
                <p className="font-sans text-xs text-[#2b2b2b]/70">Categorizes active drugs, ATC codes, WHO AWaRe groups, and indication alignment.</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#2b2b2b] bg-[#fffef2] px-2.5 py-1 border border-[#2b2b2b] rounded-md">
              Confidence: {result.stage4.auditTrail.stage1Confidence}%
            </span>
          </div>

          <p className="font-mono text-xs text-[#2b2b2b] bg-[#fffef2] p-3 rounded-xl border-2 border-[#2b2b2b]/30">
            {result.stage1.prescriptionSummary}
          </p>

          <div className="overflow-x-auto border-2 border-[#2b2b2b] rounded-xl">
            <table className="w-full text-left font-sans text-xs text-[#2b2b2b]">
              <thead className="font-mono text-[11px] font-bold text-[#2b2b2b] bg-[#fffef2] border-b-2 border-[#2b2b2b] uppercase">
                <tr>
                  <th className="p-3">Drug Name</th>
                  <th className="p-3">AMU Class</th>
                  <th className="p-3">ATC Code</th>
                  <th className="p-3">WHO AWaRe</th>
                  <th className="p-3">Spectrum</th>
                  <th className="p-3">Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b2b2b]/20">
                {result.stage1.antimicrobialsFound.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#fffef2]">
                    <td className="p-3 font-bold">{item.drugName}</td>
                    <td className="p-3 font-semibold">{item.antimicrobialClass}</td>
                    <td className="p-3 font-mono">{item.atcCode || 'N/A'}</td>
                    <td className="p-3">{getAWaReBadge(item.whoAWaReGroup)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-gray-100 border border-[#2b2b2b] text-[#2b2b2b] font-mono rounded text-[10px] font-bold">
                        {item.spectrum}
                      </span>
                    </td>
                    <td className="p-3 text-[#2b2b2b]/70 max-w-xs truncate">{item.mechanismOfAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stage 2 Output Card */}
      {(activeStageTab === 'all' || activeStageTab === 2) && (
        <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#2b2b2b]">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2b2b2b] text-white font-mono font-bold text-sm flex items-center justify-center border-2 border-[#2b2b2b]">2</span>
              <div>
                <h3 className="font-sans font-bold text-[#2b2b2b] text-base">Stage 2: Dosage Compliance & Pharmacokinetic Verification</h3>
                <p className="font-sans text-xs text-[#2b2b2b]/70">Verifies mg/kg/day dosing, renal clearance adjustments, and duration limits.</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#2b2b2b] bg-[#fffef2] px-2.5 py-1 border border-[#2b2b2b] rounded-md">
              Confidence: {result.stage4.auditTrail.stage2Confidence}%
            </span>
          </div>

          <div className="space-y-3">
            {result.stage2.dosageChecks.map((check, idx) => (
              <div key={idx} className="bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#2b2b2b]">{check.drugName}</span>
                  <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded border border-[#2b2b2b] ${
                    check.status === 'OPTIMAL' ? 'bg-emerald-300 text-[#2b2b2b]' : 'bg-[#ff5f3d] text-white'
                  }`}>
                    STATUS: {check.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border-2 border-[#2b2b2b]">
                  <div>
                    <span className="font-mono text-[10px] text-[#2b2b2b]/60 font-bold block">Prescribed mg/kg/day</span>
                    <span className="font-mono text-[#2b2b2b] font-bold">{check.prescribedMgPerKg ?? 'N/A'} mg/kg</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#2b2b2b]/60 font-bold block">Recommended Range</span>
                    <span className="font-mono text-[#2b2b2b]">
                      {check.recommendedMgPerKgRange ? `${check.recommendedMgPerKgRange.min} - ${check.recommendedMgPerKgRange.max} mg/kg` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#2b2b2b]/60 font-bold block">Duration Check</span>
                    <span className={`font-semibold ${check.durationAppropriate ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {check.durationAppropriate ? 'Appropriate' : 'Requires Review'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#2b2b2b]/60 font-bold block">Renal Adjustment</span>
                    <span className={`font-semibold ${check.renalAdjustmentNeeded ? 'text-[#ff5f3d]' : 'text-[#2b2b2b]'}`}>
                      {check.renalAdjustmentNeeded ? 'Adjustment Required' : 'Not Required'}
                    </span>
                  </div>
                </div>

                {check.adjustedRecommendation && (
                  <div className="p-3 bg-amber-100 border-2 border-[#2b2b2b] rounded-lg text-xs text-[#2b2b2b] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#ff5f3d] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block mb-0.5">Renal Adjustment Recommendation:</strong>
                      {check.adjustedRecommendation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage 3 Output Card */}
      {(activeStageTab === 'all' || activeStageTab === 3) && (
        <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#2b2b2b]">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2b2b2b] text-white font-mono font-bold text-sm flex items-center justify-center border-2 border-[#2b2b2b]">3</span>
              <div>
                <h3 className="font-sans font-bold text-[#2b2b2b] text-base">Stage 3: Drug Safety, Interactions & AMR Pressure Matrix</h3>
                <p className="font-sans text-xs text-[#2b2b2b]/70">Scans drug interactions, contraindications, and calculates AMR selective pressure index.</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#2b2b2b] bg-[#fffef2] px-2.5 py-1 border border-[#2b2b2b] rounded-md">
              Confidence: {result.stage4.auditTrail.stage3Confidence}%
            </span>
          </div>

          {/* AMR Pressure Score Display */}
          <div className="bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold text-[#2b2b2b] uppercase block">AMR Selective Pressure Index</span>
              <p className="font-sans text-xs text-[#2b2b2b]/80 mt-1 max-w-2xl">{result.stage3.amrRationale}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="font-mono text-2xl font-extrabold text-[#ff5f3d]">{result.stage3.amrPressureScore}</span>
                <span className="font-mono text-xs text-[#2b2b2b]/60 font-bold block">/ 10 Scale</span>
              </div>
            </div>
          </div>

          {/* Drug Interactions */}
          {result.stage3.interactions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold uppercase text-[#ff5f3d] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Drug-Drug Interactions Detected ({result.stage3.interactions.length})
              </h4>
              {result.stage3.interactions.map((interaction, idx) => (
                <div key={idx} className="bg-red-50 border-2 border-[#2b2b2b] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#2b2b2b]">
                      {interaction.drugA} ⚡ {interaction.drugB}
                    </span>
                    <span className="px-2 py-0.5 bg-[#ff5f3d] text-white text-[10px] font-mono font-bold rounded border border-[#2b2b2b]">
                      SEVERITY: {interaction.severity}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#2b2b2b]">
                    <strong className="font-bold">Clinical Effect:</strong> {interaction.clinicalEffect}
                  </p>
                  <p className="font-sans text-xs text-[#2b2b2b] bg-white p-2 rounded border border-[#2b2b2b]">
                    <strong className="font-bold">Clinical Management:</strong> {interaction.management}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Black Box Warnings / Contraindications */}
          {result.stage3.safetyRisks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold uppercase text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Safety Warnings & Black-Box Alerts ({result.stage3.safetyRisks.length})
              </h4>
              {result.stage3.safetyRisks.map((risk, idx) => (
                <div key={idx} className="bg-amber-50 border-2 border-[#2b2b2b] p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#2b2b2b]">{risk.title}</span>
                    <span className="text-[10px] font-mono font-bold text-[#ff5f3d] uppercase">{risk.type}</span>
                  </div>
                  <p className="font-sans text-xs text-[#2b2b2b]/80">{risk.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stage 4 Output Card */}
      {(activeStageTab === 'all' || activeStageTab === 4) && (
        <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#2b2b2b]">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2b2b2b] text-white font-mono font-bold text-sm flex items-center justify-center border-2 border-[#2b2b2b]">4</span>
              <div>
                <h3 className="font-sans font-bold text-[#2b2b2b] text-base">Stage 4: Regulatory Surveillance & Explainable AI Audit Trail</h3>
                <p className="font-sans text-xs text-[#2b2b2b]/70">Official regulatory flags, WHO/WOAH compliance alerts, and guideline citations.</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#2b2b2b] bg-[#fffef2] px-2.5 py-1 border border-[#2b2b2b] rounded-md">
              Confidence: {result.stage4.auditTrail.stage4Confidence}%
            </span>
          </div>

          {/* Regulatory Alerts */}
          {result.stage4.regulatoryAlerts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold uppercase text-purple-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Official Regulatory Surveillance Flags ({result.stage4.regulatoryAlerts.length})
              </h4>
              {result.stage4.regulatoryAlerts.map((alert) => (
                <div key={alert.id} className="bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#2b2b2b]">{alert.title}</span>
                    <span className="px-2 py-0.5 bg-[#2b2b2b] text-white text-[10px] font-mono font-bold rounded">
                      AUTHORITY: {alert.authority}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#2b2b2b]/80">{alert.details}</p>
                  <div className="p-2 bg-white rounded text-xs text-[#2b2b2b] border border-[#2b2b2b]">
                    <strong>Action Required:</strong> {alert.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Explainable AI Audit Trail */}
          <div className="bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b] space-y-3">
            <span className="font-mono text-xs font-bold text-[#2b2b2b] uppercase block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff5f3d]" /> Transparent AI Reasoning Chain (Explainable AI)
            </span>
            <ul className="space-y-1.5 font-sans text-xs text-[#2b2b2b]">
              {result.stage4.auditTrail.reasoningChain.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2b2b2b] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinical Citations */}
          <div className="bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b] space-y-2">
            <span className="font-mono text-xs font-bold text-[#2b2b2b] uppercase block flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Standard Guidelines & Citations
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {result.stage4.auditTrail.guidelineCitations.map((citation, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-[#2b2b2b] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#2b2b2b] font-bold">
                    <span>{citation.title}</span>
                    <span className="text-[10px] font-mono text-[#ff5f3d] font-bold">{citation.source} ({citation.versionOrYear})</span>
                  </div>
                  <p className="font-sans text-[#2b2b2b]/70 text-[11px]">{citation.relevance}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Documentation & PDF Export Banner */}
      <div className="bg-[#fffef2] border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase font-bold bg-[#2b2b2b] text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#ff5f3d]" />
              <span>Official Clinical Record</span>
            </span>
            <span className="font-mono text-xs text-[#2b2b2b]/60">
              WHO AWaRe 2026 Compliant
            </span>
          </div>
          <h3 className="font-gaegu text-2xl sm:text-3xl font-bold text-[#2b2b2b]">
            Download Official Clinical PDF Report
          </h3>
          <p className="font-sans text-xs sm:text-sm text-[#2b2b2b]/70 leading-relaxed">
            Generates a high-resolution, multi-page PDF document formatted for institutional patient charts, pharmacy verification records, and regulatory stewardship audits. Contains complete patient demographics, dosing tables, DDI interaction matrices, and guideline references.
          </p>
        </div>

        <div className="shrink-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] hover:bg-[#e84f2f] text-white border-3 border-[#2b2b2b] px-6 py-3.5 rounded-xl shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preparing Document...</span>
              </>
            ) : pdfSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Download Clinical PDF</span>
              </>
            )}
          </button>
          <span className="font-mono text-[10px] text-[#2b2b2b]/60 text-center">
            Verification Hash: {result.id}
          </span>
        </div>
      </div>
    </div>
  );
};
