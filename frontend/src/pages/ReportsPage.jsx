import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Users, 
  TrendingDown, 
  CreditCard, 
  Clock, 
  Filter, 
  Search, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { reportsAPI, departmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('employees'); // employees, attrition, payroll, attendance
  const [summary, setSummary] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const fetchSummary = async () => {
    try {
      const res = await reportsAPI.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error("Error loading summary:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.getAll();
      setDepartments(res.data);
    } catch (err) {
      console.error("Error loading departments:", err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let res;
      const params = {};
      if (selectedDept) params.department_id = selectedDept;

      if (activeReport === 'employees') {
        res = await reportsAPI.getEmployees(params);
      } else if (activeReport === 'attrition') {
        res = await reportsAPI.getAttrition(params);
      } else if (activeReport === 'payroll') {
        res = await reportsAPI.getPayroll(params);
      } else if (activeReport === 'attendance') {
        res = await reportsAPI.getAttendance(params);
      }
      setReportData(res?.data || []);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeReport, selectedDept]);

  const handleExport = (format) => {
    let url = '';
    if (format === 'csv') url = reportsAPI.exportCsv(activeReport);
    if (format === 'excel') url = reportsAPI.exportExcel(activeReport);
    if (format === 'pdf') url = reportsAPI.exportPdf(activeReport);
    
    // Open in new tab / download with JWT authorization handled via direct link or token query
    const token = localStorage.getItem('token');
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error("Export failed");
      return response.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const ext = format === 'excel' ? 'xlsx' : format;
      a.download = `workforce_ai_${activeReport}_report.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => {
      alert("Export failed: " + err.message);
    });
  };

  // Filter report data by search term
  const filteredData = reportData.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.employee_name && item.employee_name.toLowerCase().includes(term)) ||
      (item.employee_code && item.employee_code.toLowerCase().includes(term)) ||
      (item.department && item.department.toLowerCase().includes(term)) ||
      (item.job_title && item.job_title.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full px-6 py-5 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <FileText className="w-4 h-4" />
            Module 19 • Enterprise Intelligence
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Export Suite</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time analytics reports, audit compliance rosters, and automated PDF / Excel exports.
          </p>
        </div>

        {/* Global Export Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Download Microsoft Excel .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Generate Printable Corporate PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Workforce</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_employees}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {summary.active_employees} Active Profiles
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Monthly Payroll</span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">${summary.total_monthly_payroll.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Avg: ${summary.avg_salary.toLocaleString()} / year
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Attendance Rate</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.attendance_rate}%</div>
            <div className="text-[11px] text-slate-500 mt-1">Biometric shift compliance</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Flight Risk</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.avg_attrition_risk}%</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {summary.high_risk_employee_count} High Risk Monitored
            </div>
          </div>
        </div>
      )}

      {/* Report Categories Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveReport('employees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            activeReport === 'employees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory Report
        </button>
        <button
          onClick={() => setActiveReport('attrition')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            activeReport === 'attrition'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          AI Attrition & Risk Report
        </button>
        <button
          onClick={() => setActiveReport('payroll')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            activeReport === 'payroll'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payroll & Compensation Report
        </button>
        <button
          onClick={() => setActiveReport('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            activeReport === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Attendance & Shifts Report
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report by name, code, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Department:
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <button
            onClick={fetchReportData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading report dataset...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-medium">No matching report records found.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeReport === 'employees' && (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Role Title</th>
                    <th className="py-3.5 px-4 text-right">Salary</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{emp.employee_code}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4">{emp.department}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{emp.job_title}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">${emp.salary.toLocaleString()}</td>
                      <td className="py-3 px-4">{emp.employment_type}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          emp.risk_level === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          emp.risk_level === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          emp.risk_level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {emp.risk_level || 'LOW'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'attrition' && (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4 text-center">Flight Probability</th>
                    <th className="py-3.5 px-4">Risk Tier</th>
                    <th className="py-3.5 px-4">Primary Flight Driver</th>
                    <th className="py-3.5 px-4">Tenure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((att, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{att.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{att.employee_code}</div>
                      </td>
                      <td className="py-3 px-4">{att.department}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{att.job_title}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono font-bold text-slate-900">{att.risk_score.toFixed(1)}%</div>
                        <div className="w-20 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${att.risk_score >= 60 ? 'bg-rose-500' : att.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(att.risk_score, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          att.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          att.risk_level === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          att.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {att.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{att.primary_driver}</td>
                      <td className="py-3 px-4 text-slate-500">{att.tenure_years} yrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'payroll' && (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Pay Period</th>
                    <th className="py-3.5 px-4 text-right">Basic</th>
                    <th className="py-3.5 px-4 text-right">Allowances</th>
                    <th className="py-3.5 px-4 text-right">Bonus</th>
                    <th className="py-3.5 px-4 text-right">Tax & PF</th>
                    <th className="py-3.5 px-4 text-right font-bold text-slate-900">Net Disbursed</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.employee_name}</td>
                      <td className="py-3 px-4">{p.department}</td>
                      <td className="py-3 px-4 font-mono">{p.month_year}</td>
                      <td className="py-3 px-4 text-right font-mono">${p.basic_salary.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono">${p.allowances.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">${p.bonus.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-500">-${(p.tax_deduction + p.provident_fund).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${p.net_salary.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'attendance' && (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Shift Type</th>
                    <th className="py-3.5 px-4">Check-In</th>
                    <th className="py-3.5 px-4">Check-Out</th>
                    <th className="py-3.5 px-4 text-right">Hours</th>
                    <th className="py-3.5 px-4 text-right">Overtime</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((att, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{att.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{att.employee_name}</td>
                      <td className="py-3 px-4">{att.department}</td>
                      <td className="py-3 px-4 text-slate-500">{att.shift_type}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600">{att.check_in || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{att.check_out || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">{att.working_hours}h</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-600">{att.overtime_hours > 0 ? `+${att.overtime_hours}h` : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          att.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Showing <span className="font-semibold text-slate-800">{filteredData.length}</span> records</div>
          <div className="text-[11px] text-slate-400">Export formats: CSV, Microsoft Excel (.xlsx), Printable Corporate PDF</div>
        </div>
      </div>
    </div>
  );
}
