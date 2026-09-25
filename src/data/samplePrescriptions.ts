import { PrescriptionData } from '../types';

export const SAMPLE_PRESCRIPTIONS: PrescriptionData[] = [
  {
    id: 'RX-HUMAN-001',
    patient: {
      type: 'human',
      species: 'Human',
      ageYears: 68,
      weightKg: 55,
      gender: 'Male',
      renalFunction: 'Moderate Impairment',
      hepaticFunction: 'Normal',
      diagnosis: 'Community Acquired Pneumonia & Severe Gastritis',
      clinicalContext: 'Outpatient presentation with fever, productive cough, and mild breathlessness. Serum creatinine 2.1 mg/dL (eGFR 32 mL/min/1.73m2).'
    },
    medications: [
      {
        id: 'M1',
        drugName: 'Levofloxacin',
        dosage: '750 mg',
        route: 'Oral',
        frequency: 'Once Daily (Q24H)',
        durationDays: 10
      },
      {
        id: 'M2',
        drugName: 'Aluminum hydroxide / Magnesium hydroxide (Antacid)',
        dosage: '15 mL',
        route: 'Oral',
        frequency: 'TDS (Three times daily after meals)',
        durationDays: 10
      }
    ],
    rawText: "Rx: Patient Male 68yo (55kg, CrCl ~32mL/min). Diagnosis: Community Acquired Pneumonia.\n1. Levofloxacin 750mg PO OD x 10 days\n2. Gelusil (Al/Mg Antacid) 15mL PO TDS x 10 days",
    prescriberRole: 'Primary Care Physician',
    facilityType: 'Outpatient Clinic',
    createdAt: '2026-08-05'
  },
  {
    id: 'RX-VET-BOVINE-002',
    patient: {
      type: 'veterinary',
      species: 'Bovine',
      ageYears: 2,
      weightKg: 450,
      gender: 'Female',
      renalFunction: 'Normal',
      hepaticFunction: 'Normal',
      diagnosis: 'Bovine Respiratory Disease (BRD) / Shipping Fever in Dairy Cow',
      clinicalContext: 'High fever 40.8C, nasal discharge, tachypnea in a commercial herd dairy cow.'
    },
    medications: [
      {
        id: 'M1',
        drugName: 'Colistin Sulfate',
        dosage: '500,000 IU/kg',
        route: 'Oral (In feed / water)',
        frequency: 'Daily',
        durationDays: 14
      },
      {
        id: 'M2',
        drugName: 'Oxytetracycline Injection',
        dosage: '20 mg/kg',
        route: 'Intramuscular',
        frequency: 'Single Dose',
        durationDays: 1
      }
    ],
    rawText: "Rx: Bovine (Dairy Cow 450kg, 2yo). Diagnosis: Bovine Respiratory Disease.\n1. Colistin Sulfate 500,000 IU/kg PO in water x 14 days for herd metaphylaxis.\n2. Oxytetracycline LA 20mg/kg IM Single Dose.",
    prescriberRole: 'Veterinary Practitioner',
    facilityType: 'Commercial Dairy Farm',
    createdAt: '2026-08-05'
  },
  {
    id: 'RX-HUMAN-PEDIATRIC-003',
    patient: {
      type: 'human',
      species: 'Human',
      ageYears: 4,
      weightKg: 16,
      gender: 'Female',
      renalFunction: 'Normal',
      hepaticFunction: 'Normal',
      diagnosis: 'Acute Otitis Media (AOM)',
      clinicalContext: 'Pediatric ear pain and fever 38.5C. No prior antibiotic exposure in past 30 days. No drug allergies.'
    },
    medications: [
      {
        id: 'M1',
        drugName: 'Amoxicillin Oral Suspension (250mg/5mL)',
        dosage: '90 mg/kg/day (720 mg BD)',
        route: 'Oral',
        frequency: 'Twice Daily (Q12H)',
        durationDays: 7
      }
    ],
    rawText: "Rx: Female child 4yo (16kg). Diagnosis: Acute Otitis Media.\n1. Amoxicillin suspension 90 mg/kg/day divided BID (720mg BD) PO x 7 days.",
    prescriberRole: 'Pediatrician',
    facilityType: 'Pediatric Clinic',
    createdAt: '2026-08-05'
  },
  {
    id: 'RX-HUMAN-RESERVE-004',
    patient: {
      type: 'human',
      species: 'Human',
      ageYears: 52,
      weightKg: 70,
      gender: 'Female',
      renalFunction: 'Severe Impairment / Dialysis',
      hepaticFunction: 'Normal',
      diagnosis: 'Hospital-Acquired Pneumonia (HAP) with MDR Pseudomonas suspicion',
      clinicalContext: 'ICU patient on mechanical ventilation. Serum creatinine 4.5 mg/dL. Empirical prescription before microbiological culture results.'
    },
    medications: [
      {
        id: 'M1',
        drugName: 'Ceftazidime-Avibactam',
        dosage: '2.5 g',
        route: 'Intravenous',
        frequency: 'Q8H (8 hourly)',
        durationDays: 14
      },
      {
        id: 'M2',
        drugName: 'Gentamicin',
        dosage: '240 mg',
        route: 'Intravenous',
        frequency: 'Q12H',
        durationDays: 10
      }
    ],
    rawText: "Rx: Female 52yo (70kg, ICU hemodialysis patient). Diagnosis: Hospital-Acquired Pneumonia.\n1. Ceftazidime-Avibactam 2.5g IV Q8H x 14 days\n2. Gentamicin 240mg IV Q12H x 10 days",
    prescriberRole: 'ICU Specialist',
    facilityType: 'Tertiary Care Hospital ICU',
    createdAt: '2026-08-05'
  },
  {
    id: 'RX-VET-CANINE-005',
    patient: {
      type: 'veterinary',
      species: 'Canine',
      ageYears: 5,
      weightKg: 22,
      gender: 'Male',
      renalFunction: 'Normal',
      hepaticFunction: 'Normal',
      diagnosis: 'Canine Pyoderma (Staphylococcal Skin Infection)',
      clinicalContext: 'Recurrent papules and crusts on abdomen. Prior cephalexin therapy 2 months ago.'
    },
    medications: [
      {
        id: 'M1',
        drugName: 'Enrofloxacin',
        dosage: '10 mg/kg/day (220 mg once daily)',
        route: 'Oral',
        frequency: 'Once Daily (Q24H)',
        durationDays: 21
      }
    ],
    rawText: "Rx: Dog (Golden Retriever 22kg, 5yo). Diagnosis: Recurrent Pyoderma.\n1. Enrofloxacin 220mg PO OD x 21 days.",
    prescriberRole: 'Small Animal Veterinarian',
    facilityType: 'Veterinary Hospital',
    createdAt: '2026-08-05'
  }
];
