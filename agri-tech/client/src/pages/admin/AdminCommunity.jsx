import { Link } from 'react-router-dom';
import { api, errorMessage } from '../../services/api';
import useMeta from '../../hooks/useMeta';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import ResourceManager from '../../components/ResourceManager';
import { StatusBadge } from '../../components/Badges';
import { timeAgo } from '../../utils/format';

export default function AdminCommunity() {
  const { t } = useLanguage();
  const meta = useMeta();
  const toast = useToast();

  const setHidden = async (post, isHidden, reload) => {
    try {
      await api.patch(`/community/posts/${post._id}/moderate`, { isHidden });
      toast.success(isHidden ? 'Post hidden from the community.' : 'Post restored to the community.');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <ResourceManager
      title={t('nav.community')}
      subtitle="Review discussions, hide inappropriate posts, or remove them entirely. Hidden posts stay visible to administrators only."
      endpoint="/community/posts"
      noun="Post"
      searchPlaceholder="Title or text"
      canCreate={false}
      canEdit={false}
      emptyIcon="bi-chat-square-text"
      emptyText="Posts appear here when farmers start discussions."
      filters={[
        { name: 'category', label: 'Category', options: meta.POST_CATEGORIES },
        { name: 'status', label: 'Visibility', options: [{ value: 'hidden', label: 'Hidden only' }] },
      ]}
      columns={[
        { header: 'Post', render: (p) => <><Link to={`/admin/community/${p._id}`} className="fw-bold text-decoration-none">{p.title}</Link><div className="small text-muted line-clamp-2" style={{ maxWidth: '28rem' }}>{p.body}</div></> },
        { header: 'Author', render: (p) => (p.author ? p.author.name : 'Removed user') },
        { header: 'Category', render: (p) => p.category },
        { header: 'Activity', render: (p) => <span className="text-nowrap"><i className="bi bi-chat-dots me-1" aria-hidden="true" />{p.commentCount} <i className="bi bi-hand-thumbs-up ms-2 me-1" aria-hidden="true" />{p.likesCount}</span> },
        { header: 'Posted', render: (p) => timeAgo(p.createdAt) },
        { header: 'Visibility', render: (p) => <StatusBadge status={p.isHidden ? 'Hidden' : 'Visible'} /> },
      ]}
      rowActions={({ row, reload }) => (
        <>
          <Link to={`/admin/community/${row._id}`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-eye" aria-hidden="true" /><span className="d-none d-md-inline ms-1">{t('common.view')}</span></Link>
          <button type="button" className={`btn btn-sm ${row.isHidden ? 'btn-outline-success' : 'btn-outline-warning'}`} onClick={() => setHidden(row, !row.isHidden, reload)}>
            <i className={`bi ${row.isHidden ? 'bi-eye' : 'bi-eye-slash'}`} aria-hidden="true" /><span className="d-none d-md-inline ms-1">{row.isHidden ? 'Restore' : 'Hide'}</span>
          </button>
        </>
      )}
    />
  );
}
