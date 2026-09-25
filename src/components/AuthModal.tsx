import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from '../firebase';
import { UserProfile } from '../types';
import { X, Lock, Mail, User, Building, ShieldCheck, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Clinical Pharmacist');
  const [organization, setOrganization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (!displayName.trim()) {
          throw new Error('Please enter your full name or clinician title.');
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });

        const profile = await syncUserProfile(cred.user, {
          displayName,
          role,
          organization: organization || 'Healthcare / Veterinary Facility',
          licenseNumber: licenseNumber || 'SURV-REG-PENDING',
        });

        onAuthSuccess(profile);
        onClose();
      } else {
        // Sign In
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(cred.user);
        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let friendly = err.message || 'Authentication failed. Please verify credentials.';
      if (err.code === 'auth/email-already-in-use') {
        friendly = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        friendly = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        friendly = 'No account found with this email. Please create an account.';
      }
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
      const profile = await syncUserProfile(cred.user, {
        role: role || 'Clinical Pharmacist',
        organization: organization || 'Healthcare / Academic Center'
      });
      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMsg(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoClinician = async (demoRole: UserProfile['role']) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const demoEmail = `clinician.${demoRole.toLowerCase().replace(/[^a-z0-9]/g, '')}@stewardship.health`;
      const demoPass = 'Stewardship2026!';
      
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      } catch {
        cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        await updateProfile(cred.user, { displayName: `Dr. Sanjana (${demoRole})` });
      }

      const profile = await syncUserProfile(cred.user, {
        displayName: `Dr. Sanjana (${demoRole})`,
        role: demoRole,
        organization: 'WHO National Antimicrobial Surveillance Center',
        licenseNumber: 'AMU-VER-99824'
      });

      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Demo Login Error:', err);
      setErrorMsg(err.message || 'Could not launch demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#fffef2] border-3 border-[#2b2b2b] rounded-2xl w-full max-w-lg shadow-[12px_12px_0px_#2b2b2b] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b2b2b] text-white p-5 flex items-center justify-between border-b-2 border-[#2b2b2b]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#ff5f3d]" />
            <div>
              <h3 className="font-sans font-bold text-base leading-tight">
                {mode === 'signin' ? 'Clinician Authentication' : 'Create Practitioner Account'}
              </h3>
              <p className="font-mono text-[11px] text-white/70">
                AMU Surveillance & Drug Safety Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Sign In vs Register */}
        <div className="flex border-b-2 border-[#2b2b2b] bg-white font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'signin'
                ? 'bg-[#fffef2] text-[#ff5f3d] border-b-3 border-[#ff5f3d]'
                : 'text-[#2b2b2b]/60 hover:text-[#2b2b2b]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-[#fffef2] text-[#ff5f3d] border-b-3 border-[#ff5f3d]'
                : 'text-[#2b2b2b]/60 hover:text-[#2b2b2b]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-100 border-2 border-red-500 text-red-900 rounded-lg font-mono text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase text-[#2b2b2b] mb-1">
                    Full Name & Title *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Dr. Jane Doe, PharmD"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] font-bold uppercase text-[#2b2b2b] mb-1">
                      Professional Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                    >
                      <option value="Clinical Pharmacist">Clinical Pharmacist</option>
                      <option value="Infectious Disease Specialist">Infectious Disease Specialist</option>
                      <option value="Veterinarian">Veterinarian</option>
                      <option value="Hospital Epidemiologist">Hospital Epidemiologist</option>
                      <option value="Public Health Officer">Public Health Officer</option>
                      <option value="Physician / Medical Officer">Physician / Medical Officer</option>
                      <option value="Regulator">Health Authority / Regulator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] font-bold uppercase text-[#2b2b2b] mb-1">
                      Facility / Organization *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. General Hospital"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase text-[#2b2b2b] mb-1">
                    License / Prescriber ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. RPH-492048 or VET-9938"
                    className="w-full px-3 py-2 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#2b2b2b] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clinician@hospital.org"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#2b2b2b] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase text-[#2b2b2b] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs font-semibold focus:border-[#ff5f3d] outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] py-3 rounded-lg font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Credentials</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Start Surveillance</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-[2px] bg-[#2b2b2b]/20" />
            <span className="font-mono text-[10px] font-bold uppercase text-[#2b2b2b]/50">Or Continue With</span>
            <div className="flex-1 h-[2px] bg-[#2b2b2b]/20" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] py-2.5 rounded-lg font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-2"
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
            <span>Google Account</span>
          </button>

          {/* Quick Demo Pre-filled Logins for instantaneous testing */}
          <div className="bg-[#fffef2] p-3 rounded-xl border-2 border-[#2b2b2b]/40 space-y-2">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#2b2b2b]/70 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#ff5f3d]" />
              <span>Instant Test Clinician Profiles:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoClinician('Clinical Pharmacist')}
                className="text-left font-mono text-[10px] font-bold p-2 bg-white border border-[#2b2b2b] rounded-md hover:bg-orange-50 transition-colors cursor-pointer"
              >
                💊 Clinical Pharmacist
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoClinician('Veterinarian')}
                className="text-left font-mono text-[10px] font-bold p-2 bg-white border border-[#2b2b2b] rounded-md hover:bg-orange-50 transition-colors cursor-pointer"
              >
                🐾 Veterinarian
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
