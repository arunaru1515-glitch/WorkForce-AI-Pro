import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  User, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { attendanceAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AttendancePage() {
  const { user } = useAuth();
  const userRole = (user?.role || '').toUpperCase();
  const isHRorAdmin = ['ADMIN', 'HR'].includes(userRole);
  const isStaff = userRole === 'EMPLOYEE';

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Admin / HR Shift Allocation Form State
  const [targetEmpId, setTargetEmpId] = useState('');
  const [targetShiftType, setTargetShiftType] = useState('Morning (9 AM - 5 PM)');
  const [filterDate, setFilterDate] = useState('');
  const [inlineEditingShiftId, setInlineEditingShiftId] = useState(null);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch workforce members (for HR/Admin shift management & display)
      try {
        const empRes = await employeesAPI.getAll();
        const emps = empRes.data || [];
        setEmployees(emps);
        if (emps.length > 0) {
          setTargetEmpId((prev) => prev || emps[0].id);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }

      // 2. Fetch today's personal status
      try {
        const todayRes = await attendanceAPI.getTodayStatus();
        setTodayStatus(todayRes.data);
      } catch (err) {
        console.error("Error fetching today status:", err);
      }

      // 3. Fetch attendance logs
      try {
        const attRes = await attendanceAPI.getAll({ target_date: filterDate || undefined });
        setRecords(attRes.data || []);
      } catch (err) {
        console.error("Error fetching attendance records:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [user, filterDate]);

  // Personal Check-In (Strictly for the logged-in user themselves)
  const handlePersonalCheckIn = async () => {
    setActionLoading(true);
    try {
      await attendanceAPI.checkIn({
        employee_id: todayStatus?.employee_id || undefined,
        notes: "Personal check-in registered via portal."
      });
      setToastMessage("Your check-in has been registered successfully! Shift hours are now logging.");
      await fetchAttendanceData();
      setTimeout(() => setToastMessage(''), 6000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' 
        ? detail 
        : Array.isArray(detail) 
          ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') 
          : "Check-in failed.";
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Personal Check-Out (Strictly for the logged-in user themselves)
  const handlePersonalCheckOut = async () => {
    if (!todayStatus?.record?.id) return;
    setActionLoading(true);
    try {
      await attendanceAPI.checkOut({
        attendance_id: todayStatus.record.id,
        notes: "Personal shift conclusion."
      });
      setToastMessage("You have checked out successfully! Working hours and overtime calculated.");
      await fetchAttendanceData();
      setTimeout(() => setToastMessage(''), 6000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' 
        ? detail 
        : Array.isArray(detail) 
          ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') 
          : "Check-out failed.";
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Today's Clock (Allows testing Clock In & Clock Out repeatedly)
  const handleResetToday = async () => {
    setActionLoading(true);
    try {
      await attendanceAPI.resetToday();
      setToastMessage("Today's shift record has been reset. You can now test Clock In!");
      await fetchAttendanceData();
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      alert("Failed to reset clock: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // HR / Admin Shift Assignment (Only changes shift schedule, does NOT check in/out)
  const handleAssignShiftSchedule = async (e) => {
    e.preventDefault();
    if (!targetEmpId) return;
    setActionLoading(true);
    try {
      const res = await attendanceAPI.assignShift(parseInt(targetEmpId), targetShiftType);
      setToastMessage(res.data.message || `Shift schedule successfully updated to ${targetShiftType}.`);
      await fetchAttendanceData();
      setTimeout(() => setToastMessage(''), 6000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to assign shift schedule.");
    } finally {
      setActionLoading(false);
    }
  };

  // HR / Admin Inline Shift Change on an existing record
  const handleInlineShiftChange = async (attendanceId, newShift) => {
    try {
      await attendanceAPI.updateShift(attendanceId, newShift);
      setToastMessage(`Record shift schedule updated to ${newShift} successfully.`);
      setInlineEditingShiftId(null);
      await fetchAttendanceData();
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update record shift schedule.");
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isStaff ? 'My Daily Attendance & Work Clock' : 'Attendance & Shift Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStaff 
              ? 'Personal clock-in/out console, active shift hours tracking, and log history.'
              : 'Corporate shift allocation, workforce arrival roster, and overtime monitoring.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHRorAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> HR / Admin Controller
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <User className="w-3.5 h-3.5 text-blue-600" /> Personal Account
            </span>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. PERSONAL WORK CLOCK (Every User Only Clocks In/Out for Themselves) */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {todayStatus?.employee_name || user?.full_name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">({user?.email})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayStr}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">Personal Work Clock</span>
              </div>
            </div>
          </div>

          {/* Assigned Shift Schedule */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                My Assigned Shift
              </span>
              <span className="text-xs font-bold text-slate-800">
                {todayStatus?.assigned_shift || 'Morning (9 AM - 5 PM)'}
              </span>
            </div>
            <div className="pl-3 border-l border-slate-200 flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>HR Controlled</span>
            </div>
          </div>
        </div>

        {/* Live Clock Status & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            {!todayStatus?.record ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Not Checked In Today
                </div>
                <p className="text-[11px] text-slate-500">
                  Click the button below to register your personal arrival for today.
                </p>
              </div>
            ) : !todayStatus.record.check_out ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Currently Checked In (Active)
                </div>
                <p className="text-[11px] text-slate-700 font-mono">
                  Arrived at: <span className="font-bold text-slate-900">{new Date(todayStatus.record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> • Shift currently logging
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Shift Completed for Today
                </div>
                <p className="text-[11px] text-slate-700 font-mono">
                  {todayStatus.record.working_hours} hrs logged • Overtime: +{todayStatus.record.overtime_hours} hrs
                </p>
              </div>
            )}
          </div>

          {/* Clock Buttons (Strictly personal) */}
          <div className="flex items-center gap-3">
            {!todayStatus?.record ? (
              <button
                onClick={handlePersonalCheckIn}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Clock In / Check-In
              </button>
            ) : !todayStatus.record.check_out ? (
              <button
                onClick={handlePersonalCheckOut}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Clock Out / End Shift
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Shift Concluded
                </span>
                <button
                  onClick={handleResetToday}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-xs transition-all cursor-pointer"
                  title="Reset today's attendance to test Clock In and Clock Out again"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset & Re-Clock In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. HR / ADMIN SHIFT ALLOCATION PANEL (Only assigns shifts)     */}
      {/* ============================================================== */}
      {isHRorAdmin && (
        <form onSubmit={handleAssignShiftSchedule} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Shift Schedule Allocation & Assignment (HR / Admin)
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Shift Management Only
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Assign or change shift schedules for workforce members. Employees, HR, and Managers must check in and out from their own individual portal accounts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Select Workforce Member
              </label>
              <select
                value={targetEmpId}
                onChange={(e) => setTargetEmpId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {employees.length === 0 ? (
                  <option value="">Loading workforce members...</option>
                ) : (
                  employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} ({e.employee_code} • {e.department_name})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Assign Shift Schedule
              </label>
              <select
                value={targetShiftType}
                onChange={(e) => setTargetShiftType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="Morning (9 AM - 5 PM)">Morning (9 AM - 5 PM)</option>
                <option value="Evening (1 PM - 9 PM)">Evening (1 PM - 9 PM)</option>
                <option value="Night (9 PM - 5 AM)">Night (9 PM - 5 AM)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer h-[34px]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Assign Shift Schedule
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 3. WORKFORCE ATTENDANCE ROSTER / MY HISTORY TABLE              */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {isStaff ? 'My Attendance History' : 'Workforce Attendance Roster & Shifts'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isStaff 
                ? 'Your personal verified check-in, check-out, and overtime records.'
                : 'Workforce arrival status and shift schedules. HR / Admin can modify shift allocations directly.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={fetchAttendanceData}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Shift Schedule</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Hours Logged</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4">Arrival Status</th>
                {isHRorAdmin && <th className="py-3 px-4 text-right">Shift Reassignment</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={isHRorAdmin ? 9 : 8} className="py-8 text-center text-slate-400">
                    Loading attendance entries...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={isHRorAdmin ? 9 : 8} className="py-8 text-center text-slate-400">
                    No attendance records found for this view.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {r.employee_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {r.date}
                    </td>
                    <td className="py-3 px-4">
                      {isHRorAdmin && inlineEditingShiftId === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            defaultValue={r.shift_type}
                            onChange={(e) => handleInlineShiftChange(r.id, e.target.value)}
                            className="bg-white border border-purple-300 rounded px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none"
                          >
                            <option value="Morning (9 AM - 5 PM)">Morning (9 AM - 5 PM)</option>
                            <option value="Evening (1 PM - 9 PM)">Evening (1 PM - 9 PM)</option>
                            <option value="Night (9 PM - 5 AM)">Night (9 PM - 5 AM)</option>
                          </select>
                          <button
                            onClick={() => setInlineEditingShiftId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            r.shift_type?.includes('Morning')
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : r.shift_type?.includes('Evening')
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {r.shift_type || 'Morning (9 AM - 5 PM)'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {r.check_out ? (
                        new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="text-amber-600 font-semibold">In Progress</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {r.working_hours > 0 ? `${r.working_hours} hrs` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                      {r.overtime_hours > 0 ? `+${r.overtime_hours} hrs` : '0.0 hrs'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        r.status === 'Present' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    {isHRorAdmin && (
                      <td className="py-3 px-4 text-right">
                        {inlineEditingShiftId === r.id ? (
                          <span className="text-[11px] text-purple-600 font-medium">Selecting...</span>
                        ) : (
                          <button
                            onClick={() => setInlineEditingShiftId(r.id)}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                            title="Reassign Shift Schedule"
                          >
                            Change Shift
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
