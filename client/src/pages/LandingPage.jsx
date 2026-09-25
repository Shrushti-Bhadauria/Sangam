import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import {
  Shield,
  PlayCircle,
  ArrowRight,
  Database,
  Building,
  CheckCircle,
  Layers,
  FileCheck,
  Lock,
  Cpu,
  BarChart3,
  ExternalLink
} from 'lucide-react';

export function LandingPage({ onOpenDemo, onGoToLogin, onGoToDashboard }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalIntegrations: 3892,
    activeConnectors: 4,
    successRate: '98.6%'
  });

  useEffect(() => {
    // Optionally fetch public stats if available
    api.admin.getStats().then((data) => {
      if (data && data.totalIntegrations !== undefined) {
        const total = data.totalIntegrations || 1;
        const success = data.successfulIntegrations || 0;
        const rate = ((success / Math.max(1, total)) * 100).toFixed(1);
        setStats({
          totalIntegrations: data.totalIntegrations,
          activeConnectors: data.activeConnectors,
          successRate: `${rate}%`
        });
      }
    }).catch(() => {});
  }, []);

  const howSteps = [
    { num: '01', title: t('howStep1Title'), desc: t('howStep1Desc'), icon: FileCheck },
    { num: '02', title: t('howStep2Title'), desc: t('howStep2Desc'), icon: Cpu },
    { num: '03', title: t('howStep3Title'), desc: t('howStep3Desc'), icon: Lock },
    { num: '04', title: t('howStep4Title'), desc: t('howStep4Desc'), icon: Building },
    { num: '05', title: t('howStep5Title'), desc: t('howStep5Desc'), icon: Database },
    { num: '06', title: t('howStep6Title'), desc: t('howStep6Desc'), icon: CheckCircle }
  ];

  const connectedDepts = [
    {
      title: t('deptEducation'),
      desc: t('deptEducationDesc'),
      system: 'MahaDBT Gateway',
      status: 'Active',
      type: 'REST API'
    },
    {
      title: t('deptRevenue'),
      desc: t('deptRevenueDesc'),
      system: 'MahaBhumi / Aaple Sarkar',
      status: 'Active',
      type: 'SOAP/REST Interoperability'
    },
    {
      title: t('deptWelfare'),
      desc: t('deptWelfareDesc'),
      system: 'Social Justice MIS',
      status: 'Active',
      type: 'OAuth2 Secure Connector'
    },
    {
      title: t('deptRegistry'),
      desc: t('deptRegistryDesc'),
      system: 'e-Pramaan ID Master',
      status: 'Active',
      type: 'Core Identity Hub'
    }
  ];

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-slate-900 via-[#0f294a] to-slate-900 rounded-2xl text-white p-8 sm:p-14 relative overflow-hidden shadow-xl border border-slate-800">
          {/* Subtle geometric grid backdrop */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-10 max-w-3xl space-y-6">
            {/* <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-3 py-1 text-xs text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span></span>
            </div> */}

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              One Citizen. <br />
              {/* Connected Services. <br /> */}
              <span className="text-amber-400">One Unified Journey.</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Maharashtra Government digital portals are often fragmented, requiring citizens to repeatedly submit the same income, demographic, and caste certificates across different department websites.
              <strong> SANGAM</strong> introduces an interoperability layer that connects these departments seamlessly with identity resolution and citizen consent.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenDemo}
                className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-md hover:scale-[1.02] transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{t('runDemoBtn')}</span>
              </button>

              <button
                onClick={onGoToLogin}
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-md border border-white/20 transition-colors flex items-center space-x-2"
              >
                <span>{t('getStarted')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar at bottom of hero */}
          <div className="relative z-10 mt-10 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <p className="text-slate-400">Interoperability Connectors</p>
              <p className="text-xl font-bold text-white mt-0.5">4 Active Systems</p>
            </div>
            <div>
              <p className="text-slate-400">Repeated Paperwork</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">0 Uploads</p>
            </div>
            <div>
              <p className="text-slate-400">Citizen Control</p>
              <p className="text-xl font-bold text-amber-300 mt-0.5">100% Consent Driven</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Sangam Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            End-to-End Interoperability Architecture
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('howSangamWorksTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            How a citizen's scholarship application is automatically verified across government silos in 6 structured steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {howSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0f294a] flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5 text-[#0f294a]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{step.num}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Connected Departments Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Live Connected Ecosystem
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {t('connectedDeptsTitle')}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Interoperability Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {connectedDepts.map((dept, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {dept.type}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{dept.status}</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{dept.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{dept.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>System: {dept.system}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
