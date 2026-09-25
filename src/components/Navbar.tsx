import React, { useState } from 'react';
import { Activity, Terminal, FileSpreadsheet, BarChart3, ClipboardList, User, LogIn, LogOut, ShieldCheck, ChevronDown, UserCheck, RefreshCw, Users, Stethoscope } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  activeTab: 'analyzer' | 'prompts' | 'library' | 'dashboard' | 'audit';
  setActiveTab: (tab: 'analyzer' | 'prompts' | 'library' | 'dashboard' | 'audit') => void;
  analysisCount: number;
  userProfile: UserProfile | null;
  viewMode?: 'doctor' | 'patient';
  onToggleViewMode?: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onGoToLoginPage: () => void;
  onGoToDoctorLogin?: () => void;
  onGoToPatientLogin?: () => void;
  onOpenAdminUsers: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  analysisCount,
  userProfile,
  viewMode = 'doctor',
  onToggleViewMode,
  onOpenAuth,
  onSignOut,
  onGoToLoginPage,
  onGoToDoctorLogin,
  onGoToPatientLogin,
  onOpenAdminUsers
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="bg-[#fffef2] border-b-3 border-[#2b2b2b] px-4 sm:px-12 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('analyzer')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="font-gaegu text-3xl sm:text-4xl text-[#2b2b2b] leading-none tracking-wide select-none group-hover:text-[#ff5f3d] transition-colors">
            stewardship.ai
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase font-bold bg-[#2b2b2b] text-white px-2.5 py-0.5 rounded-full">
            4-Stage AI Engine
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`font-sans font-bold text-xs sm:text-sm text-[#2b2b2b] bg-none border-none cursor-pointer relative py-1 transition-all ${
              activeTab === 'analyzer' ? 'text-[#ff5f3d]' : 'hover:text-[#ff5f3d]'
            }`}
          >
            {t('nav.analyzer', 'Analyzer')}
            {activeTab === 'analyzer' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ff5f3d]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`font-sans font-bold text-xs sm:text-sm text-[#2b2b2b] bg-none border-none cursor-pointer relative py-1 transition-all ${
              activeTab === 'prompts' ? 'text-[#ff5f3d]' : 'hover:text-[#ff5f3d]'
            }`}
          >
            {t('nav.prompts', 'Prompts')}
            {activeTab === 'prompts' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ff5f3d]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`font-sans font-bold text-xs sm:text-sm text-[#2b2b2b] bg-none border-none cursor-pointer relative py-1 transition-all ${
              activeTab === 'library' ? 'text-[#ff5f3d]' : 'hover:text-[#ff5f3d]'
            }`}
          >
            {t('nav.library', 'Library')}
            {activeTab === 'library' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ff5f3d]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`font-sans font-bold text-xs sm:text-sm text-[#2b2b2b] bg-none border-none cursor-pointer relative py-1 transition-all ${
              activeTab === 'dashboard' ? 'text-[#ff5f3d]' : 'hover:text-[#ff5f3d]'
            }`}
          >
            {t('nav.analytics', 'Analytics')}
            {activeTab === 'dashboard' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ff5f3d]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`font-sans font-bold text-xs sm:text-sm text-[#2b2b2b] bg-none border-none cursor-pointer relative py-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'text-[#ff5f3d]' : 'hover:text-[#ff5f3d]'
            }`}
          >
            <span>{t('nav.audit', 'Audit Log')} ({analysisCount})</span>
            {activeTab === 'audit' && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ff5f3d]" />
            )}
          </button>
        </nav>

        {/* Right Controls: Multilingual Selector & Auth/Account Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rural & Regional Multilingual Selector */}
          <LanguageSelector />
          {userProfile ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white border-2 border-[#2b2b2b] px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#ff5f3d] text-white flex items-center justify-center font-bold text-xs">
                  {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-sans font-bold text-xs text-[#2b2b2b] leading-tight line-clamp-1 max-w-[120px]">
                    {userProfile.displayName}
                  </div>
                  <div className="font-mono text-[9px] text-[#2b2b2b]/70 font-semibold leading-tight">
                    {userProfile.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#2b2b2b]/70" />
              </button>

              {/* User Dropdown */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-[#2b2b2b] rounded-xl shadow-[6px_6px_0px_#2b2b2b] p-4 z-40 space-y-3 font-sans">
                    <div className="border-b border-[#2b2b2b]/20 pb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        {userProfile.accountType === 'patient' || userProfile.role === 'Patient / Individual' ? (
                          <>
                            <User className="w-4 h-4 text-emerald-600" />
                            <span className="font-mono text-[10px] font-bold uppercase text-emerald-700">
                              Patient Health Portal
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-[#ff5f3d]" />
                            <span className="font-mono text-[10px] font-bold uppercase text-[#ff5f3d]">
                              Authenticated Clinician
                            </span>
                          </>
                        )}
                      </div>
                      <div className="font-bold text-sm text-[#2b2b2b]">{userProfile.displayName}</div>
                      <div className="font-mono text-[11px] text-[#2b2b2b]/60">{userProfile.email}</div>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#2b2b2b]/60">Account Type:</span>
                        <span className="font-bold text-[#2b2b2b] text-right">
                          {userProfile.accountType === 'patient' || userProfile.role === 'Patient / Individual' ? '👤 Patient' : '🩺 Doctor / Prescriber'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#2b2b2b]/60">Role / Title:</span>
                        <span className="font-bold text-[#2b2b2b] text-right">{userProfile.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#2b2b2b]/60">Facility / Clinic:</span>
                        <span className="font-bold text-[#2b2b2b] text-right line-clamp-1">{userProfile.organization}</span>
                      </div>
                      {userProfile.licenseNumber && (
                        <div className="flex justify-between">
                          <span className="text-[#2b2b2b]/60">License:</span>
                          <span className="font-bold text-[#2b2b2b]">{userProfile.licenseNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#2b2b2b]/20 space-y-2">
                      {onToggleViewMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onToggleViewMode();
                          }}
                          className="w-full font-mono text-xs font-bold uppercase bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-600 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          {viewMode === 'patient' ? (
                            <>
                              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                              <span>Switch to Doctor Console</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Switch to Patient Portal</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenAdminUsers();
                        }}
                        className="w-full font-mono text-xs font-bold uppercase bg-orange-50 hover:bg-orange-100 text-[#ff5f3d] border-2 border-[#ff5f3d] py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Creator & Admin Registry</span>
                      </button>

                      <div className="pt-1 border-t border-[#2b2b2b]/15 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onGoToDoctorLogin) onGoToDoctorLogin();
                            else onGoToLoginPage();
                          }}
                          className="w-full font-mono text-xs font-bold uppercase bg-white hover:bg-orange-50 text-[#2b2b2b] border border-[#2b2b2b] py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Stethoscope className="w-3.5 h-3.5 text-[#ff5f3d]" />
                          <span>Switch to Doctor Login</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onGoToPatientLogin) onGoToPatientLogin();
                            else onGoToLoginPage();
                          }}
                          className="w-full font-mono text-xs font-bold uppercase bg-white hover:bg-emerald-50 text-[#2b2b2b] border border-[#2b2b2b] py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Switch to Patient Login</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full font-mono text-xs font-bold uppercase bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGoToDoctorLogin || onGoToLoginPage}
                className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-1.5"
                title="Log in to Doctor & Clinician Surveillance Console"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>🩺 Doctor Login</span>
              </button>

              <button
                type="button"
                onClick={onGoToPatientLogin || onGoToLoginPage}
                className="font-mono text-xs font-bold uppercase bg-emerald-700 text-white border-2 border-[#2b2b2b] px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-1.5"
                title="Log in to Patient Medication Safety Portal"
              >
                <User className="w-3.5 h-3.5" />
                <span>👤 Patient Login</span>
              </button>
            </div>
          )}

          {/* Quick Doctor / Patient View Toggle Button */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className={`font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xl border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] transition-transform cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'patient'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-800'
                  : 'bg-blue-100 text-blue-900 border-blue-800'
              }`}
              title="Toggle between Doctor Surveillance Console and Patient Safety Portal"
            >
              {viewMode === 'patient' ? (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Patient Portal</span>
                  <span className="text-[10px] text-[#2b2b2b]/60">(&rarr; Doctor)</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
                  <span className="hidden sm:inline">Doctor Console</span>
                  <span className="text-[10px] text-[#2b2b2b]/60">(&rarr; Patient)</span>
                </>
              )}
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAdminUsers}
              className="font-mono text-[10px] font-bold uppercase text-[#2b2b2b] bg-white hover:bg-orange-50 border-2 border-[#2b2b2b] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
              title="Open Creator & Admin Practitioner Registry"
            >
              <Users className="w-3 h-3 text-[#ff5f3d]" />
              <span>Accounts</span>
            </button>
            <span className="font-mono text-[10px] font-bold text-[#2b2b2b]/70 border-2 border-[#2b2b2b] px-2.5 py-1 rounded-lg bg-white">
              WHO AWaRe 2026
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Subbar */}
      <div className="md:hidden flex items-center justify-around mt-3 pt-3 border-t-2 border-[#2b2b2b] text-xs font-bold">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'analyzer' ? 'text-[#ff5f3d]' : 'text-[#2b2b2b]'}`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px]">Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'prompts' ? 'text-[#ff5f3d]' : 'text-[#2b2b2b]'}`}
        >
          <Terminal className="w-4 h-4" />
          <span className="text-[10px]">Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'library' ? 'text-[#ff5f3d]' : 'text-[#2b2b2b]'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="text-[10px]">Library</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-[#ff5f3d]' : 'text-[#2b2b2b]'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px]">Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'audit' ? 'text-[#ff5f3d]' : 'text-[#2b2b2b]'}`}
        >
          <ClipboardList className="w-4 h-4" />
          <span className="text-[10px]">Audit ({analysisCount})</span>
        </button>
      </div>
    </header>
  );
};
