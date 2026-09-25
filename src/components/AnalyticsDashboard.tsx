import React from 'react';
import { FullAnalysisResult } from '../types';
import { BarChart3, PieChart, ShieldAlert, Activity, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface AnalyticsDashboardProps {
  history: FullAnalysisResult[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history }) => {
  const totalCases = history.length;
  
  const accessCount = history.reduce((acc, h) => {
    return acc + h.stage1.antimicrobialsFound.filter(a => a.whoAWaReGroup === 'ACCESS').length;
  }, 0);

  const watchCount = history.reduce((acc, h) => {
    return acc + h.stage1.antimicrobialsFound.filter(a => a.whoAWaReGroup === 'WATCH').length;
  }, 0);

  const reserveCount = history.reduce((acc, h) => {
    return acc + h.stage1.antimicrobialsFound.filter(a => a.whoAWaReGroup === 'RESERVE').length;
  }, 0);

  const totalAntimicrobials = accessCount + watchCount + reserveCount || 1;
  const accessPercentage = Math.round((accessCount / totalAntimicrobials) * 100);
  const watchPercentage = Math.round((watchCount / totalAntimicrobials) * 100);
  const reservePercentage = Math.round((reserveCount / totalAntimicrobials) * 100);

  const avgAmrScore = totalCases > 0
    ? +(history.reduce((acc, h) => acc + h.stage3.amrPressureScore, 0) / totalCases).toFixed(1)
    : 4.2;

  const criticalAlertsCount = history.filter(h => h.overallStatus === 'CRITICAL').length;
  const warningCount = history.filter(h => h.overallStatus === 'WARNING').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_#2b2b2b]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase bg-[#2b2b2b] text-white px-3 py-1 rounded-full inline-block mb-2">
              SURVEILLANCE METRICS
            </span>
            <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2b2b2b]">Antimicrobial Usage (AMU) Analytics</h2>
            <p className="font-sans text-xs sm:text-sm text-[#2b2b2b]/70 mt-1">Aggregated WHO AWaRe stewardship metrics and AMR selection pressure tracking.</p>
          </div>

          <div className="flex items-center gap-3 bg-[#fffef2] p-3.5 rounded-xl border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b]">
            <Sparkles className="w-5 h-5 text-[#ff5f3d]" />
            <div>
              <span className="font-mono text-[10px] text-[#2b2b2b]/60 font-bold uppercase block">WHO Global Target</span>
              <span className="font-sans text-xs font-bold text-emerald-700">&ge; 60% Access Group Antibiotics</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-3 border-[#2b2b2b] p-5 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-2">
          <span className="font-mono text-xs font-bold text-[#2b2b2b]/60 uppercase block">Total Prescriptions</span>
          <div className="font-mono text-3xl font-extrabold text-[#2b2b2b] flex items-center justify-between">
            <span>{totalCases}</span>
            <Activity className="w-6 h-6 text-[#ff5f3d]" />
          </div>
          <span className="font-sans text-[11px] text-[#2b2b2b]/70 block">Real-time audit log count</span>
        </div>

        <div className="bg-white border-3 border-[#2b2b2b] p-5 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-2">
          <span className="font-mono text-xs font-bold text-[#2b2b2b]/60 uppercase block">WHO Access Share</span>
          <div className="font-mono text-3xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{accessPercentage}%</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="font-sans text-[11px] text-[#2b2b2b]/70 block">Target: &ge;60% ({accessCount} items)</span>
        </div>

        <div className="bg-white border-3 border-[#2b2b2b] p-5 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-2">
          <span className="font-mono text-xs font-bold text-[#2b2b2b]/60 uppercase block">Average AMR Score</span>
          <div className="font-mono text-3xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{avgAmrScore}</span>
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <span className="font-sans text-[11px] text-[#2b2b2b]/70 block">1.0 = Minimal, 10.0 = Extreme</span>
        </div>

        <div className="bg-white border-3 border-[#2b2b2b] p-5 rounded-2xl shadow-[6px_6px_0px_#2b2b2b] space-y-2">
          <span className="font-mono text-xs font-bold text-[#2b2b2b]/60 uppercase block">Critical Alerts</span>
          <div className="font-mono text-3xl font-extrabold text-[#ff5f3d] flex items-center justify-between">
            <span>{criticalAlertsCount}</span>
            <ShieldAlert className="w-6 h-6 text-[#ff5f3d]" />
          </div>
          <span className="font-sans text-[11px] text-[#2b2b2b]/70 block">{warningCount} Warnings pending review</span>
        </div>
      </div>

      {/* WHO AWaRe Visual Balance Breakdown */}
      <div className="bg-white border-3 border-[#2b2b2b] p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_#2b2b2b] space-y-6">
        <h3 className="font-gaegu text-2xl sm:text-3xl font-bold text-[#2b2b2b] flex items-center gap-2">
          <PieChart className="w-6 h-6 text-[#ff5f3d]" />
          <span>WHO AWaRe Classification Proportions</span>
        </h3>

        {/* Progress Bar Visualizer */}
        <div className="space-y-4">
          <div className="h-8 w-full bg-[#fffef2] rounded-xl overflow-hidden flex border-2 border-[#2b2b2b]">
            <div style={{ width: `${accessPercentage}%` }} className="bg-emerald-400 h-full flex items-center justify-center font-mono text-xs font-bold text-[#2b2b2b] border-r border-[#2b2b2b]">
              {accessPercentage > 10 ? `${accessPercentage}% ACCESS` : ''}
            </div>
            <div style={{ width: `${watchPercentage}%` }} className="bg-amber-400 h-full flex items-center justify-center font-mono text-xs font-bold text-[#2b2b2b] border-r border-[#2b2b2b]">
              {watchPercentage > 10 ? `${watchPercentage}% WATCH` : ''}
            </div>
            <div style={{ width: `${reservePercentage}%` }} className="bg-[#ff5f3d] h-full flex items-center justify-center font-mono text-xs font-bold text-white">
              {reservePercentage > 5 ? `${reservePercentage}% RESERVE` : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#fffef2] rounded-xl border-2 border-[#2b2b2b]">
              <span className="font-mono font-bold text-emerald-700 text-xs uppercase block mb-1">Access Group ({accessCount})</span>
              <p className="font-sans text-xs text-[#2b2b2b]/70">First/second choice antibiotics with lower resistance potential.</p>
            </div>

            <div className="p-4 bg-[#fffef2] rounded-xl border-2 border-[#2b2b2b]">
              <span className="font-mono font-bold text-amber-700 text-xs uppercase block mb-1">Watch Group ({watchCount})</span>
              <p className="font-sans text-xs text-[#2b2b2b]/70">Higher resistance potential; recommended for limited indications.</p>
            </div>

            <div className="p-4 bg-[#fffef2] rounded-xl border-2 border-[#2b2b2b]">
              <span className="font-mono font-bold text-[#ff5f3d] text-xs uppercase block mb-1">Reserve Group ({reserveCount})</span>
              <p className="font-sans text-xs text-[#2b2b2b]/70">Last-resort antibiotics; restricted to verified MDR pathogens.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
