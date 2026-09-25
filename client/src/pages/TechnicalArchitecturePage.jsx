import React from 'react';
import {
  Shield,
  Layers,
  Database,
  Building,
  CheckCircle,
  Cpu,
  Lock,
  ArrowDown,
  ArrowRight,
  Server,
  FileCheck,
  Bell,
  Code
} from 'lucide-react';

export function TechnicalArchitecturePage() {
  const pipeline = [
    {
      step: '01',
      title: 'Citizen Interface Layer',
      sub: 'Single Window Application Entry',
      desc: 'Citizen initiates scholarship or scheme application. No manual scanning or document uploads required.',
      icon: Layers
    },
    {
      step: '02',
      title: 'Sangam Gateway & Identity Resolution',
      sub: 'Federated ID Hub',
      desc: 'Maps the citizen Sangam ID (e.g. SGM-MH-102934) to Education ID (EDU-92831), Revenue ID (REV-44921), and Welfare ID (WEL-77182).',
      icon: Cpu
    },
    {
      step: '03',
      title: 'Citizen Consent Management Layer',
      sub: 'Data Sovereignty & Granular Permissions',
      desc: 'Enforces explicit, purpose-bound citizen consent prior to dispatching cross-department API queries.',
      icon: Lock
    },
    {
      step: '04',
      title: 'Departmental Micro-Connectors',
      sub: 'Secure Upstream Adapters',
      desc: 'Dedicated interoperability connectors communicate directly with MahaDBT, MahaBhumi, and Social Justice systems.',
      icon: Server
    },
    {
      step: '05',
      title: 'Canonical Data Transformation & Mapping',
      sub: 'Harmonized Schema Normalization',
      desc: 'Transforms departmental formats (e.g. income_amount, cert_issue_date) into Sangam Canonical Schema (annualIncome, issueDate).',
      icon: Database
    },
    {
      step: '06',
      title: 'Data Validation & Quality Rules Engine',
      sub: 'Automated Integrity & Eligibility Check',
      desc: 'Validates scheme thresholds (income <= ₹2,50,000), checks certificate validity dates, and logs Data Quality Issues.',
      icon: FileCheck
    },
    {
      step: '07',
      title: 'Real-time Updates & Immutable Audit Trail',
      sub: 'Event-Driven Reactive Notification Hub',
      desc: 'Records non-repudiable audit logs, notifies citizen via SSE stream, and updates department officer dashboards.',
      icon: Bell
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs text-blue-800 font-semibold">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>SIH 2026 Solution Architecture</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          How SANGAM Works Technically
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          An architectural breakdown of the Government of Maharashtra Interoperability Framework (Problem Statement 129), bridging siloed departmental platforms through automated identity resolution and secure consent-driven connectors.
        </p>
      </div>

      {/* Visual Pipeline Stack */}
      <div className="max-w-4xl mx-auto space-y-4">
        {pipeline.map((item, index) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.step}>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-[#0f294a] transition-colors flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0f294a] flex items-center justify-center font-bold shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      <span className="font-mono text-amber-600 mr-2">{item.step}.</span>
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.sub}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>

              {index < pipeline.length - 1 && (
                <div className="flex justify-center my-1 text-slate-300">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Connected Departments Topology */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-lg font-bold">Interoperability Topology</h3>
          <p className="text-xs text-slate-400">
            Disparate departmental data silos connected through the Sangam Secure Integration Gateway
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
            <h4 className="text-xs font-bold text-amber-400">Education Dept</h4>
            <p className="text-[10px] text-slate-400 font-mono">MahaDBT REST API</p>
            <p className="text-[11px] text-slate-300">Scholarship & Enrollment</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
            <h4 className="text-xs font-bold text-emerald-400">Revenue Dept</h4>
            <p className="text-[10px] text-slate-400 font-mono">MahaBhumi / AapleSarkar</p>
            <p className="text-[11px] text-slate-300">Certified Income & 7/12</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
            <h4 className="text-xs font-bold text-blue-400">Welfare Dept</h4>
            <p className="text-[10px] text-slate-400 font-mono">Social Justice MIS</p>
            <p className="text-[11px] text-slate-300">Caste & DBT Seeding</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
            <h4 className="text-xs font-bold text-purple-400">Citizen Registry</h4>
            <p className="text-[10px] text-slate-400 font-mono">e-Pramaan ID Master</p>
            <p className="text-[11px] text-slate-300">Demographic Verification</p>
          </div>
        </div>

        <div className="text-center pt-2 text-[11px] text-slate-400">
          All connectors support health ping diagnostics, automated circuit breaking, and administrator retries.
        </div>
      </div>
    </div>
  );
}
