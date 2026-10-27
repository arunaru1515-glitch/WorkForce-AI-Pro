import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Clock, 
  CalendarDays, 
  CreditCard, 
  FolderKanban, 
  MessageSquare,
  BrainCircuit,
  TrendingDown,
  LineChart,
  ShieldAlert,
  Database,
  Sparkles,
  CheckSquare,
  Award,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const isManagerOrAbove = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);
  const isHRorAdmin = ['ADMIN', 'HR'].includes(user?.role);

  // RBAC: Regular employees do not have access to company-wide attrition intelligence
  const aiItems = [];
  if (isManagerOrAbove) {
    aiItems.push(
      { id: 'attrition', label: 'AI Attrition Dashboard', icon: TrendingDown },
      { id: 'forecasting', label: 'Workforce Forecasting', icon: LineChart },
      { id: 'interventions', label: 'HR Retention Plans', icon: ShieldAlert },
    );
  }
  if (isHRorAdmin) {
    aiItems.push({ id: 'datasets', label: 'Dataset Management', icon: Database });
  }

  const talentItems = [
    { id: 'performance', label: 'Performance & Growth', icon: Award }
  ];
  if (isManagerOrAbove) {
    talentItems.push({ id: 'reports', label: 'Reports & Exports', icon: FileText });
  }
  if (isHRorAdmin) {
    talentItems.push({ id: 'audit', label: 'Audit Logs & Trail', icon: ShieldCheck });
  }

  const navSections = [
    {
      category: 'CORE HRMS',
      items: [
        { id: 'dashboard', label: 'Workforce Dashboard', icon: LayoutDashboard },
        { id: 'employees', label: 'Employee Directory', icon: Users },
        { id: 'departments', label: 'Departments', icon: Building2 },
      ]
    },
    ...(aiItems.length > 0 ? [{
      category: 'AI INTELLIGENCE & ATTRITION',
      items: aiItems
    }] : []),
    {
      category: 'OPERATIONS & WORKFLOW',
      items: [
        { id: 'attendance', label: 'Attendance & Shifts', icon: Clock },
        { id: 'leaves', label: 'Leave Management', icon: CalendarDays },
        { id: 'payroll', label: 'Payroll & Compensation', icon: CreditCard },
        { id: 'tasks', label: 'Workflow & Tasks', icon: CheckSquare },
      ]
    },
    {
      category: 'ENTERPRISE & TALENT',
      items: talentItems
    },
    {
      category: 'COMMUNICATION & VAULT',
      items: [
        { id: 'chat', label: '1-on-1 Messages', icon: MessageSquare },
        { id: 'documents', label: 'Document Vault', icon: FolderKanban },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0b1329] text-slate-300 flex flex-col justify-between select-none shrink-0 h-screen border-r border-slate-800/80">
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1.5">
              WorkForce <span className="text-blue-500 font-extrabold">AI</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.5 rounded font-bold border border-blue-500/30">PRO</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">HR & Attrition Intelligence</div>
          </div>
        </div>

        {/* Navigation Sections (Scrollable) */}
        <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.category}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/30 shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{user?.full_name || 'Admin User'}</div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider">{user?.role || 'ADMIN'}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
