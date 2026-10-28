import { useState } from 'react';
import { api, errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import PageHeader from './PageHeader';
import Modal, { ConfirmModal } from './Modal';
import DynamicForm from './DynamicForm';
import Pagination from './Pagination';
import { DataState, EmptyState, SkeletonRows } from './feedback';

/**
 * Searchable, filterable, paginated admin table with add / edit / delete dialogs.
 *
 * columns:    [{ header, render(row), className }]
 * filters:    [{ name, label, options: ['A', 'B'] | [{ value, label }] }]  (sent as query params)
 * fields:     DynamicForm field list, or (editingRow | null) => list so create and edit forms can differ
 * rowActions: ({ row, reload }) => node, extra buttons shown beside Edit / Delete
 * toPayload:  (formValues, editingRow | null) => body, for last-minute shaping before the request
 */
export default function ResourceManager({
  title, subtitle, embedded = false, endpoint, noun, plural, columns, fields, filters = [], params, searchable = true, searchPlaceholder,
  canCreate = true, canEdit = true, canDelete = true, rowActions, toPayload, modalSize = 'lg', emptyIcon = 'bi-inbox', emptyText, headerActions,
}) {
  const { t } = useLanguage();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = closed, {} = creating, row = editing
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const search = useDebounce(q);

  const query = { ...(params || {}), ...filterValues, q: search || undefined, page, limit: 15 };
  const list = useFetch(() => api.get(endpoint, query), [endpoint, search, page, JSON.stringify(filterValues), JSON.stringify(params || {})]);
  const rows = list.data || [];
  const filtered = Boolean(search || Object.values(filterValues).some(Boolean));
  const plurals = plural || `${noun.toLowerCase()}s`;
  const hasActions = canEdit || canDelete || Boolean(rowActions);

  const setFilter = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value || undefined }));
    setPage(1);
  };

  const save = async (values) => {
    const body = toPayload ? toPayload(values, editing) : values;
    if (editing && editing._id) {
      await api.put(`${endpoint}/${editing._id}`, body);
      toast.success(`${noun} updated successfully.`);
    } else {
      await api.post(endpoint, body);
      toast.success(`${noun} added successfully.`);
    }
    setEditing(null);
    list.reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`${endpoint}/${deleting._id}`);
      toast.success(`${noun} deleted successfully.`);
      setDeleting(null);
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addButton = canCreate && (
    <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
      <i className="bi bi-plus-lg me-1" aria-hidden="true" />{t('common.add')} {noun.toLowerCase()}
    </button>
  );
  const actions = <>{headerActions}{addButton}</>;
  const formFields = typeof fields === 'function' ? fields(editing && editing._id ? editing : null) : fields;

  return (
    <>
      {embedded ? (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <p className="text-muted mb-0">{subtitle}</p>
          <div className="d-flex flex-wrap gap-2">{actions}</div>
        </div>
      ) : (
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
      )}

      {(searchable || filters.length > 0) && (
        <div className="card section-card mb-3">
          <div className="row g-2 align-items-end">
            {searchable && (
              <div className="col-12 col-md-5">
                <label className="form-label" htmlFor={`rm-q-${noun}`}>{t('common.search')}</label>
                <input id={`rm-q-${noun}`} type="search" className="form-control" placeholder={searchPlaceholder || `Search ${plurals}`} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
              </div>
            )}
            {filters.map((filter) => (
              <div key={filter.name} className="col-6 col-md-3 col-xl-2">
                <label className="form-label" htmlFor={`rm-f-${noun}-${filter.name}`}>{filter.label}</label>
                <select id={`rm-f-${noun}-${filter.name}`} className="form-select" value={filterValues[filter.name] || ''} onChange={(e) => setFilter(filter.name, e.target.value)}>
                  <option value="">{t('common.all')}</option>
                  {filter.options.map((o) => {
                    const opt = typeof o === 'string' ? { value: o, label: o } : o;
                    return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                  })}
                </select>
              </div>
            ))}
            {filtered && (
              <div className="col-auto">
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setQ(''); setFilterValues({}); setPage(1); }}>
                  <i className="bi bi-x-lg me-1" aria-hidden="true" />{t('common.clear')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <DataState loading={list.loading} error={list.error} onRetry={list.reload} skeleton={<SkeletonRows />} isEmpty={rows.length === 0}
        empty={<EmptyState icon={filtered ? 'bi-search' : emptyIcon} title={filtered ? t('common.noResults') : `No ${plurals} yet`} text={filtered ? undefined : emptyText} />}>
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  {columns.map((c) => <th key={c.header} className={c.className}>{c.header}</th>)}
                  {hasActions && <th className="text-end">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    {columns.map((c) => <td key={c.header} className={c.className}>{c.render(row)}</td>)}
                    {hasActions && (
                      <td className="text-end text-nowrap">
                        <div className="d-inline-flex gap-1">
                          {rowActions && rowActions({ row, reload: list.refresh })}
                          {canEdit && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setEditing(row)} aria-label={`${t('common.edit')} ${noun.toLowerCase()}`}><i className="bi bi-pencil" aria-hidden="true" /><span className="d-none d-md-inline ms-1">{t('common.edit')}</span></button>}
                          {canDelete && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(row)} aria-label={`${t('common.delete')} ${noun.toLowerCase()}`}><i className="bi bi-trash" aria-hidden="true" /><span className="d-none d-md-inline ms-1">{t('common.delete')}</span></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination meta={list.meta} onChange={setPage} />
      </DataState>

      <Modal show={Boolean(editing)} size={modalSize} title={editing && editing._id ? `${t('common.edit')} ${noun.toLowerCase()}` : `${t('common.add')} ${noun.toLowerCase()}`} onClose={() => setEditing(null)}>
        {editing && <DynamicForm key={editing._id || 'new'} fields={formFields} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmModal show={Boolean(deleting)} busy={busy} title={`Delete this ${noun.toLowerCase()}?`} confirmLabel={t('common.delete')} onConfirm={remove} onClose={() => setDeleting(null)}
        message="This permanently removes it and cannot be undone." />
    </>
  );
}
