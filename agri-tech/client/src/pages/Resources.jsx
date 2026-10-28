import { useState } from 'react';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useMeta from '../hooks/useMeta';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { StatusBadge } from '../components/Badges';
import { DataState, EmptyState } from '../components/feedback';
import SmartImage from '../components/SmartImage';
import { resourceImage } from '../utils/images';
import { CATEGORY_ICONS, formatINR } from '../utils/format';

export function ProductCard({ resource, onAdd }) {
  const soldOut = !resource.available || resource.stock <= 0;
  const low = !soldOut && resource.stock <= 10;
  return (
    <article className="card card-hover h-100">
      <SmartImage image={resourceImage(resource)} ratio="4 / 3" sizes="(min-width: 1200px) 20vw, (min-width: 768px) 33vw, 50vw"
        fallbackIcon={CATEGORY_ICONS[resource.category] || 'bi-box'} fallbackLabel={`${resource.category || 'Product'} photo unavailable`} />
      <div className="section-card d-flex flex-column flex-grow-1">
        <div className="d-flex justify-content-between gap-2 mb-1">
          <span className="tone tone-lime"><i className={`bi ${CATEGORY_ICONS[resource.category]}`} aria-hidden="true" />{resource.category}</span>
          <StatusBadge status={soldOut ? 'Out of stock' : low ? 'Low_stock' : 'Available'} label={soldOut ? 'Out of stock' : low ? `Only ${resource.stock} left` : 'In stock'} />
        </div>
        <h3 className="h6 mt-2 mb-0">{resource.name}</h3>
        {resource.brand && <div className="small text-muted">{resource.brand}</div>}
        <p className="small text-muted line-clamp-2 my-2">{resource.description}</p>
        <div className="mt-auto d-flex align-items-end justify-content-between gap-2">
          <div><div className="display-font fs-4 fw-bold" style={{ color: 'var(--leaf-800)' }}>{formatINR(resource.price)}</div><div className="small text-muted">per {resource.unit}</div></div>
          <button type="button" className="btn btn-primary btn-sm" disabled={soldOut} onClick={() => onAdd(resource)} aria-label={`Add ${resource.name} to cart`}>
            <i className="bi bi-cart-plus me-1" aria-hidden="true" />{soldOut ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Resources() {
  const { t } = useLanguage();
  const meta = useMeta();
  const cart = useCart();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const search = useDebounce(q);
  const list = useFetch(() => api.get('/resources', { q: search || undefined, category: category || undefined, availability: availability || undefined, sort, page }), [search, category, availability, sort, page]);
  const filtered = Boolean(search || category || availability);

  const add = (resource) => {
    cart.add(resource, 1);
    toast.success(`${resource.name} added to your cart.`);
  };

  return (
    <>
      <PageHeader title={t('resources.title')} subtitle={t('resources.subtitle')}
        actions={<button type="button" className="btn btn-outline-primary" onClick={() => cart.setOpen(true)}><i className="bi bi-cart3 me-1" aria-hidden="true" />{t('nav.cart')} ({cart.count})</button>} />
      <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Category">
        <button type="button" className={`chip-btn ${!category ? 'active' : ''}`} onClick={() => { setCategory(''); setPage(1); }}>{t('common.all')}</button>
        {meta.RESOURCE_CATEGORIES.map((c) => <button key={c} type="button" className={`chip-btn ${category === c ? 'active' : ''}`} aria-pressed={category === c} onClick={() => { setCategory(c); setPage(1); }}><i className={`bi ${CATEGORY_ICONS[c]} me-1`} aria-hidden="true" />{c}</button>)}
      </div>
      <div className="card section-card mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-6"><label className="form-label" htmlFor="res-q">{t('common.search')}</label><input id="res-q" type="search" className="form-control" placeholder="Product, brand or keyword" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <div className="col-6 col-md-3"><label className="form-label" htmlFor="res-av">Availability</label>
            <select id="res-av" className="form-select" value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1); }}><option value="">{t('common.all')}</option><option value="in-stock">In stock</option><option value="out-of-stock">Out of stock</option></select></div>
          <div className="col-6 col-md-3"><label className="form-label" htmlFor="res-sort">Sort by</label>
            <select id="res-sort" className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">Name</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="newest">Newest</option></select></div>
        </div>
      </div>
      <DataState loading={list.loading} error={list.error} onRetry={list.reload} isEmpty={list.data && list.data.length === 0}
        empty={<EmptyState icon="bi-search" title={filtered ? t('common.noResults') : 'No products available yet'} text="Try a different search or category." />}>
        <div className="row g-3">{(list.data || []).map((r) => <div key={r._id} className="col-6 col-lg-4 col-xl-3"><ProductCard resource={r} onAdd={add} /></div>)}</div>
        <Pagination meta={list.meta} onChange={setPage} />
      </DataState>
    </>
  );
}
