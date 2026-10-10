import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, AlertCircle, ArrowUpRight, Check, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../StatusBadge';

const DuplicateRadar = ({ ticketId }) => {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDuplicates = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await api.get(`/tickets/${ticketId}/duplicates`);
      setDuplicates(res.data.duplicates || []);
    } catch (err) {
      console.error('Failed to fetch duplicates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [ticketId]);

  return (
    <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-indigo-600" />
          <h4 className="font-display font-semibold text-xs text-ink-900">
            Duplicate & Surge Radar
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {duplicates.length > 0 && (
            <span className="font-mono text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
              {duplicates.length} Related
            </span>
          )}
          <button
            onClick={fetchDuplicates}
            className="text-ink-400 hover:text-ink-900 transition-colors p-1"
            title="Scan for duplicates"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-3 text-xs">
        {loading ? (
          <div className="text-center py-4 text-ink-400 font-mono text-[11px]">
            Scanning active ticket queue for semantic patterns...
          </div>
        ) : duplicates.length === 0 ? (
          <div className="text-center py-3 text-ink-400 font-mono text-[11px] flex flex-col items-center gap-1">
            <Check size={14} className="text-emerald-500" />
            <span>No duplicate complaints detected for this issue.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] text-ink-500">
              Identified related or duplicate open cases in queue:
            </p>
            {duplicates.map((dup) => (
              <div
                key={dup.ticketId}
                className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/30 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] font-bold text-indigo-700">
                    #{dup.ticketNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded font-semibold">
                      {dup.similarityScore}% match
                    </span>
                    <StatusBadge status={dup.status} size="sm" />
                  </div>
                </div>

                <p className="text-xs font-medium text-ink-900 truncate mb-1">
                  {dup.subject}
                </p>

                {dup.matchingKeywords && dup.matchingKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {dup.matchingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono bg-white border border-indigo-200/60 text-indigo-800 px-1 py-0.2 rounded"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  to={`/agent/tickets/${dup.ticketId}`}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 hover:text-indigo-900 font-semibold"
                >
                  Inspect ticket <ArrowUpRight size={10} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateRadar;
