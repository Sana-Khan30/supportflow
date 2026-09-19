import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

const PRIORITY_BAR = {
  Low: "bg-signal-teal",
  Medium: "bg-signal-amber",
  High: "bg-signal-coral",
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TicketStub = ({ ticket, to, extra }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => to && navigate(to)}
      className={`group relative flex bg-white border border-ink-100 rounded-md overflow-hidden shadow-stub ${
        to ? "cursor-pointer hover:border-ink-300" : ""
      } transition-colors`}
    >
      <div className={`w-1.5 shrink-0 ${PRIORITY_BAR[ticket.priority] || "bg-ink-200"}`} />

      {/* perforated divider look */}
      <div className="relative flex-1 flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-ink-400 tracking-tight">
              #{ticket.ticketNumber}
            </span>
            <span className="text-xs text-ink-300">·</span>
            <span className="text-xs text-ink-400">{timeAgo(ticket.createdAt)}</span>
          </div>
          <p className="font-display font-semibold text-ink-900 truncate">{ticket.subject}</p>
          {ticket.aiSummary && (
            <p className="text-sm text-ink-400 truncate mt-0.5">{ticket.aiSummary}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {extra}
    </div>
  );
};

export default TicketStub;
