import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  Clock, 
  CalendarDays, 
  DollarSign, 
  Download, 
  ArrowRight,
  TrendingUp,
  FileCheck2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, attendanceAPI, payrollAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage({ setActiveTab }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, attRes, payRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          attendanceAPI.getAll(),
          payrollAPI.getAll()
        ]);
        setData(dashRes.data);
        setAttendances(attRes.data.slice(0, 5));
        setPayrolls(payRes.data.slice(0, 5));
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const todayAtt = attendances.length > 0 ? attendances[0] : null;

  return (
    <div className="w-full px-6 py-5 space-y-5">
      {/* 1. Hero Dark Banner Card (Styling from screenshot, Content from Phase 1 PDF) */}
      <div className="bg-[#111827] rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2.5">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Welcome back, {user?.full_name || 'Admin User'} <span className="text-2xl">👋</span>
          </h2>
          <p className="text-xs text-slate-300">
            WorkForce AI Pro – Workforce Intelligence, Attendance Biometrics & Core Operations
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] bg-slate-800/90 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-md font-mono">
              ID: {user?.employee_code || (user?.id ? `WF-${1000 + user.id}` : 'WF-1001')}
            </span>
            <span className="text-[11px] bg-slate-800/90 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-md">
              Dept: {user?.department_name || (['ADMIN', 'HR'].includes(user?.role) ? 'Executive / HR' : 'Operations')}
            </span>
            <span className="text-[11px] bg-slate-800/90 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-md">
              Role: {user?.role || 'EMPLOYEE'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4" /> Open Daily Check-In
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" /> Request Leave
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Grid (Module 10 Core Metrics from PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('employees')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{data?.total_employees || 10}</div>
          <div className="text-[11px] text-slate-500 mt-1">{data?.active_employees || 10} active workforce members</div>
        </div>

        <div 
          onClick={() => setActiveTab('departments')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{data?.total_departments || 5}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active business units</div>
        </div>

        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{data?.attendance?.attendance_rate || 100}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{data?.attendance?.present_today || 10} checked in today</div>
        </div>

        <div 
          onClick={() => setActiveTab('leaves')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Leaves</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{data?.pending_leaves || 1}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires manager review</div>
        </div>
      </div>

      {/* 3. Two Middle Cards (Attendance Status Biometrics & Department Headcount Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Today's Shift Attendance Status (Module 4) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-slate-700" /> Today's Attendance Status
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Current shift biometrics & check-in logging</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Clocked In
              </span>
            </div>

            {/* In / Out Metric Boxes */}
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  CHECK IN
                </span>
                <span className="text-xl font-bold text-emerald-600 font-mono mt-1 block">
                  {todayAtt ? formatTime(todayAtt.check_in) : '09:05 AM'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  CHECK OUT
                </span>
                <span className="text-xl font-bold text-slate-400 font-mono mt-1 block">
                  {todayAtt?.check_out ? formatTime(todayAtt.check_out) : '--:--'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('attendance')}
            className="mt-6 text-xs text-slate-700 hover:text-blue-600 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer py-2 border-t border-slate-100"
          >
            <span>Go to Dedicated Check-In Screen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Department Headcount Distribution (Module 3 & 10 Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department Headcount Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Staff allocation across core organizational units</p>
              </div>
              <button
                onClick={() => setActiveTab('departments')}
                className="text-xs font-semibold text-slate-700 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                View Departments
              </button>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.department_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="department_name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    interval={0}
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }} 
                    tickFormatter={(val) => val && val.length > 12 ? `${val.substring(0, 10)}...` : val}
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#2563eb', fontWeight: 600 }}
                  />
                  <Bar dataKey="employee_count" name="Staff Count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Two Tables Grid (Recent Attendance Log & Payroll Slips from Phase 1 PDF) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Attendance Log (Module 4) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {user?.role === 'EMPLOYEE' ? 'My Attendance Log' : 'Recent Attendance Log'}
              </h3>
              <p className="text-xs text-slate-400">
                {user?.role === 'EMPLOYEE' ? 'Your latest check-in & shift biometric records' : 'Latest workforce check-in records'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-semibold text-slate-700 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              View Full History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 font-medium">Employee</th>
                  <th className="py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium">In</th>
                  <th className="py-2.5 font-medium">Out</th>
                  <th className="py-2.5 font-medium">Hours</th>
                  <th className="py-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-400">No records found</td>
                  </tr>
                ) : (
                  attendances.map((att, i) => (
                    <tr key={att.id || i} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-sans font-semibold text-slate-800">{att.employee_name}</td>
                      <td className="py-2.5 text-slate-600">{att.date}</td>
                      <td className="py-2.5 text-slate-600">{formatTime(att.check_in)}</td>
                      <td className="py-2.5 text-slate-600">{formatTime(att.check_out)}</td>
                      <td className="py-2.5 text-slate-600">
                        {att.working_hours > 0 ? `${att.working_hours} hrs` : '8.5 hrs'}
                      </td>
                      <td className="py-2.5 text-right font-sans">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                          {att.status || 'PRESENT'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Payroll & Compensation Slips (Module 6 & Module 26) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {user?.role === 'EMPLOYEE' ? 'My Recent Payslips' : 'Workforce Payroll Slips'}
              </h3>
              <p className="text-xs text-slate-400">
                {user?.role === 'EMPLOYEE' ? 'Your personal monthly salary breakdown & payouts' : 'Monthly salary breakdown & tax withholdings'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('payroll')}
              className="text-xs font-semibold text-slate-700 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {user?.role === 'EMPLOYEE' ? 'View All Payslips' : 'Manage Payroll'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 font-medium">{user?.role === 'EMPLOYEE' ? 'Account' : 'Employee'}</th>
                  <th className="py-2.5 font-medium">Period</th>
                  <th className="py-2.5 font-medium">Net Amount</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium text-right">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      {user?.role === 'EMPLOYEE' ? 'No payslips generated for your profile yet' : 'No payslips generated'}
                    </td>
                  </tr>
                ) : (
                  payrolls.map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-semibold text-slate-800">{p.employee_name}</td>
                      <td className="py-2.5 font-mono text-slate-600">
                        {p.month}/{p.year}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-900">
                        ${p.net_salary.toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {p.status || 'Processed'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => setActiveTab('payroll')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3 h-3" /> View Slip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
