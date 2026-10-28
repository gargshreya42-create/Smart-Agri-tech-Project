import { api } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import ChartCard from '../../components/ChartCard';
import { BarChart, DoughnutChart, LineChart } from '../../components/charts';
import { ErrorState, SkeletonCards } from '../../components/feedback';
import { formatINR } from '../../utils/format';

export default function AdminReports() {
  const { t } = useLanguage();
  const reports = useFetch(() => api.get('/admin/reports'), []);

  const header = <PageHeader title={t('nav.reports')} subtitle="Six-month trends in sales, crops, pests and expert demand." />;
  if (reports.loading) return <>{header}<SkeletonCards count={6} height="18rem" cols="col-12 col-lg-6" /></>;
  if (reports.error) return <>{header}<ErrorState message={reports.error} onRetry={reports.reload} /></>;

  const r = reports.data;
  const months = (series) => series.map((m) => m.label);
  const values = (series) => series.map((m) => m.value);
  const consultLabels = Object.keys(r.consultationsByStatus);

  return (
    <>
      {header}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6"><ChartCard title="Revenue by month" question="Is marketplace revenue growing? (cancelled orders excluded)"><LineChart label="Revenue per month in rupees" labels={months(r.revenueByMonth)} datasets={[{ label: 'Revenue (₹)', data: values(r.revenueByMonth) }]} height="16rem" /></ChartCard></div>
        <div className="col-12 col-lg-6"><ChartCard title="Orders by month" question="How busy is the marketplace?"><BarChart label="Orders per month" labels={months(r.ordersByMonth)} datasets={[{ label: 'Orders', data: values(r.ordersByMonth) }]} height="16rem" /></ChartCard></div>
        <div className="col-12 col-lg-6"><ChartCard title="Best-selling resources" question="Which products should we keep in stock?"><BarChart label="Units sold per resource" horizontal labels={r.topResources.map((x) => x.name)} datasets={[{ label: 'Units sold', data: r.topResources.map((x) => x.quantity) }]} height="16rem" /></ChartCard></div>
        <div className="col-12 col-lg-6"><ChartCard title="Revenue by category" question="Which kinds of products earn the most?"><DoughnutChart label="Revenue share by category" labels={r.salesByCategory.map((x) => x.category)} values={r.salesByCategory.map((x) => x.revenue)} height="16rem" /></ChartCard></div>
        <div className="col-12 col-lg-6"><ChartCard title="Most-grown crops" question="What are farmers growing on the platform?"><BarChart label="Number of plantings per crop" horizontal labels={r.cropsByName.map((x) => x.name)} datasets={[{ label: 'Plantings', data: r.cropsByName.map((x) => x.count) }]} height="16rem" /></ChartCard></div>
        <div className="col-12 col-lg-6"><ChartCard title="Pest alerts published" question="Are pest threats rising or easing?"><LineChart label="Pest alerts per month" labels={months(r.pestAlertsByMonth)} datasets={[{ label: 'New alerts', data: values(r.pestAlertsByMonth), color: '#d9622b' }]} height="16rem" /></ChartCard></div>
        <div className="col-12 col-lg-4"><ChartCard title="Consultations by status" question="Are expert requests being answered?"><DoughnutChart label="Consultations by status" labels={consultLabels} values={Object.values(r.consultationsByStatus)} height="15rem" /></ChartCard></div>
        <div className="col-12 col-lg-8">
          <ChartCard title="Top resources in detail" question="Units and revenue for the six best sellers.">
            {r.topResources.length === 0 ? <p className="text-muted mb-0">No sales yet.</p> : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Product</th><th className="text-end">Units sold</th><th className="text-end">Revenue</th></tr></thead>
                  <tbody>{r.topResources.map((x) => <tr key={x.name}><td className="fw-semibold">{x.name}</td><td className="text-end">{x.quantity}</td><td className="text-end">{formatINR(x.revenue)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </>
  );
}
