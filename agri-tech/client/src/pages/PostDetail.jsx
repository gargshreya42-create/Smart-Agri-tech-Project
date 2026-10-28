import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import useMeta from '../hooks/useMeta';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import { StatusBadge } from '../components/Badges';
import Avatar from '../components/Avatar';
import { ErrorState, SkeletonCards } from '../components/feedback';
import { postFields } from './Community';
import { timeAgo } from '../utils/format';

function CommentItem({ comment, replies, canDelete, onDelete, onReply, isReply = false }) {
  return (
    <div className={`${isReply ? 'ms-4 ms-md-5 mt-2' : 'mt-3'}`}>
      <div className="p-3 rounded-3" style={{ background: isReply ? '#fff' : 'var(--leaf-50)', border: '1px solid var(--line)' }}>
        <div className="d-flex justify-content-between gap-2 small mb-1"><strong className="d-inline-flex align-items-center gap-2"><Avatar name={comment.author?.name} size="1.7rem" />{comment.author?.name}</strong><span className="text-muted">{timeAgo(comment.createdAt)}</span></div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{comment.body}</div>
        <div className="d-flex gap-3 mt-2 small">
          {!isReply && <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onReply(comment)}><i className="bi bi-reply me-1" aria-hidden="true" />Reply</button>}
          {canDelete(comment) && <button type="button" className="btn btn-link btn-sm p-0 text-danger" onClick={() => onDelete(comment)}><i className="bi bi-trash me-1" aria-hidden="true" />Delete</button>}
        </div>
      </div>
      {replies.map((r) => <CommentItem key={r._id} comment={r} replies={[]} canDelete={canDelete} onDelete={onDelete} onReply={onReply} isReply />)}
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const meta = useMeta();
  const navigate = useNavigate();
  const inAdmin = useLocation().pathname.startsWith('/admin');
  const basePath = inAdmin ? '/admin/community' : '/community';
  const detail = useFetch(() => api.get(`/community/posts/${id}`), [id]);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'post' | 'comment', comment? }
  const [busy, setBusy] = useState(false);

  const threads = useMemo(() => {
    const all = detail.data ? detail.data.comments : [];
    const top = all.filter((c) => !c.parent);
    return top.map((c) => ({ comment: c, replies: all.filter((r) => String(r.parent) === String(c._id)) }));
  }, [detail.data]);

  if (detail.loading) return <SkeletonCards count={2} height="12rem" cols="col-12" />;
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />;

  const { post } = detail.data;
  const mine = String(post.author?._id) === String(user._id);
  const canDeleteComment = (c) => isAdmin || String(c.author?._id) === String(user._id);

  const act = async (fn, successMessage) => {
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
      detail.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    await act(async () => {
      await api.post(`/community/posts/${id}/comments`, { body: comment.trim(), parent: replyTo ? replyTo._id : undefined });
      setComment('');
      setReplyTo(null);
    }, 'Comment added successfully.');
    setPosting(false);
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      if (confirm.type === 'post') {
        await api.del(`/community/posts/${id}`);
        toast.success('Post deleted successfully.');
        navigate(basePath, { replace: true });
        return;
      }
      await api.del(`/community/posts/${id}/comments/${confirm.comment._id}`);
      toast.success('Comment deleted.');
      setConfirm(null);
      detail.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to={basePath} className="fw-bold text-decoration-none d-inline-block mb-2"><i className="bi bi-arrow-left me-1" aria-hidden="true" />Back to community</Link>
      <article className="card section-card mb-4">
        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
          <span className="tone tone-lime">{post.category}</span>
          {post.isHidden && <StatusBadge status="Hidden" label="Hidden by moderator" />}
          <span className="small text-muted ms-auto">{timeAgo(post.createdAt)}</span>
        </div>
        <h1 className="h2">{post.title}</h1>
        <div className="small text-muted mb-3"><Avatar name={post.author?.name} size="1.8rem" className="me-2" /><strong>{post.author?.name}</strong>{post.author?.location ? ` · ${post.author.location}` : ''}</div>
        <p style={{ whiteSpace: 'pre-wrap' }}>{post.body}</p>
        <div className="d-flex flex-wrap gap-2 pt-3 border-top">
          <button type="button" className={`btn btn-sm ${post.liked ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={post.liked} onClick={() => act(() => api.post(`/community/posts/${id}/like`))}><i className={`bi ${post.liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} me-1`} aria-hidden="true" />{post.likesCount} helpful</button>
          {(mine || isAdmin) && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(true)}><i className="bi bi-pencil me-1" aria-hidden="true" />Edit</button>}
          {(mine || isAdmin) && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setConfirm({ type: 'post' })}><i className="bi bi-trash me-1" aria-hidden="true" />Delete</button>}
          {isAdmin && <button type="button" className="btn btn-sm btn-outline-dark ms-auto" onClick={() => act(() => api.patch(`/community/posts/${id}/moderate`, { isHidden: !post.isHidden }), post.isHidden ? 'Post is visible to farmers again.' : 'Post hidden from farmers.')}><i className={`bi ${post.isHidden ? 'bi-eye' : 'bi-eye-slash'} me-1`} aria-hidden="true" />{post.isHidden ? 'Unhide post' : 'Hide post'}</button>}
        </div>
      </article>

      <section aria-labelledby="comments-h">
        <h2 id="comments-h" className="h4"><i className="bi bi-chat-dots me-2 text-primary" aria-hidden="true" />{post.commentCount} comment{post.commentCount === 1 ? '' : 's'}</h2>
        <form onSubmit={submitComment} className="card section-card mt-3">
          {replyTo && <div className="small mb-2">Replying to <strong>{replyTo.author?.name}</strong> <button type="button" className="btn btn-link btn-sm p-0 ms-2" onClick={() => setReplyTo(null)}>Cancel reply</button></div>}
          <label htmlFor="new-comment" className="form-label">Add your answer or comment</label>
          <textarea id="new-comment" className="form-control" rows={3} maxLength={1500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share what worked for you…" />
          <div className="d-flex justify-content-between align-items-center mt-2"><span className="small text-muted">{comment.length}/1500</span><button type="submit" className="btn btn-primary" disabled={posting || !comment.trim()}>{posting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Post comment</button></div>
        </form>
        {threads.length === 0 ? <p className="text-muted mt-3">No comments yet — be the first to help.</p> : threads.map(({ comment: c, replies }) => (
          <CommentItem key={c._id} comment={c} replies={replies} canDelete={canDeleteComment} onDelete={(cm) => setConfirm({ type: 'comment', comment: cm })} onReply={(cm) => { setReplyTo(cm); document.getElementById('new-comment')?.focus(); }} />
        ))}
      </section>

      <Modal show={editing} title="Edit post" onClose={() => setEditing(false)}>
        {editing && <DynamicForm fields={postFields(meta.POST_CATEGORIES)} initial={post} onCancel={() => setEditing(false)} onSubmit={async (values) => { await api.put(`/community/posts/${id}`, values); toast.success('Post updated successfully.'); setEditing(false); detail.refresh(); }} />}
      </Modal>
      <ConfirmModal show={Boolean(confirm)} busy={busy} title={confirm?.type === 'post' ? 'Delete this post?' : 'Delete this comment?'} confirmLabel="Delete" onConfirm={confirmDelete} onClose={() => setConfirm(null)}
        message={confirm?.type === 'post' ? 'The post and all of its comments will be permanently removed.' : 'This comment will be permanently removed.'} />
    </>
  );
}
