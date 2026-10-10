import React from 'react';
import { History, CheckCircle2, Bot, User, Edit3, ArrowRight, Clock, FileText } from 'lucide-react';

const ACTION_ICONS = {
  CREATED: { icon: FileText, color: 'text-blue-500 bg-blue-50' },
  AI_TRIAGED: { icon: Bot, color: 'text-amber-500 bg-amber-50' },
  ASSIGNED: { icon: User, color: 'text-indigo-500 bg-indigo-50' },
  STATUS_CHANGE: { icon: ArrowRight, color: 'text-emerald-500 bg-emerald-50' },
  TRIAGE_OVERRIDE: { icon: Edit3, color: 'text-purple-500 bg-purple-50' },
  INTERNAL_NOTE: { icon: History, color: 'text-slate-500 bg-slate-100' }
};

const AuditTimeline = ({ activityLog = [] }) => {
  if (!activityLog || activityLog.length === 0) {
    return (
      <div className="text-center py-8 text-ink-400 font-mono text-xs">
        No recorded lifecycle events yet.
      </div>
    );
  }

  const sorted = [...activityLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-100">
      {sorted.map((item, idx) => {
        const conf = ACTION_ICONS[item.action] || { icon: Clock, color: 'text-ink-400 bg-ink-50' };
        const Icon = conf.icon;
        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

        return (
          <div key={idx} className="relative group">
            {/* Timeline bullet icon */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border border-white shadow-xs flex items-center justify-center ${conf.color}`}
            >
              <Icon size={10} />
            </div>

            {/* Event card */}
            <div className="bg-white p-3 rounded-lg border border-ink-100 text-xs shadow-2xs hover:border-ink-200 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-ink-900 font-display">
                  {item.performerName || 'System'}
                  {item.performerRole && (
                    <span className="ml-1.5 font-mono text-[10px] text-ink-400 font-normal">
                      ({item.performerRole})
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-mono text-ink-400 shrink-0">
                  {dateStr} · {timeStr}
                </span>
              </div>
              <p className="text-ink-600 leading-relaxed font-sans">{item.details}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditTimeline;
