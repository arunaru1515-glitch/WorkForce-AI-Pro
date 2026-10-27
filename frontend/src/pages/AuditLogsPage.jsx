import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  Terminal, 
  User, 
  Lock, 
  AlertCircle,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { auditAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;
      if (searchQuery) params.search = searchQuery;

      const [logsRes, statsRes] = await Promise.all([
        auditAPI.getLogs(params),
        auditAPI.getStats()
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error loading audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [moduleFilter, actionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAuditData();
  };

  return (
    <div className="w-full px-6 py-5 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            Module 20 • Compliance & Governance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs & Activity Tracking</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable tracking of user activities, administrative mutations, and automated AI inference pulses.
          </p>
        </div>

        <button
          onClick={fetchAuditData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Trail
        </button>
      </div>

      {/* Audit Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Audit Records</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.total_logs}</div>
            <div className="text-[11px] text-slate-500 mt-1">Immutable system actions</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Today's Activity</span>
              <Terminal className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.today_count}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Actions in current window</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Operators</span>
              <User className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.active_users_count}</div>
            <div className="text-[11px] text-slate-500 mt-1">Distinct verified accounts</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Monitored Modules</span>
              <Database className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{Object.keys(stats.module_breakdown).length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Active audit channels</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, action or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Module:
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Modules</option>
            <option value="AUTH">Authentication</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="WORKFLOW">Workflow Tasks</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="PAYROLL">Payroll</option>
            <option value="AI">AI Engine</option>
            <option value="REPORTS">Reports Export</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-2">
            Action:
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="EXPORT">EXPORT</option>
            <option value="RUN_AI">AI INFERENCE</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading audit events...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-medium">No matching audit trail logs recorded.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator / User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Details & Payload</th>
                  <th className="py-3.5 px-4 font-mono">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const dateStr = new Date(log.created_at).toLocaleString();
                  const isCritical = ['DELETE', 'RBAC_VIOLATION'].some(k => log.action.includes(k));
                  const isSuccess = ['LOGIN', 'CREATE', 'INIT'].some(k => log.action.includes(k));

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.user_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                          isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{log.module}</td>
                      <td className="py-3 px-4 max-w-md truncate text-slate-800 font-mono text-[11px]">
                        {log.details || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{log.ip_address}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Showing <span className="font-semibold text-slate-800">{logs.length}</span> recorded log entries</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <Lock className="w-3 h-3" /> Audit hashing enabled • RFC-5424 compliant
          </div>
        </div>
      </div>
    </div>
  );
}
