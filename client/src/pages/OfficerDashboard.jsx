import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { sseClient } from '../services/sse';
import { ApplicationDetailsModal } from '../components/ApplicationDetailsModal';
import {
  Building,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';

export function OfficerDashboard({ onSelectCitizen360 }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await api.applications.list({
        status: statusFilter,
        department: deptFilter,
        search
      });
      setApplications(data);
    } catch (err) {
      console.error('Error fetching officer applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    const unsubscribe = sseClient.subscribe((evt) => {
      if (evt.type === 'APPLICATION_UPDATED' || evt.type === 'APPLICATION_CREATED') {
        fetchApplications();
      }
    });

    return () => unsubscribe();
  }, [statusFilter, deptFilter, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">{t('officerDashboardTitle')}</h2>
          </div>
          <p className="text-xs text-slate-500">
            Authenticated as <strong>{user?.name}</strong> (Department Officer) — Reviewing automated departmental verifications.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-700">Total in Queue:</span>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {applications.length}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Citizen Name, Sangam ID, or App Number..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a] bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONSENT_REQUIRED">Consent Required</option>
              <option value="FAILED">Sync Paused / Failed</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-medium">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a] bg-white font-medium"
            >
              <option value="ALL">All Departments</option>
              <option value="EDUCATION">Education</option>
              <option value="REVENUE">Revenue</option>
              <option value="WELFARE">Welfare</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">App Number</th>
                <th className="px-4 py-3 text-left">Citizen / Sangam ID</th>
                <th className="px-4 py-3 text-left">Service Scheme</th>
                <th className="px-4 py-3 text-left">Attached Verified Records</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No applications matching current filters.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const verifiedCount = Array.isArray(app.verifiedDocuments)
                    ? app.verifiedDocuments.length
                    : 0;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#0f294a]">
                        {app.applicationNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{app.citizenName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{app.sangamId}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{app.serviceType}</td>
                      <td className="px-4 py-3">
                        {verifiedCount > 0 ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Revenue Data Attached</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Awaiting sync</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : app.status === 'UNDER_REVIEW'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => onSelectCitizen360(app.citizenId)}
                          className="px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 font-medium rounded border border-blue-200 transition-colors"
                          title="Open Unified Citizen 360"
                        >
                          Citizen 360
                        </button>
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1 text-xs bg-[#0f294a] text-white font-semibold rounded hover:bg-[#1a385f] transition-colors"
                        >
                          {t('reviewAction')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Details Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdated={() => {
            fetchApplications();
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
}
