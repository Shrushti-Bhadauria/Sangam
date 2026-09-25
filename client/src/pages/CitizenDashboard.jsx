import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { sseClient } from '../services/sse';
import { ApplicationDetailsModal } from '../components/ApplicationDetailsModal';
import {
  FileText,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Lock,
  Building,
  RefreshCw,
  Eye,
  Check,
  X,
  FileCheck
} from 'lucide-react';

export function CitizenDashboard({ onOpenDemo }) {
  const { user, citizen } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Form states for new application
  const [serviceType, setServiceType] = useState('Maharashtra Post-Matric Scholarship (Higher Education)');
  const [department, setDepartment] = useState('EDUCATION');
  const [applicantCollege, setApplicantCollege] = useState('COEP Technological University, Pune');
  const [applicantCourse, setApplicantCourse] = useState('B.Tech Computer Engineering (Year 3)');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsData, consentsData] = await Promise.all([
        api.applications.list(),
        api.consents.list()
      ]);
      setApplications(appsData);
      setConsents(consentsData);
    } catch (err) {
      console.error('Error fetching citizen dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time events for instant updates without page refresh
    const unsubscribe = sseClient.subscribe((evt) => {
      if (
        evt.type === 'APPLICATION_UPDATED' ||
        evt.type === 'APPLICATION_CREATED' ||
        evt.type === 'CONSENT_UPDATED' ||
        evt.type === 'INTEGRATION_EVENT_UPDATED'
      ) {
        fetchData();
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setActionSuccess(null);
    try {
      const res = await api.applications.create({
        serviceType,
        department,
        remarks: `Enrolled at ${applicantCollege}, ${applicantCourse}`
      });
      setShowApplyModal(false);
      setActionSuccess(
        `Application ${res.application.applicationNumber} initiated! Please review and grant consent below so Sangam can verify your documents.`
      );
      fetchData();
    } catch (err) {
      alert('Application creation failed: ' + err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleApproveConsent = async (consentId) => {
    try {
      const res = await api.consents.approve(consentId);
      setActionSuccess('Consent approved! Revenue records retrieved and verified automatically via API connector.');
      fetchData();
    } catch (err) {
      alert('Consent approval failed: ' + err.message);
    }
  };

  const handleRejectConsent = async (consentId) => {
    try {
      await api.consents.reject(consentId, 'Declined by citizen');
      fetchData();
    } catch (err) {
      alert('Consent rejection failed: ' + err.message);
    }
  };

  const handleRevokeConsent = async (consentId) => {
    try {
      await api.consents.revoke(consentId);
      fetchData();
    } catch (err) {
      alert('Revoke consent failed: ' + err.message);
    }
  };

  // Metrics
  const pendingConsentsCount = consents.filter((c) => c.status === 'PENDING').length;
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('welcomeCitizen')},
            </span>
            <span className="text-sm font-bold text-slate-900">{citizen?.fullName || user?.name}</span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-600 font-medium">
              {t('sangamIdLabel')}:
            </span>
            <span className="font-mono font-bold text-[#0f294a] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              {citizen?.sangamId || 'SGM-MH-102934'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{citizen?.district || 'Pune'}, Maharashtra</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-[#0f294a] text-white text-xs font-semibold rounded-md hover:bg-[#1a385f] transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('applyScholarshipBtn')}</span>
          </button>
          <button
            onClick={onOpenDemo}
            className="px-3.5 py-2 bg-amber-500 text-white text-xs font-semibold rounded-md hover:bg-amber-600 transition-colors"
          >
            {t('runDemoBtn')}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500">{t('activeApplications')}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500">{t('underReview')}</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{underReviewCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500">{t('approvedApps')}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500">{t('pendingConsents')}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{pendingConsentsCount}</p>
        </div>
      </div>

      {/* CONSENT CENTER (Section 6 & 8) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#0f294a]" />
            <h3 className="text-base font-bold text-slate-900">{t('consentCenterTitle')}</h3>
          </div>
          <span className="text-xs text-slate-500">Citizen Data Sovereignty & Interoperability</span>
        </div>

        {consents.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            {t('noConsents')}
          </div>
        ) : (
          <div className="space-y-3">
            {consents.map((csn) => {
              const fields = Array.isArray(csn.dataFields) ? csn.dataFields : [];
              return (
                <div
                  key={csn.id}
                  className={`bg-white rounded-xl border p-5 shadow-2xs space-y-3 ${
                    csn.status === 'PENDING' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{csn.requestedBy}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            csn.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : csn.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {csn.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Application Ref: {csn.applicationId}
                      </p>
                    </div>

                    {csn.status === 'PENDING' ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRejectConsent(csn.id)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                        >
                          {t('rejectConsent')}
                        </button>
                        <button
                          onClick={() => handleApproveConsent(csn.id)}
                          className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 transition-colors flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('approveConsent')}</span>
                        </button>
                      </div>
                    ) : csn.status === 'APPROVED' ? (
                      <button
                        onClick={() => handleRevokeConsent(csn.id)}
                        className="text-[11px] text-red-600 hover:text-red-800 underline"
                      >
                        {t('revokeConsent')}
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold">{t('purposeLabel')}: </span>
                      <span className="text-slate-700">{csn.purpose}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">{t('dataFieldsLabel')}: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fields.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono border border-slate-200"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MY APPLICATIONS (Section 8) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#0f294a]" />
            <h3 className="text-base font-bold text-slate-900">{t('myApplicationsTitle')}</h3>
          </div>
          <span className="text-xs text-slate-500">Database-backed Application Journey</span>
        </div>

        {applications.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-3">
            <p className="text-xs text-slate-500">{t('noApplications')}</p>
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2 bg-[#0f294a] text-white text-xs font-semibold rounded-md hover:bg-[#1a385f]"
            >
              {t('applyScholarshipBtn')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Application No</th>
                    <th className="px-4 py-3 text-left">Service Scheme</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Current Status</th>
                    <th className="px-4 py-3 text-left">Submitted Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#0f294a]">
                        {app.applicationNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{app.serviceType}</td>
                      <td className="px-4 py-3 text-slate-600">{app.department}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : app.status === 'UNDER_REVIEW'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'CONSENT_REQUIRED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors"
                        >
                          {t('viewDetails')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* APPLY FOR SCHOLARSHIP MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#0f294a] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Apply for Scholarship</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg text-blue-900 space-y-1">
                <span className="font-bold flex items-center space-x-1">
                  <FileCheck className="w-4 h-4 text-blue-700" />
                  <span>Paperless Government Verification Guarantee</span>
                </span>
                <p className="text-[11px] text-blue-800 leading-snug">
                  You will NOT need to upload or scan an income certificate. Sangam will verify your certified income directly with the Revenue Department upon your consent.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scholarship Scheme</label>
                <input
                  type="text"
                  disabled
                  value={serviceType}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Enrolled Institution (COEP)</label>
                <input
                  type="text"
                  value={applicantCollege}
                  onChange={(e) => setApplicantCollege(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded focus:ring-1 focus:ring-[#0f294a]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course & Year</label>
                <input
                  type="text"
                  value={applicantCourse}
                  onChange={(e) => setApplicantCourse(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded focus:ring-1 focus:ring-[#0f294a]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-5 py-2 bg-[#0f294a] text-white font-semibold rounded hover:bg-[#1a385f]"
                >
                  {applying ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdated={() => {
            fetchData();
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
}
