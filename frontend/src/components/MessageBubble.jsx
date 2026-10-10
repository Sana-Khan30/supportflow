/**
 * One bubble component for both ticket-detail pages. `viewerRole` says which
 * side is "self" for this viewer — a customer's own messages sit on the
 * right in the customer view, an agent's own messages sit on the right in
 * the agent view, and the AI always gets its own consistent treatment
 * regardless of who's looking.
 */
const MessageBubble = ({ message, viewerRole }) => {
  const isAi = message.senderRole === 'ai';
  const isSelf = !isAi && message.senderRole === viewerRole;
  const selfLabel = viewerRole === 'agent' ? 'You (agent)' : 'You';
  const otherLabel = viewerRole === 'agent' ? 'Customer' : 'Agent';

  return (
    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
      <span
        className={`text-[10px] font-mono mb-1 px-1 ${
          isAi ? 'text-signal-coral font-semibold uppercase tracking-wide' : 'text-ink-400'
        }`}
      >
        {isAi ? 'AI' : isSelf ? selfLabel : otherLabel}
      </span>
      <div
        className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-sm text-sm leading-relaxed ${
          isSelf
            ? 'bg-ink-900 text-paper rounded-br-sm'
            : isAi
            ? 'bg-signal-coral/5 border border-signal-coral/20 text-ink-900 rounded-bl-sm'
            : 'bg-paper text-ink-900 border border-ink-200 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
