import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  User, 
  ArrowRight, 
  X, 
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { interventionsAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function InterventionsPage() {
  const { user } = useAuth();
  const isHRorManager = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);
  const [interventions, setInterventions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    action_title: '',
    strategy_type: 'Compensation',
    description: '',
    priority: 'HIGH',
    expected_impact: 'Projected ~30% flight-risk reduction'
  });

  const [loadingRecs, setLoadingRecs] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intRes, empRes] = await Promise.all([
        interventionsAPI.getAll({ status_filter: statusFilter || undefined }),
        employeesAPI.getAll()
      ]);
      setInterventions(intRes.data);
      setEmployees(empRes.data);
      if (empRes.data.length > 0 && !formData.employee_id) {
        setFormData(prev => ({ ...prev, employee_id: empRes.data[0].id }));
      }
    } catch (e) {
      console.error("Error fetching interventions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleEmployeeChange = async (empId) => {
    setFormData(prev => ({ ...prev, employee_id: empId }));
    setLoadingRecs(true);
    try {
      const recRes = await interventionsAPI.getRecommendations(empId);
      const recs = recRes.data.ai_recommendations || [];
      if (recs.length > 0) {
        const top = recs[0];
        setFormData(prev => ({
          ...prev,
          employee_id: empId,
          action_title: `${top.strategy}: ${recRes.data.employee_name}`,
          strategy_type: top.strategy.includes('Compensation') ? 'Compensation' : 'Workload',
          description: top.action,
          priority: top.priority || 'HIGH'
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await interventionsAPI.create({
        ...formData,
        employee_id: parseInt(formData.employee_id)
      });
      setShowModal(false);
      setFormData({
        employee_id: employees[0]?.id || '',
        action_title: '',
        strategy_type: 'Compensation',
        description: '',
        priority: 'HIGH',
        expected_impact: 'Projected ~30% flight-risk reduction'
      });
      fetchData();
      alert("Retention plan launched!");
    } catch (err) {
      alert(err.response?.data?.detail || "Error creating plan");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const notes = prompt(`Enter notes for setting status to ${newStatus}:`, `Plan milestone achieved`);
    try {
      await interventionsAPI.updateStatus(id, {
        status: newStatus,
        outcome_notes: notes || undefined
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Status update failed");
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In-Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Initiated': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const resolvedCount = interventions.filter(i => i.status === 'Resolved').length;
  const inProgressCount = interventions.filter(i => i.status === 'In-Progress').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">HR Retention & Decision Support</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeted employee retention workflows, AI recommendations, and mitigation tracking.
          </p>
        </div>

        {isHRorManager && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Launch Retention Plan
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Active Plans</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{interventions.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Assigned to HR & Managers</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Execution</span>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">{inProgressCount}</div>
          <div className="text-[10px] text-blue-600 mt-0.5 font-medium">Active negotiations & changes</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Successfully Resolved</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Turnover averted</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Retention Success</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {interventions.length > 0 ? Math.round((resolvedCount / interventions.length) * 100) : 100}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Based on completed actions</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['', 'Initiated', 'In-Progress', 'Resolved'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === st 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {st ? st : 'All Action Plans'}
          </button>
        ))}
      </div>

      {/* Interventions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Action Plan & Strategy</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Expected Impact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Progress Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading intervention records...</td>
                </tr>
              ) : interventions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No retention plans found for this filter.</td>
                </tr>
              ) : (
                interventions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.employee_name}</div>
                      <div className="text-[10px] text-slate-500">{item.department_name}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{item.action_title}</div>
                      <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{item.description}</div>
                      <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {item.strategy_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {item.expected_impact || "Reduce flight risk"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isHRorManager && item.status !== 'Resolved' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'Initiated' && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'In-Progress')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold border border-blue-200 transition-all cursor-pointer"
                            >
                              In-Progress
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                      {item.status === 'Resolved' && (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Retained
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Launch Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Initiate Employee Retention Strategy</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Select Target Employee</label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} ({e.job_title} - {e.department_name})
                    </option>
                  ))}
                </select>
                {loadingRecs && <span className="text-[10px] text-blue-600 mt-1 block">Analyzing AI retention strategies...</span>}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Action Plan Title</label>
                <input
                  type="text"
                  required
                  value={formData.action_title}
                  onChange={(e) => setFormData({...formData, action_title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Strategy Type</label>
                  <select
                    value={formData.strategy_type}
                    onChange={(e) => setFormData({...formData, strategy_type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Compensation">Compensation Adjustment</option>
                    <option value="Workload">Workload Rebalancing</option>
                    <option value="Promotion">Accelerated Promotion</option>
                    <option value="Mentorship">Senior Mentorship</option>
                    <option value="Culture">Flexible Remote / Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Escalation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Roadmap & Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold shadow-xs cursor-pointer"
                >
                  Launch Retention Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
