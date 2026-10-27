import React, { useState, useEffect } from 'react';
import { 
  LineChart as LineChartIcon, 
  TrendingDown, 
  Users, 
  Calendar, 
  Target, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Sparkles,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { aiAPI } from '../services/api';

export default function ForecastingPage() {
  const [forecast, setForecast] = useState(null);
  const [stability, setStability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState('baseline'); // 'baseline' | 'mitigated' | 'stress'

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const [res, stabRes] = await Promise.all([
        aiAPI.getForecasting(),
        aiAPI.getStability()
      ]);
      setForecast(res.data);
      setStability(stabRes.data);
    } catch (e) {
      console.error("Error fetching forecasting:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  // Adjust chart data dynamically based on scenario
  const getTimelineData = () => {
    if (!forecast?.forecast_timeline) return [];
    return forecast.forecast_timeline.map((item, idx) => {
      let rate = item.retention_rate;
      if (scenario === 'mitigated') {
        rate = Math.min(100, Math.round(rate + (idx + 1) * 2.5));
      } else if (scenario === 'stress') {
        rate = Math.max(50, Math.round(rate - (idx + 1) * 3.0));
      }
      return {
        ...item,
        retention_rate: rate,
        projected_headcount: Math.round((rate / 100) * (forecast.current_headcount || 10))
      };
    });
  };

  const timelineData = getTimelineData();

  return (
    <div className="w-full px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workforce Retention Forecasting</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Module 14 • Predictive Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            6-month retention projection curves, departmental turnover risk distributions, and headcount stability simulations.
          </p>
        </div>

        {/* Scenario Switcher */}
        <div className="bg-white border border-slate-300 p-1 rounded-xl flex text-xs font-semibold self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setScenario('mitigated')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              scenario === 'mitigated' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mitigated (+15%)
          </button>
          <button
            onClick={() => setScenario('baseline')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              scenario === 'baseline' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Baseline Forecast
          </button>
          <button
            onClick={() => setScenario('stress')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              scenario === 'stress' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stress Scenario
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Baseline</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {forecast?.current_headcount || 10} <span className="text-xs font-normal text-slate-400">staff</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Current enterprise headcount</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Projected 6M Exits</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {scenario === 'mitigated' ? 1 : scenario === 'stress' ? 4 : (forecast?.projected_6m_exits || 2)}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5 font-medium">Expected turnover departures</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Projected Retention</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {timelineData.length > 0 ? timelineData[timelineData.length - 1].retention_rate : 80}%
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">6-Month retention probability</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Turnover Rate</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {scenario === 'mitigated' ? '10.0%' : scenario === 'stress' ? '40.0%' : `${forecast?.projected_turnover_rate || 20.0}%`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Annualized flight estimate</div>
        </div>
      </div>

      {/* Retention Projection Curve Line Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">6-Month Workforce Retention Projection Curve</h3>
            <p className="text-[11px] text-slate-500">Predicted retention percentage and retained headcount month-over-month</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Scenario: {scenario.toUpperCase()}
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[50, 100]} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                formatter={(val, name) => [name === 'retention_rate' ? `${val}%` : `${val} Staff`, name === 'retention_rate' ? 'Retention Rate' : 'Retained Headcount']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="retention_rate" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Departmental Risk & Exit Projections</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(forecast?.department_forecasts || []).map((dept, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{dept.department}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  dept.risk_level === 'HIGH' 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : dept.risk_level === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {dept.risk_level}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Headcount:</span>
                  <span className="font-bold text-slate-800">{dept.headcount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Avg Risk:</span>
                  <span className="font-bold text-slate-800">{dept.avg_risk}%</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Projected departures: <span className="font-bold text-slate-800">{dept.projected_exits} exit(s)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Workforce Stability Analysis & Yearly Prediction Grid (Module 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 14: Workforce Stability Analysis */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Workforce Stability Analysis</h3>
                <p className="text-[11px] text-slate-500">Stability index score, turnover risk grade & volatility rating</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
              {forecast?.stability_analysis?.stability_status || "HIGH STABILITY"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Stability Score</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {forecast?.stability_analysis?.stability_score || 72.4} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Index: <span className="font-mono font-semibold text-slate-800">{forecast?.stability_analysis?.stability_index || 0.72}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Risk Grade</span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {forecast?.stability_analysis?.risk_grade || "Manageable Turnover Risk"}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Driver: {forecast?.stability_analysis?.flight_risk_driver || "Workload & Benchmarks"}
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">AI Strategic Stability Recommendation:</span>
              <div className="text-[11px] text-blue-800 mt-0.5">
                {forecast?.stability_analysis?.recommended_action || "Targeted retention packages for high-risk technical roles."}
              </div>
            </div>
          </div>
        </div>

        {/* Module 14: Yearly Workforce Prediction (12-Month Horizon) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Yearly Workforce Prediction</h3>
                <p className="text-[11px] text-slate-500">12-Month macro projection, annual retention & departure models</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">
              12M Horizon
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Projected 12M Staff</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {forecast?.yearly_prediction?.projected_headcount || 8}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Retained headcount</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">12M Retention Rate</span>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {forecast?.yearly_prediction?.projected_retention_rate || 78.0}%
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Estimated survival</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Annual Turnover</span>
              <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                {forecast?.yearly_prediction?.annual_turnover_rate || 22.0}%
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Exits: {forecast?.yearly_prediction?.projected_yearly_exits || 2} staff</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Projected Annual Turnover departures:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
              {forecast?.yearly_prediction?.projected_yearly_exits || 2} departures
            </span>
          </div>
        </div>

        {/* MODULE 27: Workforce Stability Engine */}
        {stability && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Workforce Stability Engine</h3>
                  <p className="text-[11px] text-slate-500">Department Stability Scoring, Quarterly Growth & Retention Horizons</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Company Stability:</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                  {stability.overall_stability_score}/100 • {stability.stability_status}
                </span>
              </div>
            </div>

            {/* Department Stability Scoring Table */}
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Department Stability Scoring
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Headcount</th>
                      <th className="py-2.5 px-3 text-center">Stability Score</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Retention Prob.</th>
                      <th className="py-2.5 px-3">Primary Driver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stability.department_stability_scores?.map((dept) => (
                      <tr key={dept.department_id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{dept.department_name}</td>
                        <td className="py-2.5 px-3 font-mono">{dept.headcount} staff</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {dept.stability_score}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            {dept.stability_grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">{dept.retention_probability}%</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{dept.primary_stability_driver}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quarterly Growth & Retention Horizons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Growth Projections */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Workforce Growth Projections</span>
                <div className="space-y-1.5 pt-1">
                  {stability.growth_projections?.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                      <span className="font-medium text-slate-800">{g.quarter}</span>
                      <span className="text-emerald-700 font-mono font-bold">+{g.net_growth} net ({g.projected_headcount} staff)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retention Horizons */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Employee Retention Horizons</span>
                <div className="space-y-1.5 pt-1">
                  {stability.retention_horizons?.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                      <span className="font-medium text-slate-800">{h.horizon}</span>
                      <span className="text-blue-700 font-mono font-bold">{h.probability}% retention ({h.expected_retention_count} staff)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

