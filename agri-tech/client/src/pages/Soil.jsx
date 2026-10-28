import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import useMeta from '../hooks/useMeta';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal, { ConfirmModal } from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import { AlertBox, Meter, StatusBadge } from '../components/Badges';
import { BarChart, LineChart } from '../components/charts';
import { DataState, EmptyState } from '../components/feedback';
import SmartImage from '../components/SmartImage';
import { SOIL_EMPTY, soilImage } from '../utils/images';
import { formatDate } from '../utils/format';

const PARAMS = [
  ['ph', 'pH', '', 'bi-droplet'],
  ['nitrogen', 'Nitrogen (N)', 'kg/ha', 'bi-wind'],
  ['phosphorus', 'Phosphorus (P)', 'kg/ha', 'bi-lightning-charge'],
  ['potassium', 'Potassium (K)', 'kg/ha', 'bi-gem'],
  ['moisture', 'Moisture', '%', 'bi-moisture'],
  ['organicMatter', 'Organic matter', '%', 'bi-recycle'],
];

export default function Soil() {
  const { t } = useLanguage();
  const toast = useToast();
  const meta = useMeta();
  const [params, setParams] = useSearchParams();
  const farmId = params.get('farm') || '';
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const farms = useFetch(() => api.get('/farms'), []);
  const records = useFetch(() => api.get('/soil', { farm: farmId || undefined }), [farmId]);
  const farmOptions = (farms.data || []).map((f) => ({ value: f._id, label: f.name }));
  const latest = records.data && records.data[0];
  const history = useMemo(() => [...(records.data || [])].reverse().slice(-8), [records.data]);

  const fields = [
    { name: 'farm', label: 'Farm', type: 'select', required: true, options: farmOptions, help: farmOptions.length ? undefined : 'Add a farm first from the My Farm page.' },
    { name: 'sampledOn', label: 'Sample date', type: 'date', span: 6 },
    { name: 'soilType', label: 'Soil type', type: 'select', options: meta.SOIL_TYPES, span: 6, help: 'Leave empty to use the farm’s soil type.' },
    { name: 'ph', label: 'pH (0–14)', type: 'number', required: true, min: 0, max: 14, step: 0.1, span: 4 },
    { name: 'moisture', label: 'Moisture (%)', type: 'number', required: true, min: 0, max: 100, span: 4 },
    { name: 'organicMatter', label: 'Organic matter (%)', type: 'number', required: true, min: 0, max: 100, span: 4 },
    { name: 'nitrogen', label: 'Nitrogen (kg/ha)', type: 'number', required: true, min: 0, max: 5000, span: 4 },
    { name: 'phosphorus', label: 'Phosphorus (kg/ha)', type: 'number', required: true, min: 0, max: 1000, span: 4 },
    { name: 'potassium', label: 'Potassium (kg/ha)', type: 'number', required: true, min: 0, max: 5000, span: 4 },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 2, maxLength: 500 },
  ];

  const save = async (values) => {
    const res = await api.post('/soil', values);
    toast.success('Soil analysis saved successfully.');
    setAdding(false);
    records.reload();
    return res;
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/soil/${deleting._id}`);
      toast.success('Soil record deleted successfully.');
      setDeleting(null);
      records.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this record.');
    } finally {
      setBusy(false);
    }
  };

  const addButton = <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><i className="bi bi-plus-lg me-1" aria-hidden="true" />{t('soil.add')}</button>;
  const analysis = latest && latest.analysis;

  return (
    <>
      <PageHeader title={t('soil.title')} subtitle={t('soil.subtitle')} actions={addButton} />
      <div className="mb-3" style={{ maxWidth: '22rem' }}>
        <label className="form-label" htmlFor="soil-farm">Farm</label>
        <select id="soil-farm" className="form-select" value={farmId} onChange={(e) => setParams(e.target.value ? { farm: e.target.value } : {})}>
          <option value="">All farms</option>{farmOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <DataState loading={records.loading} error={records.error} onRetry={records.reload} isEmpty={!latest}
        empty={<EmptyState icon="bi-layers" image={SOIL_EMPTY} title="No soil readings yet" text="Add a reading from your latest soil test to see its health score and practical recommendations." action={addButton} />}>
        {analysis && (
          <div className="row g-4">
            <div className="col-lg-4">
              <section className="card text-center h-100">
                <SmartImage image={soilImage(analysis.overallStatus, latest.moisture)} ratio="16 / 8" sizes="(min-width: 992px) 30vw, 100vw" fallbackIcon="bi-layers" fallbackLabel="Soil photo unavailable" />
                <div className="section-card d-flex flex-column align-items-center flex-grow-1">
                <h2 className="h5">Overall soil health</h2>
                <div className="d-flex justify-content-center my-3"><div className="ring" style={{ '--pct': analysis.overallScore, '--size': '10rem' }} role="img" aria-label={`Overall soil health ${analysis.overallScore} out of 100`}><span style={{ fontSize: '2rem' }}>{analysis.overallScore}</span></div></div>
                <div><StatusBadge status={analysis.overallStatus} /></div>
                <p className="small text-muted mt-3 mb-0">{latest.farm?.name} · sampled {formatDate(latest.sampledOn)}</p>
                </div>
              </section>
            </div>
            <div className="col-lg-8">
              <div className="row g-3">
                {PARAMS.map(([key, label, unit, icon]) => {
                  const p = analysis.parameters[key];
                  return (
                    <div key={key} className="col-6 col-md-4">
                      <div className="card section-card h-100">
                        <div className="d-flex justify-content-between align-items-start mb-1"><span className="small fw-bold text-muted"><i className={`bi ${icon} me-1`} aria-hidden="true" />{label}</span></div>
                        <div className="display-font fs-4 fw-bold">{p.value}<span className="fs-6 text-muted"> {unit}</span></div>
                        <Meter value={p.score} label={`${label} score`} className="my-2" />
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-lg-7">
              <section className="card section-card h-100">
                <h2 className="h5 mb-3">What to do next</h2>
                <div className="d-grid gap-2">
                  {analysis.recommendations.map((r, i) => <AlertBox key={i} severity={r.severity} title={r.parameter === 'overall' ? 'Overall' : r.parameter.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}>{r.message}</AlertBox>)}
                </div>
                <p className="small text-muted mt-3 mb-0"><i className="bi bi-info-circle me-1" aria-hidden="true" />{records.meta?.disclaimer || 'These recommendations are general guidance, not a laboratory diagnosis. Confirm with a soil-testing lab or your local agriculture office before major decisions.'}</p>
              </section>
            </div>
            <div className="col-lg-5">
              <section className="card section-card h-100">
                <h2 className="h5">Nutrient levels (N · P · K)</h2>
                <p className="small text-muted">Available nutrients in kg per hectare — latest sample.</p>
                <BarChart label="Latest nitrogen, phosphorus and potassium levels" labels={['Nitrogen', 'Phosphorus', 'Potassium']}
                  datasets={[{ label: 'kg/ha', data: [latest.nitrogen, latest.phosphorus, latest.potassium], color: '#2f7d3c' }]} />
              </section>
            </div>

            {history.length > 1 && (
              <div className="col-12">
                <section className="card section-card">
                  <h2 className="h5">Is my soil improving?</h2>
                  <p className="small text-muted">Overall health score across your last {history.length} readings.</p>
                  <LineChart label="Soil health score over time" labels={history.map((r) => formatDate(r.sampledOn, { day: 'numeric', month: 'short' }))} datasets={[{ label: 'Score', data: history.map((r) => r.analysis.overallScore) }]} yMax={100} />
                </section>
              </div>
            )}

            <div className="col-12">
              <section className="card section-card">
                <h2 className="h5 mb-3">Reading history</h2>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead><tr><th>Date</th><th>Farm</th><th>pH</th><th>N / P / K</th><th>Moisture</th><th>Health</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                    <tbody>
                      {records.data.map((r) => (
                        <tr key={r._id}>
                          <td>{formatDate(r.sampledOn)}</td><td>{r.farm?.name}</td><td>{r.ph}</td><td>{r.nitrogen} / {r.phosphorus} / {r.potassium}</td><td>{r.moisture}%</td>
                          <td><StatusBadge status={r.analysis.overallStatus} label={`${r.analysis.overallStatus} · ${r.analysis.overallScore}`} /></td>
                          <td className="text-end"><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(r)} aria-label={`Delete reading from ${formatDate(r.sampledOn)}`}><i className="bi bi-trash" aria-hidden="true" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}
      </DataState>

      <Modal show={adding} title={t('soil.add')} onClose={() => setAdding(false)}>
        {adding && <DynamicForm fields={fields} initial={{ farm: farmId || undefined, sampledOn: new Date() }} onSubmit={save} onCancel={() => setAdding(false)} submitLabel="Analyse & save" />}
      </Modal>
      <ConfirmModal show={Boolean(deleting)} busy={busy} title="Delete this reading?" confirmLabel={t('common.delete')} onConfirm={remove} onClose={() => setDeleting(null)} message="This soil record will be permanently removed." />
    </>
  );
}
