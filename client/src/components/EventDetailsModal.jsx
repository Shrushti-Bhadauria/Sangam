import React, { useState } from 'react';
import { api } from '../services/api';
import {
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Building,
  Clock,
  Layers
} from 'lucide-react';

export function EventDetailsModal({ event, isOpen, onClose, onRetried }) {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState(null);

  if (!isOpen || !event) return null;

  const handleRetry = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      const res = await api.integrations.retry(event.id);
      setRetryResult('Integration event successfully recovered and completed.');
      if (onRetried) onRetried(res);
    } catch (err) {
      alert('Retry failed: ' + err.message);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f294a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
              {event.id}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                event.status === 'SUCCESS'
                  ? 'bg-emerald-500 text-white'
                  : event.status === 'FAILED'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {event.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {retryResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{retryResult}</span>
            </div>
          )}

          {/* Operation & Routing Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-500">Operation</p>
              <p className="font-bold text-slate-900">{event.operation}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">{event.sourceDepartment}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-blue-700">{event.targetDepartment}</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Retry Count</p>
              <p className="font-bold text-slate-800">{event.retryCount || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Timestamp</p>
              <p className="font-medium text-slate-800">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Error Banner if Failed */}
          {event.errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg space-y-1">
              <div className="flex items-center space-x-2 text-red-800 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Integration Fault Detected</span>
              </div>
              <p className="text-red-700 text-xs">{event.errorMessage}</p>
            </div>
          )}

          {/* Request & Response Inspection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Outbound Request Payload</span>
              </h4>
              <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-48">
                {JSON.stringify(event.requestPayload, null, 2) || '// No request payload recorded'}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inbound Response Payload</span>
              </h4>
              <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-48">
                {JSON.stringify(event.responsePayload, null, 2) || '// Awaiting response'}
              </pre>
            </div>
          </div>

          {/* Mapping & Validation Badges */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Canonical Data Mapping</p>
              <span
                className={`font-semibold text-xs ${
                  event.mappingStatus === 'SUCCESS' ? 'text-emerald-700' : 'text-amber-600'
                }`}
              >
                ● {event.mappingStatus || 'PENDING'}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Data Validation Rules</p>
              <span
                className={`font-semibold text-xs ${
                  event.validationStatus === 'VALID'
                    ? 'text-emerald-700'
                    : event.validationStatus === 'WARNING'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                ● {event.validationStatus || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          {event.status === 'FAILED' && (
            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Executing Retry...' : 'Retry Integration Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
