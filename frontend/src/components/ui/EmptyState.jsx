const EmptyState = ({ icon: Icon, title, body, action }) => (
  <div className="bg-white border border-ink-100 rounded-card p-10 text-center">
    {Icon && (
      <div className="w-10 h-10 rounded-full bg-ink-50 text-ink-400 flex items-center justify-center mx-auto mb-4">
        <Icon size={18} />
      </div>
    )}
    <p className="text-ink-900 font-medium">{title}</p>
    {body && <p className="text-sm text-ink-400 mt-1 max-w-sm mx-auto">{body}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
