import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { PromptInspector } from './components/PromptInspector';
import { PrescriptionInput } from './components/PrescriptionInput';
import { AnalysisPipeline } from './components/AnalysisPipeline';
import { AnalysisResultsView } from './components/AnalysisResultsView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuditLogView } from './components/AuditLogView';
import { AdminUsersModal } from './components/AdminUsersModal';
import { PatientPortalView } from './components/PatientPortalView';
import { PrescriptionData, FullAnalysisResult, UserProfile } from './types';
import { SAMPLE_PRESCRIPTIONS } from './data/samplePrescriptions';
import { auth, syncUserProfile, saveUserPrescription, subscribeToUserPrescriptions } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ArrowRight, Sparkles, Terminal, ShieldCheck, UserCheck, CloudCheck, LogIn, KeyRound } from 'lucide-react';
import { generateDeterministicRuleEngineAnalysis } from './utils/clinicalRuleEngine';

export default function App() {
  // Navigation View: Separate Login Page vs Main App/Website
  const [currentView, setCurrentView] = useState<'login' | 'app'>('login');
  const [loginDoorway, setLoginDoorway] = useState<'doctor' | 'patient'>('doctor');
  const [viewMode, setViewMode] = useState<'doctor' | 'patient'>('doctor');
  const [activeTab, setActiveTab] = useState<'analyzer' | 'prompts' | 'library' | 'dashboard' | 'audit'>('analyzer');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentPipelineStage, setCurrentPipelineStage] = useState<number>(0);
  const [currentResult, setCurrentResult] = useState<FullAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [history, setHistory] = useState<FullAnalysisResult[]>([]);
  const [isAdminUsersModalOpen, setIsAdminUsersModalOpen] = useState<boolean>(false);
  
  // Authentication State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Monitor Firebase Auth State
  useEffect(() => {
    // Restore cached session if present
    try {
      const cached = localStorage.getItem('amu_active_user_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        setUserProfile(parsed);
        if (parsed?.accountType === 'patient' || parsed?.role === 'Patient / Individual') {
          setViewMode('patient');
        } else {
          setViewMode('doctor');
        }
      }
    } catch (e) {
      console.error("Failed to load cached user profile:", e);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
          if (profile.accountType === 'patient' || profile.role === 'Patient / Individual') {
            setViewMode('patient');
          } else {
            setViewMode('doctor');
          }
          localStorage.setItem('amu_active_user_profile', JSON.stringify(profile));
          setCurrentView('app');
        } catch (err) {
          console.error("Failed to sync profile:", err);
          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Clinician',
            role: 'Clinical Pharmacist',
            organization: 'Healthcare Surveillance Network',
          };
          setUserProfile(fallbackProfile);
          localStorage.setItem('amu_active_user_profile', JSON.stringify(fallbackProfile));
          setCurrentView('app');
        }
      } else {
        // If there's an active demo or local profile (starts with 'demo-' or 'local-'), preserve it
        try {
          const cached = localStorage.getItem('amu_active_user_profile');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.uid?.startsWith('demo-') || parsed?.uid?.startsWith('local-')) {
              setUserProfile(parsed);
              if (parsed?.accountType === 'patient' || parsed?.role === 'Patient / Individual') {
                setViewMode('patient');
              } else {
                setViewMode('doctor');
              }
              setAuthInitialized(true);
              return;
            }
          }
        } catch {}
        setUserProfile(null);
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Sync prescriptions from Firestore when user is logged in
  useEffect(() => {
    // If not authenticated with real Firebase Auth (e.g. demo account, local session, or guest), use localStorage
    if (!userProfile || !auth.currentUser || userProfile.uid.startsWith('demo-') || userProfile.uid.startsWith('local-')) {
      try {
        const saved = localStorage.getItem('amu_analysis_history');
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load history from localStorage:", e);
      }
      return;
    }

    // Authenticated Firestore listener for real accounts
    const unsubscribe = subscribeToUserPrescriptions(
      userProfile.uid,
      (cloudRecords) => {
        if (cloudRecords && cloudRecords.length > 0) {
          setHistory(cloudRecords);
        } else {
          // If Firestore is empty for new user, check local storage to migrate
          try {
            const saved = localStorage.getItem('amu_analysis_history');
            if (saved) {
              const localList: FullAnalysisResult[] = JSON.parse(saved);
              setHistory(localList);
              // Migrate local items to cloud
              localList.forEach((item) => {
                saveUserPrescription(userProfile.uid, item).catch(console.error);
              });
            }
          } catch (e) {
            console.error("Local history check:", e);
          }
        }
      },
      (err) => {
        console.warn("Firestore subscription error (fallback to local):", err);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  const saveHistory = async (newHistory: FullAnalysisResult[], newlyAddedItem?: FullAnalysisResult) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('amu_analysis_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }

    // Only sync to Firestore if user has a real authenticated Firebase UID
    if (userProfile && auth.currentUser && !userProfile.uid.startsWith('demo-') && !userProfile.uid.startsWith('local-') && newlyAddedItem) {
      try {
        const entityType = (userProfile.entityType === 'patient' || userProfile.accountType === 'patient') ? 'patient' : 'doctor';
        await saveUserPrescription(userProfile.uid, newlyAddedItem, entityType);
      } catch (e) {
        console.error("Failed to sync prescription to Firestore:", e);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUserProfile(null);
      localStorage.removeItem('amu_active_user_profile');
      setCurrentView('login');
    }
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    if (profile.accountType === 'patient' || profile.role === 'Patient / Individual') {
      setViewMode('patient');
    } else {
      setViewMode('doctor');
    }
    try {
      localStorage.setItem('amu_active_user_profile', JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save user profile:", e);
    }
    setCurrentView('app');
  };

  const handleEnterAsGuest = () => {
    setCurrentView('app');
  };

  const handleAnalyzePrescription = async (rxData: PrescriptionData) => {
    setIsAnalyzing(true);
    setCurrentPipelineStage(1);
    setCurrentResult(null);
    setAnalysisError(null);

    // Attach prescriber identity if logged in
    if (userProfile) {
      rxData.prescriberRole = userProfile.role;
      rxData.facilityType = userProfile.organization;
    }

    // Stage progression visualization
    const timer1 = setTimeout(() => setCurrentPipelineStage(2), 600);
    const timer2 = setTimeout(() => setCurrentPipelineStage(3), 1200);
    const timer3 = setTimeout(() => setCurrentPipelineStage(4), 1800);

    try {
      const response = await fetch('/api/analyze-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rxData),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result: FullAnalysisResult = await response.json();
      
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setCurrentPipelineStage(5);
      setIsAnalyzing(false);
      setCurrentResult(result);
      setAnalysisError(null);

      const updatedHistory = [result, ...history];
      await saveHistory(updatedHistory, result);
    } catch (error: any) {
      console.error("Analysis execution error:", error);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsAnalyzing(false);
      setCurrentPipelineStage(0);
      setAnalysisError(error?.message || "Analysis failed. Please check network or try again.");
    }
  };

  const handleSelectHistoryItem = (res: FullAnalysisResult) => {
    setCurrentResult(res);
    setActiveTab('analyzer');
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear the audit log history?")) {
      saveHistory([]);
    }
  };

  // View 1: Separate Dedicated Login Page
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onEnterAsGuest={handleEnterAsGuest}
        initialAccountType={loginDoorway}
      />
    );
  }

  // View 2: Main Application / Website
  return (
    <div className="min-h-screen bg-[#fffef2] text-[#2b2b2b] font-sans antialiased selection:bg-[#ff5f3d] selection:text-white flex flex-col justify-between">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          analysisCount={history.length}
          userProfile={userProfile}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(prev => prev === 'doctor' ? 'patient' : 'doctor')}
          onOpenAuth={() => setCurrentView('login')}
          onSignOut={handleSignOut}
          onGoToLoginPage={() => setCurrentView('login')}
          onGoToDoctorLogin={() => {
            setLoginDoorway('doctor');
            setCurrentView('login');
          }}
          onGoToPatientLogin={() => {
            setLoginDoorway('patient');
            setCurrentView('login');
          }}
          onOpenAdminUsers={() => setIsAdminUsersModalOpen(true)}
        />

        <main className="pb-16 max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
          {viewMode === 'patient' ? (
            <PatientPortalView
              userProfile={userProfile || {
                uid: 'guest-patient',
                displayName: 'Sanjana',
                email: 'patient@health.org',
                role: 'Patient / Individual',
                organization: 'Personal Health Portal',
                accountType: 'patient'
              }}
              history={history}
              onAnalyze={handleAnalyzePrescription}
              isAnalyzing={isAnalyzing}
              currentPipelineStage={currentPipelineStage}
              currentResult={currentResult}
              onSwitchToDoctorView={() => setViewMode('doctor')}
            />
          ) : (
            <>
              {/* Tab 1: 4-Stage Analyzer */}
              {activeTab === 'analyzer' && (
                <div className="space-y-10">
                  {/* Hero Split Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
                    <div className="lg:col-span-5 space-y-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold uppercase bg-[#2b2b2b] text-white px-3.5 py-1 rounded-full inline-block">
                          Surveillance Phase
                        </span>
                        {userProfile ? (
                          <span className="font-mono text-xs font-bold text-green-800 bg-green-100 border border-green-400 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-green-600" />
                            <span>{userProfile.displayName} ({userProfile.role})</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCurrentView('login')}
                            className="font-mono text-xs font-bold text-[#ff5f3d] bg-orange-100/70 hover:bg-orange-100 border border-[#ff5f3d]/40 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-[#ff5f3d]" />
                            <span>Sign In to Cloud Account</span>
                          </button>
                        )}
                      </div>

                      <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl text-[#2b2b2b] tracking-tight leading-none">
                        Safe drug use, powered by AI.
                      </h1>
                      <p className="font-sans text-sm sm:text-base font-light text-[#2b2b2b]/70 leading-relaxed max-w-lg">
                        Evaluates prescriptions across 4 sequential phases: (1) AMU Detection & WHO AWaRe Mapping, (2) Pharmacokinetic Dosage Integrity, (3) Drug Safety & AMR Pressure Score, and (4) Regulatory Alerting.
                      </p>

                      {userProfile && (
                        <div className="p-3 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[3px_3px_0px_#2b2b2b] font-mono text-xs space-y-1">
                          <div className="flex items-center gap-2 font-bold text-[#2b2b2b]">
                            <ShieldCheck className="w-4 h-4 text-[#ff5f3d]" />
                            <span>Authenticated Practitioner Stamp:</span>
                          </div>
                          <div className="text-[11px] text-[#2b2b2b]/80 pl-6">
                            {userProfile.organization} &bull; {userProfile.role}
                            {userProfile.licenseNumber && ` &bull; Lic: ${userProfile.licenseNumber}`}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => setActiveTab('prompts')}
                          className="font-mono text-xs font-bold bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] px-4 py-2.5 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-2"
                        >
                          <Terminal className="w-4 h-4 text-[#ff5f3d]" />
                          <span>PROMPT_LIBRARY_v4</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('library')}
                          className="font-mono text-xs font-bold text-[#ff5f3d] hover:underline bg-none border-none cursor-pointer flex items-center gap-1"
                        >
                          <span>Explore Presets &rarr;</span>
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7">
                      {/* Input Form Card with Voice Dictation */}
                      <PrescriptionInput onAnalyze={handleAnalyzePrescription} isAnalyzing={isAnalyzing} />
                    </div>
                  </div>

                  {/* Analysis Error Notification */}
                  {analysisError && (
                    <div className="p-4 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 font-mono text-xs flex items-center justify-between shadow-[4px_4px_0px_#2b2b2b]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded text-[10px]">Error</span>
                        <span>{analysisError}</span>
                      </div>
                      <button
                        onClick={() => setAnalysisError(null)}
                        className="text-red-700 hover:text-red-900 font-bold ml-4 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Pipeline Visualizer during execution */}
                  {(isAnalyzing || currentPipelineStage > 0) && (
                    <AnalysisPipeline currentStage={currentPipelineStage} isAnalyzing={isAnalyzing} />
                  )}

                  {/* Analysis Results View */}
                  {currentResult && (
                    <div className="pt-4">
                      <AnalysisResultsView result={currentResult} userProfile={userProfile} />
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: 4-Stage AI Studio Prompts */}
              {activeTab === 'prompts' && <PromptInspector />}

              {/* Tab 3: Sample Prescription Library */}
              {activeTab === 'library' && (
                <div className="space-y-8">
                  <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b]">
                    <span className="font-mono text-xs font-bold uppercase bg-[#2b2b2b] text-white px-3 py-1 rounded-full inline-block mb-2">
                      CLINICAL DATASET
                    </span>
                    <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2b2b2b]">Prescription Test Library</h2>
                    <p className="font-sans text-xs sm:text-sm text-[#2b2b2b]/70 mt-1">
                      Preset human and veterinary cases with known clinical interactions, dosage violations, or regulatory alerts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SAMPLE_PRESCRIPTIONS.map((preset) => (
                      <div key={preset.id} className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 bg-[#2b2b2b] text-white rounded-full">
                              {preset.patient.type === 'veterinary' ? '🐾 VETERINARY' : '👤 HUMAN'}
                            </span>
                            <span className="font-mono text-xs text-[#2b2b2b]/60 font-bold">{preset.id}</span>
                          </div>

                          <h3 className="font-sans font-bold text-lg text-[#2b2b2b]">{preset.patient.species} — {preset.patient.diagnosis}</h3>
                          <p className="font-mono text-xs text-[#2b2b2b] bg-[#fffef2] p-3 rounded-lg border-2 border-[#2b2b2b]/30 leading-relaxed">
                            {preset.rawText}
                          </p>

                          <div className="space-y-1">
                            <span className="font-mono text-[10px] font-bold text-[#2b2b2b]/60 uppercase block">Prescribed Drugs:</span>
                            <div className="flex wrap gap-1.5">
                              {preset.medications.map((m) => (
                                <span key={m.id} className="font-sans font-semibold text-xs px-2.5 py-1 bg-[#fffef2] border border-[#2b2b2b] rounded">
                                  {m.drugName} ({m.dosage})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t-2 border-[#2b2b2b]/20 flex justify-end">
                          <button
                            onClick={() => {
                              setActiveTab('analyzer');
                              handleAnalyzePrescription(preset);
                            }}
                            className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] px-4 py-2 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-2"
                          >
                            <span>Analyze Case</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: AMU Analytics Dashboard */}
              {activeTab === 'dashboard' && <AnalyticsDashboard history={history} />}

              {/* Tab 5: Audit Log */}
              {activeTab === 'audit' && (
                <AuditLogView
                  history={history}
                  onSelectResult={handleSelectHistoryItem}
                  onClearHistory={handleClearHistory}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Creator & Admin Account Registry Modal */}
      <AdminUsersModal
        isOpen={isAdminUsersModalOpen}
        onClose={() => setIsAdminUsersModalOpen(false)}
        currentUserEmail={userProfile?.email}
      />

      {/* Footer */}
      <footer className="border-t-3 border-[#2b2b2b] bg-[#fffef2] px-6 sm:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-xs font-bold text-[#2b2b2b]">
        <div>WHO AWaRe 2026 // PROTOCOL</div>
        <div className="font-gaegu text-xl text-[#ff5f3d]">Explainable AI Audit Trail Enabled</div>
        <div>VER: ST_v1.0.4</div>
      </footer>
    </div>
  );
}
