import React, { useState } from 'react';
import { PrescriptionData, PrescriptionItem, PatientType, Species } from '../types';
import { SAMPLE_PRESCRIPTIONS } from '../data/samplePrescriptions';
import { Plus, Trash2, Sparkles, ArrowRight, Upload, FileText, RefreshCw, Wand2, Mic } from 'lucide-react';
import { MicrophoneDictation } from './MicrophoneDictation';
import { useLanguage } from '../i18n/LanguageContext';
import { parsePrescriptionTextHeuristic } from '../utils/clinicalParser';

interface PrescriptionInputProps {
  onAnalyze: (prescription: PrescriptionData) => void;
  isAnalyzing: boolean;
}

export const PrescriptionInput: React.FC<PrescriptionInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const { t } = useLanguage();
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(SAMPLE_PRESCRIPTIONS[0].id);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseStatusMsg, setParseStatusMsg] = useState<string | null>(null);
  const [isMicOpen, setIsMicOpen] = useState<boolean>(false);

  // Form State
  const [patientType, setPatientType] = useState<PatientType>('human');
  const [species, setSpecies] = useState<Species>('Human');
  const [ageYears, setAgeYears] = useState<number>(68);
  const [weightKg, setWeightKg] = useState<number>(55);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Unknown'>('Male');
  const [renalFunction, setRenalFunction] = useState<'Normal' | 'Mild Impairment' | 'Moderate Impairment' | 'Severe Impairment / Dialysis'>('Moderate Impairment');
  const [hepaticFunction, setHepaticFunction] = useState<'Normal' | 'Impaired'>('Normal');
  const [pregnancyOrLactation, setPregnancyOrLactation] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<string>('Community Acquired Pneumonia');
  const [clinicalContext, setClinicalContext] = useState<string>('Outpatient presentation with fever, productive cough, and mild breathlessness. Serum creatinine 2.1 mg/dL.');
  
  const [medications, setMedications] = useState<PrescriptionItem[]>([
    {
      id: 'm1',
      drugName: 'Levofloxacin',
      dosage: '750mg',
      route: 'Oral',
      frequency: 'Once Daily (Q24H)',
      durationDays: 10
    },
    {
      id: 'm2',
      drugName: 'Al/Mg Hydrox (Gelusil Antacid)',
      dosage: '15mL',
      route: 'Oral',
      frequency: 'TDS',
      durationDays: 10
    }
  ]);

  const [rawText, setRawText] = useState<string>("Rx: Patient Male 68yo (55kg, CrCl ~32mL/min). Diagnosis: Community Acquired Pneumonia.\n1. Levofloxacin 750mg PO OD x 10 days\n2. Gelusil (Al/Mg Antacid) 15mL PO TDS x 10 days");

  // Clear Form for Blank Custom Input
  const handleClearForm = () => {
    setSelectedPresetId(null);
    setPatientType('human');
    setSpecies('Human');
    setAgeYears(45);
    setWeightKg(70);
    setGender('Male');
    setRenalFunction('Normal');
    setHepaticFunction('Normal');
    setPregnancyOrLactation(false);
    setDiagnosis('');
    setClinicalContext('');
    setMedications([
      {
        id: `m-${Date.now()}`,
        drugName: '',
        dosage: '',
        route: 'Oral',
        frequency: 'Once Daily (Q24H)',
        durationDays: 7
      }
    ]);
    setRawText('');
    setParseStatusMsg('Form cleared. Enter your custom prescription details above.');
    setTimeout(() => setParseStatusMsg(null), 4000);
  };

  // Load Preset Case Study
  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESCRIPTIONS.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(preset.id);
    setPatientType(preset.patient.type);
    setSpecies(preset.patient.species);
    setAgeYears(preset.patient.ageYears ?? 30);
    setWeightKg(preset.patient.weightKg ?? 70);
    setGender(preset.patient.gender ?? 'Male');
    setRenalFunction(preset.patient.renalFunction ?? 'Normal');
    setHepaticFunction(preset.patient.hepaticFunction ?? 'Normal');
    setPregnancyOrLactation(!!preset.patient.pregnancyOrLactation);
    setDiagnosis(preset.patient.diagnosis);
    setClinicalContext(preset.patient.clinicalContext ?? '');
    setMedications([...preset.medications]);
    setRawText(preset.rawText ?? '');
    setParseStatusMsg(`Loaded case study: ${preset.id}`);
    setTimeout(() => setParseStatusMsg(null), 3000);
  };

  // Handle Prescription File Upload (Txt, Json, Csv, PDF text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setSelectedPresetId(null);
        setParseStatusMsg(`File "${file.name}" loaded! Extracting prescription variables...`);
        await parseAndAutofill(content);
      }
    };
    reader.readAsText(file);
  };

  // Parse raw text and auto-fill form (with seamless client fallback)
  const parseAndAutofill = async (textToParse: string) => {
    if (!textToParse || textToParse.trim().length === 0) {
      setParseStatusMsg("Please enter or upload raw prescription text first.");
      setTimeout(() => setParseStatusMsg(null), 4000);
      return;
    }

    setIsParsing(true);
    let parsedData: any = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/parse-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToParse }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.parsed) {
          parsedData = data.parsed;
        }
      }
    } catch {
      // Backend fetch failed, timed out, or offline - silently proceed to client-side parser
    }

    // Reliable client-side clinical parser fallback
    if (!parsedData) {
      parsedData = parsePrescriptionTextHeuristic(textToParse);
    }

    if (parsedData) {
      const { patient, medications: parsedMeds } = parsedData;

      if (patient) {
        if (patient.type) setPatientType(patient.type as PatientType);
        if (patient.species) setSpecies(patient.species as Species);
        if (patient.ageYears !== undefined) setAgeYears(patient.ageYears);
        if (patient.weightKg !== undefined) setWeightKg(patient.weightKg);
        if (patient.gender) setGender(patient.gender);
        if (patient.renalFunction) setRenalFunction(patient.renalFunction);
        if (patient.diagnosis) setDiagnosis(patient.diagnosis);
        if (patient.clinicalContext) setClinicalContext(patient.clinicalContext);
      }

      if (parsedMeds && Array.isArray(parsedMeds) && parsedMeds.length > 0) {
        setMedications(
          parsedMeds.map((m: any, i: number) => ({
            id: `m-parsed-${Date.now()}-${i}`,
            drugName: m.drugName || 'Antimicrobial Agent',
            dosage: m.dosage || '500mg',
            route: m.route || 'Oral',
            frequency: m.frequency || 'Once Daily (Q24H)',
            durationDays: m.durationDays || 7,
          }))
        );
      }

      setSelectedPresetId(null);
      setParseStatusMsg("✨ Prescription fields automatically extracted and populated!");
    } else {
      setParseStatusMsg("Notice: Populated raw text. Verify medication manifest below.");
    }

    setIsParsing(false);
    setTimeout(() => setParseStatusMsg(null), 5000);
  };

  // Handle Spoken Dictation Complete
  const handleDictationComplete = async (transcriptText: string) => {
    setRawText(transcriptText);
    setSelectedPresetId(null);
    setParseStatusMsg('🎙️ Spoken prescription captured! Extracting clinical variables...');
    await parseAndAutofill(transcriptText);
  };

  const handleAddDrug = () => {
    setMedications([
      ...medications,
      {
        id: `m-${Date.now()}`,
        drugName: '',
        dosage: '',
        route: 'Oral',
        frequency: 'Once Daily (Q24H)',
        durationDays: 7
      }
    ]);
  };

  const handleRemoveDrug = (id: string) => {
    if (medications.length <= 1) return;
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleDrugChange = (id: string, field: keyof PrescriptionItem, value: any) => {
    setMedications(
      medications.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rxData: PrescriptionData = {
      id: `RX-CUSTOM-${Date.now()}`,
      patient: {
        type: patientType,
        species,
        ageYears,
        weightKg,
        gender,
        renalFunction,
        hepaticFunction,
        pregnancyOrLactation,
        diagnosis,
        clinicalContext
      },
      medications,
      rawText,
      createdAt: new Date().toISOString()
    };

    onAnalyze(rxData);
  };

  return (
    <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-10 shadow-[12px_12px_0px_#2b2b2b] space-y-8">
      {/* Header & Quick Actions */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#2b2b2b] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs uppercase font-bold bg-[#2b2b2b] text-white px-3 py-1 rounded-full">
                SURVEILLANCE FORM
              </span>
              {selectedPresetId ? (
                <span className="font-mono text-[10px] font-bold bg-[#fffef2] text-[#2b2b2b] border border-[#2b2b2b] px-2.5 py-0.5 rounded-full">
                  PRESET CASE
                </span>
              ) : (
                <span className="font-mono text-[10px] font-bold bg-[#ff5f3d] text-white px-2.5 py-0.5 rounded-full">
                  TRUE USER DATA
                </span>
              )}
            </div>
            <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2b2b2b] leading-tight">
              {t('input.title', 'Prescription Entry')}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#2b2b2b]/70 font-normal mt-1">
              {t('input.subtitle', 'Enter your own patient data, upload prescription notes, or test sample cases.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearForm}
              className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] px-3.5 py-2 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5"
              title="Clear form and enter custom data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Blank Form / Custom Entry</span>
            </button>
          </div>
        </div>

        {/* Case Study Presets */}
        <div className="flex flex-wrap items-center gap-2 bg-[#fffef2] p-3 rounded-xl border-2 border-[#2b2b2b]">
          <span className="font-mono text-xs font-bold text-[#2b2b2b] uppercase mr-1">
            {t('input.samplePrescriptions', 'Case Studies')}:
          </span>
          {SAMPLE_PRESCRIPTIONS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset.id)}
              className={`font-sans font-bold text-xs px-3 py-1 rounded-full border-2 border-[#2b2b2b] cursor-pointer transition-all ${
                selectedPresetId === preset.id
                  ? 'bg-[#2b2b2b] text-white shadow-[2px_2px_0px_#ff5f3d]'
                  : 'bg-white text-[#2b2b2b] hover:bg-gray-50'
              }`}
            >
              {preset.medications[0]?.drugName.split(' ')[0] || preset.id}
            </button>
          ))}
        </div>

        {/* Notification Banner */}
        {parseStatusMsg && (
          <div className="p-3 bg-[#2b2b2b] text-white font-mono text-xs font-bold rounded-lg border-2 border-[#2b2b2b] flex items-center gap-2 shadow-[3px_3px_0px_#ff5f3d]">
            <Wand2 className="w-4 h-4 text-[#ff5f3d] shrink-0" />
            <span>{parseStatusMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Domain & Demographics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1.5">
              {t('input.patientType', 'Domain / Species Type')}
            </label>
            <select
              value={patientType}
              onChange={(e) => {
                const val = e.target.value as PatientType;
                setPatientType(val);
                setSpecies(val === 'veterinary' ? 'Bovine' : 'Human');
                setSelectedPresetId(null);
              }}
              className="w-full bg-white border-2 border-[#2b2b2b] text-[#2b2b2b] rounded-lg p-2.5 font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
            >
              <option value="human">{t('input.human', 'Human Medicine')}</option>
              <option value="veterinary">{t('input.veterinary', 'Veterinary Medicine')}</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1.5">
              {t('input.species', 'Species')}
            </label>
            <select
              value={species}
              onChange={(e) => {
                setSpecies(e.target.value as Species);
                setSelectedPresetId(null);
              }}
              className="w-full bg-white border-2 border-[#2b2b2b] text-[#2b2b2b] rounded-lg p-2.5 font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
            >
              {patientType === 'human' ? (
                <option value="Human">Human</option>
              ) : (
                <>
                  <option value="Bovine">Bovine (Cattle)</option>
                  <option value="Swine">Swine (Pigs)</option>
                  <option value="Poultry">Poultry (Flock)</option>
                  <option value="Canine">Canine (Dog)</option>
                  <option value="Feline">Feline (Cat)</option>
                  <option value="Equine">Equine (Horse)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1.5">
              Age (Years) & Weight (Kg)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={ageYears}
                onChange={(e) => {
                  setAgeYears(+e.target.value);
                  setSelectedPresetId(null);
                }}
                placeholder="Age"
                className="w-1/2 bg-white border-2 border-[#2b2b2b] text-[#2b2b2b] rounded-lg p-2.5 font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                min={0}
              />
              <input
                type="number"
                value={weightKg}
                onChange={(e) => {
                  setWeightKg(+e.target.value);
                  setSelectedPresetId(null);
                }}
                placeholder="Weight"
                className="w-1/2 bg-white border-2 border-[#2b2b2b] text-[#2b2b2b] rounded-lg p-2.5 font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                min={0.1}
                step={0.1}
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1.5">
              Renal Clearance
            </label>
            <select
              value={renalFunction}
              onChange={(e) => {
                setRenalFunction(e.target.value as any);
                setSelectedPresetId(null);
              }}
              className="w-full bg-white border-2 border-[#2b2b2b] text-[#2b2b2b] rounded-lg p-2.5 font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
            >
              <option value="Normal">Normal Clearance</option>
              <option value="Mild Impairment">Mild (eGFR 60-89)</option>
              <option value="Moderate Impairment">Mod. (eGFR 30-59)</option>
              <option value="Severe Impairment / Dialysis">Severe (eGFR &lt; 30)</option>
            </select>
          </div>
        </div>

        {/* Diagnosis Row */}
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1.5">
            Diagnosis & Clinical Indication
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => {
              setDiagnosis(e.target.value);
              setSelectedPresetId(null);
            }}
            className="w-full bg-white border-2 border-[#2b2b2b] text-[#2b2b2b] rounded-lg p-2.5 font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
            placeholder="Diagnosis (e.g. Community Acquired Pneumonia)"
            required
          />
        </div>

        {/* Medication Manifest Table */}
        <div className="border-t-2 border-dashed border-[#2b2b2b] pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2b2b2b]">
              MEDICATION MANIFEST ({medications.length})
            </span>
            <button
              type="button"
              onClick={handleAddDrug}
              className="font-mono text-xs font-bold text-[#ff5f3d] hover:underline bg-none border-none cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ADD ANOTHER DRUG</span>
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#fffef2] p-3 rounded-xl border-2 border-[#2b2b2b] items-center"
              >
                <div className="sm:col-span-4">
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#2b2b2b] mb-1">
                    Drug Name #{index + 1}
                  </label>
                  <input
                    type="text"
                    value={item.drugName}
                    onChange={(e) => {
                      handleDrugChange(item.id, 'drugName', e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-white border-2 border-[#2b2b2b]/30 focus:border-[#ff5f3d] rounded p-2 font-sans text-xs font-semibold outline-none"
                    placeholder="e.g. Amoxicillin, Ciprofloxacin"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#2b2b2b] mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) => {
                      handleDrugChange(item.id, 'dosage', e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-white border-2 border-[#2b2b2b]/30 focus:border-[#ff5f3d] rounded p-2 font-sans text-xs font-semibold outline-none"
                    placeholder="e.g. 500mg"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#2b2b2b] mb-1">
                    Route
                  </label>
                  <select
                    value={item.route}
                    onChange={(e) => {
                      handleDrugChange(item.id, 'route', e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-white border-2 border-[#2b2b2b]/30 focus:border-[#ff5f3d] rounded p-2 font-sans text-xs font-semibold outline-none"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Intravenous">IV</option>
                    <option value="Intramuscular">IM</option>
                    <option value="Subcutaneous">SubQ</option>
                    <option value="In Feed / Water">Feed/Water</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#2b2b2b] mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={item.frequency}
                    onChange={(e) => {
                      handleDrugChange(item.id, 'frequency', e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-white border-2 border-[#2b2b2b]/30 focus:border-[#ff5f3d] rounded p-2 font-sans text-xs font-semibold outline-none"
                    placeholder="Q24H / OD / BD"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block font-mono text-[9px] uppercase font-bold text-[#2b2b2b] mb-1">
                    Days
                  </label>
                  <input
                    type="number"
                    value={item.durationDays}
                    onChange={(e) => {
                      handleDrugChange(item.id, 'durationDays', +e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-white border-2 border-[#2b2b2b]/30 focus:border-[#ff5f3d] rounded p-2 font-sans text-xs font-semibold outline-none"
                    min={1}
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveDrug(item.id)}
                    disabled={medications.length <= 1}
                    className="p-1.5 text-[#2b2b2b]/60 hover:text-[#ff5f3d] disabled:opacity-20 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Prescription File / Text Box with AI Extract */}
        <div className="space-y-3 border-t-2 border-dashed border-[#2b2b2b] pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b]">
              Upload Source Document or Paste Unstructured Rx Text
            </label>
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsMicOpen(true)}
                className="font-mono text-xs font-bold uppercase bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] px-3 py-1 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5 hover:bg-orange-50"
                title="Dictate prescription using microphone"
              >
                <Mic className="w-3.5 h-3.5 text-[#ff5f3d]" />
                <span>Dictate (Voice)</span>
              </button>

              <label className="font-mono text-xs font-bold uppercase bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] px-3 py-1 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#ff5f3d]" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".txt,.json,.csv,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => parseAndAutofill(rawText)}
                disabled={isParsing || !rawText.trim()}
                className="font-mono text-xs font-bold uppercase bg-[#2b2b2b] text-white px-3 py-1 rounded-lg shadow-[2px_2px_0px_#ff5f3d] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                {isParsing ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5 text-[#ff5f3d]" />
                )}
                <span>AI Auto-Extract</span>
              </button>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setSelectedPresetId(null);
            }}
            placeholder="Paste clinical note, handwritten OCR scan text, or doctor's prescription note here..."
            rows={3}
            className="w-full bg-[#fffef2] border-2 border-[#2b2b2b] text-[#2b2b2b] rounded-lg p-3 font-mono text-xs focus:border-[#ff5f3d] outline-none"
          />
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isAnalyzing}
          className="w-full bg-[#ff5f3d] text-white border-3 border-[#2b2b2b] p-5 font-bold uppercase font-mono text-sm tracking-wide cursor-pointer shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#2b2b2b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#2b2b2b] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('input.analyzing', 'Analyzing Custom Data with 4-Stage Engine...')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>{t('input.analyzeButton', 'Run 4-Stage Antimicrobial Surveillance Audit')}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Voice Dictation Modal */}
      <MicrophoneDictation
        isOpen={isMicOpen}
        onClose={() => setIsMicOpen(false)}
        onDictationComplete={handleDictationComplete}
      />
    </div>
  );
};

