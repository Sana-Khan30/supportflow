import Button from './ui/Button';

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page === 1}>
        Previous
      </Button>
      <span className="text-sm text-ink-400 font-mono px-2">
        {String(page).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
      </span>
      <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        Next
      </Button>
    </div>
  );
};

export default Pagination;
