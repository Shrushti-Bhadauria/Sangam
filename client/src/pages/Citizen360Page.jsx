import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import {
  User,
  Shield,
  Building,
  GraduationCap,
  Landmark,
  FileText,
  Lock,
  Activity,
  CheckCircle,
  Clock,
  Layers,
  Search
} from 'lucide-react';

export function Citizen360Page({ citizenIdProp }) {
  const { user, citizen: authCitizen } = useAuth();
  const { t } = useLanguage();

  const [citizenId, setCitizenId] = useState(citizenIdProp || (authCitizen ? authCitizen.id : 'CIT-001'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchCitizen, setSearchCitizen] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const fetch360 = async (idToFetch) => {
    try {
      setLoading(true);
      const res = await api.citizens.getCitizen360(idToFetch);
      setData(res);
    } catch (err) {
      console.error('Error fetching Citizen 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch360(citizenId);
  }, [citizenId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCitizen.trim()) {
      fetch360(searchCitizen.trim());
    }
  };

  const isOfficerOrAdmin = user && (user.role === 'DEPARTMENT_OFFICER' || user.role === 'INTEGRATION_ADMIN');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Loading Unified Citizen 360 Profile...
      </div>
    );
  }

  if (!data || !data.citizen) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Citizen record not found.
      </div>
    );
  }

  const { citizen, departmentRecords = [], applications = [], consents = [], integrationEvents = [], auditLogs = [] } = data;

  const revRecord = departmentRecords.find((r) => r.department === 'REVENUE');
  const eduRecord = departmentRecords.find((r) => r.department === 'EDUCATION');
  const welRecord = departmentRecords.find((r) => r.department === 'WELFARE');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-[#0f294a] rounded-xl flex items-center justify-center text-white text-xl font-bold">
              {citizen.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{citizen.fullName}</h2>
                <span className="font-mono text-xs font-bold text-[#0f294a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {citizen.sangamId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {citizen.village}, {citizen.taluka}, {citizen.district}, Maharashtra
              </p>
            </div>
          </div>

          {/* Citizen Search for Officers/Admins */}
          {isOfficerOrAdmin && (
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 text-xs">
              <input
                type="text"
                value={searchCitizen}
                onChange={(e) => setSearchCitizen(e.target.value)}
                placeholder="Lookup Citizen ID or Sangam ID..."
                className="px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#0f294a]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#0f294a] text-white font-semibold rounded hover:bg-[#1a385f]"
              >
                Search
              </button>
            </form>
          )}
        </div>

        {/* Identity Mappings Strip (Section 3 & 10) */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Inter-Departmental Identity Mappings (Cross-System Federated Identifiers)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500">Education Dept ID</span>
              <p className="font-mono font-bold text-slate-800">
                {citizen.identityMappings?.educationId || 'EDU-92831'}
              </p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500">Revenue Dept ID</span>
              <p className="font-mono font-bold text-slate-800">
                {citizen.identityMappings?.revenueId || 'REV-44921'}
              </p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500">Welfare Dept ID</span>
              <p className="font-mono font-bold text-slate-800">
                {citizen.identityMappings?.welfareId || 'WEL-77182'}
              </p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500">Aadhaar Virtual Token</span>
              <p className="font-mono font-bold text-slate-800">
                {citizen.identityMappings?.aadhaarRef || 'VID-XXXX-4912'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DEPARTMENT RECORDS GRID (Education, Revenue, Welfare) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
          Federated Departmental Records
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Records */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <Landmark className="w-4 h-4 text-amber-600" />
              <span>Revenue Department (MahaBhumi)</span>
            </div>
            {revRecord ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">Certificate No: </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {revRecord.data?.certificate_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Certified Income: </span>
                  <span className="font-bold text-emerald-700">
                    ₹{Number(revRecord.data?.income_amount || 0).toLocaleString('en-IN')} / yr
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Land Holding: </span>
                  <span className="font-medium text-slate-800">{revRecord.data?.land_holding_acres} Acres</span>
                </div>
                <div>
                  <span className="text-slate-500">Ration Card Category: </span>
                  <span className="font-medium text-slate-800">{revRecord.data?.ration_card_type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Issuing Authority: </span>
                  <span className="font-medium text-slate-800">{revRecord.data?.issuing_authority}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No revenue records found.</p>
            )}
          </div>

          {/* Education Records */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Higher Education (MahaDBT)</span>
            </div>
            {eduRecord ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">Enrollment No: </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {eduRecord.data?.enrollment_no}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Institution: </span>
                  <span className="font-medium text-slate-800">{eduRecord.data?.institution}</span>
                </div>
                <div>
                  <span className="text-slate-500">Course & Year: </span>
                  <span className="font-medium text-slate-800">
                    {eduRecord.data?.course} ({eduRecord.data?.academic_year})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Current CGPA: </span>
                  <span className="font-bold text-blue-700">{eduRecord.data?.current_cgpa}</span>
                </div>
                <div>
                  <span className="text-slate-500">Attendance: </span>
                  <span className="font-bold text-emerald-700">{eduRecord.data?.attendance_percentage}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No education records found.</p>
            )}
          </div>

          {/* Welfare Records */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Social Justice & Welfare</span>
            </div>
            {welRecord ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">Caste Category: </span>
                  <span className="font-bold text-slate-800">{welRecord.data?.category}</span>
                </div>
                <div>
                  <span className="text-slate-500">Caste Cert No: </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {welRecord.data?.caste_cert_no}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Bank Seeding: </span>
                  <span className="font-semibold text-emerald-700">Aadhaar Linked Active</span>
                </div>
                <div>
                  <span className="text-slate-500">Prior Schemes: </span>
                  <span className="font-medium text-slate-800">
                    {welRecord.data?.prior_benefits_availed?.join(', ') || 'None'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No welfare records found.</p>
            )}
          </div>
        </div>
      </div>

      {/* APPLICATIONS & CONSENTS TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-[#0f294a]" />
            <span>Applications History ({applications.length})</span>
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
            {applications.map((app) => (
              <div key={app.id} className="pt-2 first:pt-0 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{app.applicationNumber}</p>
                  <p className="text-[10px] text-slate-500">{app.serviceType}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Consents History */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-[#0f294a]" />
            <span>Consent Permissions ({consents.length})</span>
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
            {consents.map((csn) => (
              <div key={csn.id} className="pt-2 first:pt-0 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{csn.requestedBy}</p>
                  <p className="text-[10px] text-slate-500">{csn.purpose}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    csn.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {csn.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
