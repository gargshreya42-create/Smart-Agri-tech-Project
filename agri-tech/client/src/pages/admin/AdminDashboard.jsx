import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import { BackdropImage } from '../../components/SmartImage';
import { ADMIN_BANNER } from '../../utils/images';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import { BarChart, DoughnutChart, LineChart } from '../../components/charts';
import { StatusBadge } from '../../components/Badges';
import { ErrorState, SkeletonCards } from '../../components/feedback';
import { ACTIVITY_ICONS, formatDate, formatINR, timeAgo } from '../../utils/format';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const stats = useFetch(() => api.get('/admin/stats'), []);

  if (stats.loading) return <><PageHeader title={t('nav.dashboard')} /><SkeletonCards count={6} height="6rem" cols="col-12 col-sm-6 col-xl-4" /></>;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} />;

  const { totals, ordersByStatus, cropsByHealth, pestsByRisk, userGrowth, recentOrders, recentActivity } = stats.data;
  const keysOf = (map) => Object.keys(map);
  const valuesOf = (map) => Object.values(map);

  return (
    <>
      <section className="hero-banner has-backdrop mb-4" style={{ padding: '1rem 1.4rem' }}>
        <BackdropImage image={ADMIN_BANNER} strength="soft" />
        <h1 className="mb-1">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="mb-0 opacity-75">Platform health at a glance: who is using it, what is growing, and what needs your attention.</p>
      </section>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4"><StatCard icon="bi-people" tone="green" label="Total users" value={totals.totalUsers} hint={`${totals.totalFarmers} farmers`} to="/admin/users" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard icon="bi-geo-alt" tone="soil" label="Farms registered" value={totals.totalFarms} to="/admin/farms" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard icon="bi-flower2" tone="green" label="Crops tracked" value={totals.totalCrops} to="/admin/crops" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard icon="bi-bag-check" tone="blue" label="Total orders" value={totals.totalOrders} hint={`${totals.pendingOrders} waiting for confirmation`} to="/admin/orders" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard icon="bi-bug" tone="red" label="Active pest alerts" value={totals.activePestAlerts} to="/admin/pests" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard icon="bi-chat-heart" tone="amber" label="Consultation requests" value={totals.consultationRequests} hint="Awaiting a response" to="/admin/experts" /></div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6 col-xl-3"><ChartCard title="Orders by status" question="Where are orders getting stuck?"><DoughnutChart label="Orders by status" labels={keysOf(ordersByStatus)} values={valuesOf(ordersByStatus)} height="15rem" /></ChartCard></div>
        <div className="col-12 col-lg-6 col-xl-3"><ChartCard title="Crop health" question="How many crops need help?"><DoughnutChart label="Crops by health" labels={keysOf(cropsByHealth)} values={valuesOf(cropsByHealth)} height="15rem" /></ChartCard></div>
        <div className="col-12 col-lg-6 col-xl-3"><ChartCard title="Active alerts by risk" question="How severe are current threats?"><BarChart label="Active pest alerts by risk" labels={keysOf(pestsByRisk)} datasets={[{ label: 'Alerts', data: valuesOf(pestsByRisk), perBar: true }]} height="15rem" /></ChartCard></div>
        <div className="col-12 col-lg-6 col-xl-3"><ChartCard title="New farmers" question="Is the community growing?"><LineChart label="New users per month" labels={userGrowth.map((m) => m.label)} datasets={[{ label: 'New users', data: userGrowth.map((m) => m.value) }]} height="15rem" /></ChartCard></div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <section className="card section-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-2"><h2 className="h6 mb-0">Recent orders</h2><Link to="/admin/orders" className="small fw-bold text-decoration-none">Manage orders</Link></div>
            {recentOrders.length === 0 ? <p className="text-muted mb-0">No orders yet.</p> : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Order</th><th>Farmer</th><th>Date</th><th className="text-end">Total</th><th>Status</th></tr></thead>
                  <tbody>{recentOrders.map((o) => <tr key={o._id}><td className="fw-bold">{o.orderNumber}</td><td>{o.user ? o.user.name : '—'}</td><td>{formatDate(o.createdAt)}</td><td className="text-end">{formatINR(o.totalAmount)}</td><td><StatusBadge status={o.status} /></td></tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        <div className="col-12 col-xl-5">
          <section className="card section-card h-100">
            <h2 className="h6 mb-3">Recent activity</h2>
            {recentActivity.length === 0 ? <p className="text-muted mb-0">Activity will appear here as farmers use the platform.</p> : (
              <ul className="list-unstyled d-grid gap-3 mb-0">
                {recentActivity.map((a) => (
                  <li key={a._id} className="d-flex gap-2">
                    <i className={`bi ${ACTIVITY_ICONS[a.type] || 'bi-dot'} text-primary`} aria-hidden="true" />
                    <div><div className="small fw-semibold">{a.user ? `${a.user.name}: ` : ''}{a.message}</div><div className="small text-muted">{timeAgo(a.createdAt)}</div></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <p className="small text-muted mt-3 mb-0">{totals.communityPosts} community posts · {totals.totalFarmers} farmers</p>
    </>
  );
}
