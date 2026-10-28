import { useState } from 'react';
import useMeta from '../../hooks/useMeta';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import Tabs from '../../components/Tabs';
import ResourceManager from '../../components/ResourceManager';
import { StatusBadge } from '../../components/Badges';
import ConsultationsPanel from './ConsultationsPanel';

export default function AdminExperts() {
  const { t } = useLanguage();
  const meta = useMeta();
  const [tab, setTab] = useState('experts');

  const fields = [
    { name: 'name', label: 'Name', required: true, maxLength: 100, span: 6 },
    { name: 'title', label: 'Title', required: true, maxLength: 120, placeholder: 'e.g. Senior Agronomist', span: 6 },
    { name: 'expertise', label: 'Main expertise', required: true, maxLength: 120, span: 6 },
    { name: 'experienceYears', label: 'Experience (years)', type: 'number', integer: true, required: true, min: 0, max: 70, step: 1, span: 6 },
    { name: 'specializations', label: 'Specializations', type: 'tags', placeholder: 'Soil testing, Drip irrigation', help: 'Separate with commas.' },
    { name: 'availability', label: 'Availability', maxLength: 120, placeholder: 'e.g. Mon–Sat, 9am–5pm', span: 6 },
    { name: 'languages', label: 'Languages (codes)', type: 'tags', placeholder: `${meta.LANGUAGES.map((l) => l.code).join(', ')}`, help: 'Use language codes, separated by commas.', span: 6 },
    { name: 'bio', label: 'Short biography', type: 'textarea', required: true, maxLength: 800 },
    { name: 'isActive', label: 'Visibility', type: 'checkbox', checkLabel: 'Accepting consultation requests', defaultChecked: true },
  ];

  return (
    <>
      <PageHeader title={t('nav.experts')} subtitle="Maintain the expert directory and respond to consultation requests." />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: 'experts', label: 'Expert directory', icon: 'bi-person-workspace' }, { id: 'consultations', label: 'Consultation requests', icon: 'bi-chat-heart' }]} />
      {tab === 'experts' ? (
        <ResourceManager
          embedded
          subtitle="Experts farmers can book. Deactivate to hide someone without deleting their history."
          endpoint="/experts"
          noun="Expert"
          searchPlaceholder="Name, expertise or specialization"
          emptyIcon="bi-person-workspace"
          emptyText="Add an agronomist or specialist for farmers to consult."
          columns={[
            { header: 'Expert', render: (e) => <><div className="fw-bold">{e.name}</div><div className="small text-muted">{e.title}</div></> },
            { header: 'Expertise', render: (e) => e.expertise },
            { header: 'Experience', render: (e) => `${e.experienceYears} yrs` },
            { header: 'Specializations', render: (e) => <div className="d-flex flex-wrap gap-1">{(e.specializations || []).slice(0, 3).map((s) => <span key={s} className="tone tone-lime">{s}</span>)}</div> },
            { header: 'Availability', render: (e) => e.availability || '—' },
            { header: 'Status', render: (e) => <StatusBadge status={e.isActive ? 'Active' : 'Inactive'} /> },
          ]}
          fields={fields}
        />
      ) : <ConsultationsPanel />}
    </>
  );
}
