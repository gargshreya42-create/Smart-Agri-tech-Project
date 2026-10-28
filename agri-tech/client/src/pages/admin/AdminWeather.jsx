import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import Tabs from '../../components/Tabs';
import ResourceManager from '../../components/ResourceManager';
import { AlertBox, StatusBadge } from '../../components/Badges';
import { formatDate, formatDateTime } from '../../utils/format';

const SEVERITY_LABEL = { info: 'Information', warning: 'Warning', danger: 'Severe' };
const SEVERITY_TONE = { info: 'tone-blue', warning: 'tone-amber', danger: 'tone-red' };

const advisoryFields = [
  { name: 'title', label: 'Title', required: true, maxLength: 120, placeholder: 'e.g. Heavy rainfall expected' },
  { name: 'message', label: 'Message to farmers', type: 'textarea', required: true, maxLength: 600, rows: 3 },
  { name: 'severity', label: 'Severity', type: 'select', options: [{ value: 'info', label: 'Information' }, { value: 'warning', label: 'Warning' }, { value: 'danger', label: 'Severe' }], span: 4 },
  { name: 'region', label: 'Region', maxLength: 100, placeholder: 'All', help: 'Type "All" or part of a farmer’s location, e.g. Bhopal.', span: 4 },
  { name: 'expiresAt', label: 'Expires on', type: 'date', help: 'Optional. Leave blank to keep it until you switch it off.', span: 4 },
  { name: 'active', label: 'Visibility', type: 'checkbox', checkLabel: 'Advisory is live', defaultChecked: true },
];

export default function AdminWeather() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('advisories');

  return (
    <>
      <PageHeader title={t('nav.weather')} subtitle="Publish weather advisories and review cached forecast data." />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: 'advisories', label: 'Advisories', icon: 'bi-megaphone' }, { id: 'records', label: 'Cached forecasts', icon: 'bi-database' }]} />
      {tab === 'advisories' ? (
        <ResourceManager
          embedded
          subtitle="Advisories appear on matching farmers’ dashboards and weather pages."
          endpoint="/weather/alerts"
          params={{ all: 1 }}
          noun="Advisory"
          plural="advisories"
          searchable={false}
          emptyIcon="bi-megaphone"
          emptyText="Publish an advisory to warn farmers about storms, heat or frost."
          columns={[
            { header: 'Advisory', render: (a) => <><div className="fw-bold">{a.title}</div><div className="small text-muted line-clamp-2" style={{ maxWidth: '26rem' }}>{a.message}</div></> },
            { header: 'Severity', render: (a) => <span className={`tone ${SEVERITY_TONE[a.severity]}`}>{SEVERITY_LABEL[a.severity]}</span> },
            { header: 'Region', render: (a) => a.region || 'All' },
            { header: 'Expires', render: (a) => (a.expiresAt ? formatDate(a.expiresAt) : 'No expiry') },
            { header: 'Status', render: (a) => <StatusBadge status={a.active ? 'Active' : 'Inactive'} /> },
          ]}
          fields={advisoryFields}
        />
      ) : (
        <>
          <AlertBox severity="info" className="mb-3">Forecasts are cached per location to reduce external API calls and to serve as an offline fallback. Deleting a record simply forces a fresh download next time.</AlertBox>
          <ResourceManager
            embedded
            subtitle=""
            endpoint="/weather/records"
            noun="Record"
            canCreate={false}
            canEdit={false}
            searchPlaceholder="Location name"
            emptyIcon="bi-database"
            emptyText="Records are created automatically when farmers open the weather page."
            columns={[
              { header: 'Location', render: (r) => <><div className="fw-bold">{r.location && r.location.name}</div><div className="small text-muted">{[r.location && r.location.region, r.location && r.location.country].filter(Boolean).join(', ')}</div></> },
              { header: 'Now', render: (r) => (r.current ? `${Math.round(r.current.temperature)}°C · ${r.current.condition}` : '—') },
              { header: 'Humidity', render: (r) => (r.current ? `${r.current.humidity}%` : '—') },
              { header: 'Rain chance', render: (r) => (r.current ? `${r.current.rainProbability ?? 0}%` : '—') },
              { header: 'Forecast days', render: (r) => (r.forecast || []).length },
              { header: 'Source', render: (r) => r.source },
              { header: 'Fetched', render: (r) => formatDateTime(r.fetchedAt) },
            ]}
          />
        </>
      )}
    </>
  );
}
