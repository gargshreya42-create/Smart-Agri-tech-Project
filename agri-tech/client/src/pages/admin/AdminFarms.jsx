import useMeta from '../../hooks/useMeta';
import { useLanguage } from '../../context/LanguageContext';
import ResourceManager from '../../components/ResourceManager';
import { Thumb } from '../../components/SmartImage';
import { farmImage } from '../../utils/images';
import { formatDate } from '../../utils/format';

export default function AdminFarms() {
  const { t } = useLanguage();
  const meta = useMeta();

  const fields = [
    { name: 'name', label: 'Farm name', required: true, maxLength: 100, span: 6 },
    { name: 'location', label: 'Location', required: true, maxLength: 150, span: 6 },
    { name: 'sizeAcres', label: 'Size (acres)', type: 'number', required: true, min: 0.01, max: 100000, span: 4 },
    { name: 'soilType', label: 'Soil type', type: 'select', options: meta.SOIL_TYPES, required: true, span: 4 },
    { name: 'irrigationType', label: 'Irrigation', type: 'select', options: meta.IRRIGATION_TYPES, required: true, span: 4 },
    { name: 'farmingType', label: 'Farming type', type: 'select', options: meta.FARMING_TYPES, span: 6 },
    { name: 'primaryCrops', label: 'Primary crops', type: 'tags', placeholder: 'Wheat, Soybean', help: 'Separate with commas.', span: 6 },
    { name: 'imageUrl', label: 'Farm photo URL', maxLength: 500, placeholder: 'https://…', help: 'Optional. Leave empty to use a matching photo.', pattern: /^https?:\/\/\S+$/i, patternMessage: 'The photo link must start with http:// or https://' },
    { name: 'notes', label: 'Notes', type: 'textarea', maxLength: 1000 },
  ];

  return (
    <ResourceManager
      title={t('nav.farms')}
      subtitle="Every farm registered on the platform. Farmers add their own farms; administrators can correct details or remove records."
      endpoint="/farms"
      noun="Farm"
      searchPlaceholder="Farm name or location"
      canCreate={false}
      emptyIcon="bi-geo-alt"
      emptyText="Farms appear here as soon as farmers add them."
      columns={[
        { header: 'Farm', render: (f) => (
          <div className="d-flex align-items-center gap-2">
            <Thumb image={farmImage(f)} label={`${f.name} photo unavailable`} icon="bi-geo-alt" />
            <div><div className="fw-bold">{f.name}</div><div className="small text-muted"><i className="bi bi-geo-alt me-1" aria-hidden="true" />{f.location}</div></div>
          </div>
        ) },
        { header: 'Owner', render: (f) => (f.owner ? <><div>{f.owner.name}</div><div className="small text-muted">{f.owner.email}</div></> : '—') },
        { header: 'Size', render: (f) => `${f.sizeAcres} acres` },
        { header: 'Soil / irrigation', render: (f) => <>{f.soilType}<div className="small text-muted">{f.irrigationType}</div></> },
        { header: 'Type', render: (f) => f.farmingType || '—' },
        { header: 'Crops', render: (f) => <span className="tone tone-lime"><i className="bi bi-flower2" aria-hidden="true" />{f.cropCount}</span> },
        { header: 'Added', render: (f) => formatDate(f.createdAt) },
      ]}
      fields={fields}
    />
  );
}
