import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from '../firebase';
import { UserProfile } from '../types';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  LogIn,
  UserPlus,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  Stethoscope,
  Microscope,
  Award,
  Globe2,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onEnterAsGuest: () => void;
  initialAccountType?: 'doctor' | 'patient';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onEnterAsGuest,
  initialAccountType = 'doctor'
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [accountTypeSelection, setAccountTypeSelection] = useState<'doctor' | 'patient'>(initialAccountType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Physician / Medical Officer');
  const [organization, setOrganization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>(28);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other' | 'Unknown'>('Female');
  const [patientAllergies, setPatientAllergies] = useState<string>('Penicillins (rash)');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    // Client-side standard email validation to prevent Firebase auth/invalid-email errors
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address (e.g. practitioner@hospital.org or patient@gmail.com).');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (cleanPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (cleanPassword !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (!displayName.trim()) {
          throw new Error('Please enter your full name.');
        }

        const effectiveRole = accountTypeSelection === 'patient' ? 'Patient / Individual' : role;
        const effectiveOrg = accountTypeSelection === 'patient'
          ? (organization.trim() || 'Personal Health Portal')
          : (organization.trim() || 'Healthcare / Veterinary Surveillance Network');

        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        await updateProfile(cred.user, { displayName: displayName.trim() });

        const profile = await syncUserProfile(cred.user, {
          displayName: displayName.trim(),
          role: effectiveRole,
          accountType: accountTypeSelection,
          entityType: accountTypeSelection,
          organization: effectiveOrg,
          licenseNumber: accountTypeSelection === 'doctor' ? (licenseNumber.trim() || 'SURV-REG-ACTIVE') : undefined,
          ageYears: accountTypeSelection === 'patient' && patientAge ? Number(patientAge) : undefined,
          gender: accountTypeSelection === 'patient' ? patientGender : undefined,
          allergies: accountTypeSelection === 'patient' ? patientAllergies : undefined,
        });

        onLoginSuccess(profile);
      } else {
        // Sign In
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const profile = await syncUserProfile(cred.user);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email/Password provider is not enabled in Firebase Console. Authenticating via local session...');
        const effectiveRole = accountTypeSelection === 'patient' ? 'Patient / Individual' : role;
        const effectiveOrg = accountTypeSelection === 'patient'
          ? (organization.trim() || 'Personal Health Portal')
          : (organization.trim() || 'Healthcare / Veterinary Surveillance Network');
        const fallbackName = displayName.trim() || cleanEmail.split('@')[0] || (accountTypeSelection === 'patient' ? 'Patient' : 'Dr. Practitioner');

        const localProfile: UserProfile = {
          uid: `local-${accountTypeSelection}-${Date.now()}`,
          email: cleanEmail,
          displayName: fallbackName,
          role: effectiveRole,
          accountType: accountTypeSelection,
          entityType: accountTypeSelection,
          organization: effectiveOrg,
          licenseNumber: accountTypeSelection === 'doctor' ? (licenseNumber.trim() || 'SURV-REG-ACTIVE') : undefined,
          ageYears: accountTypeSelection === 'patient' && patientAge ? Number(patientAge) : undefined,
          gender: accountTypeSelection === 'patient' ? patientGender : undefined,
          allergies: accountTypeSelection === 'patient' ? patientAllergies : undefined,
          createdAt: new Date().toISOString()
        };

        onLoginSuccess(localProfile);
        return;
      }

      let friendly = 'Authentication failed. Please verify credentials.';
      if (err.code === 'auth/invalid-email') {
        friendly = 'The email address is improperly formatted. Please enter a valid email address (e.g. name@domain.com).';
      } else if (err.code === 'auth/email-already-in-use') {
        friendly = 'This email is already registered. Please switch to Sign In.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        friendly = 'Invalid email or password. Please verify your credentials or register a new account.';
      } else if (err.code === 'auth/user-not-found') {
        friendly = 'No clinician account found with this email. Please create a new account.';
      } else if (err.message) {
        friendly = err.message;
      }

      console.warn('Authentication notice:', err.code || err.message);
      setErrorMsg(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const effectiveRole = accountTypeSelection === 'patient' ? 'Patient / Individual' : (role || 'Physician / Medical Officer');
      const profile = await syncUserProfile(cred.user, {
        role: effectiveRole,
        accountType: accountTypeSelection,
        entityType: accountTypeSelection,
        organization: organization || (accountTypeSelection === 'patient' ? 'Personal Health Portal' : 'Academic Health System'),
      });
      onLoginSuccess(profile);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        console.warn('Google Provider not enabled in Firebase Console. Authenticating via local session...');
        const profile: UserProfile = {
          uid: `local-google-${Date.now()}`,
          email: 'user.google@stewardship.health',
          displayName: accountTypeSelection === 'patient' ? 'Sanjana (Patient)' : 'Dr. Sanjana, MD',
          role: accountTypeSelection === 'patient' ? 'Patient / Individual' : 'Physician / Medical Officer',
          accountType: accountTypeSelection,
          entityType: accountTypeSelection,
          organization: accountTypeSelection === 'patient' ? 'Personal Health Portal' : 'Academic Health System',
          createdAt: new Date().toISOString()
        };
        onLoginSuccess(profile);
        return;
      }
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google Sign In Error:', err);
        setErrorMsg(err.message || 'Google authentication could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (accountType: 'doctor' | 'patient', demoRole: UserProfile['role'] = 'Physician / Medical Officer') => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const isPatient = accountType === 'patient';
      const demoEmail = isPatient
        ? 'patient.sanjana@stewardship.health'
        : 'dr.sanjana.md@stewardship.health';
      const demoPass = 'Stewardship2026!';
      const display = isPatient ? 'Sanjana (Patient)' : 'Dr. Sanjana, MD (Lead Physician)';
      const org = isPatient ? 'City Primary Care Clinic' : 'National Antimicrobial Stewardship Command';
      const lic = isPatient ? undefined : 'MD-REG-847291';
      const effectiveRole: UserProfile['role'] = isPatient ? 'Patient / Individual' : demoRole;

      let profile: UserProfile | null = null;
      try {
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        } catch (innerErr: any) {
          if (innerErr.code === 'auth/operation-not-allowed') {
            throw innerErr;
          }
          cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          await updateProfile(cred.user, { displayName: display });
        }

        profile = await syncUserProfile(cred.user, {
          displayName: display,
          role: effectiveRole,
          accountType,
          entityType: accountType,
          organization: org,
          licenseNumber: lic,
          ageYears: isPatient ? 28 : undefined,
          gender: isPatient ? 'Female' : undefined,
          allergies: isPatient ? 'Penicillins (rash)' : undefined
        });
      } catch (authError: any) {
        console.warn('Firebase email auth not available, falling back to seamless demo profile:', authError);
        // Seamless instant demo profile
        profile = {
          uid: `demo-${accountType}-${Date.now()}`,
          email: demoEmail,
          displayName: display,
          role: effectiveRole,
          accountType,
          entityType: accountType,
          organization: org,
          licenseNumber: lic,
          ageYears: isPatient ? 28 : undefined,
          gender: isPatient ? 'Female' : undefined,
          allergies: isPatient ? 'Penicillins (rash)' : undefined,
          createdAt: new Date().toISOString()
        };
      }

      if (profile) {
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error('Demo Login Error:', err);
      setErrorMsg(err.message || 'Could not launch instant demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffef2] text-[#2b2b2b] flex flex-col justify-between font-sans antialiased selection:bg-[#ff5f3d] selection:text-white">
      {/* Top Banner Header */}
      <header className="border-b-3 border-[#2b2b2b] px-6 sm:px-12 py-5 bg-[#fffef2] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-gaegu text-4xl sm:text-5xl text-[#2b2b2b] leading-none tracking-wide select-none">
            stewardship.ai
          </span>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase font-bold bg-[#ff5f3d] text-white px-2.5 py-0.5 rounded-full border border-[#2b2b2b]">
            Secure Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEnterAsGuest}
            className="font-mono text-xs font-bold uppercase text-[#2b2b2b] bg-white border-2 border-[#2b2b2b] px-4 py-2 rounded-xl shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-2 hover:bg-orange-50"
          >
            <span>Skip to Demo Console</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#ff5f3d]" />
          </button>
        </div>
      </header>

      {/* Main Split Portal Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 lg:py-12 space-y-8">
        
        {/* TOP DUAL LOGIN GATEWAY SELECTOR */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#2b2b2b]/60">
              Select Your Designated Access Gateway:
            </span>
          </div>
          <div className="bg-white border-3 border-[#2b2b2b] p-2 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Door 1: Doctor Login Portal */}
            <button
              type="button"
              onClick={() => {
                setAccountTypeSelection('doctor');
                setErrorMsg(null);
              }}
              className={`py-3.5 px-5 rounded-xl font-mono text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-3 ${
                accountTypeSelection === 'doctor'
                  ? 'bg-[#2b2b2b] text-white border-[#2b2b2b] shadow-[3px_3px_0px_#ff5f3d]'
                  : 'bg-[#fffef2] text-[#2b2b2b] border-[#2b2b2b]/30 hover:bg-orange-50 hover:border-[#ff5f3d]'
              }`}
            >
              <Stethoscope className={`w-5 h-5 shrink-0 ${accountTypeSelection === 'doctor' ? 'text-[#ff5f3d]' : 'text-[#2b2b2b]/60'}`} />
              <div className="text-left">
                <div className="leading-tight flex items-center gap-1.5">
                  <span>🩺 1. DOCTOR LOGIN</span>
                  {accountTypeSelection === 'doctor' && (
                    <span className="bg-[#ff5f3d] text-white text-[9px] px-1.5 py-0.2 rounded font-mono">ACTIVE</span>
                  )}
                </div>
                <div className="text-[10px] opacity-75 font-normal">Surveillance & PK/PD Dosing (/doctors)</div>
              </div>
            </button>

            {/* Door 2: Patient Login Portal */}
            <button
              type="button"
              onClick={() => {
                setAccountTypeSelection('patient');
                setErrorMsg(null);
              }}
              className={`py-3.5 px-5 rounded-xl font-mono text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-3 ${
                accountTypeSelection === 'patient'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-[3px_3px_0px_#10b981]'
                  : 'bg-[#fffef2] text-[#2b2b2b] border-[#2b2b2b]/30 hover:bg-emerald-50 hover:border-emerald-600'
              }`}
            >
              <User className={`w-5 h-5 shrink-0 ${accountTypeSelection === 'patient' ? 'text-emerald-300' : 'text-[#2b2b2b]/60'}`} />
              <div className="text-left">
                <div className="leading-tight flex items-center gap-1.5">
                  <span>👤 2. PATIENT LOGIN</span>
                  {accountTypeSelection === 'patient' && (
                    <span className="bg-emerald-400 text-emerald-950 text-[9px] px-1.5 py-0.2 rounded font-mono">ACTIVE</span>
                  )}
                </div>
                <div className="text-[10px] opacity-75 font-normal">Personal Health & Medicine Safety (/patients)</div>
              </div>
            </button>
          </div>
        </div>

        {/* Portal Body: Dynamic based on Doctor vs Patient */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Side: Dynamic Narrative for the Selected Gateway */}
          <div className="lg:col-span-6 space-y-6">
            {accountTypeSelection === 'doctor' ? (
              <>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-[#2b2b2b] text-white px-3.5 py-1 rounded-full font-mono text-xs font-bold uppercase">
                    <Stethoscope className="w-4 h-4 text-[#ff5f3d]" />
                    <span>Doctor & Clinician Gateway (/doctors)</span>
                  </div>

                  <h1 className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-[#2b2b2b] tracking-tight leading-[1.1]">
                    Clinical AMU Surveillance & Dosing Engine.
                  </h1>

                  <p className="font-sans text-sm sm:text-base font-light text-[#2b2b2b]/70 leading-relaxed">
                    Designed for Physicians, Clinical Pharmacists, Infectious Disease Specialists, and Veterinarians to verify weight/renal dosages, audit WHO AWaRe groups, and prevent superbug resistance.
                  </p>
                </div>

                {/* Instant 1-Click Doctor Login Card */}
                <div className="bg-[#fffef2] border-3 border-[#2b2b2b] p-5 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-[#2b2b2b] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#ff5f3d]" />
                      <span>Instant 1-Click Doctor Access:</span>
                    </span>
                    <span className="font-mono text-[10px] bg-[#ff5f3d] text-white px-2 py-0.5 rounded-full font-bold">
                      Verified Clinician
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('doctor', 'Physician / Medical Officer')}
                    disabled={isLoading}
                    className="w-full text-left font-mono text-xs font-bold p-4 bg-white border-2 border-[#2b2b2b] rounded-xl hover:bg-orange-50 hover:border-[#ff5f3d] transition-all cursor-pointer flex flex-col justify-between group shadow-[3px_3px_0px_#2b2b2b]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        <span>Doctor Account Profile</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#ff5f3d] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-[#2b2b2b] group-hover:text-[#ff5f3d] font-bold text-base">
                      Dr. Sanjana, MD (Lead Physician)
                    </div>
                    <div className="text-[11px] text-[#2b2b2b]/70 font-sans font-medium mt-1 leading-snug">
                      National Antimicrobial Stewardship Command &bull; License: MD-REG-847291 &bull; Direct access to full surveillance pipeline
                    </div>
                  </button>
                </div>

                {/* 4 Multi-Agent Clinical Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-[#ff5f3d] flex items-center gap-1.5">
                      <Microscope className="w-3.5 h-3.5" />
                      <span>Phase 1: AMU Detection</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      WHO AWaRe 2026 classification & animal health tier mapping.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-[#ff5f3d] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Phase 2: PK/PD Dosage</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      Weight-adjusted mg/kg verification & renal CrCl clearance calculation.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-[#ff5f3d] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Phase 3: AMR Pressure</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      Drug-drug interaction matrix & collateral AMR selection pressure score.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-[#ff5f3d] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Phase 4: Regulatory Alert</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      WHO Reserve authorization protocols, FDA alerts, and veterinary bans.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-emerald-800 text-white px-3.5 py-1 rounded-full font-mono text-xs font-bold uppercase">
                    <User className="w-4 h-4 text-emerald-300" />
                    <span>Patient & Individual Gateway (/patients)</span>
                  </div>

                  <h1 className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-[#2b2b2b] tracking-tight leading-[1.1]">
                    Your Personal Antibiotic Safety & Timings.
                  </h1>

                  <p className="font-sans text-sm sm:text-base font-light text-[#2b2b2b]/70 leading-relaxed">
                    Clear, easy-to-understand antibiotic information designed for patients. Know when to take your medicines, avoid harmful food/vitamin interactions, and protect your health against superbugs.
                  </p>
                </div>

                {/* Instant 1-Click Patient Login Card */}
                <div className="bg-[#fffef2] border-3 border-[#2b2b2b] p-5 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-[#2b2b2b] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Instant 1-Click Patient Access:</span>
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                      Personal Health Portal
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('patient', 'Patient / Individual')}
                    disabled={isLoading}
                    className="w-full text-left font-mono text-xs font-bold p-4 bg-white border-2 border-[#2b2b2b] rounded-xl hover:bg-emerald-50 hover:border-emerald-600 transition-all cursor-pointer flex flex-col justify-between group shadow-[3px_3px_0px_#2b2b2b]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Patient Account Profile</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-[#2b2b2b] group-hover:text-emerald-700 font-bold text-base">
                      Sanjana (Patient)
                    </div>
                    <div className="text-[11px] text-[#2b2b2b]/70 font-sans font-medium mt-1 leading-snug">
                      City Primary Care Clinic &bull; Age 28 &bull; Allergy: Penicillins (mild rash) &bull; Direct access to plain-English instructions
                    </div>
                  </button>
                </div>

                {/* 4 Patient Wellness Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Plain-English Meaning</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      Understand why this antibiotic was prescribed and what infection it targets.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>When to Take It</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      Daily dosing times, spacing between doses, and taking with meals or water.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-red-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Food & Antacid Alerts</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      Critical warnings on dairy, calcium, and antacid syrups that block medicine absorption.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Superbug Prevention</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#2b2b2b]/80">
                      Why finishing all days of your prescription stops bacteria from becoming resistant.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side: High-Impact Auth Card with Dedicated Mode */}
          <div className="lg:col-span-6">
            <div className="bg-white border-3 border-[#2b2b2b] rounded-3xl shadow-[12px_12px_0px_#2b2b2b] overflow-hidden flex flex-col">
              
              {/* Card Header Bar */}
              <div className={`p-6 flex items-center justify-between border-b-3 border-[#2b2b2b] ${
                accountTypeSelection === 'doctor' ? 'bg-[#2b2b2b] text-white' : 'bg-emerald-900 text-white'
              }`}>
                <div>
                  <span className={`font-mono text-[10px] uppercase font-bold tracking-wider block mb-0.5 ${
                    accountTypeSelection === 'doctor' ? 'text-[#ff5f3d]' : 'text-emerald-300'
                  }`}>
                    {accountTypeSelection === 'doctor' ? '🩺 Clinician Doorway' : '👤 Patient Doorway'}
                  </span>
                  <h2 className="font-sans font-bold text-xl sm:text-2xl text-white">
                    {mode === 'signin' 
                      ? (accountTypeSelection === 'doctor' ? 'Sign In as Doctor' : 'Sign In as Patient')
                      : (accountTypeSelection === 'doctor' ? 'Register Doctor Account' : 'Register Patient Account')}
                  </h2>
                  <div className="font-mono text-[11px] opacity-80 mt-0.5">
                    {accountTypeSelection === 'doctor' ? 'Entity: /doctors/{doctorId}' : 'Entity: /patients/{patientId}'}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  {accountTypeSelection === 'doctor' 
                    ? <Stethoscope className="w-6 h-6 text-[#ff5f3d]" />
                    : <User className="w-6 h-6 text-emerald-300" />}
                </div>
              </div>

              {/* Mode Switch Tabs (Sign In vs Register) */}
              <div className="flex border-b-2 border-[#2b2b2b] bg-[#fffef2] font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(null); }}
                  className={`flex-1 py-3.5 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'signin'
                      ? (accountTypeSelection === 'doctor' 
                          ? 'bg-white text-[#ff5f3d] border-b-3 border-[#ff5f3d]' 
                          : 'bg-white text-emerald-700 border-b-3 border-emerald-700')
                      : 'text-[#2b2b2b]/60 hover:text-[#2b2b2b]'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(null); }}
                  className={`flex-1 py-3.5 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'register'
                      ? (accountTypeSelection === 'doctor' 
                          ? 'bg-white text-[#ff5f3d] border-b-3 border-[#ff5f3d]' 
                          : 'bg-white text-emerald-700 border-b-3 border-emerald-700')
                      : 'text-[#2b2b2b]/60 hover:text-[#2b2b2b]'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Form Container */}
              <div className="p-6 sm:p-8 space-y-5">
                {errorMsg && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 text-red-900 rounded-xl font-mono text-xs font-semibold leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                          {accountTypeSelection === 'doctor' ? 'Full Name & Degree / Title *' : 'Full Name *'}
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3.5" />
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder={accountTypeSelection === 'doctor' ? 'e.g. Dr. Sanjana, MD, BCPS' : 'e.g. Sanjana'}
                            required
                            className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none shadow-xs"
                          />
                        </div>
                      </div>

                      {accountTypeSelection === 'doctor' ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                                Clinical Specialty *
                              </label>
                              <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full px-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none shadow-xs"
                              >
                                <option value="Physician / Medical Officer">Physician / Medical Officer</option>
                                <option value="Clinical Pharmacist">Clinical Pharmacist</option>
                                <option value="Infectious Disease Specialist">Infectious Disease Specialist</option>
                                <option value="Veterinarian">Veterinarian</option>
                                <option value="Hospital Epidemiologist">Hospital Epidemiologist</option>
                                <option value="Public Health Officer">Public Health Officer</option>
                                <option value="Regulator">Health Authority / Regulator</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                                Hospital / Facility *
                              </label>
                              <div className="relative">
                                <Building className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3.5" />
                                <input
                                  type="text"
                                  value={organization}
                                  onChange={(e) => setOrganization(e.target.value)}
                                  placeholder="e.g. Memorial General Hospital"
                                  required
                                  className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none shadow-xs"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                              Prescriber License ID (Optional)
                            </label>
                            <input
                              type="text"
                              value={licenseNumber}
                              onChange={(e) => setLicenseNumber(e.target.value)}
                              placeholder="e.g. MD-847291 or RPH-492048"
                              className="w-full px-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none shadow-xs"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                                Age (Years)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="125"
                                value={patientAge}
                                onChange={(e) => setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                placeholder="e.g. 28"
                                className="w-full px-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-emerald-600 outline-none shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                                Gender
                              </label>
                              <select
                                value={patientGender}
                                onChange={(e) => setPatientGender(e.target.value as any)}
                                className="w-full px-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-emerald-600 outline-none shadow-xs"
                              >
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                                <option value="Unknown">Prefer not to say</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                              Primary Care Clinic / City (Optional)
                            </label>
                            <div className="relative">
                              <Building className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3.5" />
                              <input
                                type="text"
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                placeholder="e.g. City Health Clinic"
                                className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-emerald-600 outline-none shadow-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                              Known Antibiotic Allergies (Optional)
                            </label>
                            <input
                              type="text"
                              value={patientAllergies}
                              onChange={(e) => setPatientAllergies(e.target.value)}
                              placeholder="e.g. Penicillin, Sulfa, None"
                              className="w-full px-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-emerald-600 outline-none shadow-xs"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={accountTypeSelection === 'doctor' ? 'doctor@hospital.org' : 'patient@gmail.com'}
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full pl-9 pr-10 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#2b2b2b]/50 hover:text-[#2b2b2b] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="block font-mono text-[11px] font-bold uppercase text-[#2b2b2b] mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#2b2b2b] rounded-xl font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none shadow-xs"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full text-white border-2 border-[#2b2b2b] py-3.5 rounded-xl font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2 ${
                      accountTypeSelection === 'doctor'
                        ? 'bg-[#ff5f3d] hover:bg-[#e04f2e]'
                        : 'bg-emerald-700 hover:bg-emerald-800'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : mode === 'signin' ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Authenticate & Enter {accountTypeSelection === 'doctor' ? 'Doctor Console' : 'Patient Portal'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create {accountTypeSelection === 'doctor' ? 'Doctor Account' : 'Patient Account'} & Enter</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Gateway Switch Prompt */}
                <div className="pt-2 pb-1 border-t border-[#2b2b2b]/15 text-center">
                  {accountTypeSelection === 'doctor' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountTypeSelection('patient');
                        setErrorMsg(null);
                      }}
                      className="font-mono text-xs font-bold text-emerald-800 hover:underline cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Are you a patient? Switch to Patient Login Gateway &rarr;</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountTypeSelection('doctor');
                        setErrorMsg(null);
                      }}
                      className="font-mono text-xs font-bold text-[#ff5f3d] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Are you a clinician? Switch to Doctor Login Gateway &rarr;</span>
                    </button>
                  )}
                </div>

                {/* Or Google Auth */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-[2px] bg-[#2b2b2b]/20" />
                  <span className="font-mono text-[10px] font-bold uppercase text-[#2b2b2b]/50">Or Workspace Login</span>
                  <div className="flex-1 h-[2px] bg-[#2b2b2b]/20" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] py-2.5 rounded-xl font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-2 hover:bg-orange-50/50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={onEnterAsGuest}
                    className="font-mono text-xs font-bold text-[#ff5f3d] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Skip to Demo Console &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-[#2b2b2b] bg-[#fffef2] px-6 sm:px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-xs font-bold text-[#2b2b2b]">
        <div>WHO AWaRe 2026 // PROTOCOL</div>
        <div className="font-gaegu text-xl text-[#ff5f3d]">Explainable AI Audit Trail Enabled</div>
        <div>ST_SURVEILLANCE_PORTAL_v1.0</div>
      </footer>
    </div>
  );
};
