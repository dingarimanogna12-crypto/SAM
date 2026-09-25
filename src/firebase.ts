import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  onSnapshot,
  deleteDoc,
  orderBy,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, DoctorProfile, PatientProfile, FullAnalysisResult } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test Connection constraint
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// ENTITY 1: Doctor Profile Entity Sync
// ==========================================
export async function syncDoctorEntity(user: User, data?: Partial<DoctorProfile>): Promise<DoctorProfile> {
  const docRef = doc(db, 'doctors', user.uid);
  const path = `doctors/${user.uid}`;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const existing = snap.data() as DoctorProfile;
      const updated: DoctorProfile = {
        ...existing,
        ...data,
        uid: user.uid,
        email: user.email || existing.email,
        displayName: data?.displayName || user.displayName || existing.displayName,
        entityType: 'doctor',
      };
      await setDoc(docRef, updated, { merge: true });
      return updated;
    } else {
      const newDoctor: DoctorProfile = {
        uid: user.uid,
        email: user.email,
        displayName: data?.displayName || user.displayName || user.email?.split('@')[0] || 'Dr. Practitioner',
        entityType: 'doctor',
        role: data?.role || 'Physician / Medical Officer',
        organization: data?.organization || 'Hospital Surveillance Network',
        licenseNumber: data?.licenseNumber || 'MD-REG-ACTIVE',
        department: data?.department,
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, newDoctor);
      return newDoctor;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// ENTITY 2: Patient Profile Entity Sync
// ==========================================
export async function syncPatientEntity(user: User, data?: Partial<PatientProfile>): Promise<PatientProfile> {
  const docRef = doc(db, 'patients', user.uid);
  const path = `patients/${user.uid}`;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const existing = snap.data() as PatientProfile;
      const updated: PatientProfile = {
        ...existing,
        ...data,
        uid: user.uid,
        email: user.email || existing.email,
        displayName: data?.displayName || user.displayName || existing.displayName,
        entityType: 'patient',
      };
      await setDoc(docRef, updated, { merge: true });
      return updated;
    } else {
      const newPatient: PatientProfile = {
        uid: user.uid,
        email: user.email,
        displayName: data?.displayName || user.displayName || user.email?.split('@')[0] || 'Patient',
        entityType: 'patient',
        role: 'Patient / Individual',
        organization: data?.organization || 'Personal Health Portal',
        ageYears: data?.ageYears,
        gender: data?.gender || 'Unknown',
        allergies: data?.allergies || 'None recorded',
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, newPatient);
      return newPatient;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// User Profile helpers (Handles both Doctor & Patient entities)
export async function syncUserProfile(user: User, customFields?: Partial<UserProfile>): Promise<UserProfile> {
  const isPatient = customFields?.entityType === 'patient' || customFields?.accountType === 'patient' || customFields?.role === 'Patient / Individual';
  const entityType: 'doctor' | 'patient' = isPatient ? 'patient' : 'doctor';

  // 1. Sync to the respective entity collection (/doctors or /patients)
  try {
    if (entityType === 'doctor') {
      await syncDoctorEntity(user, {
        displayName: customFields?.displayName || user.displayName,
        role: (customFields?.role as DoctorProfile['role']) || 'Physician / Medical Officer',
        organization: customFields?.organization || 'Hospital Surveillance Network',
        licenseNumber: customFields?.licenseNumber || 'SURV-REG-ACTIVE',
      });
    } else {
      await syncPatientEntity(user, {
        displayName: customFields?.displayName || user.displayName,
        organization: customFields?.organization || 'Personal Health Portal',
        ageYears: customFields?.ageYears,
        gender: customFields?.gender,
        allergies: customFields?.allergies,
      });
    }
  } catch (entityErr) {
    console.warn(`Could not sync to ${entityType} entity collection:`, entityErr);
  }

  // 2. Sync to unified /users collection for backward compatibility
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (customFields && Object.keys(customFields).length > 0) {
        const updated: UserProfile = {
          ...data,
          ...customFields,
          uid: user.uid,
          email: user.email || data.email,
          displayName: customFields.displayName || user.displayName || data.displayName,
          entityType,
          accountType: entityType,
        };
        await setDoc(userRef, updated, { merge: true });
        return updated;
      }
      return { ...data, entityType: data.entityType || entityType, accountType: data.accountType || entityType };
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: customFields?.displayName || user.displayName || user.email?.split('@')[0] || (isPatient ? 'Patient' : 'Clinician'),
        role: customFields?.role || (isPatient ? 'Patient / Individual' : 'Physician / Medical Officer'),
        organization: customFields?.organization || (isPatient ? 'Personal Health Portal' : 'Hospital Surveillance Network'),
        licenseNumber: customFields?.licenseNumber || (isPatient ? undefined : 'SURV-REG-ACTIVE'),
        entityType,
        accountType: entityType,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUserPrescription(userId: string, result: FullAnalysisResult, entityType: 'doctor' | 'patient' = 'doctor'): Promise<void> {
  const path = `users/${userId}/prescriptions/${result.id}`;
  try {
    const payload = {
      id: result.id,
      userId,
      timestamp: result.timestamp || new Date().toISOString(),
      diagnosis: result.prescription.patient.diagnosis || 'Unspecified Indication',
      species: result.prescription.patient.species || 'Human',
      patientType: result.prescription.patient.type || 'human',
      overallStatus: result.overallStatus || 'INFO',
      rawText: (result.prescription.rawText || '').slice(0, 4900),
      analysisData: JSON.stringify(result),
    };

    // Save to unified user path
    const recordRef = doc(db, 'users', userId, 'prescriptions', result.id);
    await setDoc(recordRef, payload);

    // Also persist in the entity subcollection (/doctors/... or /patients/...)
    try {
      const entityCol = entityType === 'doctor' ? 'doctors' : 'patients';
      const entityRecordRef = doc(db, entityCol, userId, 'prescriptions', result.id);
      await setDoc(entityRecordRef, payload);
    } catch (e) {
      console.warn("Could not mirror prescription into entity subcollection:", e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToUserPrescriptions(
  userId: string,
  onData: (results: FullAnalysisResult[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/prescriptions`;
  const q = query(collection(db, 'users', userId, 'prescriptions'));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: FullAnalysisResult[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        if (item.analysisData) {
          try {
            records.push(JSON.parse(item.analysisData));
          } catch (e) {
            console.error("Failed to parse analysis JSON:", e);
          }
        }
      });
      // Sort newest first
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(records);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteUserPrescription(userId: string, prescriptionId: string): Promise<void> {
  const path = `users/${userId}/prescriptions/${prescriptionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'prescriptions', prescriptionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getAllRegisteredUsers(): Promise<UserProfile[]> {
  const path = 'users';

  // Guard: If no authenticated Firebase session exists, return local cache instead of making an unauthorized query
  if (!auth.currentUser) {
    try {
      const cached = localStorage.getItem('amu_active_user_profile');
      if (cached) {
        return [JSON.parse(cached)];
      }
    } catch {
      // ignore
    }
    return [];
  }

  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserProfile;
      list.push(data);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
