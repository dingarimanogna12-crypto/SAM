import React, { useState } from 'react';
import { UserProfile, FullAnalysisResult, PrescriptionData } from '../types';
import {
  User,
  HeartPulse,
  Pill,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Info,
  Calendar,
  Utensils,
  Sun,
  Activity,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { PrescriptionInput } from './PrescriptionInput';
import { AnalysisPipeline } from './AnalysisPipeline';
import { generateClinicalAuditPdf } from '../utils/generatePdfReport';

interface PatientPortalViewProps {
  userProfile: UserProfile;
  history: FullAnalysisResult[];
  onAnalyze: (data: PrescriptionData) => Promise<void>;
  isAnalyzing: boolean;
  currentPipelineStage: number;
  currentResult: FullAnalysisResult | null;
  onSwitchToDoctorView: () => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  userProfile,
  history,
  onAnalyze,
  isAnalyzing,
  currentPipelineStage,
  currentResult,
  onSwitchToDoctorView,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'check' | 'my-meds' | 'guide'>('check');

  const patientPresets = [
    {
      title: 'Ear Infection (Otitis Media)',
      drug: 'Amoxicillin 500mg',
      text: 'Patient: Sanjana, 28 years old, 62 kg. Diagnosis: Acute Otitis Media. Prescribed: Amoxicillin 500mg orally three times daily for 7 days.'
    },
    {
      title: 'Bronchitis / Chest Infection',
      drug: 'Azithromycin 500mg',
      text: 'Patient: Sanjana, 28 years old, 62 kg. Diagnosis: Acute Bronchitis. Prescribed: Azithromycin 500mg orally once daily for 3 days.'
    },
    {
      title: 'Stomach & Urinary with Antacid Warning',
      drug: 'Ciprofloxacin + Antacid (Gelusil)',
      text: 'Patient: Sanjana, 28 years old, 62 kg. Diagnosis: Urinary Tract Infection. Prescribed: Ciprofloxacin 500mg twice daily for 5 days, Gelusil Antacid syrup 10ml as needed.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Patient Welcome Banner */}
      <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-3xl shadow-[8px_8px_0px_#2b2b2b] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase bg-emerald-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Patient Health Portal</span>
              </span>
              <span className="font-mono text-xs font-bold text-[#2b2b2b]/60">
                Personal Medication Safety & Guidance
              </span>
            </div>

            <h1 className="font-sans font-bold text-3xl sm:text-4xl text-[#2b2b2b] tracking-tight">
              Hello, {userProfile.displayName || 'Patient'} 👋
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#2b2b2b]/80 leading-relaxed font-light">
              Check your antibiotic prescriptions in plain, simple language. Find out when to take them, what foods or vitamins to avoid, common side effects, and how finishing your full prescription protects you from superbugs.
            </p>

            {/* Patient Entity Stamp */}
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold">
                Entity: /patients/{userProfile.uid?.slice(0, 10)}...
              </span>
              {userProfile.ageYears && (
                <span className="bg-[#fffef2] text-[#2b2b2b] border border-[#2b2b2b]/30 px-2.5 py-1 rounded-lg">
                  Age: <strong>{userProfile.ageYears} yrs</strong>
                </span>
              )}
              {userProfile.allergies && (
                <span className="bg-red-50 text-red-900 border border-red-300 px-2.5 py-1 rounded-lg font-bold">
                  Allergies: {userProfile.allergies}
                </span>
              )}
              <span className="bg-[#fffef2] text-[#2b2b2b]/80 border border-[#2b2b2b]/30 px-2.5 py-1 rounded-lg">
                Clinic: {userProfile.organization || 'Personal Health Portal'}
              </span>
            </div>
          </div>

          {/* Quick Switch to Doctor Mode */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={onSwitchToDoctorView}
              className="font-mono text-xs font-bold uppercase bg-[#fffef2] hover:bg-orange-50 text-[#ff5f3d] border-2 border-[#2b2b2b] px-4 py-3 rounded-xl shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-[#ff5f3d]" />
              <span>Switch to Doctor / Clinician View &rarr;</span>
            </button>
            <span className="font-mono text-[10px] text-center text-[#2b2b2b]/50">
              Access WHO AWaRe surveillance & PK/PD dosing engine
            </span>
          </div>
        </div>

        {/* Quick Nav subtabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t-2 border-[#2b2b2b]/15 font-mono text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('check')}
            className={`px-4 py-2 rounded-lg border-2 border-[#2b2b2b] transition-all cursor-pointer ${
              activeSubTab === 'check'
                ? 'bg-[#ff5f3d] text-white shadow-[2px_2px_0px_#2b2b2b]'
                : 'bg-white text-[#2b2b2b] hover:bg-orange-50'
            }`}
          >
            🔍 Check a Prescription
          </button>
          <button
            onClick={() => setActiveSubTab('my-meds')}
            className={`px-4 py-2 rounded-lg border-2 border-[#2b2b2b] transition-all cursor-pointer ${
              activeSubTab === 'my-meds'
                ? 'bg-[#ff5f3d] text-white shadow-[2px_2px_0px_#2b2b2b]'
                : 'bg-white text-[#2b2b2b] hover:bg-orange-50'
            }`}
          >
            📋 My Safety History ({history.length})
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`px-4 py-2 rounded-lg border-2 border-[#2b2b2b] transition-all cursor-pointer ${
              activeSubTab === 'guide'
                ? 'bg-[#ff5f3d] text-white shadow-[2px_2px_0px_#2b2b2b]'
                : 'bg-white text-[#2b2b2b] hover:bg-orange-50'
            }`}
          >
            🛡️ Safe Antibiotic Guide
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Check a Prescription */}
      {activeSubTab === 'check' && (
        <div className="space-y-8">
          {/* Preset Buttons for Quick Testing */}
          <div className="bg-white border-2 border-[#2b2b2b] p-4 rounded-2xl shadow-[4px_4px_0px_#2b2b2b] space-y-2">
            <span className="font-mono text-[11px] font-bold uppercase text-[#ff5f3d]">
              Patient Quick Test Cases (1-Click Sample Prescriptions):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {patientPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onAnalyze({
                      id: `RX-PATIENT-${Date.now()}`,
                      patient: {
                        type: 'human',
                        species: 'Human',
                        ageYears: 28,
                        weightKg: 62,
                        gender: 'Female',
                        diagnosis: p.title,
                        renalFunction: 'Normal',
                      },
                      medications: [
                        {
                          id: `M-${Date.now()}`,
                          drugName: p.drug.split(' ')[0],
                          dosage: p.drug.includes('500') ? '500mg' : 'Standard',
                          route: 'Oral',
                          frequency: 'As Prescribed',
                          durationDays: 7
                        }
                      ],
                      rawText: p.text
                    });
                  }}
                  className="text-left p-3 rounded-xl border-2 border-[#2b2b2b] hover:bg-orange-50/70 transition-all cursor-pointer group shadow-xs bg-[#fffef2]"
                >
                  <div className="font-sans font-bold text-xs text-[#2b2b2b] group-hover:text-[#ff5f3d] flex items-center justify-between">
                    <span>{p.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#ff5f3d] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-mono text-[10px] text-[#2b2b2b]/70 mt-1 line-clamp-1">{p.drug}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-12">
              <PrescriptionInput onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
            </div>
          </div>

          {/* Execution Pipeline Visualizer */}
          {(isAnalyzing || currentPipelineStage > 0) && (
            <AnalysisPipeline currentStage={currentPipelineStage} isAnalyzing={isAnalyzing} />
          )}

          {/* Patient-Centric Analysis Result Card */}
          {currentResult && (
            <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-3xl shadow-[8px_8px_0px_#2b2b2b] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#2b2b2b]/15 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block mb-1">
                    Plain-Language Patient Safety Summary
                  </span>
                  <h2 className="font-sans font-bold text-2xl text-[#2b2b2b]">
                    Prescription Analysis for {currentResult.prescription.patient.diagnosis}
                  </h2>
                </div>

                <div className={`px-4 py-2 rounded-xl border-2 border-[#2b2b2b] font-mono text-xs font-bold uppercase flex items-center gap-2 ${
                  currentResult.overallStatus === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  currentResult.overallStatus === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentResult.overallStatus === 'COMPLIANT' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {currentResult.overallStatus === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {currentResult.overallStatus === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  <span>Safety Status: {currentResult.overallStatus}</span>
                </div>
              </div>

              {/* 4 Patient Practical Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. What are these medicines? */}
                <div className="p-5 bg-blue-50/60 border-2 border-[#2b2b2b] rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-bold font-sans text-sm">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <span>Your Prescribed Medicines</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {currentResult.stage1.antimicrobialsFound.map((m, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-[#2b2b2b]/30 font-sans text-xs">
                        <div className="font-bold text-[#2b2b2b]">{m.drugName}</div>
                        <div className="text-[#2b2b2b]/70 font-mono text-[11px]">
                          Category: <strong>{m.whoAWaReGroup}</strong> &bull; {m.antimicrobialClass}
                        </div>
                        <div className="text-[11px] text-[#2b2b2b]/80 mt-1 italic">
                          Action: {m.mechanismOfAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. When and How to Take */}
                <div className="p-5 bg-emerald-50/60 border-2 border-[#2b2b2b] rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold font-sans text-sm">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Daily Schedule & Dosage Guidance</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {currentResult.stage2.dosageChecks.map((d, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-[#2b2b2b]/30 font-sans text-xs">
                        <div className="font-bold text-[#2b2b2b]">{d.drugName}</div>
                        <div className="font-mono text-[11px] text-[#2b2b2b]/70">
                          Daily Dose: {d.prescribedDosePerDayMg ? `${d.prescribedDosePerDayMg}mg/day` : 'Standard tablet/capsule'}
                        </div>
                        <div className={`mt-1 font-mono text-[11px] font-bold ${
                          d.status === 'APPROPRIATE' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          Dosage Check: {d.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Dangerous Interactions & Food/Drink Rules */}
                <div className="p-5 bg-amber-50/60 border-2 border-[#2b2b2b] rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold font-sans text-sm">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Important Food, Vitamin & Drug Warnings</span>
                  </div>
                  {currentResult.stage3.interactions.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {currentResult.stage3.interactions.map((inter, i) => (
                        <div key={i} className="bg-white p-2.5 rounded-lg border border-amber-300 font-sans text-xs">
                          <div className="font-bold text-amber-900">
                            Avoid taking together: {inter.drugA} + {inter.drugB}
                          </div>
                          <div className="text-[11px] text-[#2b2b2b]/80 mt-1">{inter.management}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-sans text-xs text-[#2b2b2b]/70 pt-1">
                      No dangerous interactions detected among these medicines. Always take with a full glass of water.
                    </p>
                  )}
                </div>

                {/* 4. Superbug & Adherence Rule */}
                <div className="p-5 bg-purple-50/60 border-2 border-[#2b2b2b] rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-purple-900 font-bold font-sans text-sm">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Why You Must Finish the Entire Course</span>
                  </div>
                  <p className="font-sans text-xs text-[#2b2b2b]/80 leading-relaxed">
                    Even if your symptoms improve after 2 or 3 days, surviving bacteria can mutate into drug-resistant superbugs. Finishing every prescribed dose ensures the infection is completely cleared and stops bacteria from becoming resistant.
                  </p>
                  <div className="font-mono text-[10px] text-purple-800 font-bold bg-white p-2 rounded border border-purple-200">
                    WHO AWaRe Safety Score: {currentResult.stage4.whoAWaReComplianceScore} / 100
                  </div>
                </div>
              </div>

              {/* View Deep Clinical Report Button & PDF Download */}
              <div className="pt-4 border-t-2 border-[#2b2b2b]/15 flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-[#2b2b2b]/60">
                  Clinical documentation & regulatory audit report:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const practitionerName = userProfile?.displayName
                        ? `${userProfile.displayName} (Patient Portal Session)`
                        : 'Patient Portal Documentation';
                      generateClinicalAuditPdf(currentResult, practitionerName, userProfile?.organization || 'Personal Health Portal');
                    }}
                    className="font-mono text-xs font-bold uppercase bg-white hover:bg-orange-50 text-[#2b2b2b] border-2 border-[#2b2b2b] px-3.5 py-2 rounded-xl shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] transition-transform cursor-pointer flex items-center gap-1.5"
                    title="Download official PDF medical report"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#ff5f3d]" />
                    <span>Download PDF Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={onSwitchToDoctorView}
                    className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] px-4 py-2 rounded-xl shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] transition-transform cursor-pointer flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Doctor Surveillance View &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: My Medication Safety History */}
      {activeSubTab === 'my-meds' && (
        <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-3xl shadow-[8px_8px_0px_#2b2b2b] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#2b2b2b]/15 pb-4">
            <div>
              <h2 className="font-sans font-bold text-2xl text-[#2b2b2b]">My Checked Prescriptions</h2>
              <p className="font-mono text-xs text-[#2b2b2b]/60">Past medicines reviewed for safety</p>
            </div>
            <span className="font-mono text-xs font-bold bg-[#2b2b2b] text-white px-3 py-1 rounded-full">
              {history.length} Record(s)
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Pill className="w-10 h-10 text-[#2b2b2b]/30 mx-auto" />
              <p className="font-sans text-sm text-[#2b2b2b]/60">You have not checked any prescriptions yet.</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('check')}
                className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white px-4 py-2 rounded-xl border border-[#2b2b2b] shadow-xs cursor-pointer"
              >
                Check a Prescription Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-[#fffef2] border-2 border-[#2b2b2b] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#2b2b2b]">{item.prescription.patient.diagnosis}</span>
                      <span className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        item.overallStatus === 'COMPLIANT' ? 'bg-green-100 text-green-800' :
                        item.overallStatus === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.overallStatus}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[#2b2b2b]/70">
                      Medications: {item.prescription.medications.map(m => m.drugName).join(', ')}
                    </div>
                    <div className="font-mono text-[10px] text-[#2b2b2b]/50">
                      Checked on: {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('check');
                    }}
                    className="font-mono text-xs font-bold text-[#ff5f3d] hover:underline cursor-pointer"
                  >
                    View Details &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Safe Antibiotic Guide */}
      {activeSubTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-sans font-bold text-lg text-[#2b2b2b]">Antibiotics Do NOT Treat Viral Invasions</h3>
            <p className="font-sans text-xs text-[#2b2b2b]/70 leading-relaxed font-light">
              Common colds, viral flu, runny noses, and most sore throats are caused by viruses. Taking antibiotics for viral illnesses does not help and only breeds resistant bacteria.
            </p>
          </div>

          <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-sans font-bold text-lg text-[#2b2b2b]">Never Share or Reuse Leftover Antibiotics</h3>
            <p className="font-sans text-xs text-[#2b2b2b]/70 leading-relaxed font-light">
              Every antibiotic targets specific bacterial species. Taking someone else&apos;s leftover prescription can cause toxic interactions, allergic shock, and ineffective treatment.
            </p>
          </div>

          <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-sans font-bold text-lg text-[#2b2b2b]">Watch Food, Milk & Antacid Combinations</h3>
            <p className="font-sans text-xs text-[#2b2b2b]/70 leading-relaxed font-light">
              Minerals like calcium (milk, yogurt), magnesium, and aluminum (antacid syrups) bind to antibiotics like ciprofloxacin and doxycycline, reducing their absorption by up to 90%.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
