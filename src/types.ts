export type PatientType = 'human' | 'veterinary';
export type Species = 'Human' | 'Bovine' | 'Swine' | 'Poultry' | 'Canine' | 'Feline' | 'Equine';
export type WHOAWaReGroup = 'ACCESS' | 'WATCH' | 'RESERVE' | 'NOT_CLASSIFIED';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'COMPLIANT';

export type UserAccountType = 'doctor' | 'patient';

// ==========================================
// ENTITY 1: Doctor Profile (/doctors/{doctorId})
// ==========================================
export interface DoctorProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  entityType: 'doctor';
  role: 'Clinical Pharmacist' | 'Infectious Disease Specialist' | 'Veterinarian' | 'Hospital Epidemiologist' | 'Public Health Officer' | 'Physician / Medical Officer' | 'Regulator';
  organization: string;
  licenseNumber: string;
  department?: string;
  createdAt?: string;
}

// ==========================================
// ENTITY 2: Patient Profile (/patients/{patientId})
// ==========================================
export interface PatientProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  entityType: 'patient';
  role: 'Patient / Individual' | 'Pet Owner';
  organization: string; // Primary clinic or city
  ageYears?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Unknown';
  allergies?: string;
  createdAt?: string;
}

export type AppUserEntity = DoctorProfile | PatientProfile;

// Unified UserProfile interface for backward compatibility
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  accountType?: UserAccountType;
  entityType?: 'doctor' | 'patient';
  role: 'Clinical Pharmacist' | 'Infectious Disease Specialist' | 'Veterinarian' | 'Hospital Epidemiologist' | 'Public Health Officer' | 'Physician / Medical Officer' | 'Regulator' | 'Patient / Individual' | 'Pet Owner';
  organization: string;
  licenseNumber?: string;
  ageYears?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Unknown';
  allergies?: string;
  createdAt?: string;
}

export interface PatientInfo {
  type: PatientType;
  species: Species;
  ageYears?: number;
  weightKg?: number;
  gender?: 'Male' | 'Female' | 'Unknown';
  renalFunction?: 'Normal' | 'Mild Impairment' | 'Moderate Impairment' | 'Severe Impairment / Dialysis';
  hepaticFunction?: 'Normal' | 'Impaired';
  pregnancyOrLactation?: boolean;
  diagnosis: string;
  clinicalContext?: string;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  route: string;
  frequency: string;
  durationDays: number;
}

export interface PrescriptionData {
  id: string;
  patient: PatientInfo;
  medications: PrescriptionItem[];
  rawText?: string;
  prescriberRole?: string;
  facilityType?: string;
  createdAt?: string;
}

// Stage 1: Extracted Drug & AMU Categorization
export interface Stage1Antimicrobial {
  drugName: string;
  isAntimicrobial: boolean;
  antimicrobialClass: string;
  atcCode?: string;
  whoAWaReGroup: WHOAWaReGroup;
  spectrum: 'Broad Spectrum' | 'Narrow Spectrum' | 'Antifungal' | 'Antiviral' | 'Antiprotozoal';
  mechanismOfAction: string;
  criticalityWOAH?: 'Important' | 'Highly Important' | 'Critically Important';
}

export interface Stage1Output {
  prescriptionSummary: string;
  antimicrobialsFound: Stage1Antimicrobial[];
  nonAntimicrobialDrugs: string[];
  detectedIndicationMatch: boolean;
  explanation: string;
}

// Stage 2: Dosage & Pharmacokinetic Precision
export interface DosageCheckResult {
  drugName: string;
  prescribedDosePerDayMg: number;
  recommendedDoseRangePerDayMg: { min: number; max: number };
  prescribedMgPerKg?: number;
  recommendedMgPerKgRange?: { min: number; max: number };
  status: 'OPTIMAL' | 'UNDERDOSED' | 'OVERDOSED' | 'CONTRAINDICATED_DOSE';
  frequencyAppropriate: boolean;
  durationAppropriate: boolean;
  recommendedDurationDays: { min: number; max: number };
  renalAdjustmentNeeded: boolean;
  adjustedRecommendation?: string;
  confidenceScore: number; // 0 to 100
}

export interface Stage2Output {
  overallDosageStatus: 'COMPLIANT' | 'DOSAGE_WARNING' | 'CRITICAL_OVERDOSE' | 'INSUFFICIENT_DOSE';
  dosageChecks: DosageCheckResult[];
  explanation: string;
}

// Stage 3: Drug Safety, Interaction & AMR Risk Matrix
export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  mechanism: string;
  clinicalEffect: string;
  management: string;
}

export interface SafetyRisk {
  type: 'CONTRAINDICATION' | 'BLACK_BOX_WARNING' | 'ALLERGY_RISK' | 'TOXICITY' | 'SPECIES_SAFETY';
  drugName: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface Stage3Output {
  safetyRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  interactions: DrugInteraction[];
  safetyRisks: SafetyRisk[];
  amrPressureScore: number; // 1 to 10 scale (1 = minimal AMR pressure, 10 = extreme resistance selection pressure)
  amrRationale: string;
  explanation: string;
}

// Stage 4: Regulatory Alerting & Explainable AI Audit Trail
export interface RegulatoryAlert {
  id: string;
  alertType: 'AWARE_VIOLATION' | 'UNAUTHORIZED_SPECIES_USE' | 'BAN_RESTRICTION' | 'CRITICAL_SAFETY' | 'MANDATORY_REPORT';
  authority: 'WHO' | 'FDA' | 'EMA' | 'WOAH' | 'NATIONAL_HEALTH';
  severity: AlertSeverity;
  title: string;
  details: string;
  recommendedAction: string;
}

export interface ClinicalGuidelineCitation {
  source: string;
  title: string;
  versionOrYear: string;
  relevance: string;
}

export interface Stage4Output {
  regulatoryComplianceStatus: 'COMPLIANT' | 'ACTION_REQUIRED' | 'NON_COMPLIANT';
  regulatoryAlerts: RegulatoryAlert[];
  whoAWaReComplianceScore: number; // 0 to 100
  explainableSummary: string;
  auditTrail: {
    stage1Confidence: number;
    stage2Confidence: number;
    stage3Confidence: number;
    stage4Confidence: number;
    overallConfidence: number;
    reasoningChain: string[];
    guidelineCitations: ClinicalGuidelineCitation[];
  };
}

// Full 4-Stage Analysis Result
export interface FullAnalysisResult {
  id: string;
  timestamp: string;
  prescription: PrescriptionData;
  stage1: Stage1Output;
  stage2: Stage2Output;
  stage3: Stage3Output;
  stage4: Stage4Output;
  overallStatus: AlertSeverity;
}

export interface PromptStage {
  stageNumber: 1 | 2 | 3 | 4;
  title: string;
  shortDescription: string;
  roleDefinition: string;
  inputVariables: string[];
  systemInstructions: string;
  outputFormatJSONSchema: string;
  expectedOutputExample: string;
}
