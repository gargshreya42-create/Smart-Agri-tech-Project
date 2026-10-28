export default function Pagination({ meta, onChange }) {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages, total } = meta;
  return (
    <nav className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3" aria-label="Pagination">
      <span className="small text-muted">Page {page} of {pages} · {total} total</span>
      <div className="btn-group">
        <button type="button" className="btn btn-outline-primary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <i className="bi bi-chevron-left" aria-hidden="true" /> Previous
        </button>
        <button type="button" className="btn btn-outline-primary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
