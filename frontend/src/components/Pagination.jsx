const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="px-3 py-1.5 rounded border text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50">
        Previous
      </button>
      <span className="text-sm text-gray-500 px-2">
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="px-3 py-1.5 rounded border text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50">
        Next
      </button>
    </div>
  );
};

export default Pagination;