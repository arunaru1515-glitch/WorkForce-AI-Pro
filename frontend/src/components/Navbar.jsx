import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  LogOut, 
  CheckCheck, 
  BrainCircuit, 
  CalendarDays, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Search,
  SlidersHorizontal,
  Users,
  Building2,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI, searchAPI, departmentsAPI } from '../services/api';

export default function Navbar({ setActiveTab }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'LEAVES' | 'PAYROLL'
  const notifRef = useRef(null);

  // Module 24: Advanced Multi-Filter Global Search State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchRisk, setSearchRisk] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchMinSalary, setSearchMinSalary] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const fetchNotifs = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data);
    } catch (e) {
      // silently handle
    }
  };

  useEffect(() => {
    departmentsAPI.getAll().then(res => setDepartments(res.data)).catch(() => {});
  }, []);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
      if (e.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchModal]);

  const executeSearch = async () => {
    setSearchLoading(true);
    try {
      const params = {};
      if (searchQuery) params.query = searchQuery;
      if (searchDept) params.department_id = searchDept;
      if (searchRisk) params.risk_level = searchRisk;
      if (searchStatus) params.status = searchStatus;
      if (searchMinSalary) params.min_salary = parseFloat(searchMinSalary);

      const res = await searchAPI.globalSearch(params);
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (showSearchModal) {
      executeSearch();
    }
  }, [showSearchModal, searchQuery, searchDept, searchRisk, searchStatus, searchMinSalary]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
    }
    if (showNotifMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifMenu]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.markRead(id);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await handleMarkOneRead(notif.id);
    }
    setShowNotifMenu(false);

    // Deep link navigation
    if (setActiveTab) {
      const lower = (notif.title + ' ' + notif.message).toLowerCase();
      if (lower.includes('flight risk') || lower.includes('attrition') || lower.includes('risk score')) {
        setActiveTab('attrition');
      } else if (lower.includes('retention') || lower.includes('intervention')) {
        setActiveTab('interventions');
      } else if (lower.includes('leave')) {
        setActiveTab('leaves');
      } else if (lower.includes('payroll') || lower.includes('salary')) {
        setActiveTab('payroll');
      } else if (lower.includes('attendance') || lower.includes('shift')) {
        setActiveTab('attendance');
      } else if (lower.includes('employee') || lower.includes('hire')) {
        setActiveTab('employees');
      } else if (lower.includes('department')) {
        setActiveTab('departments');
      }
    }
  };

  const getNotifDetails = (title, type) => {
    const lower = (title + ' ' + type).toLowerCase();
    if (lower.includes('flight risk') || lower.includes('attrition') || lower.includes('risk score')) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-200',
        label: 'Flight Risk Alert',
        targetTab: 'attrition'
      };
    }
    if (lower.includes('retention') || lower.includes('intervention')) {
      return {
        icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
        bg: 'bg-purple-50 border-purple-200',
        label: 'Retention Action Plan',
        targetTab: 'interventions'
      };
    }
    if (lower.includes('leave')) {
      return {
        icon: <CalendarDays className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-50 border-amber-200',
        label: 'Leave Request',
        targetTab: 'leaves'
      };
    }
    if (lower.includes('payroll') || lower.includes('salary')) {
      return {
        icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-200',
        label: 'Payroll Batch',
        targetTab: 'payroll'
      };
    }
    if (lower.includes('warning') || lower.includes('alert')) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-200',
        label: 'Important Alert',
        targetTab: 'dashboard'
      };
    }
    if (lower.includes('attendance') || lower.includes('late')) {
      return {
        icon: <Clock className="w-4 h-4 text-orange-600" />,
        bg: 'bg-orange-50 border-orange-200',
        label: 'Attendance Biometrics',
        targetTab: 'attendance'
      };
    }
    return {
      icon: <Sparkles className="w-4 h-4 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-200',
      label: 'System Update',
      targetTab: 'dashboard'
    };
  };

  const filteredNotifs = notifications.filter(n => {
    if (categoryFilter === 'UNREAD') return !n.is_read;
    if (categoryFilter === 'LEAVES') return (n.title + n.message).toLowerCase().includes('leave');
    if (categoryFilter === 'PAYROLL') return (n.title + n.message).toLowerCase().includes('payroll') || (n.title + n.message).toLowerCase().includes('salary');
    return true;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'HR': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MANAGER': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-300/90 px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      {/* Left: Brand Identity & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
            WorkForce Intelligence Platform
          </div>
          <div className="text-[11px] text-slate-500">
            Core HRMS • Attendance Biometrics • Payroll • Leave Management
          </div>
        </div>
      </div>

      {/* Center: Module 24 Advanced Multi-Filter Global Search Trigger */}
      <button
        onClick={() => setShowSearchModal(true)}
        className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs transition-colors shadow-2xs cursor-pointer max-w-sm w-full mx-4"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="flex-1 text-left font-medium">Search directory, skills, risk tiers...</span>
        <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white font-mono text-[10px] text-slate-400 font-bold">
          Ctrl+K
        </kbd>
      </button>

      {/* Right Controls: Notification Center + User Profile + Logout */}
      <div className="flex items-center gap-3">
        
        {/* Improved Notification Dropdown Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer relative ${
              showNotifMenu 
                ? 'bg-blue-50 border-blue-300 text-blue-600 ring-2 ring-blue-500/20' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Elevated Notification Popover Modal */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2.5 w-[420px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/15 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              
              {/* Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => setShowNotifMenu(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-slate-100 px-3 pt-2 gap-1 text-xs font-semibold bg-white">
                {[
                  { id: 'ALL', label: `All (${notifications.length})` },
                  { id: 'UNREAD', label: `Unread (${unreadCount})` },
                  { id: 'LEAVES', label: 'Leaves' },
                  { id: 'PAYROLL', label: 'Payroll' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                      categoryFilter === tab.id
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {filteredNotifs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <CheckCheck className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="font-semibold text-slate-600">You're all caught up!</div>
                    <div className="text-[11px] text-slate-400">No {categoryFilter.toLowerCase()} notifications found.</div>
                  </div>
                ) : (
                  filteredNotifs.map((n) => {
                    const detail = getNotifDetails(n.title, n.type);
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 flex items-start gap-3 transition-all cursor-pointer group hover:bg-blue-50/40 relative ${
                          !n.is_read ? 'bg-blue-50/20' : 'bg-white'
                        }`}
                      >
                        {/* Type Icon Badge */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${detail.bg}`}>
                          {detail.icon}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              View details <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>

                        {/* Quick Action: Mark as read button */}
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkOneRead(n.id, e)}
                            className="absolute right-3 top-3.5 p-1 rounded-md text-slate-300 hover:text-blue-600 hover:bg-blue-100/60 transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Real-time workforce alerts
                </span>
                <span className="text-slate-400 font-mono">
                  Sync: Live
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge */}
        <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
          {user?.role || 'ADMIN'}
        </div>

        {/* User Info (Desktop) */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-800 leading-tight">
            {user?.full_name || 'Admin User'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
            {user?.email}
          </span>
        </div>

        {/* Clean Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          title="Sign out of workspace"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Module 24: Advanced Multi-Filter Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-600 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search by name, role, employee code, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Multi-Filter Controls */}
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Department</label>
                <select
                  value={searchDept}
                  onChange={(e) => setSearchDept(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Flight Risk</label>
                <select
                  value={searchRisk}
                  onChange={(e) => setSearchRisk(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">All Risk Tiers</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
                <select
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On-Leave">On-Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Min Salary ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 80000"
                  value={searchMinSalary}
                  onChange={(e) => setSearchMinSalary(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Results Roster */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {searchLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Searching workforce profiles...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching employees found with applied filters.
                </div>
              ) : (
                searchResults.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setShowSearchModal(false);
                      if (setActiveTab) setActiveTab('employees');
                    }}
                    className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {emp.full_name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          {emp.full_name}
                          <span className="text-[10px] font-mono text-slate-400">({emp.employee_code})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {emp.department_name} • {emp.job_title} • ${emp.salary.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.risk_level === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          emp.risk_level === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          emp.risk_level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          Risk: {emp.risk_score?.toFixed(1) || 20}% ({emp.risk_level || 'LOW'})
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Att: {emp.attendance_rate}%</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{searchResults.length} matches found</span>
              <span>Press ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

