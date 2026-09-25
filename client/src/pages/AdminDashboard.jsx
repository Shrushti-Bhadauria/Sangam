import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { sseClient } from '../services/sse';
import { EventDetailsModal } from '../components/EventDetailsModal';
import {
  Activity,
  Layers,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Building,
  Database,
  Cpu,
  ShieldAlert,
  Clock,
  Play,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [events, setEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [dataIssues, setDataIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [revenueSimFailure, setRevenueSimFailure] = useState(false);
  const [eventStatusFilter, setEventStatusFilter] = useState('ALL');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsData, connData, eventsData, auditData, issuesData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getConnectors(),
        api.integrations.getEvents({ status: eventStatusFilter }),
        api.admin.getAuditLogs({ limit: 20 }),
        api.admin.getDataQualityIssues()
      ]);

      setStats(statsData);
      setConnectors(connData);
      setEvents(eventsData);
      setAuditLogs(auditData);
      setDataIssues(issuesData);
      setRevenueSimFailure(!!statsData?.isRevenueFailureSimulated);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    const unsubscribe = sseClient.subscribe((evt) => {
      // Auto-refresh when relevant events arrive
      if (
        evt.type === 'INTEGRATION_EVENT_UPDATED' ||
        evt.type === 'AUDIT_LOG_CREATED' ||
        evt.type === 'APPLICATION_UPDATED'
      ) {
        fetchAll();
      }
    });

    return () => unsubscribe();
  }, [eventStatusFilter]);

  const handleToggleConnector = async (id, currentEnabled) => {
    try {
      await api.admin.toggleConnector(id, !currentEnabled);
      fetchAll();
    } catch (err) {
      alert('Failed to toggle connector: ' + err.message);
    }
  };

  const handleTestConnector = async (id) => {
    setTestResult(null);
    try {
      const res = await api.admin.testConnector(id);
      setTestResult({ connectorId: id, ...res });
      fetchAll();
    } catch (err) {
      alert('Test ping failed: ' + err.message);
    }
  };

  const handleToggleSimulatedFailure = async () => {
    const nextState = !revenueSimFailure;
    try {
      await api.integrations.toggleFailure(nextState);
      setRevenueSimFailure(nextState);
      fetchAll();
    } catch (err) {
      alert('Failed to set simulated failure: ' + err.message);
    }
  };

  const handleResetData = async () => {
    if (confirm('Reset database and re-seed clean demonstration data?')) {
      try {
        await api.admin.resetData();
        fetchAll();
        alert('Database re-seeded with demo records successfully.');
      } catch (err) {
        alert('Reset failed: ' + err.message);
      }
    }
  };

  const handleResolveIssue = async (id) => {
    try {
      await api.admin.resolveDataQualityIssue(id);
      fetchAll();
    } catch (err) {
      alert('Failed to resolve issue: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">{t('adminDashboardTitle')}</h2>
          </div>
          <p className="text-xs text-slate-500">
            Real-time monitoring of departmental interoperability connectors, event pipelines, and canonical transformations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Failure Simulation Button for Live Demo */}
          <button
            onClick={handleToggleSimulatedFailure}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 ${
              revenueSimFailure
                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {revenueSimFailure ? t('restoreConnBtn') : t('simFailureBtn')}
            </span>
          </button>

          <button
            onClick={handleResetData}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center space-x-1"
            title="Reset Database to Clean Demo State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {/* Real Database Analytics Cards (Section 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] text-slate-500">{t('totalIntegrations')}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats?.totalIntegrations || 0}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] text-slate-500">{t('successfulIntegrations')}</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {stats?.successfulIntegrations || 0}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] text-slate-500">{t('failedIntegrations')}</p>
          <p className="text-xl font-bold text-red-600 mt-1">{stats?.failedIntegrations || 0}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] text-slate-500">Pending Syncs</p>
          <p className="text-xl font-bold text-amber-500 mt-1">
            {stats?.pendingIntegrations || 0}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] text-slate-500">{t('activeConnectors')}</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{stats?.activeConnectors || 4}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] text-slate-500">{t('dataQualityIssues')}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {stats?.unresolvedDataQualityIssues || 0}
          </p>
        </div>
      </div>

      {/* CONNECTOR MONITOR (Section 12) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#0f294a]" />
            <h3 className="text-base font-bold text-slate-900">{t('connectorHealthTitle')}</h3>
          </div>
          <span className="text-xs text-slate-500">Departmental Micro-Connectors</span>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <span>
              Ping Result for connector {testResult.connectorId}:{' '}
              <strong>{testResult.success ? `HEALTHY (${testResult.latencyMs}ms)` : testResult.message}</strong>
            </span>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {connectors.map((c) => {
            const isRevenue = c.department === 'REVENUE';
            const isDegraded = isRevenue && revenueSimFailure;
            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 flex flex-col justify-between ${
                  isDegraded ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">{c.department}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center space-x-1 ${
                        isDegraded
                          ? 'bg-red-100 text-red-800'
                          : c.enabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDegraded
                            ? 'bg-red-600 animate-ping'
                            : c.enabled
                            ? 'bg-emerald-600'
                            : 'bg-slate-400'
                        }`}
                      ></span>
                      <span>{isDegraded ? 'OUTAGE (SIMULATED)' : c.enabled ? 'ACTIVE' : 'DISABLED'}</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{c.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{c.endpoint}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Avg Latency:</span>
                    <span className="font-bold text-slate-800">{c.averageResponseTime} ms</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Transactions:</span>
                    <span>
                      <strong className="text-emerald-700">{c.successCount} ok</strong> /{' '}
                      <strong className="text-red-600">{c.failureCount} fail</strong>
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleTestConnector(c.id)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                    >
                      {t('testConnectionBtn')}
                    </button>
                    <button
                      onClick={() => handleToggleConnector(c.id, c.enabled)}
                      className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                        c.enabled
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {c.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTEGRATION EVENT LOG (Section 13) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#0f294a]" />
            <h3 className="text-base font-bold text-slate-900">{t('integrationEventsTitle')}</h3>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Status:</span>
            <select
              value={eventStatusFilter}
              onChange={(e) => setEventStatusFilter(e.target.value)}
              className="p-1.5 border border-slate-200 rounded text-xs bg-white"
            >
              <option value="ALL">All Events</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="RETRYING">Retrying</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Event ID</th>
                  <th className="px-4 py-3 text-left">Citizen / Sangam ID</th>
                  <th className="px-4 py-3 text-left">Source → Target</th>
                  <th className="px-4 py-3 text-left">Operation</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Retries</th>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      {t('noEvents')}
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#0f294a]">
                        {evt.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{evt.citizenName || 'Citizen'}</div>
                        <div className="font-mono text-[10px] text-slate-500">{evt.sangamId}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {evt.sourceDepartment} → <strong className="text-blue-700">{evt.targetDepartment}</strong>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {evt.operation}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            evt.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : evt.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 font-bold">
                        {evt.retryCount || 0}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DATA QUALITY & AUDIT LOGS ROW (Section 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Quality Issues */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Data Quality & Consistency Issues</span>
            </h4>
            <span className="text-[11px] text-slate-500">{dataIssues.length} Detected</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {dataIssues.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No data quality anomalies recorded.
              </div>
            ) : (
              dataIssues.map((issue) => (
                <div key={issue.id} className="p-3 text-xs flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{issue.field}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          issue.severity === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      {issue.resolved ? (
                        <span className="text-[10px] text-emerald-700 font-semibold">Resolved</span>
                      ) : null}
                    </div>
                    <p className="text-slate-700">{issue.description}</p>
                  </div>
                  {!issue.resolved && (
                    <button
                      onClick={() => handleResolveIssue(issue.id)}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-medium shrink-0"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Audit Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Immutable System Audit Trail</span>
            </h4>
            <span className="text-[11px] text-slate-500">Real-time Stream</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {t('noAuditLogs')}
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#0f294a]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-snug">{log.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Details & Retry Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRetried={() => {
            fetchAll();
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
