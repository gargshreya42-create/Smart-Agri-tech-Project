import useMeta from '../../hooks/useMeta';
import { useLanguage } from '../../context/LanguageContext';
import ResourceManager from '../../components/ResourceManager';
import { StatusBadge } from '../../components/Badges';
import { Thumb } from '../../components/SmartImage';
import { pestImage } from '../../utils/images';
import { formatDate } from '../../utils/format';

export default function AdminPests() {
  const { t } = useLanguage();
  const meta = useMeta();

  const fields = [
    { name: 'name', label: 'Pest / disease name', required: true, maxLength: 120, span: 6 },
    { name: 'type', label: 'Type', type: 'select', options: ['Pest', 'Disease', 'Weed'], span: 3 },
    { name: 'riskLevel', label: 'Risk level', type: 'select', options: meta.RISK_LEVELS, required: true, span: 3 },
    { name: 'crops', label: 'Affected crops', type: 'tags', required: true, placeholder: 'Soybean, Cotton', help: 'Separate with commas. Farmers see alerts matching their crops.', span: 6 },
    { name: 'region', label: 'Region', maxLength: 100, placeholder: 'e.g. Malwa Plateau', span: 3 },
    { name: 'detectedOn', label: 'Detection date', type: 'date', span: 3 },
    { name: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 1200 },
    { name: 'preventiveSuggestions', label: 'Preventive suggestions', type: 'lines', rows: 4, help: 'One suggestion per line.' },
    { name: 'imageUrl', label: 'Photo URL', maxLength: 500, placeholder: 'https://…', help: 'Optional. Leave empty to use a matching photo automatically.', pattern: /^https?:\/\/\S+$/i, patternMessage: 'The photo link must start with http:// or https://' },
    { name: 'recommendedAction', label: 'Recommended action', type: 'textarea', required: true, maxLength: 600, rows: 2 },
    { name: 'active', label: 'Visibility', type: 'checkbox', checkLabel: 'Alert is active and visible to farmers', defaultChecked: true },
  ];

  return (
    <ResourceManager
      title={t('nav.pests')}
      subtitle="Publish, update and retire pest and disease alerts."
      endpoint="/pests"
      noun="Alert"
      searchPlaceholder="Pest, disease or crop"
      emptyIcon="bi-bug"
      emptyText="Publish an alert to warn farmers growing the affected crops."
      filters={[
        { name: 'risk', label: 'Risk level', options: meta.RISK_LEVELS },
        { name: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      ]}
      columns={[
        { header: 'Alert', render: (a) => (
          <div className="d-flex align-items-center gap-2">
            <Thumb image={pestImage(a).image} label={`${a.name} photo unavailable`} icon="bi-bug" />
            <div><div className="fw-bold">{a.name}</div><div className="small text-muted">{a.type}{a.region ? ` · ${a.region}` : ''}</div></div>
          </div>
        ) },
        { header: 'Crops', render: (a) => <div className="d-flex flex-wrap gap-1">{a.crops.map((c) => <span key={c} className="tone tone-lime">{c}</span>)}</div> },
        { header: 'Risk', render: (a) => <StatusBadge status={a.riskLevel} /> },
        { header: 'Detected', render: (a) => formatDate(a.detectedOn) },
        { header: 'Status', render: (a) => <StatusBadge status={a.active ? 'Active' : 'Inactive'} /> },
      ]}
      fields={fields}
    />
  );
}
