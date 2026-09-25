import React, { useState } from 'react';
import { api } from '../services/api';
import {
  PlayCircle,
  CheckCircle,
  ArrowRight,
  Shield,
  FileText,
  Database,
  RefreshCw,
  X,
  AlertCircle,
  Building,
  UserCheck,
  Send,
  Lock
} from 'lucide-react';

export function DemoWorkflowModal({ isOpen, onClose, onFinish }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Workflow state variables
  const [citizen, setCitizen] = useState(null);
  const [application, setApplication] = useState(null);
  const [consent, setConsent] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  if (!isOpen) return null;

  // Step 1: Initialize Demo Citizen
  const handleSelectCitizen = async () => {
    setLoading(true);
    setError(null);
    try {
      // Login or fetch Ananya Patil's profile
      const authData = await api.auth.login({ email: 'citizen@sangam.gov.in', password: 'citizen123' });
      localStorage.setItem('sangam_token', authData.token);
      setCitizen(authData.citizen);
      setStep(2);
    } catch (err) {
      setError('Failed to select citizen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 & 3: Submit Scholarship Application & Resolve Identity
  const handleCreateApplication = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.applications.create({
        serviceType: 'Maharashtra Post-Matric Scholarship (Higher Education)',
        department: 'EDUCATION',
        remarks: 'SIH 2026 Live Interoperability Demonstration'
      });
      setApplication(res.application);
      setConsent(res.consent);
      setStep(4);
    } catch (err) {
      setError('Application submission error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4 & 5: Grant Consent and Trigger Interoperability Engine
  const handleApproveConsent = async () => {
    if (!consent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.consents.approve(consent.id);
      setConsent(res.consent);
      setStep(6);
      // Wait a moment then trigger sync
      setTimeout(async () => {
        try {
          const syncRes = await api.integrations.sync({
            applicationId: application.id,
            citizenId: citizen.id,
            targetDepartment: 'REVENUE'
          });
          setSyncResult(syncRes);
          setStep(7);
        } catch (syncErr) {
          setError('Sync execution error: ' + syncErr.message);
        } finally {
          setLoading(false);
        }
      }, 700);
    } catch (err) {
      setError('Consent approval error: ' + err.message);
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Citizen Selection', desc: 'Select authentic citizen profile' },
    { num: 2, title: 'Apply for Scholarship', desc: 'Initiate scheme application' },
    { num: 3, title: 'Identity Resolution', desc: 'Resolve cross-department IDs' },
    { num: 4, title: 'Consent Request', desc: 'Verify required revenue fields' },
    { num: 5, title: 'Citizen Consent', desc: 'Citizen approves data sharing' },
    { num: 6, title: 'Revenue Connector', desc: 'Query MahaBhumi/Revenue system' },
    { num: 7, title: 'Mapping & Validation', desc: 'Canonical schema transformation' },
    { num: 8, title: 'Application Updated', desc: 'Verified data attached' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0f294a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                SANGAM Interoperability Engine — Live Demonstration
              </h2>
              <p className="text-xs text-slate-300">
                End-to-End Inter-Departmental Data Flow (SIH 2026 Problem Statement 129)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[640px] text-xs">
            {stepsList.map((s, idx) => (
              <div key={s.num} className="flex items-center space-x-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    step > s.num
                      ? 'bg-emerald-600 text-white'
                      : step === s.num
                      ? 'bg-[#0f294a] text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`font-medium ${
                    step >= s.num ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
                {idx < stepsList.length - 1 && (
                  <span className="text-slate-300 mx-1">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Citizen Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Step 1: Choose Citizen for Demonstration
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Select a registered Maharashtra citizen who holds credentials across different state portals.
                  Sangam links all disparate department IDs under one unified citizen master identity.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-white hover:border-blue-400 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">Ananya Ramesh Patil</h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                        SGM-MH-102934
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Resident: Haveli, Pune, Maharashtra</p>
                    <p className="text-xs text-slate-500">Student: COEP Technological University, Pune</p>
                  </div>
                  <button
                    onClick={handleSelectCitizen}
                    disabled={loading}
                    className="px-4 py-2 bg-[#0f294a] text-white text-xs font-semibold rounded-md hover:bg-[#1a385f] transition-colors"
                  >
                    {loading ? 'Loading Citizen...' : 'Select This Citizen →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 & 3: Identity Resolution & Scholarship Initiation */}
          {step >= 2 && step <= 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Step 2: Identity Resolution Across Department Portals
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Cross-System Identity Resolved</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-[10px] text-slate-500">Unified Sangam ID</p>
                    <p className="font-bold text-[#0f294a]">{citizen?.sangamId}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-[10px] text-slate-500">Higher Education (MahaDBT)</p>
                    <p className="font-bold text-slate-800">
                      {citizen?.identityMappings?.educationId || 'EDU-92831'}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-[10px] text-slate-500">Revenue (MahaBhumi)</p>
                    <p className="font-bold text-slate-800">
                      {citizen?.identityMappings?.revenueId || 'REV-44921'}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <p className="text-[10px] text-slate-500">Social Justice (Welfare)</p>
                    <p className="font-bold text-slate-800">
                      {citizen?.identityMappings?.welfareId || 'WEL-77182'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-lg bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900">
                  Step 3: Scholarship Application Initiation
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The citizen submits a scholarship application on the Education portal.
                  Traditionally, the citizen would be required to obtain a physical income certificate from the Tehsildar, scan it, and upload it.
                  Under <strong>SANGAM</strong>, the system instead queries the Revenue Department automatically.
                </p>
                <button
                  onClick={handleCreateApplication}
                  disabled={loading}
                  className="px-4 py-2 bg-[#0f294a] text-white text-xs font-semibold rounded-md hover:bg-[#1a385f] transition-colors"
                >
                  {loading ? 'Initiating Application...' : 'Initiate Scholarship Application →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 & 5: Consent Request & Approval */}
          {step >= 4 && step <= 5 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
                <div className="flex items-center space-x-2 text-amber-900">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold">
                    Step 4: Explicit Citizen Consent Requirement
                  </h3>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  In compliance with Government of Maharashtra data privacy policies, the Education Department cannot directly read Revenue Department records without the citizen's explicit, informed consent.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Consent Request ID: {consent?.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {consent?.requestedBy}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Awaiting Approval
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Purpose: </span>
                    <span className="text-slate-600">{consent?.purpose}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Data Fields to be Shared: </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {['annualIncome', 'landHoldingAcres', 'incomeCertificateDate', 'economicCategory'].map((f) => (
                        <span key={f} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono border border-slate-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleApproveConsent}
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{loading ? 'Dispatched to Revenue Connector...' : 'Approve & Trigger Revenue Sync'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Sync in progress */}
          {step === 6 && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Executing Revenue Interoperability Connector...
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Connecting to MahaBhumi API, retrieving certified record for REV-44921, performing canonical mapping and validation.
                </p>
              </div>
            </div>
          )}

          {/* STEP 7 & 8: Data Retrieved, Canonical Mapping & Verification Complete */}
          {step >= 7 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-900">
                    Interoperability Workflow Completed Successfully!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    The Revenue Department returned authentic verified income records. Sangam converted the source format into canonical schema, validated scheme eligibility, updated the application to <strong>Under Review</strong>, and recorded immutable audit entries.
                  </p>
                </div>
              </div>

              {/* Data Transformation Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Department Data */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span>Revenue Source System (MahaBhumi)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">SOAP/JSON</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700 overflow-x-auto">
{`{
  "certificate_number": "MH-REV-2025-098124",
  "applicant_name": "Ananya Ramesh Patil",
  "income_amount": 180000,
  "financial_year": "2024-2025",
  "issuing_authority": "Tehsildar Haveli",
  "land_holding_acres": 1.5,
  "verification_status": "VERIFIED_LEGITIMATE"
}`}
                  </pre>
                </div>

                {/* Sangam Canonical Format */}
                <div className="border border-emerald-200 rounded-lg p-3.5 bg-emerald-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sangam Canonical Schema (Harmonized)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">1.0.0-sangam</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-emerald-200 text-emerald-900 overflow-x-auto">
{`{
  "annualIncome": 180000,
  "certificateNumber": "MH-REV-2025-098124",
  "economicCategory": "Orange (BPL)",
  "isGovernmentVerified": true,
  "validationStatus": "VALID",
  "eligibilityConfirmed": true
}`}
                  </pre>
                </div>
              </div>

              {/* Result Summary Bar */}
              <div className="bg-slate-100 p-3.5 rounded-lg flex flex-wrap items-center justify-between text-xs gap-2">
                <div>
                  <span className="text-slate-500">Application Number: </span>
                  <span className="font-bold text-slate-800">{application?.applicationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status: </span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    UNDER_REVIEW
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Documents Uploaded by Citizen: </span>
                  <span className="font-bold text-emerald-700">0 (100% Interoperable API)</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onFinish) onFinish();
                  }}
                  className="px-5 py-2 bg-[#0f294a] text-white text-xs font-semibold rounded-md hover:bg-[#1a385f] transition-colors"
                >
                  View in Citizen Dashboard →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
