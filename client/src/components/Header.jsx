import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { sseClient } from '../services/sse';
import {
  Shield,
  Bell,
  Globe,
  User,
  LogOut,
  PlayCircle,
  Menu,
  X,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export function Header({ onOpenDemo, activeTab, setActiveTab }) {
  const { user, citizen, logout, quickLogin } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.notifications.list();
      setNotifications(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = sseClient.subscribe((evt) => {
      if (evt.type === 'NOTIFICATION_CREATED') {
        setNotifications((prev) => [evt.data, ...prev]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Government Disclaimer & SIH Banner */}
      <div className="bg-[#0f294a] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-amber-400">SIH 2026 Prototype</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-200">Government of Maharashtra — Problem Statement 129: Platform Interoperability</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300 text-[11px]">
            <span>MahaDBT</span>
            <span>•</span>
            <span>MahaBhumi</span>
            <span>•</span>
            <span>e-Pramaan</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Connectors Online</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Emblem */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-lg bg-[#0f294a] flex items-center justify-center text-white font-bold shadow-xs">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-[#0f294a]">SANGAM</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  संगम
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                One Citizen. Connected Services. One Unified Journey.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'home'
                  ? 'bg-slate-100 text-[#0f294a] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('navHome')}
            </button>

            {user && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-100 text-[#0f294a] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t('navDashboard')}
                </button>

                <button
                  onClick={() => setActiveTab('citizen360')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'citizen360'
                      ? 'bg-slate-100 text-[#0f294a] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t('navCitizen360')}
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'architecture'
                  ? 'bg-slate-100 text-[#0f294a] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('navArchitecture')}
            </button>

            {/* Run Interoperability Demo Button */}
            <button
              onClick={onOpenDemo}
              className="ml-2 inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{t('runDemoBtn')}</span>
            </button>
          </nav>

          {/* Right Header Controls: Language, Notifications, User/Role */}
          <div className="flex items-center space-x-3">
            {/* Language Selector: EN | हिन्दी | मराठी */}
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'en'
                    ? 'bg-white text-[#0f294a] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'hi'
                    ? 'bg-white text-[#0f294a] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => changeLanguage('mr')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'mr'
                    ? 'bg-white text-[#0f294a] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* Notifications Bell (for logged in user) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-800">
                        {t('recentNotificationsTitle')} ({unreadCount} unread)
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t('markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          {t('noNotifications')}
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 text-xs ${
                              notif.read ? 'bg-white' : 'bg-blue-50/50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-semibold text-slate-800">{notif.title}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-snug">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Role Switcher for SIH Judging / User Profile */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden lg:flex items-center space-x-1.5 bg-slate-100 rounded-md p-1 text-xs">
                  <span className="text-[11px] text-slate-500 font-medium px-1">Role:</span>
                  <button
                    onClick={() => quickLogin('CITIZEN')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      user.role === 'CITIZEN' ? 'bg-[#0f294a] text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Citizen
                  </button>
                  <button
                    onClick={() => quickLogin('DEPARTMENT_OFFICER')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      user.role === 'DEPARTMENT_OFFICER' ? 'bg-[#0f294a] text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Officer
                  </button>
                  <button
                    onClick={() => quickLogin('INTEGRATION_ADMIN')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      user.role === 'INTEGRATION_ADMIN' ? 'bg-[#0f294a] text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>

                <div className="flex items-center space-x-2 border-l border-slate-200 pl-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t('navLogout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#0f294a] text-white hover:bg-[#1e3a62] transition-colors"
              >
                {t('navLogin')}
              </button>
            )}

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drop */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            <button
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded"
            >
              {t('navHome')}
            </button>
            {user && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded"
                >
                  {t('navDashboard')}
                </button>
                <button
                  onClick={() => { setActiveTab('citizen360'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded"
                >
                  {t('navCitizen360')}
                </button>
              </>
            )}
            <button
              onClick={() => { setActiveTab('architecture'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded"
            >
              {t('navArchitecture')}
            </button>
            <button
              onClick={() => { onOpenDemo(); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded"
            >
              {t('runDemoBtn')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
