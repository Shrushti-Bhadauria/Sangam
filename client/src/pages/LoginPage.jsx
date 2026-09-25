import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Shield,
  User,
  Building,
  Key,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export function LoginPage({ onLoginSuccess }) {
  const { login, register, quickLogin } = useAuth();
  const { t } = useLanguage();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [taluka, setTaluka] = useState('Haveli');
  const [village, setVillage] = useState('Manjri');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await register({
          name,
          email,
          phone,
          password,
          district,
          taluka,
          village
        });
      } else {
        await login(email, password);
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    setError(null);
    try {
      await quickLogin(role);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError('Quick login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#0f294a] rounded-xl flex items-center justify-center text-white mx-auto shadow-sm">
            <Shield className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRegister ? 'Citizen Registration' : 'Government Identity Login'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Create a unified Sangam Citizen ID linked to Maharashtra state databases'
              : 'Sign in to access your applications, consents, or departmental reviews'}
          </p>
        </div>

        {/* 1-CLICK DEMO ACCOUNTS FOR JUDGING */}
        {!isRegister && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                SIH 2026 Presentation Accounts (1-Click Login)
              </span>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                Pre-Seeded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('CITIZEN')}
                disabled={loading}
                className="p-2.5 bg-white border border-amber-300 rounded-lg text-left hover:bg-amber-100/50 transition-colors shadow-2xs"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Citizen</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Ananya Patil</p>
                <p className="text-[9px] text-slate-400 font-mono">SGM-MH-102934</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('DEPARTMENT_OFFICER')}
                disabled={loading}
                className="p-2.5 bg-white border border-amber-300 rounded-lg text-left hover:bg-amber-100/50 transition-colors shadow-2xs"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Officer</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Suresh Deshmukh</p>
                <p className="text-[9px] text-slate-400">Education Dept</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('INTEGRATION_ADMIN')}
                disabled={loading}
                className="p-2.5 bg-white border border-amber-300 rounded-lg text-left hover:bg-amber-100/50 transition-colors shadow-2xs"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Dr. Neha Kulkarni</p>
                <p className="text-[9px] text-slate-400">Integration Lead</p>
              </button>
            </div>
          </div>
        )}

        {/* Login / Register Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Shankar Patil"
                    className="w-full p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98XXX XXXXX"
                      className="w-full p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">District</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
                    >
                      <option value="Pune">Pune</option>
                      <option value="Nagpur">Nagpur</option>
                      <option value="Nashik">Nashik</option>
                      <option value="Aurangabad">Chhatrapati Sambhajinagar</option>
                      <option value="Kolhapur">Kolhapur</option>
                      <option value="Thane">Thane</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@sangam.gov.in"
                className="w-full p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0f294a] text-white font-semibold rounded-md hover:bg-[#1a385f] transition-colors flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Register & Generate Sangam ID' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="pt-2 border-t border-slate-100 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-blue-700 hover:text-blue-900 font-medium"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register as a Citizen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
