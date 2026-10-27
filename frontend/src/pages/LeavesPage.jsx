import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, CheckCircle, XCircle, X, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { leavesAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [leaveBalance, setLeaveBalance] = useState(null);

  // RBAC: Only Admin, HR, and Manager can approve/reject
  const isApprover = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'Casual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, empRes] = await Promise.all([
        leavesAPI.getAll({ status: statusFilter || undefined }),
        employeesAPI.getAll()
      ]);
      setLeaves(lRes.data);
      setEmployees(empRes.data);

      // Identify the current user's employee record
      const myEmp = empRes.data.find(e => e.email === user?.email || e.user_id === user?.id) || empRes.data[0];
      if (myEmp) {
        if (!formData.employee_id) {
          setFormData(prev => ({ ...prev, employee_id: myEmp.id }));
        }
        // Fetch balance for the current user's employee record
        try {
          const balRes = await leavesAPI.getBalance(myEmp.id);
          setLeaveBalance(balRes.data);
        } catch (e) {
          console.error("Could not fetch balance", e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const currentEmployee = employees.find(e => e.email === user?.email || e.user_id === user?.id);

  const handleApply = async (e) => {
    e.preventDefault();
    const targetEmpId = isApprover ? parseInt(formData.employee_id) : (currentEmployee?.id || parseInt(formData.employee_id));
    if (!targetEmpId) {
      alert("No employee profile identified for leave submission.");
      return;
    }
    try {
      await leavesAPI.apply({
        ...formData,
        employee_id: targetEmpId
      });
      setShowApplyModal(false);
      setFormData(prev => ({ ...prev, reason: '' }));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit leave application");
    }
  };

  const handleReview = async (leaveId, status) => {
    if (!isApprover) {
      alert("Employees cannot approve or reject leaves. Only Managers, HR, or Admins have review permissions.");
      return;
    }
    const comments = prompt(`Enter review comment for ${status}:`, `Reviewed by ${user?.role || 'Manager'}`);
    try {
      await leavesAPI.review(leaveId, {
        status,
        review_comments: comments || `${status} by ${user?.full_name || 'Management'}`
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Review action failed");
    }
  };

  const handleCancel = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this pending leave request?")) return;
    try {
      await leavesAPI.cancel(leaveId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not cancel request");
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management System</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isApprover 
              ? "Review team absence requests, approve leaves, and monitor department availability." 
              : "Submit time-off requests, monitor approval status, and track your remaining leave balances."}
          </p>
        </div>
        <button
          onClick={() => {
            if (!isApprover && currentEmployee) {
              setFormData(prev => ({ ...prev, employee_id: currentEmployee.id }));
            }
            setShowApplyModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {/* Dynamic Leave Balances Cards (Module 5) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Remaining</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {leaveBalance ? leaveBalance.total_remaining : '38'} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3 h-3" /> Available balance
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Annual Paid Leave</div>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
            {leaveBalance ? (leaveBalance.annual_allowed - leaveBalance.annual_used) : '18'} <span className="text-xs font-normal text-slate-400">/ 18</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Used: {leaveBalance ? leaveBalance.annual_used : 0} days
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Casual Leave</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {leaveBalance ? (leaveBalance.casual_allowed - leaveBalance.casual_used) : '12'} <span className="text-xs font-normal text-slate-400">/ 12</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Used: {leaveBalance ? leaveBalance.casual_used : 0} days
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sick Leave</div>
          <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">
            {leaveBalance ? (leaveBalance.sick_allowed - leaveBalance.sick_used) : '10'} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Used: {leaveBalance ? leaveBalance.sick_used : 0} days
          </div>
        </div>
      </div>

      {/* Leave Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['', 'Pending', 'Approved', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === status 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {status ? status : 'All Requests'}
          </button>
        ))}
      </div>

      {/* Leaves Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions / Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading leave requests...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No leave requests found.</td>
                </tr>
              ) : (
                leaves.map((l) => {
                  const isMyLeave = currentEmployee && l.employee_id === currentEmployee.id;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-slate-900">{l.employee_name}</div>
                            <div className="text-[10px] text-slate-500">{l.department_name}</div>
                          </div>
                          {isMyLeave && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{l.leave_type}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {l.start_date} → {l.end_date}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {l.days_count} day(s)
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={l.reason}>
                        {l.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          l.status === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : l.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {/* RBAC: ONLY Managers, HR, and Admin can approve/reject */}
                        {isApprover ? (
                          l.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReview(l.id, 'Approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleReview(l.id, 'Rejected')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {l.review_comments || l.status}
                            </span>
                          )
                        ) : (
                          /* Employee View: NO approve/reject buttons allowed */
                          l.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" /> Awaiting Manager Review
                              </span>
                              {isMyLeave && (
                                <button
                                  onClick={() => handleCancel(l.id)}
                                  className="text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded border border-rose-200 transition-colors cursor-pointer"
                                  title="Cancel your pending request"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              {l.review_comments || l.status}
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Leave of Absence</h3>
                <p className="text-[11px] text-slate-400">Submit time off for manager approval</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              {/* Employee Selection: Restricted for regular employees to self */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Employee Profile</label>
                {isApprover ? (
                  <select
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} ({e.employee_code} - {e.job_title})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : (user?.full_name || 'Staff Employee')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currentEmployee?.employee_code} • {currentEmployee?.job_title || 'Employee'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Self
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Casual">Casual Leave (12 days/year)</option>
                  <option value="Sick">Sick Leave (10 days/year)</option>
                  <option value="Annual">Annual Paid Leave (18 days/year)</option>
                  <option value="Maternity">Maternity/Paternity</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Reason for Absence</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Provide context for manager review..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold shadow-xs cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
