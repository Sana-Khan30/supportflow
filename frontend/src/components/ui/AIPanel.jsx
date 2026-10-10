import React, { useState } from 'react';
import { Sparkles, CheckCircle, Sliders, ShieldAlert, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import SentimentBadge from '../SentimentBadge';
import PriorityBadge from '../PriorityBadge';

const AIPanel = ({ ticket, onUpdateTriage, isResolved }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    category: ticket?.category || 'General',
    priority: ticket?.priority || 'Medium',
    sentiment: ticket?.sentiment || 'Neutral',
    intent: ticket?.intent || '',
    suggestedAction: ticket?.suggestedAction || ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!ticket) return null;

  const confidence = ticket.aiConfidence || 85;
  const urgency = ticket.urgencyScore || 5;

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdateTriage(formData);
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-ink-900 to-ink-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
            <Sparkles size={14} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-xs tracking-wide uppercase text-white/90">
              AI Triage Intelligence
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-white/15 px-2 py-0.5 rounded text-amber-300 flex items-center gap-1">
            <span>{confidence}%</span>
            <span className="text-[9px] text-white/60">confidence</span>
          </span>
          {!isResolved && (
            <button
              onClick={() => {
                setFormData({
                  category: ticket.category,
                  priority: ticket.priority,
                  sentiment: ticket.sentiment || 'Neutral',
                  intent: ticket.intent || '',
                  suggestedAction: ticket.suggestedAction || ''
                });
                setIsEditing(!isEditing);
              }}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isEditing ? 'Cancel' : 'Verify / Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isEditing ? (
        <div className="p-4 space-y-3.5 text-xs">
          {/* Top Row: Sentiment & Urgency Meter */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-mono text-ink-400 uppercase tracking-wider block mb-1">
                Detected Sentiment
              </span>
              <SentimentBadge sentiment={ticket.sentiment || 'Neutral'} size="sm" />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-mono text-ink-400 uppercase tracking-wider block mb-1">
                Urgency Index
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-ink-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      urgency >= 8 ? 'bg-rose-500' : urgency >= 5 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${urgency * 10}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-ink-800">{urgency}/10</span>
              </div>
            </div>
          </div>

          {/* Intent / Core Objective */}
          {ticket.intent && (
            <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg">
              <span className="text-[10px] font-mono font-semibold text-amber-800 uppercase tracking-wider block mb-0.5">
                Customer Intent
              </span>
              <p className="text-ink-800 font-medium">{ticket.intent}</p>
            </div>
          )}

          {/* AI Distillation Summary */}
          {ticket.aiSummary && (
            <div>
              <span className="text-[10px] font-mono text-ink-400 uppercase tracking-wider block mb-1">
                Issue Summary
              </span>
              <p className="text-ink-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {ticket.aiSummary}
              </p>
            </div>
          )}

          {/* Extracted Key Points */}
          {ticket.keyPoints && ticket.keyPoints.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-ink-400 uppercase tracking-wider block mb-1">
                Extracted Key Points
              </span>
              <ul className="space-y-1">
                {ticket.keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-ink-600">
                    <span className="text-amber-500 mt-0.5 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Next Step */}
          {ticket.suggestedAction && (
            <div className="bg-teal-500/5 border border-teal-500/20 p-2.5 rounded-lg">
              <span className="text-[10px] font-mono font-semibold text-teal-800 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                <Zap size={11} className="text-teal-600" />
                Recommended Next Step
              </span>
              <p className="text-teal-950 font-medium">{ticket.suggestedAction}</p>
            </div>
          )}

          {/* Verified by Human Agent Badge */}
          {!ticket.isTriagedByAI && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              <CheckCircle size={12} />
              <span>Human agent verified & confirmed classifications</span>
            </div>
          )}
        </div>
      ) : (
        /* Edit & Override Mode */
        <form onSubmit={handleSave} className="p-4 space-y-3 text-xs bg-slate-50/50">
          <div className="flex items-center justify-between pb-1 border-b border-ink-100">
            <span className="font-semibold text-ink-900 flex items-center gap-1.5">
              <Sliders size={13} />
              Adjust & Override Triage
            </span>
            <span className="text-[10px] font-mono text-ink-400">Human supervision</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-ink-500 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-ink-200 rounded-md text-xs focus:ring-1 focus:ring-ink-900"
              >
                <option value="Billing">Billing</option>
                <option value="Authentication">Authentication</option>
                <option value="Technical / Bug">Technical / Bug</option>
                <option value="Performance">Performance</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-ink-500 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-ink-200 rounded-md text-xs focus:ring-1 focus:ring-ink-900"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-ink-500 mb-1">Customer Sentiment</label>
            <select
              value={formData.sentiment}
              onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-ink-200 rounded-md text-xs focus:ring-1 focus:ring-ink-900"
            >
              <option value="Frustrated">Frustrated</option>
              <option value="Urgent">Urgent</option>
              <option value="Neutral">Neutral</option>
              <option value="Positive">Positive</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-ink-500 mb-1">Customer Intent</label>
            <input
              type="text"
              value={formData.intent}
              onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-ink-200 rounded-md text-xs focus:ring-1 focus:ring-ink-900"
              placeholder="e.g. Request refund for unexpected fee"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-ink-500 mb-1">Recommended Action</label>
            <textarea
              value={formData.suggestedAction}
              onChange={(e) => setFormData({ ...formData, suggestedAction: e.target.value })}
              rows={2}
              className="w-full px-2.5 py-1.5 bg-white border border-ink-200 rounded-md text-xs focus:ring-1 focus:ring-ink-900"
              placeholder="Operational next step for specialist"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 rounded border border-ink-200 text-ink-600 hover:bg-ink-50 font-mono text-[11px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 rounded bg-ink-900 text-white font-mono text-[11px] hover:bg-ink-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Confirm Overrides'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AIPanel;
