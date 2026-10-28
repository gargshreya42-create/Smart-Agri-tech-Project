import { useState } from 'react';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useMeta from '../hooks/useMeta';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import { DataState, EmptyState } from '../components/feedback';
import { StatusBadge } from '../components/Badges';
import Pagination from '../components/Pagination';
import SmartImage from '../components/SmartImage';
import { healthyCropImage, pestImage } from '../utils/images';
import { formatDate } from '../utils/format';

export function PestCard({ alert }) {
  const [open, setOpen] = useState(false);
  const critical = alert.riskLevel === 'Critical' || alert.riskLevel === 'High';
  const { image, exact } = pestImage(alert);
  const healthy = exact ? healthyCropImage(alert) : null; // show "healthy → affected" when both photos exist
  return (
    <article className="card card-hover h-100" style={critical ? { borderLeft: '5px solid #c0392b' } : undefined}>
      <SmartImage image={image} ratio="16 / 8" sizes="(min-width: 1200px) 30vw, 100vw" fallbackIcon="bi-bug" fallbackLabel={`${alert.name} photo unavailable`}>
        {!exact && image && <span className="img-tag"><i className="bi bi-flower2" aria-hidden="true" />Affected crop: {alert.crops[0]}</span>}
        {healthy && (
          <figure className="img-inset mb-0">
            <SmartImage image={healthy} ratio="4 / 3" width={480} sizes="10rem" zoom={false} decorative fallbackLabel="Healthy crop" />
            <figcaption>Healthy {alert.crops[0]}</figcaption>
          </figure>
        )}
      </SmartImage>
      <div className="section-card h-100 d-flex flex-column">
        <div className="d-flex justify-content-between gap-2 align-items-start mb-2">
          <div className="min-w-0">
            <h3 className="h5 mb-0">{alert.name}</h3>
            <div className="small text-muted">{alert.type} · detected {formatDate(alert.detectedOn)}{alert.region ? ` · ${alert.region}` : ''}</div>
          </div>
          <StatusBadge status={alert.riskLevel} label={`${alert.riskLevel} risk`} />
        </div>
        <div className="d-flex flex-wrap gap-1 mb-2">{alert.crops.map((c) => <span key={c} className="tone tone-lime"><i className="bi bi-flower2" aria-hidden="true" />{c}</span>)}</div>
        <p className={`mb-2 ${open ? '' : 'line-clamp-2'}`}>{alert.description}</p>
        <div className="p-2 rounded-3 mb-2" style={{ background: 'var(--leaf-50)' }}>
          <div className="small fw-bold text-uppercase" style={{ color: 'var(--leaf-700)' }}><i className="bi bi-check2-square me-1" aria-hidden="true" />Recommended action</div>
          <div className={open ? '' : 'line-clamp-2'}>{alert.recommendedAction}</div>
        </div>
        {open && alert.preventiveSuggestions && alert.preventiveSuggestions.length > 0 && (
          <div className="mb-2">
            <div className="small fw-bold text-uppercase text-muted mb-1">Preventive suggestions</div>
            <ul className="mb-0 ps-3">{alert.preventiveSuggestions.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        )}
        <button type="button" className="btn btn-link p-0 mt-auto align-self-start fw-bold" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Show prevention & details'} <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function Pests() {
  const { t } = useLanguage();
  const meta = useMeta();
  const [q, setQ] = useState('');
  const [risk, setRisk] = useState('');
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);
  const search = useDebounce(q);
  const alerts = useFetch(() => api.get('/pests', { q: search || undefined, risk: risk || undefined, mine: mine || undefined, page, limit: 12 }), [search, risk, mine, page]);
  const filtered = Boolean(search || risk || mine);

  return (
    <>
      <PageHeader title={t('pests.title')} subtitle={t('pests.subtitle')} />
      <div className="card section-card mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5"><label className="form-label" htmlFor="pest-q">{t('common.search')}</label><input id="pest-q" type="search" className="form-control" placeholder="Pest, disease or crop" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <div className="col-6 col-md-3"><label className="form-label" htmlFor="pest-risk">Risk level</label>
            <select id="pest-risk" className="form-select" value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1); }}><option value="">{t('common.all')}</option>{meta.RISK_LEVELS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="col-6 col-md-4 d-flex gap-2">
            <button type="button" className={`chip-btn flex-grow-1 ${!mine ? 'active' : ''}`} aria-pressed={!mine} onClick={() => { setMine(false); setPage(1); }}>All alerts</button>
            <button type="button" className={`chip-btn flex-grow-1 ${mine ? 'active' : ''}`} aria-pressed={mine} onClick={() => { setMine(true); setPage(1); }}>For my crops</button>
          </div>
        </div>
      </div>
      <DataState loading={alerts.loading} error={alerts.error} onRetry={alerts.reload} isEmpty={alerts.data && alerts.data.length === 0}
        empty={<EmptyState icon={filtered ? 'bi-search' : 'bi-shield-check'} title={t('empty.pests.title')} text={filtered ? t('common.noResults') : t('empty.pests.text')} />}>
        <div className="row g-3">{(alerts.data || []).map((a) => <div key={a._id} className="col-12 col-xl-6"><PestCard alert={a} /></div>)}</div>
        <Pagination meta={alerts.meta} onChange={setPage} />
      </DataState>
    </>
  );
}
