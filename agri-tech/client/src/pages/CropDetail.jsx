import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import useMeta from '../hooks/useMeta';
import PageHeader from '../components/PageHeader';
import { AlertBox, Meter, StatusBadge } from '../components/Badges';
import { ErrorState, SkeletonCards } from '../components/feedback';
import SmartImage from '../components/SmartImage';
import { cropImage } from '../utils/images';
import { ACTIVITY_ICONS, GROWTH_ICONS, formatDate, timeAgo } from '../utils/format';

// Plain-language field advice derived from the forecast — advisory only.
function weatherTips(weather) {
  if (!weather) return [];
  const tips = [];
  const rainy = weather.forecast.find((d) => (d.rainProbability || 0) >= 60);
  if (rainy) tips.push({ severity: 'warning', title: 'Rain is likely soon', text: `${rainy.rainProbability}% chance on ${formatDate(rainy.date, { weekday: 'long' })}. Hold back irrigation and spraying, and keep drains clear.` });
  const hot = weather.forecast.find((d) => d.max >= 38);
  if (hot) tips.push({ severity: 'warning', title: 'Hot spell ahead', text: `Up to ${hot.max}°C around ${formatDate(hot.date, { weekday: 'long' })}. Irrigate early morning or evening.` });
  if (!tips.length) tips.push({ severity: 'success', title: 'Conditions look steady', text: 'No heavy rain or extreme heat in the next 7 days. Continue your normal routine.' });
  return tips;
}

export default function CropDetail() {
  const { id } = useParams();
  const meta = useMeta();
  const detail = useFetch(() => api.get(`/crops/${id}`), [id]);
  const farmLocation = detail.data && detail.data.crop.farm ? detail.data.crop.farm.location : null;
  const weather = useFetch(() => api.get('/weather', { location: farmLocation }), [farmLocation], { enabled: Boolean(farmLocation) });

  if (detail.loading) return <SkeletonCards count={3} height="10rem" />;
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />;

  const { crop, pestAlerts, latestSoil, activities } = detail.data;
  const stageIndex = meta.GROWTH_STAGES.indexOf(crop.growthStage);
  const soil = latestSoil && latestSoil.analysis;

  return (
    <>
      <Link to="/crops" className="fw-bold text-decoration-none d-inline-block mb-2"><i className="bi bi-arrow-left me-1" aria-hidden="true" />Back to crops</Link>
      <PageHeader title={`${crop.name}${crop.variety ? ` · ${crop.variety}` : ''}`} subtitle={crop.farm ? `${crop.farm.name} — ${crop.farm.location}` : ''} actions={<StatusBadge status={crop.healthStatus} />} />

      <div className="row g-4">
        <div className="col-lg-8 d-grid gap-4 align-content-start">
          <SmartImage image={cropImage(crop.name)} ratio="21 / 8" eager sizes="(min-width: 992px) 66vw, 100vw" zoom={false} className="rounded-4" fallbackLabel={`${crop.name} photo unavailable`} />

          <section className="card section-card">
            <div className="row g-4 align-items-center">
              <div className="col-sm-4 d-flex justify-content-center"><div className="ring" style={{ '--pct': crop.progress, '--size': '9rem' }} role="img" aria-label={`${crop.progress}% of growing season complete`}><span>{crop.progress}%</span></div></div>
              <div className="col-sm-8">
                <h2 className="h5">Growth progress</h2>
                <Meter value={crop.progress} label="Growth progress" />
                <ol className="list-inline mt-3 mb-0 d-flex flex-wrap gap-1">
                  {meta.GROWTH_STAGES.map((stage, i) => (
                    <li key={stage} className={`tone ${i === stageIndex ? 'tone-green' : i < stageIndex ? 'tone-lime' : 'tone-grey'}`} aria-current={i === stageIndex ? 'step' : undefined}>
                      <i className={`bi ${i < stageIndex ? 'bi-check-lg' : GROWTH_ICONS[stage]}`} aria-hidden="true" />{stage}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="card section-card">
            <h2 className="h5 mb-3">Crop information</h2>
            <dl className="row mb-0 g-2">
              {[['Planting date', formatDate(crop.plantingDate)], ['Expected harvest', formatDate(crop.expectedHarvestDate)],
                ['Days to harvest', crop.growthStage === 'Harvested' ? 'Harvested' : crop.daysToHarvest === null ? '—' : crop.daysToHarvest < 0 ? `${Math.abs(crop.daysToHarvest)} overdue` : crop.daysToHarvest],
                ['Growth stage', crop.growthStage], ['Area cultivated', `${crop.areaAcres} acres`], ['Soil type', crop.soilType || crop.farm?.soilType || '—'],
                ['Irrigation', crop.irrigationMethod || crop.farm?.irrigationType || '—']].map(([label, value]) => (
                <div key={label} className="col-6 col-md-4"><dt className="small text-muted">{label}</dt><dd className="fw-bold mb-0">{value}</dd></div>
              ))}
            </dl>
            {crop.notes && <p className="mt-3 mb-0 p-3 rounded-3" style={{ background: 'var(--leaf-50)' }}><i className="bi bi-journal-text me-2" aria-hidden="true" />{crop.notes}</p>}
          </section>

          <section>
            <h2 className="h5 mb-2">Pest alerts for {crop.name}</h2>
            {pestAlerts.length === 0 ? <AlertBox severity="success" title="No active pest alerts">Your {crop.name.toLowerCase()} looks clear for now.</AlertBox> : (
              <div className="d-grid gap-2">
                {pestAlerts.map((p) => (
                  <div key={p._id} className="card section-card">
                    <div className="d-flex justify-content-between gap-2"><strong>{p.name}</strong><StatusBadge status={p.riskLevel} label={`${p.riskLevel} risk`} /></div>
                    <p className="small mb-1 mt-1">{p.description}</p>
                    <p className="small fw-bold mb-0"><i className="bi bi-check2-square me-1" aria-hidden="true" />{p.recommendedAction}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="col-lg-4 d-grid gap-4 align-content-start">
          <section className="card section-card">
            <h2 className="h5 mb-3"><i className="bi bi-cloud-sun me-2 text-primary" aria-hidden="true" />Weather considerations</h2>
            {weather.loading ? <div className="skeleton" style={{ height: '6rem' }} /> : weather.error ? <p className="text-muted mb-0">Forecast unavailable right now. {weather.error}</p> : (
              <div className="d-grid gap-2">{weatherTips(weather.data).map((t) => <AlertBox key={t.title} severity={t.severity} title={t.title}>{t.text}</AlertBox>)}</div>
            )}
          </section>

          <section className="card section-card">
            <h2 className="h5 mb-3"><i className="bi bi-layers me-2 text-primary" aria-hidden="true" />Soil information</h2>
            {!soil ? (
              <p className="text-muted mb-0">No soil reading for this farm yet. <Link to={`/soil?farm=${crop.farm?._id || ''}`} className="fw-bold">Add one</Link>.</p>
            ) : (
              <>
                <div className="d-flex justify-content-between mb-2"><span>Overall</span><StatusBadge status={soil.overallStatus} label={`${soil.overallStatus} · ${soil.overallScore}/100`} /></div>
                <ul className="list-unstyled mb-2 d-grid gap-1 small">
                  {Object.entries(soil.parameters).map(([key, p]) => <li key={key} className="d-flex justify-content-between"><span className="text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><StatusBadge status={p.status} /></li>)}
                </ul>
                <div className="small text-muted">Sampled {formatDate(latestSoil.sampledOn)}</div>
              </>
            )}
          </section>

          <section className="card section-card">
            <h2 className="h5 mb-3">Recent activities</h2>
            {activities.length === 0 ? <p className="text-muted mb-0">No activity recorded for this crop yet.</p> : (
              <ul className="list-unstyled d-grid gap-2 mb-0">{activities.map((a) => <li key={a._id} className="d-flex gap-2 small"><i className={`bi ${ACTIVITY_ICONS[a.type]} text-primary`} aria-hidden="true" /><span>{a.message}<br /><span className="text-muted">{timeAgo(a.createdAt)}</span></span></li>)}</ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
