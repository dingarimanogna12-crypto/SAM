import React from 'react';
import { CheckCircle2, Loader2, Search, Calculator, ShieldAlert, FileText, Activity } from 'lucide-react';

interface AnalysisPipelineProps {
  currentStage: number; // 0 = idle, 1 = Stage 1, 2 = Stage 2, 3 = Stage 3, 4 = Stage 4, 5 = done
  isAnalyzing: boolean;
}

export const AnalysisPipeline: React.FC<AnalysisPipelineProps> = ({ currentStage, isAnalyzing }) => {
  if (!isAnalyzing && currentStage === 0) return null;

  const stages = [
    {
      num: 1,
      title: 'Agent 1: Clinical Pharmacist Agent',
      subtitle: 'AMU Detection & AWaRe Classification',
      desc: 'Extracted drugs, mapped ATC codes, WHO AWaRe categories & species context',
      icon: Search,
    },
    {
      num: 2,
      title: 'Agent 2: Pharmacokineticist Agent',
      subtitle: 'Dosing & Organ Clearance Verification',
      desc: 'Calculated mg/kg/day dosing, organ clearance & therapeutic window checks',
      icon: Calculator,
    },
    {
      num: 3,
      title: 'Agent 3: Toxicology & AMR Agent',
      subtitle: 'Drug Safety & AMR Selective Pressure',
      desc: 'Assessed drug interactions, black-box warnings & AMR selective pressure score',
      icon: ShieldAlert,
    },
    {
      num: 4,
      title: 'Agent 4: Chief Auditor Agent',
      subtitle: 'Regulatory Alerts & Explainable Audit',
      desc: 'Synthesized regulatory compliance flags, WHO citations & explainable AI score',
      icon: FileText,
    },
  ];

  return (
    <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#2b2b2b]">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#2b2b2b]">
          <Activity className="w-4 h-4 text-[#ff5f3d] animate-pulse" />
          <span>Multi-Agent Orchestration Pipeline (4 Collaborative Agents)</span>
        </div>
        <span className="font-mono text-xs font-bold text-[#2b2b2b] bg-[#fffef2] px-3 py-1 rounded-full border border-[#2b2b2b]">
          {currentStage >= 5 ? 'ORCHESTRATION COMPLETE' : `ACTIVE: AGENT ${Math.min(currentStage, 4)}/4 EXECUTING`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {stages.map((stage) => {
          const isDone = currentStage > stage.num;
          const isActive = currentStage === stage.num && isAnalyzing;
          const Icon = stage.icon;

          return (
            <div
              key={stage.num}
              className={`p-4 rounded-xl border-2 border-[#2b2b2b] transition-all ${
                isDone
                  ? 'bg-emerald-100 text-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b]'
                  : isActive
                  ? 'bg-[#fffef2] text-[#2b2b2b] shadow-[4px_4px_0px_#ff5f3d] ring-2 ring-[#ff5f3d]'
                  : 'bg-gray-50 text-gray-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center font-mono border border-[#2b2b2b] ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-[#ff5f3d] text-white animate-bounce'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : stage.num}
                  </span>
                  <Icon className="w-4 h-4 text-[#2b2b2b]" />
                </div>

                {isActive && <Loader2 className="w-4 h-4 animate-spin text-[#ff5f3d]" />}
              </div>

              <h4 className="font-sans font-bold text-xs text-[#2b2b2b]">{stage.title}</h4>
              <span className="font-mono text-[10px] text-[#ff5f3d] font-bold block">{stage.subtitle}</span>
              <p className="font-sans text-[11px] text-[#2b2b2b]/70 mt-1 leading-snug">{stage.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
