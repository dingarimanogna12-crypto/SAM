import React, { useState } from 'react';
import { FullAnalysisResult } from '../types';
import { Search, Download, Trash2, Eye, FileText } from 'lucide-react';
import { generateClinicalAuditPdf } from '../utils/generatePdfReport';

interface AuditLogViewProps {
  history: FullAnalysisResult[];
  onSelectResult: (result: FullAnalysisResult) => void;
  onClearHistory: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ history, onSelectResult, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');

  const filtered = history.filter((h) => {
    const matchesSearch =
      h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.prescription.patient.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.prescription.patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.prescription.medications.some(m => m.drugName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecies = speciesFilter === 'ALL' || h.prescription.patient.species === speciesFilter;

    return matchesSearch && matchesSpecies;
  });

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AMU_Regulatory_Audit_Trail_Batch_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase bg-[#2b2b2b] text-white px-3 py-1 rounded-full inline-block mb-2">
            AUDIT RECORDS
          </span>
          <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2b2b2b]">Prescription Surveillance Audit Log</h2>
          <p className="font-sans text-xs sm:text-sm text-[#2b2b2b]/70 mt-1">Complete record of analyzed prescriptions, WHO AWaRe ratings, and regulatory alert decisions.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            disabled={history.length === 0}
            className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] disabled:opacity-50 text-white border-2 border-[#2b2b2b] px-4 py-2.5 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Batch (.JSON)</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-2.5 bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] hover:bg-red-100 rounded-lg shadow-[2px_2px_0px_#2b2b2b] cursor-pointer transition-all"
              title="Clear Log"
            >
              <Trash2 className="w-4 h-4 text-[#ff5f3d]" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border-3 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#2b2b2b]/60 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by drug, diagnosis, ID..."
            className="w-full bg-[#fffef2] border-2 border-[#2b2b2b] text-[#2b2b2b] font-sans rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-mono text-xs text-[#2b2b2b] font-bold shrink-0">SPECIES:</span>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="bg-[#fffef2] border-2 border-[#2b2b2b] text-[#2b2b2b] font-mono font-bold text-xs rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Species</option>
            <option value="Human">Human</option>
            <option value="Bovine">Bovine</option>
            <option value="Swine">Swine</option>
            <option value="Canine">Canine</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border-3 border-[#2b2b2b] rounded-2xl overflow-hidden shadow-[8px_8px_0px_#2b2b2b]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[#2b2b2b]/60 font-mono text-xs font-bold">
            No audit records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs text-[#2b2b2b]">
              <thead className="font-mono text-[11px] font-bold text-[#2b2b2b] bg-[#fffef2] border-b-2 border-[#2b2b2b] uppercase">
                <tr>
                  <th className="p-4">Analysis ID / Timestamp</th>
                  <th className="p-4">Patient / Species</th>
                  <th className="p-4">Diagnosis</th>
                  <th className="p-4">Prescribed Drugs</th>
                  <th className="p-4">Overall Status</th>
                  <th className="p-4">AWaRe Score</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b2b2b]/20">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fffef2] transition-all">
                    <td className="p-4">
                      <span className="font-mono text-[#2b2b2b] font-bold block">{item.id}</span>
                      <span className="font-mono text-[10px] text-[#2b2b2b]/60">{new Date(item.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-[#2b2b2b] block">{item.prescription.patient.species}</span>
                      <span className="text-[10px] text-[#2b2b2b]/60">
                        {item.prescription.patient.ageYears}yo, {item.prescription.patient.weightKg}kg
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-[#2b2b2b]">
                      {item.prescription.patient.diagnosis}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.prescription.medications.map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#fffef2] border border-[#2b2b2b] text-[#2b2b2b] text-[10px] font-bold rounded">
                            {m.drugName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border border-[#2b2b2b] ${
                        item.overallStatus === 'CRITICAL' ? 'bg-[#ff5f3d] text-white' : item.overallStatus === 'WARNING' ? 'bg-amber-300 text-[#2b2b2b]' : 'bg-emerald-300 text-[#2b2b2b]'
                      }`}>
                        {item.overallStatus}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-[#2b2b2b]">
                      {item.stage4.whoAWaReComplianceScore}%
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => generateClinicalAuditPdf(item)}
                          className="font-mono text-xs font-bold uppercase bg-white hover:bg-orange-50 text-[#2b2b2b] border-2 border-[#2b2b2b] px-2.5 py-1.5 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all inline-flex items-center gap-1"
                          title="Download official PDF clinical report"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#ff5f3d]" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => onSelectResult(item)}
                          className="font-mono text-xs font-bold uppercase bg-white hover:bg-gray-50 text-[#2b2b2b] border-2 border-[#2b2b2b] px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#ff5f3d]" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
