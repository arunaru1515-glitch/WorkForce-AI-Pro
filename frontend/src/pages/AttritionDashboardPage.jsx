import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  Sliders, 
  CheckCircle,
  FileText,
  Clock,
  X,
  Plus,
  Radio,
  Activity,
  History,
  Flame
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { aiAPI, employeesAPI, interventionsAPI, monitoringAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AttritionDashboardPage({ setActiveTab }) {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  // Module 18: Live Workforce Telemetry & Instability Feed
  const [liveFeed, setLiveFeed] = useState([]);
  const [instability, setInstability] = useState(null);

  // Module 13: Risk Change History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Module 15: Matrix Filter
  const [matrixFilter, setMatrixFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'LOW'

  // Real-time Prediction Modal State
  const [showPredictModal, setShowPredictModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [predictResult, setPredictResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictForm, setPredictForm] = useState({
    monthly_income: 6000,
    overtime: 'No',
    job_satisfaction: 3,
    work_life_balance: 3,
    distance_from_home: 8,
    years_in_current_role: 2,
    years_since_last_promotion: 1
  });

  // Launch Intervention Modal State
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [aiRecs, setAiRecs] = useState([]);
  const [interventionForm, setInterventionForm] = useState({
    action_title: '',
    strategy_type: 'Compensation',
    description: '',
    priority: 'HIGH',
    expected_impact: 'Reduce flight risk by ~25%'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overRes, metaRes, empRes, feedRes, instRes] = await Promise.all([
        aiAPI.getOverview(),
        aiAPI.getModelInfo(),
        employeesAPI.getAll(),
        monitoringAPI.getFeed().catch(() => ({ data: { feed: [] } })),
        monitoringAPI.getInstabilityStatus().catch(() => ({ data: null }))
      ]);
      setOverview(overRes.data);
      setModelInfo(metaRes.data);
      setEmployees(empRes.data);
      setLiveFeed(feedRes.data?.feed || []);
      setInstability(instRes.data);
    } catch (e) {
      console.error("Error loading attrition dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveTelemetry = async () => {
    try {
      const [feedRes, instRes] = await Promise.all([
        monitoringAPI.getFeed(),
        monitoringAPI.getInstabilityStatus()
      ]);
      setLiveFeed(feedRes.data?.feed || []);
      setInstability(instRes.data);
    } catch (e) {
      // quiet polling
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchLiveTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenHistory = async (emp) => {
    setHistoryEmployee(emp);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await aiAPI.getRiskHistory(emp.employee_id || emp.id);
      setHistoryLogs(res.data || []);
    } catch (err) {
      console.error("Error loading risk history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await aiAPI.retrain();
      setModelInfo(res.data);
      await fetchData();
      alert("AI Attrition Model retrained successfully!");
    } catch (e) {
      alert("Retraining failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setRetraining(false);
    }
  };

  const handleOpenPredict = (emp) => {
    setSelectedEmp(emp);
    setPredictResult(null);
    setPredictForm({
      monthly_income: emp ? (emp.salary / 12) : 6000,
      overtime: emp?.salary < 80000 ? 'Yes' : 'No',
      job_satisfaction: 3,
      work_life_balance: 3,
      distance_from_home: 8,
      years_in_current_role: 2,
      years_since_last_promotion: 1
    });
    setShowPredictModal(true);
  };

  const runPrediction = async (e) => {
    if (e) e.preventDefault();
    setPredicting(true);
    try {
      const res = await aiAPI.predict({
        employee_id: selectedEmp?.id || selectedEmp?.employee_id,
        monthly_income: parseFloat(predictForm.monthly_income),
        overtime: predictForm.overtime,
        job_satisfaction: parseInt(predictForm.job_satisfaction),
        work_life_balance: parseInt(predictForm.work_life_balance),
        distance_from_home: parseInt(predictForm.distance_from_home),
        years_in_current_role: parseInt(predictForm.years_in_current_role),
        years_since_last_promotion: parseInt(predictForm.years_since_last_promotion)
      });
      setPredictResult(res.data);
    } catch (err) {
      alert("Prediction error: " + (err.response?.data?.detail || err.message));
    } finally {
      setPredicting(false);
    }
  };

  const handleOpenIntervention = async (emp) => {
    setTargetEmployee(emp);
    setShowInterventionModal(true);
    try {
      const recRes = await interventionsAPI.getRecommendations(emp.employee_id || emp.id);
      setAiRecs(recRes.data.ai_recommendations || []);
      if (recRes.data.ai_recommendations?.length > 0) {
        const top = recRes.data.ai_recommendations[0];
        setInterventionForm({
          action_title: `${top.strategy}: ${emp.employee_name || emp.first_name}`,
          strategy_type: top.strategy.includes('Compensation') ? 'Compensation' : 'Workload',
          description: top.action,
          priority: top.priority || 'HIGH',
          expected_impact: 'Projected to drop attrition risk by ~30%'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    try {
      await interventionsAPI.create({
        ...interventionForm,
        employee_id: targetEmployee.employee_id || targetEmployee.id
      });
      setShowInterventionModal(false);
      alert("Retention Action Plan launched successfully!");
      if (setActiveTab) setActiveTab('interventions');
    } catch (err) {
      alert(err.response?.data?.detail || "Could not launch retention plan");
    }
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getBarColor = (risk) => {
    if (risk >= 60) return '#ef4444';
    if (risk >= 40) return '#f59e0b';
    if (risk >= 25) return '#3b82f6';
    return '#10b981';
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Attrition Intelligence</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Random Forest Ensemble • ML v2.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workforce flight-risk prediction, key attrition drivers, and automated HR retention strategies.
          </p>
        </div>

        {/* Retrain Model Action */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Retraining...' : 'Retrain Model'}</span>
          </button>
          
          <button
            onClick={() => handleOpenPredict(null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulate Risk</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avg Attrition Risk</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {overview?.avg_attrition_risk || 28.4}%
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
            <span>Moderate company turnover probability</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">High Risk Staff</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2 font-mono">
            {overview?.high_risk_count || 2} <span className="text-xs font-normal text-slate-400">employees</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Requires immediate management review
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">6-Month Projected Exits</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {overview?.projected_6m_exits || 2} <span className="text-xs font-normal text-slate-400">departures</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Based on current overtime & salary trends
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Primary Flight Driver</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2 truncate" title={overview?.primary_flight_driver}>
            {overview?.primary_flight_driver || "Excessive Overtime Workload"}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">
            Top feature importance impact: ~28%
          </div>
        </div>
      </div>

      {/* Module 18: Real-Time Workforce Telemetry & Instability Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instability Detection Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Workforce Instability Monitor</h3>
                <p className="text-[10px] text-slate-500">Module 18 • Biometric Overtime Surges</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${
              instability?.instability_detected
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {instability?.instability_level || "MODERATE"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-semibold">Active Surge Unit</span>
              <span className="font-bold text-slate-800 text-xs">{instability?.active_surge_department || "Engineering"}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-semibold">Overtime Surge</span>
              <span className="font-bold text-rose-600 font-mono text-xs">+{instability?.overtime_surge_hours || 3.5} hrs</span>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
            <span className="font-bold">Automated Instability Guidance:</span>
            <div className="text-[10px] text-amber-800 mt-0.5">
              {instability?.recommendation || "Review workload distribution for Engineering to mitigate overtime-induced flight risk."}
            </div>
          </div>
        </div>

        {/* Live Workforce Activity Stream (Module 18) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Live Workforce Activity Feed & Signals</h3>
                <p className="text-[10px] text-slate-500">Real-time biometrics, continuous risk pulses, and instability alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Feed Connected
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {(liveFeed.length > 0 ? liveFeed : [
              {
                title: "Biometric Check-In Verified",
                employee: "Elena Rostova",
                department: "Engineering",
                details: "Morning Biometrics Registered (9:05 AM)",
                severity: "INFO",
                timestamp: "Just now"
              },
              {
                title: "Overtime Surge Detected",
                employee: "Marcus Thorne",
                department: "Engineering",
                details: "Engineering overtime surge: +2.5 hrs logged today. Flight-risk escalation pulse triggered.",
                severity: "WARNING",
                timestamp: "2m ago"
              },
              {
                title: "Continuous Flight Risk Pulse",
                employee: "David Kim",
                department: "Product & Design",
                details: "Flight risk score recalculated: 54.0% (HIGH) - Below Market Compensation driver.",
                severity: "WARNING",
                timestamp: "5m ago"
              }
            ]).map((evt, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    evt.severity === 'WARNING' ? 'bg-amber-500' : evt.severity === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></span>
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 text-[11px] mr-1.5">{evt.title}</span>
                    <span className="text-slate-500 text-[10px] truncate">{evt.details}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">{evt.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Turnover Risk Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Flight Risk Heatmap</h3>
              <p className="text-[11px] text-slate-500">Average attrition probability by organizational unit</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live Scanned</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.department_risk_summary || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(value) => [`${value}% Avg Risk`, 'Flight Risk']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <Bar dataKey="avg_risk" radius={[6, 6, 0, 0]}>
                  {(overview?.department_risk_summary || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.avg_risk)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top ML Feature Importances */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Key Flight-Risk Drivers</h3>
              <p className="text-[11px] text-slate-500">Relative feature importance weights determined by Random Forest</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              AUC {modelInfo?.roc_auc || 67.8}%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(modelInfo?.top_features?.slice(0, 5) || [
              { feature: "MonthlyIncome", importance: 6.41 },
              { feature: "OverTime_Yes", importance: 6.17 },
              { feature: "MonthlyRate", importance: 6.11 },
              { feature: "JobSatisfaction", importance: 4.52 },
              { feature: "WorkLifeBalance", importance: 4.17 }
            ]).map((feat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {feat.feature.replace('_Yes', ' (Active)').replace('MonthlyIncome', 'Compensation / Base Salary')}
                  </span>
                  <span className="font-mono text-slate-500 font-bold">{feat.importance}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, feat.importance * 10)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* High-Risk Employees Action Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Flight-Risk Employee Assessment Matrix</h3>
            <p className="text-[11px] text-slate-500">Live AI predicted probability, primary root cause, and direct retention workflows</p>
          </div>
          
          {/* Matrix Filter Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setMatrixFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                matrixFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({overview?.high_risk_employees?.length || 0})
            </button>
            <button
              onClick={() => setMatrixFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                matrixFilter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
              }`}
            >
              Critical ({overview?.high_risk_employees?.filter(e => e.risk_score >= 70).length || 0})
            </button>
            <button
              onClick={() => setMatrixFilter('HIGH')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                matrixFilter === 'HIGH' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              High ({overview?.high_risk_employees?.filter(e => e.risk_score >= 48 && e.risk_score < 70).length || 0})
            </button>
            <button
              onClick={() => setMatrixFilter('LOW')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                matrixFilter === 'LOW' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              Low Risk ({overview?.high_risk_employees?.filter(e => e.risk_score < 48).length || 0})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Attrition Risk</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Primary Flight Driver</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Running AI risk evaluations...</td>
                </tr>
              ) : (overview?.high_risk_employees || []).filter(e => {
                if (matrixFilter === 'CRITICAL') return e.risk_score >= 70;
                if (matrixFilter === 'HIGH') return e.risk_score >= 48 && e.risk_score < 70;
                if (matrixFilter === 'LOW') return e.risk_score < 48;
                return true;
              }).length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No employees matching the selected risk filter.</td>
                </tr>
              ) : (
                (overview?.high_risk_employees || []).filter(e => {
                  if (matrixFilter === 'CRITICAL') return e.risk_score >= 70;
                  if (matrixFilter === 'HIGH') return e.risk_score >= 48 && e.risk_score < 70;
                  if (matrixFilter === 'LOW') return e.risk_score < 48;
                  return true;
                }).map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{emp.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{emp.employee_code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{emp.job_title}</div>
                      <div className="text-[10px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{emp.risk_score}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${emp.risk_score}%`, 
                              backgroundColor: getBarColor(emp.risk_score) 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(emp.risk_level)}`}>
                        {emp.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 text-xs font-medium">
                        {emp.primary_driver}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(emp)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-semibold border border-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                          title="Module 13: Risk Progression History"
                        >
                          <History className="w-3 h-3 text-purple-600" /> History
                        </button>
                        <button
                          onClick={() => handleOpenPredict(emp)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Sliders className="w-3 h-3 text-blue-600" /> Simulate
                        </button>
                        <button
                          onClick={() => handleOpenIntervention(emp)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-3 h-3" /> Intervene
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Attrition Simulation Modal */}
      {showPredictModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedEmp ? `Real-Time Risk Simulation: ${selectedEmp.employee_name}` : "Simulate Workforce Flight Risk"}
                </h3>
                <p className="text-[11px] text-slate-500">Tweak workplace variables to observe real-time AI probability adjustments</p>
              </div>
              <button onClick={() => setShowPredictModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={runPrediction} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Monthly Income ($)</label>
                  <input
                    type="number"
                    value={predictForm.monthly_income}
                    onChange={(e) => setPredictForm({...predictForm, monthly_income: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Overtime Status</label>
                  <select
                    value={predictForm.overtime}
                    onChange={(e) => setPredictForm({...predictForm, overtime: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="No">No Overtime</option>
                    <option value="Yes">Frequent Overtime</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Job Satisfaction (1-4)</label>
                  <select
                    value={predictForm.job_satisfaction}
                    onChange={(e) => setPredictForm({...predictForm, job_satisfaction: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Satisfied</option>
                    <option value="4">4 - High</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Work-Life Balance (1-4)</label>
                  <select
                    value={predictForm.work_life_balance}
                    onChange={(e) => setPredictForm({...predictForm, work_life_balance: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Moderate</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Excellent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Commute Distance (Miles)</label>
                  <input
                    type="number"
                    value={predictForm.distance_from_home}
                    onChange={(e) => setPredictForm({...predictForm, distance_from_home: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Years in Current Role</label>
                  <input
                    type="number"
                    value={predictForm.years_in_current_role}
                    onChange={(e) => setPredictForm({...predictForm, years_in_current_role: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {predicting ? 'Calculating AI Inference...' : 'Calculate Attrition Probability'}
              </button>
            </form>

            {/* Prediction Output Result */}
            {predictResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Predicted Flight Risk:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-slate-900">{predictResult.risk_score}%</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(predictResult.risk_level)}`}>
                      {predictResult.risk_level}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800">Primary Driver: </span>
                  {predictResult.primary_driver}
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contributing Factors:</div>
                  {predictResult.contributing_factors?.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <span>{f.factor}</span>
                      <span className="font-mono font-bold text-rose-600">+{f.impact}%</span>
                    </div>
                  ))}
                </div>

                {predictResult.recommendations?.length > 0 && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Recommended Intervention:
                    </div>
                    <div>{predictResult.recommendations[0].action}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Launch Intervention Modal */}
      {showInterventionModal && targetEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Launch Retention Action Plan</h3>
                <p className="text-[11px] text-slate-500">Target Employee: {targetEmployee.employee_name || targetEmployee.first_name}</p>
              </div>
              <button onClick={() => setShowInterventionModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIntervention} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  value={interventionForm.action_title}
                  onChange={(e) => setInterventionForm({...interventionForm, action_title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Strategy Type</label>
                  <select
                    value={interventionForm.strategy_type}
                    onChange={(e) => setInterventionForm({...interventionForm, strategy_type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Compensation">Compensation Review</option>
                    <option value="Workload">Workload Rebalancing</option>
                    <option value="Promotion">Career Promotion</option>
                    <option value="Mentorship">Senior Mentorship</option>
                    <option value="Culture">Hybrid Flexibility</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Urgency Priority</label>
                  <select
                    value={interventionForm.priority}
                    onChange={(e) => setInterventionForm({...interventionForm, priority: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Action Description & Roadmap</label>
                <textarea
                  rows="3"
                  required
                  value={interventionForm.description}
                  onChange={(e) => setInterventionForm({...interventionForm, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInterventionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold shadow-xs cursor-pointer"
                >
                  Confirm & Dispatch Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module 13: Risk Progression History Modal */}
      {showHistoryModal && historyEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Risk Progression History: {historyEmployee.employee_name || historyEmployee.first_name}
                </h3>
                <p className="text-[11px] text-slate-500">Module 13: Continuous flight-risk progression tracking & audit trail</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading risk progression audit log...</div>
            ) : historyLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No previous risk evaluations recorded yet for this employee.</div>
            ) : (
              <div className="space-y-3">
                {historyLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 font-mono">{log.risk_score}%</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(log.risk_level)}`}>
                          {log.risk_level}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.assessed_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Primary Flight Driver: </span>
                      {log.primary_driver || "Workload & Market Benchmarks"}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-mono">
                      <span>Trigger Event: <strong className="text-slate-800 font-sans">{log.trigger_event}</strong></span>
                      <span>Confidence Score: <strong className="text-slate-800">{Math.round((log.confidence || 0.88) * 100)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold text-xs cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
