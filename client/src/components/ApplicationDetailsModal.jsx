import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import {
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Building,
  ShieldCheck,
  Send,
  User
} from 'lucide-react';

export function ApplicationDetailsModal({ application, isOpen, onClose, onUpdated }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [updating, setUpdating] = useState(false);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);

  if (!isOpen || !application) return null;

  const isOfficer = user && (user.role === 'DEPARTMENT_OFFICER' || user.role === 'INTEGRATION_ADMIN');

  // Compute stage progression
  const stages = [
    { key: 'SUBMITTED', label: 'Application Submitted' },
    { key: 'IDENTITY_VERIFIED', label: 'Identity Resolved (Sangam)' },
    { key: 'CONSENT_GRANTED', label: 'Citizen Consent Granted' },
    { key: 'DATA_RECEIVED', label: 'Revenue Records Retrieved' },
    { key: 'VALIDATED', label: 'Canonical Data Validated' },
    { key: 'REVIEW', label: 'Officer Review & Sanction' }
  ];

  const getStageStatus = (stageIndex) => {
    const s = application.status;
    if (s === 'APPROVED') return 'COMPLETED';
    if (s === 'REJECTED') return stageIndex === 5 ? 'REJECTED' : 'COMPLETED';
    if (s === 'UNDER_REVIEW') return stageIndex <= 4 ? 'COMPLETED' : 'CURRENT';
    if (s === 'DATA_REQUESTED' || s === 'IDENTITY_VERIFICATION') return stageIndex <= 2 ? 'COMPLETED' : 'CURRENT';
    if (s === 'CONSENT_REQUIRED') return stageIndex <= 1 ? 'COMPLETED' : 'CURRENT';
    return stageIndex === 0 ? 'CURRENT' : 'PENDING';
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    setActionSuccess(null);
    try {
      const updated = await api.applications.updateStatus(application.id, newStatus, officerRemarks);
      setActionSuccess(`Application status successfully updated to ${newStatus}.`);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const verifiedDocs = Array.isArray(application.verifiedDocuments)
    ? application.verifiedDocuments
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f294a] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                {application.applicationNumber}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  application.status === 'APPROVED'
                    ? 'bg-emerald-500 text-white'
                    : application.status === 'REJECTED'
                    ? 'bg-red-500 text-white'
                    : application.status === 'UNDER_REVIEW'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {application.status}
              </span>
            </div>
            <h3 className="text-sm font-bold mt-1 text-slate-100">{application.serviceType}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Citizen Demographics Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-500">Applicant Name</p>
              <p className="font-bold text-slate-900">{application.citizenName || 'Applicant'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Sangam ID</p>
              <p className="font-mono font-bold text-[#0f294a]">{application.sangamId}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">District / Taluka</p>
              <p className="font-medium text-slate-800">{application.district || 'Pune'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Submitted On</p>
              <p className="font-medium text-slate-800">
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Dynamic Interoperability Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verification & Interoperability Journey
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {stages.map((st, idx) => {
                const stStatus = getStageStatus(idx);
                return (
                  <div
                    key={st.key}
                    className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                      stStatus === 'COMPLETED'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : stStatus === 'CURRENT'
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                        : stStatus === 'REJECTED'
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold">0{idx + 1}</span>
                      {stStatus === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      {stStatus === 'CURRENT' && <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />}
                      {stStatus === 'REJECTED' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                    </div>
                    <span className="text-[11px] leading-tight">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verified Department Documents Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Department-Verified Data (No Paper Upload Required)</span>
            </h4>

            {verifiedDocs.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400">
                Awaiting automated verification from the Revenue Department.
              </div>
            ) : (
              <div className="space-y-3">
                {verifiedDocs.map((doc, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">{doc.documentName}</span>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded">
                        API Verified via {doc.department}
                      </span>
                    </div>

                    {doc.data && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                        <div>
                          <span className="text-slate-500">Certificate No: </span>
                          <span className="font-mono font-semibold text-slate-800">
                            {doc.data.certificateNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Certified Annual Income: </span>
                          <span className="font-bold text-emerald-700">
                            ₹{Number(doc.data.annualIncome || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Economic Category: </span>
                          <span className="font-medium text-slate-800">{doc.data.economicCategory}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Valid Until: </span>
                          <span className="font-medium text-slate-800">{doc.data.validUntil}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Scheme Eligibility: </span>
                          <span className="font-semibold text-emerald-700">Confirmed (Income &lt; ₹2.5L)</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department Officer Actions */}
          {isOfficer && (
            <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Officer Sanction & Review
              </h4>
              <textarea
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                placeholder="Enter remarks or approval reason..."
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f294a]"
              />
              <div className="flex items-center justify-end space-x-2.5">
                <button
                  onClick={() => handleUpdateStatus('REJECTED')}
                  disabled={updating}
                  className="px-3 py-1.5 bg-red-50 text-red-700 font-semibold rounded hover:bg-red-100 transition-colors"
                >
                  {t('rejectApplicationBtn')}
                </button>
                <button
                  onClick={() => handleUpdateStatus('APPROVED')}
                  disabled={updating}
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 transition-colors flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{t('approveApplicationBtn')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
