import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Sparkles, Send, Copy, Check, ShieldCheck, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

const KnowledgeCopilot = ({ ticketId, onInsertDraft }) => {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [draft, setDraft] = useState('');
  const [sources, setSources] = useState([]);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const fetchArticles = async (query = '') => {
    setLoadingArticles(true);
    try {
      const res = await api.get(`/tickets/knowledge/articles?query=${encodeURIComponent(query)}`);
      setArticles(res.data || []);
    } catch (err) {
      console.error('Failed to load KB articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(searchQuery);
  };

  const handleGenerateDraft = async () => {
    if (!ticketId) return;
    setGeneratingDraft(true);
    try {
      const res = await api.post(`/tickets/${ticketId}/copilot`, {
        agentInstruction: customPrompt
      });
      if (res.data?.success && res.data?.data) {
        setDraft(res.data.data.draft || '');
        setSources(res.data.data.sources || []);
      }
    } catch (err) {
      console.error('Failed to generate copilot draft:', err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const copyToClipboard = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!draft) return;
    onInsertDraft(draft);
  };

  return (
    <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden text-xs">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen size={13} className="text-teal-700" />
          <h4 className="font-display font-semibold text-ink-900">
            Knowledge Base & Copilot
          </h4>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded flex items-center gap-1">
          <ShieldCheck size={11} />
          Grounded Policy
        </span>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Knowledge Base Search */}
        <form onSubmit={handleSearch} className="flex gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approved runbooks & policies..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-ink-200 rounded-lg text-xs focus:ring-1 focus:ring-ink-900"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-ink-400" />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-ink-900 text-white rounded-lg font-mono text-[11px] hover:bg-ink-800 shrink-0"
          >
            Find
          </button>
        </form>

        {/* Available Articles List */}
        {articles.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {articles.map((art) => (
              <div
                key={art._id}
                onClick={() => setSelectedArticle(selectedArticle?._id === art._id ? null : art)}
                className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedArticle?._id === art._id
                    ? 'border-teal-500 bg-teal-50/40'
                    : 'border-ink-100 bg-white hover:border-ink-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] font-bold text-teal-800">
                    {art.sourceCode}
                  </span>
                  <span className="text-[9px] font-mono text-ink-400 bg-slate-100 px-1 py-0.2 rounded">
                    {art.category}
                  </span>
                </div>
                <p className="font-medium text-ink-900 truncate mt-0.5">{art.title}</p>
                {selectedArticle?._id === art._id && (
                  <p className="text-[11px] text-ink-600 mt-1.5 pt-1.5 border-t border-teal-100 leading-relaxed">
                    {art.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Copilot Draft Generator */}
        <div className="pt-2 border-t border-ink-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-ink-900 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              AI Response Copilot
            </span>
            <span className="text-[10px] font-mono text-ink-400">Human-supervised</span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional instruction (e.g. 'Offer 1-month credit')"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-ink-200 rounded-lg text-xs"
            />

            <button
              onClick={handleGenerateDraft}
              disabled={generatingDraft}
              className="w-full py-2 bg-gradient-to-r from-ink-900 to-ink-800 text-white rounded-lg font-mono text-[11px] font-medium hover:from-ink-800 hover:to-ink-700 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Sparkles size={12} className="text-amber-400" />
              {generatingDraft ? 'Drafting grounded response...' : 'Generate Grounded Draft'}
            </button>
          </div>

          {/* Generated Draft Preview */}
          {draft && (
            <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-amber-900">
                  Grounded Response Preview
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={copyToClipboard}
                    className="p-1 text-ink-500 hover:text-ink-900 transition-colors"
                    title="Copy text"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <p className="text-ink-800 text-[11px] leading-relaxed whitespace-pre-wrap bg-white/80 p-2.5 rounded border border-amber-200/50">
                {draft}
              </p>

              {sources.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] font-mono text-ink-400">Sources:</span>
                  {sources.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono bg-white border border-amber-300 text-amber-900 px-1.5 py-0.2 rounded font-semibold"
                    >
                      {s.code}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={handleInsert}
                className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-mono text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <ChevronRight size={12} />
                Insert into Reply Box (Review & Edit)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCopilot;
