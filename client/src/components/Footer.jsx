import React from 'react';
import { Shield, ExternalLink, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 text-xs mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: SANGAM overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-base font-bold text-white tracking-wide">SANGAM — संगम</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              A unified government interoperability and data-sharing platform developed for{' '}
              <strong className="text-white">Smart India Hackathon 2026 (Problem Statement 129)</strong>{' '}
              for the Government of Maharashtra.
            </p>
            <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>All 4 departmental interoperability connectors operational</span>
            </div>
          </div>

          {/* Col 2: Architecture components */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">
              Core Pillars
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Identity Resolution</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Citizen Consent Manager</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canonical Data Mapping</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Immutable Audit Logs</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Simulated Portals */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">
              Connected Platforms
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>MahaDBT (Scholarship Portal)</li>
              <li>MahaBhumi & Aaple Sarkar (Revenue)</li>
              <li>e-Pramaan (Unified Citizen Registry)</li>
              <li>Social Justice Directorate (Welfare)</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer row */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>
            ⚠️ <strong>SIH 2026 Academic Prototype</strong>: This system simulates interoperability between Maharashtra state digital services for hackathon evaluation.
          </p>
          <p>
            Built with React, Express, and Database-backed Relational Architecture.
          </p>
        </div>
      </div>
    </footer>
  );
}
