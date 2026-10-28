import { Link } from 'react-router-dom';
import { StatusBadge, Meter } from './Badges';
import SmartImage from './SmartImage';
import { cropImage } from '../utils/images';
import { GROWTH_ICONS, formatDate } from '../utils/format';

export default function CropCard({ crop, onEdit, onDelete }) {
  const days = crop.daysToHarvest;
  const harvestText = crop.growthStage === 'Harvested' ? 'Harvested' : days === null || days === undefined ? '—' : days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Harvest today' : `${days} days to harvest`;
  return (
    <article className="card card-hover h-100">
      <SmartImage image={cropImage(crop.name)} ratio="16 / 8" sizes="(min-width: 992px) 30vw, 100vw" fallbackLabel={`${crop.name} photo unavailable`} />
      <div className="section-card d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="h5 mb-0 text-truncate"><Link to={`/crops/${crop._id}`} className="text-decoration-none stretched-link-none">{crop.name}</Link></h3>
            <div className="small text-muted text-truncate">{crop.variety || 'Variety not set'}{crop.farm && crop.farm.name ? ` · ${crop.farm.name}` : ''}</div>
          </div>
          <StatusBadge status={crop.healthStatus} />
        </div>
        <div className="d-flex align-items-center gap-2 mb-2 fw-bold small" style={{ color: 'var(--leaf-700)' }}>
          <i className={`bi ${GROWTH_ICONS[crop.growthStage] || 'bi-flower2'}`} aria-hidden="true" />{crop.growthStage}
          <span className="ms-auto text-muted">{crop.progress}%</span>
        </div>
        <Meter value={crop.progress} label={`${crop.name} growth progress`} />
        <dl className="row small mt-3 mb-0 g-1">
          <dt className="col-5 text-muted fw-semibold">Planted</dt><dd className="col-7 mb-0">{formatDate(crop.plantingDate)}</dd>
          <dt className="col-5 text-muted fw-semibold">Harvest</dt><dd className="col-7 mb-0">{formatDate(crop.expectedHarvestDate)}</dd>
          <dt className="col-5 text-muted fw-semibold">Status</dt><dd className="col-7 mb-0 fw-bold">{harvestText}</dd>
        </dl>
        {(onEdit || onDelete) && (
          <div className="d-flex gap-2 mt-3 pt-3 border-top">
            <Link to={`/crops/${crop._id}`} className="btn btn-sm btn-outline-primary flex-grow-1"><i className="bi bi-eye me-1" aria-hidden="true" />View</Link>
            {onEdit && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(crop)} aria-label={`Edit ${crop.name}`}><i className="bi bi-pencil" aria-hidden="true" /></button>}
            {onDelete && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(crop)} aria-label={`Delete ${crop.name}`}><i className="bi bi-trash" aria-hidden="true" /></button>}
          </div>
        )}
      </div>
    </article>
  );
}
