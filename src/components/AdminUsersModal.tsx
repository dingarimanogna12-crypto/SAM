import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getAllRegisteredUsers, auth } from '../firebase';
import {
  Users,
  ShieldAlert,
  Search,
  Download,
  ExternalLink,
  X,
  RefreshCw,
  Building,
  CheckCircle2,
  Database,
  KeyRound,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    // If not signed in to Firebase Auth with real credentials
    if (!auth.currentUser) {
      setIsLoading(false);
      try {
        const cached = localStorage.getItem('amu_active_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          setUsers([parsed]);
          return;
        }
      } catch {
        // ignore
      }
      setUsers([]);
      setErrorMsg("Sign in required: Please sign in with an administrator account (dingarimanogna12@gmail.com) to query live Firestore user records.");
      return;
    }

    try {
      const data = await getAllRegisteredUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setErrorMsg(
        err.message?.includes('permission-denied') || err.message?.includes('Missing or insufficient permissions')
          ? "Permission Denied: Cloud Firestore user accounts are restricted to administrators (dingarimanogna12@gmail.com, cherrysanjana2601@gmail.com). You can also view them via Firebase Console below."
          : "Unable to load user accounts from Firestore. Please check connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.organization?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = () => {
      if (selectedRoleFilter === 'ALL') return true;
      if (selectedRoleFilter === 'DOCTORS') return u.entityType === 'doctor' || u.accountType === 'doctor' || (u.role !== 'Patient / Individual' && u.role !== 'Pet Owner');
      if (selectedRoleFilter === 'PATIENTS') return u.entityType === 'patient' || u.accountType === 'patient' || u.role === 'Patient / Individual' || u.role === 'Pet Owner';
      return u.role === selectedRoleFilter;
    };

    return matchesSearch && matchesRole();
  });

  if (!isOpen) return null;

  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ['Entity Type', 'UID', 'Full Name', 'Email', 'Role', 'Organization', 'License Number', 'Created At'];
    const rows = filteredUsers.map((u) => [
      `"${u.entityType || (u.role === 'Patient / Individual' ? 'patient' : 'doctor')}"`,
      `"${u.uid}"`,
      `"${u.displayName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.role || ''}"`,
      `"${u.organization || ''}"`,
      `"${u.licenseNumber || ''}"`,
      `"${u.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `account_entities_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#fffef2] border-3 border-[#2b2b2b] rounded-2xl w-full max-w-5xl shadow-[12px_12px_0px_#2b2b2b] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#2b2b2b] text-white p-5 flex items-center justify-between border-b-2 border-[#2b2b2b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#ff5f3d] text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-base sm:text-lg leading-tight">
                  Creator & Administrator Account Registry
                </h3>
                <span className="font-mono text-[9px] uppercase font-bold bg-[#ff5f3d] text-white px-2 py-0.5 rounded-full">
                  Admin Access
                </span>
              </div>
              <p className="font-mono text-[11px] text-white/70">
                Live Firestore practitioner accounts & database console navigation
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

        {/* Database Quick Access Banners */}
        <div className="p-4 bg-orange-50/70 border-b-2 border-[#2b2b2b] grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-3 border-2 border-[#2b2b2b] rounded-xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#2b2b2b]">
                <Database className="w-4 h-4 text-[#ff5f3d]" />
                <span>Cloud Firestore Database</span>
              </div>
              <p className="font-mono text-[10px] text-[#2b2b2b]/70">
                Collection: <code className="bg-gray-100 px-1 py-0.5 rounded">/users</code> & <code className="bg-gray-100 px-1 py-0.5 rounded">/prescriptions</code>
              </p>
            </div>
            <a
              href="https://console.firebase.google.com/project/prime-photon-k9v0l/firestore"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] font-bold uppercase bg-[#ff5f3d] text-white px-3 py-1.5 rounded-lg border border-[#2b2b2b] shadow-xs flex items-center gap-1 hover:translate-x-[-1px] transition-transform"
            >
              <span>Open Firestore</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-white p-3 border-2 border-[#2b2b2b] rounded-xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#2b2b2b]">
                <KeyRound className="w-4 h-4 text-[#ff5f3d]" />
                <span>Firebase Authentication Console</span>
              </div>
              <p className="font-mono text-[10px] text-[#2b2b2b]/70">
                Auth UIDs, password resets, Google OAuth identities
              </p>
            </div>
            <a
              href="https://console.firebase.google.com/project/prime-photon-k9v0l/authentication/users"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] font-bold uppercase bg-white text-[#2b2b2b] px-3 py-1.5 rounded-lg border border-[#2b2b2b] shadow-xs flex items-center gap-1 hover:bg-orange-50 transition-colors"
            >
              <span>Open Auth Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="p-4 border-b-2 border-[#2b2b2b] bg-[#fffef2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#2b2b2b]/50 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, hospital, or license ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-[#2b2b2b] rounded-lg font-sans text-xs outline-none focus:border-[#ff5f3d]"
              />
            </div>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border-2 border-[#2b2b2b] rounded-lg font-mono text-xs font-bold outline-none"
            >
              <option value="ALL">All Entities ({users.length})</option>
              <option value="DOCTORS">🩺 Doctor Entities (/doctors)</option>
              <option value="PATIENTS">👤 Patient Entities (/patients)</option>
              <option value="Clinical Pharmacist">Clinical Pharmacists</option>
              <option value="Veterinarian">Veterinarians</option>
              <option value="Infectious Disease Specialist">ID Specialists</option>
              <option value="Physician / Medical Officer">Physicians</option>
              <option value="Patient / Individual">Patients Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadUsers}
              disabled={isLoading}
              className="font-mono text-xs font-bold uppercase bg-white border-2 border-[#2b2b2b] px-3 py-1.5 rounded-lg hover:bg-orange-50 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredUsers.length === 0}
              className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] transition-transform cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Users Table / Directory */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-500 text-red-900 rounded-xl font-mono text-xs flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center space-y-3 font-mono text-xs text-[#2b2b2b]/70">
              <div className="w-8 h-8 border-3 border-[#ff5f3d] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying Firestore /users, /doctors, and /patients...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center space-y-2 border-2 border-dashed border-[#2b2b2b]/40 rounded-2xl bg-white p-6">
              <Users className="w-10 h-10 text-[#2b2b2b]/40 mx-auto" />
              <h4 className="font-bold text-sm text-[#2b2b2b]">No Account Entities Found</h4>
              <p className="font-mono text-xs text-[#2b2b2b]/60 max-w-md mx-auto">
                {searchTerm
                  ? 'No registered entities match your search query.'
                  : 'New entities will automatically populate here as doctors and patients register.'}
              </p>
            </div>
          ) : (
            <div className="border-2 border-[#2b2b2b] rounded-xl overflow-hidden shadow-xs bg-white">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-[#2b2b2b] text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Name & UID</th>
                    <th className="p-3">Role / Specialty</th>
                    <th className="p-3">Organization / Clinic</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">License / Patient Details</th>
                    <th className="p-3">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b2b2b]/15">
                  {filteredUsers.map((user) => {
                    const isPatient = user.entityType === 'patient' || user.accountType === 'patient' || user.role === 'Patient / Individual' || user.role === 'Pet Owner';
                    return (
                      <tr key={user.uid} className="hover:bg-orange-50/50 transition-colors">
                        <td className="p-3">
                          {isPatient ? (
                            <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                              👤 Patient (/patients)
                            </span>
                          ) : (
                            <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 inline-block">
                              🩺 Doctor (/doctors)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#2b2b2b]">{user.displayName || 'Unnamed User'}</div>
                          <div className="font-mono text-[9px] text-[#2b2b2b]/50 select-all font-semibold">
                            UID: {user.uid}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 border border-[#2b2b2b]/20 text-[#2b2b2b]">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-[#2b2b2b]">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-[#2b2b2b]/50 shrink-0" />
                            <span>{user.organization || 'Unspecified'}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#2b2b2b]">
                          {user.email || 'N/A'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#2b2b2b]/80">
                          {isPatient ? (
                            <span>{user.ageYears ? `Age: ${user.ageYears}` : 'Patient'} {user.allergies ? `• ${user.allergies}` : ''}</span>
                          ) : (
                            <span>{user.licenseNumber || '—'}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-[#2b2b2b]/60">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-[#fffef2] border-t-2 border-[#2b2b2b] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
          <div className="text-[#2b2b2b]/70 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Authenticated Admin: <strong>{currentUserEmail || 'Creator'}</strong></span>
          </div>
          <div className="text-[11px] text-[#2b2b2b]/60">
            Total Practitioners Indexed: <strong>{filteredUsers.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
