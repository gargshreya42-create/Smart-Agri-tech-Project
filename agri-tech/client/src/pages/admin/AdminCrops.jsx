import useMeta from '../../hooks/useMeta';
import { useLanguage } from '../../context/LanguageContext';
import ResourceManager from '../../components/ResourceManager';
import { StatusBadge } from '../../components/Badges';
import { Thumb } from '../../components/SmartImage';
import { cropImage } from '../../utils/images';
import { formatDate } from '../../utils/format';

export default function AdminCrops() {
  const { t } = useLanguage();
  const meta = useMeta();

  // Admins correct stage, health and notes; planting data stays with the farmer who recorded it.
  const fields = [
    { name: 'growthStage', label: 'Growth stage', type: 'select', options: meta.GROWTH_STAGES, required: true, span: 6 },
    { name: 'healthStatus', label: 'Health status', type: 'select', options: meta.CROP_HEALTH, required: true, span: 6 },
    { name: 'notes', label: 'Notes', type: 'textarea', maxLength: 1000 },
  ];

  return (
    <ResourceManager
      title={t('nav.crops')}
      subtitle="Monitor crops across all farms and update growth stage or health when needed."
      endpoint="/crops"
      noun="Crop"
      searchPlaceholder="Crop name or variety"
      canCreate={false}
      emptyIcon="bi-flower2"
      emptyText="Crops appear here as soon as farmers add them."
      filters={[
        { name: 'stage', label: 'Growth stage', options: meta.GROWTH_STAGES },
        { name: 'health', label: 'Health', options: meta.CROP_HEALTH },
      ]}
      columns={[
        { header: 'Crop', render: (c) => (
          <div className="d-flex align-items-center gap-2">
            <Thumb image={cropImage(c.name)} label={`${c.name} photo unavailable`} icon="bi-flower2" />
            <div><div className="fw-bold">{c.name}</div><div className="small text-muted">{c.variety || 'Variety not set'}</div></div>
          </div>
        ) },
        { header: 'Farm', render: (c) => (c.farm ? <>{c.farm.name}<div className="small text-muted">{c.farm.location}</div></> : '—') },
        { header: 'Farmer', render: (c) => (c.owner ? c.owner.name : '—') },
        { header: 'Planted', render: (c) => formatDate(c.plantingDate) },
        { header: 'Harvest', render: (c) => formatDate(c.expectedHarvestDate) },
        { header: 'Area', render: (c) => `${c.areaAcres} ac` },
        { header: 'Stage', render: (c) => c.growthStage },
        { header: 'Health', render: (c) => <StatusBadge status={c.healthStatus} /> },
      ]}
      fields={fields}
      modalSize="md"
    />
  );
}
