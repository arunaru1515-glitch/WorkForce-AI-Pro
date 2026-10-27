import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Star, 
  Target, 
  TrendingUp, 
  Plus, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Lightbulb, 
  Building2, 
  X, 
  ChevronRight,
  User,
  ShieldCheck,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { performanceAPI, employeesAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PerformancePage() {
  const { user } = useAuth();
  const isManagerOrAbove = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'ai_recommendations'
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiRecs, setAiRecs] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newReview, setNewReview] = useState({
    employee_id: '',
    review_cycle: 'Annual Review 2026',
    rating: 4.5,
    achievements: '',
    improvement_areas: '',
    feedback: '',
    status: 'Completed',
    goals: [
      { title: '', target: 'Q2 2026', progress_percentage: 50, status: 'IN_PROGRESS' }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, statsRes, empRes, recRes] = await Promise.all([
        performanceAPI.getAll(),
        performanceAPI.getStats(),
        employeesAPI.getAll(),
        aiAPI.getRecommendations()
      ]);
      setReviews(revRes.data);
      setStats(statsRes.data);
      setEmployees(empRes.data);
      setAiRecs(recRes.data);
      if (empRes.data.length > 0 && !newReview.employee_id) {
        setNewReview(prev => ({ ...prev, employee_id: empRes.data[0].id }));
      }
    } catch (err) {
      console.error("Error loading performance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddGoal = () => {
    setNewReview({
      ...newReview,
      goals: [...newReview.goals, { title: '', target: 'Q3 2026', progress_percentage: 25, status: 'IN_PROGRESS' }]
    });
  };

  const handleGoalChange = (idx, field, value) => {
    const updated = [...newReview.goals];
    updated[idx][field] = value;
    setNewReview({ ...newReview, goals: updated });
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!newReview.employee_id) {
      alert("Please select an employee.");
      return;
    }
    try {
      const payload = {
        employee_id: parseInt(newReview.employee_id, 10),
        review_cycle: newReview.review_cycle,
        rating: parseFloat(newReview.rating),
        achievements: newReview.achievements,
        improvement_areas: newReview.improvement_areas,
        feedback: newReview.feedback,
        status: newReview.status,
        goals_json: JSON.stringify(newReview.goals.filter(g => g.title.trim() !== ''))
      };

      await performanceAPI.create(payload);
      setShowCreateModal(false);
      setNewReview({
        employee_id: employees[0]?.id || '',
        review_cycle: 'Annual Review 2026',
        rating: 4.5,
        achievements: '',
        improvement_areas: '',
        feedback: '',
        status: 'Completed',
        goals: [{ title: '', target: 'Q2 2026', progress_percentage: 50, status: 'IN_PROGRESS' }]
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not submit review");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Award className="w-4 h-4" />
            Modules 22 & 23 • Talent Growth & AI Suggestions
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Performance Review & AI Recommendations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quarterly evaluations, milestone goal tracking, and algorithmic workforce optimization strategies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Performance Reviews
            </button>
            <button
              onClick={() => setActiveTab('ai_recommendations')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ai_recommendations' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommendations
            </button>
          </div>

          {isManagerOrAbove && activeTab === 'reviews' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Evaluation
            </button>
          )}
        </div>
      </div>

      {/* Performance Summary Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Average Rating</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.average_rating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span></div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Across all completed cycles</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Reviews</span>
              <Award className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.total_reviews}</div>
            <div className="text-[11px] text-slate-500 mt-1">Evaluated team members</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Top Performers</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.high_performers_count}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Rating ≥ 4.0 (Exceeds expectations)</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Growth Focus</span>
              <Target className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.needs_improvement_count}</div>
            <div className="text-[11px] text-slate-500 mt-1">Targeted for skill coaching</div>
          </div>
        </div>
      )}

      {/* TAB 1: REVIEWS VIEW */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Completed Review Evaluations</h3>
            <span className="text-xs text-slate-400 font-mono">Showing {reviews.length} reviews</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => {
              let goals = [];
              try {
                if (rev.goals_json) goals = JSON.parse(rev.goals_json);
              } catch (e) {}

              return (
                <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  {/* Top Bar: Employee info & rating badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{rev.employee_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {rev.department_name} • {rev.job_title}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span className="text-sm font-bold text-amber-800">{rev.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Cycle & Reviewer */}
                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between text-slate-600">
                    <div>
                      <span className="text-slate-400">Cycle:</span> <span className="font-semibold">{rev.review_cycle}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Reviewer:</span> <span className="font-semibold">{rev.reviewer_name}</span>
                    </div>
                  </div>

                  {/* Achievements & Feedback */}
                  {rev.achievements && (
                    <div>
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Key Achievements</div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                        {rev.achievements}
                      </p>
                    </div>
                  )}

                  {rev.improvement_areas && (
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Improvement & Growth Areas</div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {rev.improvement_areas}
                      </p>
                    </div>
                  )}

                  {/* Goal Tracking Progress */}
                  {goals.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        Milestone Goals ({goals.length})
                      </div>
                      <div className="space-y-2">
                        {goals.map((g, gIdx) => (
                          <div key={gIdx} className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium text-slate-800">{g.title || 'Target Objective'}</span>
                              <span className="font-mono text-[10px] text-blue-600 font-bold">{g.progress_percentage || 50}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full" 
                                style={{ width: `${g.progress_percentage || 50}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AI RECOMMENDATIONS ENGINE VIEW (Module 23) */}
      {activeTab === 'ai_recommendations' && aiRecs && (
        <div className="space-y-6">
          {/* Section 1: Employee Improvement Suggestions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Individual Employee Improvement Suggestions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Algorithmic interventions designed to mitigate flight risk and accelerate career paths.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {aiRecs.employee_suggestions.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900">{s.employee_name}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      s.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {s.priority} Priority
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">{s.department} • {s.category}</div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{s.suggestion}</p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Expected Impact: {s.impact_metric}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">{s.action_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Workforce Optimization Tips & Team Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workforce Optimization Tips */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Workforce Optimization Tips
              </h3>

              <div className="space-y-3">
                {aiRecs.workforce_optimization_tips.map((tip) => (
                  <div key={tip.id} className="p-4 rounded-xl border border-slate-200 bg-amber-50/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{tip.title}</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {tip.metric}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{tip.description}</p>
                    <div className="text-[10px] text-slate-400 font-medium pt-1">Category: {tip.category}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Performance Insights */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                Team Performance & Health Insights
              </h3>

              <div className="space-y-3">
                {aiRecs.team_performance_insights.map((team, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{team.team}</div>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-blue-600">
                        Score: {team.health_score}/100
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{team.key_insight}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Velocity: {team.velocity_trend}</span>
                      <span className="font-semibold text-rose-600">{team.flight_risk_index}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Strategic Department Recommendations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Strategic Department Retention Playbooks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiRecs.department_recommendations.map((d, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{d.department}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">{d.code}</span>
                    </div>
                    <div className="text-xs font-semibold text-blue-600 mb-2">{d.strategy}</div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
                      {d.action_items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 text-[11px] flex items-center justify-between">
                    <span className="text-slate-500">Allocation:</span>
                    <span className="font-mono font-bold text-emerald-700">{d.recommended_budget}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Evaluation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Submit Performance Review
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Profile *</label>
                <select
                  value={newReview.employee_id}
                  onChange={(e) => setNewReview({ ...newReview, employee_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.job_title})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Review Cycle</label>
                  <input
                    type="text"
                    value={newReview.review_cycle}
                    onChange={(e) => setNewReview({ ...newReview, review_cycle: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Rating (1.0 - 5.0) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    required
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Achievements</label>
                <textarea
                  rows="2"
                  placeholder="Summarize standout results and deliverables..."
                  value={newReview.achievements}
                  onChange={(e) => setNewReview({ ...newReview, achievements: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Improvement & Growth Areas</label>
                <textarea
                  rows="2"
                  placeholder="Identify professional development suggestions..."
                  value={newReview.improvement_areas}
                  onChange={(e) => setNewReview({ ...newReview, improvement_areas: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Goal Objectives */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Target Objectives & Milestones</span>
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    + Add Goal
                  </button>
                </div>

                {newReview.goals.map((g, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="Goal description..."
                      value={g.title}
                      onChange={(e) => handleGoalChange(idx, 'title', e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white col-span-2"
                    />
                    <input
                      type="number"
                      placeholder="Progress %"
                      min="0"
                      max="100"
                      value={g.progress_percentage}
                      onChange={(e) => handleGoalChange(idx, 'progress_percentage', parseInt(e.target.value, 10))}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
