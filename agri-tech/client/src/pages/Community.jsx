import { useState } from 'react';
import { api, errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useMeta from '../hooks/useMeta';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import Pagination from '../components/Pagination';
import PostCard from '../components/PostCard';
import { DataState, EmptyState } from '../components/feedback';
import { BackdropImage } from '../components/SmartImage';
import { COMMUNITY_BANNER } from '../utils/images';

export const postFields = (categories) => [
  { name: 'title', label: 'Title', required: true, minLength: 5, maxLength: 160, placeholder: 'e.g. Why are my wheat leaves turning yellow?' },
  { name: 'category', label: 'Category', type: 'select', options: categories, required: true },
  { name: 'body', label: 'Your post', type: 'textarea', rows: 6, required: true, minLength: 10, maxLength: 4000, help: 'Share details — crop, stage, weather, what you tried.' },
];

export default function Community() {
  const { t } = useLanguage();
  const toast = useToast();
  const meta = useMeta();
  const [tab, setTab] = useState('recent');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const search = useDebounce(q);
  const posts = useFetch(() => api.get('/community/posts', {
    q: search || undefined, category: category || undefined, page,
    sort: tab === 'popular' ? 'popular' : undefined, mine: tab === 'mine' ? 'true' : undefined,
  }), [search, category, page, tab]);
  const filtered = Boolean(search || category);

  const create = async (values) => {
    await api.post('/community/posts', values);
    toast.success('Post published successfully.');
    setCreating(false);
    setTab('recent');
    setPage(1);
    posts.reload();
  };

  const like = async (post) => {
    try {
      await api.post(`/community/posts/${post._id}/like`);
      posts.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const newPost = <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}><i className="bi bi-pencil-square me-1" aria-hidden="true" />Ask or share</button>;
  const tabs = [['recent', 'bi-clock', 'Recent'], ['popular', 'bi-fire', 'Popular'], ['mine', 'bi-person', 'My posts']];

  return (
    <>
      <section className="hero-banner has-backdrop mb-4" style={{ padding: '1.1rem 1.4rem' }}>
        <BackdropImage image={COMMUNITY_BANNER} strength="soft" />
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div><h1 className="mb-1">{t('community.title')}</h1><p className="mb-0 opacity-75">{t('community.subtitle')}</p></div>
          {newPost}
        </div>
      </section>
      <ul className="nav nav-pills nav-pills-agri mb-3" role="tablist">
        {tabs.map(([key, icon, label]) => <li key={key} className="nav-item" role="presentation"><button type="button" role="tab" aria-selected={tab === key} className={`nav-link ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); setPage(1); }}><i className={`bi ${icon} me-1`} aria-hidden="true" />{label}</button></li>)}
      </ul>
      <div className="card section-card mb-3">
        <label className="form-label" htmlFor="post-q">{t('common.search')}</label>
        <input id="post-q" type="search" className="form-control mb-3" placeholder="Search questions and discussions" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <div className="d-flex flex-wrap gap-2" role="group" aria-label="Categories">
          <button type="button" className={`chip-btn ${!category ? 'active' : ''}`} onClick={() => { setCategory(''); setPage(1); }}>{t('common.all')}</button>
          {meta.POST_CATEGORIES.map((c) => <button key={c} type="button" className={`chip-btn ${category === c ? 'active' : ''}`} aria-pressed={category === c} onClick={() => { setCategory(c); setPage(1); }}>{c}</button>)}
        </div>
      </div>
      <DataState loading={posts.loading} error={posts.error} onRetry={posts.reload} isEmpty={posts.data && posts.data.length === 0}
        empty={<EmptyState icon="bi-chat-heart" title={filtered ? t('common.noResults') : tab === 'mine' ? 'You haven’t posted yet' : 'No discussions yet'} text="Be the first to ask a question or share what worked on your farm." action={newPost} />}>
        <div className="d-grid gap-3">{(posts.data || []).map((p) => <PostCard key={p._id} post={p} onLike={like} />)}</div>
        <Pagination meta={posts.meta} onChange={setPage} />
      </DataState>
      <Modal show={creating} title="Start a discussion" onClose={() => setCreating(false)}>
        {creating && <DynamicForm fields={postFields(meta.POST_CATEGORIES)} initial={{ category: category || 'General' }} onSubmit={create} onCancel={() => setCreating(false)} submitLabel="Publish" />}
      </Modal>
    </>
  );
}
