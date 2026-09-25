import React, { useState } from 'react';
import { STAGE_PROMPTS, MASTER_SYSTEM_PROMPT_OVERVIEW } from '../data/prompts';
import { Copy, Check, Download, Layers, ShieldCheck, Terminal, Cpu, Sparkles, BookOpen } from 'lucide-react';

export const PromptInspector: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number | 'all'>('all');
  const [copiedStage, setCopiedStage] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStage(label);
    setTimeout(() => setCopiedStage(null), 2000);
  };

  const getCombinedMasterPrompt = () => {
    return `${MASTER_SYSTEM_PROMPT_OVERVIEW}

================================================================================
4-STAGE PIPELINE ARCHITECTURE SPECIFICATION
================================================================================

${STAGE_PROMPTS.map((stage) => `
--------------------------------------------------------------------------------
STAGE ${stage.stageNumber}: ${stage.title}
--------------------------------------------------------------------------------
ROLE DEFINITION:
${stage.roleDefinition}

INPUT VARIABLES REQUIRED:
${stage.inputVariables.map(v => `- {${v}}`).join('\n')}

SYSTEM INSTRUCTIONS:
${stage.systemInstructions.trim()}

OUTPUT FORMAT (JSON SCHEMA):
${stage.outputFormatJSONSchema}

EXPECTED OUTPUT EXAMPLE:
${stage.expectedOutputExample}
`).join('\n\n')}
`;
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([getCombinedMasterPrompt()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "AMU_DrugSafety_AIStudio_MasterPrompt_4Stages.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 shadow-[8px_8px_0px_#2b2b2b] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="font-mono text-xs font-bold uppercase bg-[#2b2b2b] text-white px-3 py-1 rounded-full inline-block mb-2">
              MULTI-AGENT ARCHITECTURE & PROMPTS
            </span>
            <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2b2b2b]">
              4-Agent Collaborative AI Pipeline Architecture
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#2b2b2b]/70 mt-1 max-w-3xl leading-relaxed">
              This application orchestrates 4 specialized AI Agents (Clinical Pharmacist Agent, Pharmacokineticist Agent, Toxicology & AMR Agent, and Chief Auditor Agent). Each agent handles a specific clinical domain with strict zero-defect boundaries and 100% explainable schemas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleCopy(getCombinedMasterPrompt(), 'master')}
              className="font-mono text-xs font-bold uppercase bg-[#ff5f3d] text-white border-2 border-[#2b2b2b] px-4 py-2.5 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-2"
            >
              {copiedStage === 'master' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedStage === 'master' ? 'Copied Master Prompt!' : 'Copy Master Prompt'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="font-mono text-xs font-bold uppercase bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] px-4 py-2.5 rounded-lg shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#ff5f3d]" />
              <span>Export .TXT</span>
            </button>
          </div>
        </div>

        {/* Stage selection tabs */}
        <div className="pt-4 border-t-2 border-[#2b2b2b]/20 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveStage('all')}
            className={`font-sans font-bold text-xs px-3.5 py-1.5 rounded-full border-2 border-[#2b2b2b] cursor-pointer transition-all ${
              activeStage === 'all'
                ? 'bg-[#2b2b2b] text-white shadow-[2px_2px_0px_#ff5f3d]'
                : 'bg-white text-[#2b2b2b] hover:bg-[#fffef2]'
            }`}
          >
            All 4 Phases Combined
          </button>

          {STAGE_PROMPTS.map((stage) => (
            <button
              key={stage.stageNumber}
              onClick={() => setActiveStage(stage.stageNumber)}
              className={`font-sans font-bold text-xs px-3.5 py-1.5 rounded-full border-2 border-[#2b2b2b] cursor-pointer transition-all flex items-center gap-1.5 ${
                activeStage === stage.stageNumber
                  ? 'bg-[#2b2b2b] text-white shadow-[2px_2px_0px_#ff5f3d]'
                  : 'bg-white text-[#2b2b2b] hover:bg-[#fffef2]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#ff5f3d] text-white flex items-center justify-center text-[10px] font-bold">
                {stage.stageNumber}
              </span>
              <span>Stage {stage.stageNumber}</span>
            </button>
          ))}
        </div>
      </div>

      {/* System prompt overview box */}
      <div className="bg-white border-3 border-[#2b2b2b] p-6 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#2b2b2b]">
            <ShieldCheck className="w-4 h-4 text-[#ff5f3d]" />
            <span>AI Studio Core Persona & Objective Definition</span>
          </div>
          <button
            onClick={() => handleCopy(MASTER_SYSTEM_PROMPT_OVERVIEW, 'overview')}
            className="font-mono text-xs text-[#ff5f3d] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copiedStage === 'overview' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Core Role</span>
          </button>
        </div>
        <pre className="font-mono text-xs text-[#2b2b2b] bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b]/30 whitespace-pre-wrap leading-relaxed">
          {MASTER_SYSTEM_PROMPT_OVERVIEW.trim()}
        </pre>
      </div>

      {/* Display Stage Prompts */}
      <div className="space-y-8">
        {STAGE_PROMPTS.filter((s) => activeStage === 'all' || activeStage === s.stageNumber).map((stage) => (
          <div
            key={stage.stageNumber}
            className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-6"
          >
            {/* Stage Title Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#2b2b2b]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2b2b2b] text-white font-mono font-bold text-lg flex items-center justify-center border-2 border-[#2b2b2b]">
                  {stage.stageNumber}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-[#2b2b2b] flex items-center gap-2">
                    {stage.title}
                  </h3>
                  <p className="font-sans text-xs text-[#2b2b2b]/70 mt-0.5">{stage.shortDescription}</p>
                </div>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    `STAGE ${stage.stageNumber} PROMPT:\n\nROLE:\n${stage.roleDefinition}\n\nINSTRUCTIONS:\n${stage.systemInstructions}\n\nSCHEMA:\n${stage.outputFormatJSONSchema}`,
                    `stage-${stage.stageNumber}`
                  )
                }
                className="font-mono text-xs font-bold uppercase bg-white text-[#2b2b2b] border-2 border-[#2b2b2b] px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all flex items-center gap-1.5"
              >
                {copiedStage === `stage-${stage.stageNumber}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied Stage {stage.stageNumber}!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Stage {stage.stageNumber} Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Role & Role Definition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b]">
                <span className="font-mono text-[10px] font-bold uppercase text-[#2b2b2b] block mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#ff5f3d]" /> Engine Role
                </span>
                <p className="font-sans text-[#2b2b2b] leading-relaxed font-semibold">{stage.roleDefinition}</p>
              </div>

              <div className="bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b] md:col-span-2">
                <span className="font-mono text-[10px] font-bold uppercase text-[#2b2b2b] block mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#ff5f3d]" /> Input Variables Required
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {stage.inputVariables.map((v) => (
                    <span
                      key={v}
                      className="px-2.5 py-1 bg-[#2b2b2b] text-white font-mono text-[11px] rounded font-bold"
                    >
                      {"{"}
                      {v}
                      {"}"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* System Instructions Codebox */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold uppercase text-[#2b2b2b] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#ff5f3d]" /> System Instructions for Gemini API
                </span>
              </div>
              <pre className="font-mono text-xs text-[#2b2b2b] bg-[#fffef2] p-4 rounded-xl border-2 border-[#2b2b2b] whitespace-pre-wrap leading-relaxed">
                {stage.systemInstructions.trim()}
              </pre>
            </div>

            {/* JSON Output Schema & Expected Example */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#2b2b2b] block mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff5f3d]" /> Output Schema (Structured JSON)
                </span>
                <pre className="font-mono text-[11px] text-[#2b2b2b] bg-[#fffef2] p-3.5 rounded-xl border-2 border-[#2b2b2b] overflow-x-auto max-h-64">
                  {stage.outputFormatJSONSchema}
                </pre>
              </div>

              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#2b2b2b] block mb-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Example Output Response
                </span>
                <pre className="font-mono text-[11px] text-[#2b2b2b] bg-[#fffef2] p-3.5 rounded-xl border-2 border-[#2b2b2b] overflow-x-auto max-h-64">
                  {stage.expectedOutputExample}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
