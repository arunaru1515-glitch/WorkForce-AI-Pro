import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (tab === 'login') {
        await login(email, password);
      } else if (tab === 'register') {
        await authAPI.register({
          email,
          password,
          full_name: fullName,
          role
        });
        setMessage("Account created successfully! Please sign in with your new credentials.");
        setTab('login');
      } else if (tab === 'forgot') {
        const res = await authAPI.forgotPassword(email);
        setMessage(res.data.message || "Password reset instructions have been dispatched.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, demoPwd);
    } catch (err) {
      setError("Login failed with selected demo credentials.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { roleName: 'Admin', roleTag: 'ADMIN', email: 'admin@workforce.ai', pass: 'Admin@123', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { roleName: 'HR Director', roleTag: 'HR', email: 'hr@workforce.ai', pass: 'Hr@123', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    { roleName: 'Manager', roleTag: 'MANAGER', email: 'manager@workforce.ai', pass: 'Manager@123', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
    { roleName: 'Employee', roleTag: 'EMPLOYEE', email: 'employee@workforce.ai', pass: 'Employee@123', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-[#ebf1f7] flex flex-col justify-center items-center p-6 selection:bg-blue-100 selection:text-blue-900 font-sans">
      <div className="w-full max-w-[440px] space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-600 text-white items-center justify-center shadow-lg shadow-blue-500/25 mb-1 ring-4 ring-blue-100">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WorkForce AI Pro</h1>
          <p className="text-xs text-slate-500 font-medium">Enterprise HR Intelligence & Workforce Management</p>
        </div>

        {/* Crisp Clean White Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-300/40 p-7 space-y-5">
          
          {/* Segmented Control Pill Tabs */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); setMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); setMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setTab('forgot'); setError(''); setMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                tab === 'forgot'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Reset
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {tab === 'register' && (
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Work Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@workforce.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10 transition-all font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            {tab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Password</label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {tab === 'register' && (
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Organizational Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="EMPLOYEE">Employee (Staff Member)</option>
                  <option value="MANAGER">Manager (Department Lead)</option>
                  <option value="HR">HR Lead (Human Resources)</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {tab === 'login' ? 'Sign In to Workspace' : tab === 'register' ? 'Create Account' : 'Send Recovery Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Neat & Clean 1-Click Demo Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Instant Demo Access
              </span>
              <span className="text-[10px] text-slate-400">1-click login</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 border border-slate-200/90 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {acc.roleName}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${acc.badgeColor}`}>
                      {acc.roleTag}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {acc.email}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <KeyRound className="w-2.5 h-2.5" /> {acc.pass}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-slate-400">
          WorkForce AI Pro • Enterprise RBAC Protected
        </div>

      </div>
    </div>
  );
}
