import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Plus, FileText, X, Printer, ShieldCheck } from 'lucide-react';
import { payrollAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PayrollPage() {
  const { user } = useAuth();
  const isHRorAdmin = ['ADMIN', 'HR'].includes(user?.role);
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [genData, setGenData] = useState({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: 0,
    other_deductions: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, empRes] = await Promise.all([
        payrollAPI.getAll(),
        employeesAPI.getAll()
      ]);
      setPayrolls(pRes.data);
      setEmployees(empRes.data);
      if (empRes.data.length > 0 && !genData.employee_id) {
        setGenData(prev => ({ ...prev, employee_id: empRes.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await payrollAPI.generate({
        ...genData,
        employee_id: parseInt(genData.employee_id),
        bonus: parseFloat(genData.bonus || 0),
        other_deductions: parseFloat(genData.other_deductions || 0)
      });
      setShowGenModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error generating payroll");
    }
  };

  const handleMarkPaid = async (payrollId) => {
    try {
      await payrollAPI.markPaid(payrollId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="w-full px-6 py-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isHRorAdmin ? 'Payroll & Compensation' : 'My Compensation & Payslips'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHRorAdmin 
              ? 'Automated salary structures, tax withholdings, and employee payslips.'
              : 'Personal monthly salary breakdown, benefits, deductions, and downloadable payslips.'}
          </p>
        </div>
        {isHRorAdmin && (
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Calculate Payroll
          </button>
        )}
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{isHRorAdmin ? 'Employee' : 'Account'}</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Basic Salary</th>
                <th className="py-3 px-4">HRA + Allowances</th>
                <th className="py-3 px-4">Tax + PF Deductions</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading payroll records...</td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    {isHRorAdmin 
                      ? 'No payroll records generated yet.' 
                      : 'No payslips generated for your account yet. Contact HR to process your monthly cycle.'}
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.employee_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.employee_code} • {p.department_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {p.month}/{p.year}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">${p.basic_salary.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">+${(p.hra + p.allowances).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">-${(p.tax_deduction + p.provident_fund).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      ${p.net_salary.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        p.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayslip(p)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 border border-slate-200 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" /> Payslip
                        </button>
                        {isHRorAdmin && p.status !== 'Paid' && (
                          <button
                            onClick={() => handleMarkPaid(p.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payroll Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Run Payroll Calculation</h3>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Select Employee</label>
                <select
                  required
                  value={genData.employee_id}
                  onChange={(e) => setGenData({...genData, employee_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} (${e.salary}/yr)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Month</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={genData.month}
                    onChange={(e) => setGenData({...genData, month: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={genData.year}
                    onChange={(e) => setGenData({...genData, year: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Bonus ($)</label>
                  <input
                    type="number"
                    value={genData.bonus}
                    onChange={(e) => setGenData({...genData, bonus: parseFloat(e.target.value || 0)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={genData.other_deductions}
                    onChange={(e) => setGenData({...genData, other_deductions: parseFloat(e.target.value || 0)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium shadow-xs cursor-pointer"
                >
                  Generate Breakdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Payslip</h3>
                <span className="text-[11px] text-slate-500">Cycle: {selectedPayslip.month}/{selectedPayslip.year}</span>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedPayslip.employee_name}</div>
                  <div className="text-slate-500">{selectedPayslip.department_name} • {selectedPayslip.employee_code}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                  {selectedPayslip.status}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-700">
                  <span>Basic Salary:</span>
                  <span className="font-mono font-medium">${selectedPayslip.basic_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>House Rent Allowance (HRA):</span>
                  <span className="font-mono font-medium">${selectedPayslip.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Special & Transport Allowances:</span>
                  <span className="font-mono font-medium">${selectedPayslip.allowances.toLocaleString()}</span>
                </div>
                {selectedPayslip.bonus > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Performance Bonus:</span>
                    <span className="font-mono font-medium">+${selectedPayslip.bonus.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-rose-600 pt-1 border-t border-slate-200">
                  <span>Income Tax Withholding (10%):</span>
                  <span className="font-mono font-medium">-${selectedPayslip.tax_deduction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Provident Fund (12%):</span>
                  <span className="font-mono font-medium">-${selectedPayslip.provident_fund.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Net Take-Home Salary:</span>
                <span className="font-mono font-extrabold text-slate-900 text-base">
                  ${selectedPayslip.net_salary.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Payslip
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-xs font-semibold cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
