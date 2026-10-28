import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import useFetch from '../hooks/useFetch';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import { BackdropImage } from '../components/SmartImage';
import { DASHBOARD_BANNER } from '../utils/images';
import CropCard from '../components/CropCard';
import { WeatherNow } from '../components/WeatherParts';
import { AlertBox, StatusBadge } from '../components/Badges';
import { EmptyState, ErrorState, SkeletonCards } from '../components/feedback';
import { ACTIVITY_ICONS, formatDate, greetingKey, timeAgo } from '../utils/format';

const QUICK = [
  ['/crops', 'bi-plus-circle', 'crops.add'],
  ['/soil', 'bi-layers', 'soil.add'],
  ['/resources', 'bi-shop', 'nav.resources'],
  ['/experts', 'bi-chat-heart', 'nav.experts'],
];

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const dash = useFetch(() => api.get('/users/dashboard'), []);
  // Weather is loaded separately so a weather-provider outage never blocks the rest of the dashboard.
  const weather = useFetch(() => api.get('/weather'), []);

  if (dash.loading) return <SkeletonCards count={6} height="7rem" cols="col-6 col-lg-4" />;
  if (dash.error) return <ErrorState message={dash.error} onRetry={dash.reload} />;

  const { stats, crops, alerts, activities, location } = dash.data;
  const w = weather.data;
  const combinedAlerts = [...(w ? w.alerts.map((a) => ({ ...a, type: 'weather' })) : []), ...alerts].slice(0, 8);
  const soilTone = { Excellent: 'green', Good: 'green', Moderate: 'amber', Poor: 'amber', Critical: 'red' }[stats.soilHealth] || 'soil';

  return (
    <>
      <section className="hero-banner has-backdrop mb-4">
        <BackdropImage image={DASHBOARD_BANNER} strength="soft" eager />
        <h1 className="mb-1">{t(greetingKey())}, {user.name.split(' ')[0]}!</h1>
        <p className="mb-3 opacity-75">{t('dashboard.welcome')}</p>
        <div className="d-flex flex-wrap gap-2">
          <span className="chip"><i className="bi bi-calendar3" aria-hidden="true" />{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          {location && <span className="chip"><i className="bi bi-geo-alt-fill" aria-hidden="true" />{location}</span>}
        </div>
      </section>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-4"><StatCard to="/farm" icon="bi-geo-alt-fill" tone="green" label={t('dashboard.totalFarms')} value={stats.totalFarms} /></div>
        <div className="col-6 col-lg-4"><StatCard to="/crops" icon="bi-flower2" tone="green" label={t('dashboard.activeCrops')} value={stats.activeCrops} /></div>
        <div className="col-6 col-lg-4"><StatCard to="/soil" icon="bi-layers-fill" tone={soilTone} label={t('dashboard.soilHealth')} value={stats.soilHealth || '—'} hint={stats.soilScore !== null ? `${stats.soilScore}/100` : t('dashboard.noSoil')} /></div>
        <div className="col-6 col-lg-4">
          <StatCard to="/weather" icon={w ? w.current.icon : 'bi-cloud-sun'} tone="blue" label={t('dashboard.currentWeather')}
            value={w ? `${w.current.temperature}°C` : weather.loading ? '…' : '—'} hint={w ? w.current.condition : weather.error ? 'Unavailable' : ''} />
        </div>
        <div className="col-6 col-lg-4"><StatCard to="/pests" icon="bi-bug-fill" tone={stats.pestAlerts ? 'red' : 'green'} label={t('dashboard.pestAlerts')} value={stats.pestAlerts} /></div>
        <div className="col-6 col-lg-4"><StatCard to="/orders" icon="bi-bag-check-fill" tone="amber" label={t('dashboard.pendingOrders')} value={stats.pendingOrders} /></div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8 d-grid gap-4 align-content-start">
          <section aria-labelledby="crops-h">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 id="crops-h" className="h4 mb-0">{t('dashboard.cropOverview')}</h2>
              <Link to="/crops" className="fw-bold small">{t('dashboard.viewAll')} <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
            </div>
            {crops.length === 0 ? (
              <EmptyState icon="bi-flower1" title={t('empty.crops.title')} text={t('empty.crops.text')} action={<Link to="/crops" className="btn btn-primary">{t('crops.add')}</Link>} />
            ) : (
              <div className="row g-3">{crops.slice(0, 4).map((crop) => <div key={crop._id} className="col-12 col-md-6"><CropCard crop={crop} /></div>)}</div>
            )}
          </section>

          <section aria-labelledby="alerts-h">
            <h2 id="alerts-h" className="h4 mb-2">{t('dashboard.alerts')}</h2>
            {combinedAlerts.length === 0 ? (
              <AlertBox severity="success" title={t('dashboard.noAlertsTitle')}>{t('dashboard.noAlertsText')}</AlertBox>
            ) : (
              <div className="d-grid gap-2">{combinedAlerts.map((a, i) => <AlertBox key={`${a.title}-${i}`} severity={a.severity} title={a.title}>{a.message}</AlertBox>)}</div>
            )}
          </section>
        </div>

        <div className="col-lg-4 d-grid gap-4 align-content-start">
          <section aria-labelledby="wx-h">
            <h2 id="wx-h" className="h4 mb-2">{t('dashboard.weather')}</h2>
            {weather.loading ? <div className="skeleton" style={{ height: '14rem' }} />
              : weather.error ? <ErrorState message={weather.error} onRetry={weather.reload} />
              : <WeatherNow weather={w} compact />}
            {w && w.stale && <p className="small text-muted mt-2 mb-0"><i className="bi bi-clock-history me-1" />Showing last saved forecast.</p>}
          </section>

          <section className="card section-card" aria-labelledby="qa-h">
            <h2 id="qa-h" className="h5 mb-3">{t('dashboard.quickActions')}</h2>
            <div className="row g-2">
              {QUICK.map(([to, icon, key]) => (
                <div key={to} className="col-6"><Link to={to} className="btn btn-outline-primary w-100 py-3 d-grid gap-1"><i className={`bi ${icon} fs-4`} aria-hidden="true" /><span className="small">{t(key)}</span></Link></div>
              ))}
            </div>
          </section>

          <section className="card section-card" aria-labelledby="act-h">
            <h2 id="act-h" className="h5 mb-3">{t('dashboard.recentActivity')}</h2>
            {activities.length === 0 ? <p className="text-muted mb-0">{t('dashboard.noActivity')}</p> : (
              <ul className="list-unstyled d-grid gap-3 mb-0">
                {activities.map((a) => (
                  <li key={a._id} className="d-flex gap-3">
                    <span className="icon-green rounded-circle d-grid flex-none" style={{ width: '2.1rem', height: '2.1rem', placeItems: 'center' }}><i className={`bi ${ACTIVITY_ICONS[a.type] || 'bi-dot'}`} aria-hidden="true" /></span>
                    <div className="min-w-0"><div className="small fw-semibold">{a.message}</div><div className="small text-muted">{timeAgo(a.createdAt)}</div></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
