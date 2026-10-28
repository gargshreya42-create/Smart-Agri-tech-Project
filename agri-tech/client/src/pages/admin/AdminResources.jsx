import useMeta from '../../hooks/useMeta';
import { useLanguage } from '../../context/LanguageContext';
import ResourceManager from '../../components/ResourceManager';
import { StatusBadge } from '../../components/Badges';
import { Thumb } from '../../components/SmartImage';
import { resourceImage } from '../../utils/images';
import { CATEGORY_ICONS, formatINR } from '../../utils/format';

const LOW_STOCK = 10;

function Availability({ resource }) {
  if (!resource.available) return <StatusBadge status="Inactive" label="Unavailable" />;
  if (resource.stock === 0) return <StatusBadge status="Out of stock" />;
  if (resource.stock <= LOW_STOCK) return <StatusBadge status="Low_stock" label="Low stock" />;
  return <StatusBadge status="Available" />;
}

export default function AdminResources() {
  const { t } = useLanguage();
  const meta = useMeta();

  const fields = [
    { name: 'name', label: 'Product name', required: true, maxLength: 120, span: 8 },
    { name: 'category', label: 'Category', type: 'select', options: meta.RESOURCE_CATEGORIES, required: true, span: 4 },
    { name: 'brand', label: 'Brand', maxLength: 80, span: 4 },
    { name: 'price', label: 'Price (₹)', type: 'number', required: true, min: 0, span: 4 },
    { name: 'unit', label: 'Unit', required: true, maxLength: 40, placeholder: 'e.g. 50 kg bag', span: 4 },
    { name: 'stock', label: 'Stock on hand', type: 'number', integer: true, required: true, min: 0, step: 1, span: 4 },
    { name: 'imageUrl', label: 'Image URL', maxLength: 500, placeholder: 'https://…', help: 'Optional. Leave empty to use a matching photo.', pattern: /^https?:\/\/\S+$/i, patternMessage: 'The image link must start with http:// or https://', span: 8 },
    { name: 'available', label: 'Availability', type: 'checkbox', checkLabel: 'Listed in the marketplace', defaultChecked: true, span: 4 },
    { name: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 800 },
  ];

  return (
    <ResourceManager
      title={t('nav.resources')}
      subtitle="Manage the marketplace catalogue, prices, stock and availability."
      endpoint="/resources"
      noun="Resource"
      searchPlaceholder="Product, brand or description"
      emptyIcon="bi-shop"
      emptyText="Add your first product to open the marketplace."
      filters={[
        { name: 'category', label: 'Category', options: meta.RESOURCE_CATEGORIES },
        { name: 'availability', label: 'Stock', options: [{ value: 'in-stock', label: 'In stock' }, { value: 'out-of-stock', label: 'Out of stock' }] },
      ]}
      columns={[
        { header: 'Product', render: (r) => (
          <div className="d-flex align-items-center gap-2">
            <Thumb image={resourceImage(r)} label={`${r.name} photo unavailable`} icon={CATEGORY_ICONS[r.category] || 'bi-box'} />
            <div className="min-w-0"><div className="fw-bold">{r.name}</div><div className="small text-muted">{r.brand || '—'}</div></div>
          </div>
        ) },
        { header: 'Category', render: (r) => r.category },
        { header: 'Price', render: (r) => <>{formatINR(r.price)}<div className="small text-muted">per {r.unit}</div></> },
        { header: 'Stock', render: (r) => r.stock },
        { header: 'Availability', render: (r) => <Availability resource={r} /> },
      ]}
      fields={fields}
    />
  );
}
