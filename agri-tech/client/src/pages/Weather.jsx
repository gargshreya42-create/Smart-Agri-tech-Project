import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import { AlertBox } from '../components/Badges';
import { BarChart, LineChart } from '../components/charts';
import { ErrorState } from '../components/feedback';
import { ForecastStrip, WeatherNow } from '../components/WeatherParts';
import { formatDate, formatDateTime } from '../utils/format';

export default function Weather() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const location = params.get('location') || '';
  const [input, setInput] = useState(location);
  const weather = useFetch(() => api.get('/weather', { location: location || undefined }), [location]);

  const submit = (event) => {
    event.preventDefault();
    const value = input.trim();
    setParams(value ? { location: value } : {});
  };

  const w = weather.data;
  const labels = w ? w.forecast.map((d) => formatDate(d.date, { weekday: 'short', day: 'numeric' })) : [];

  return (
    <>
      <PageHeader title={t('weather.title')} subtitle={t('weather.subtitle')} />
      <form className="mb-4" onSubmit={submit} role="search" style={{ maxWidth: '34rem' }}>
        <label className="visually-hidden" htmlFor="wx-location">Location</label>
        <div className="input-group input-group-lg">
          <span className="input-group-text bg-white"><i className="bi bi-geo-alt" aria-hidden="true" /></span>
          <input id="wx-location" className="form-control" placeholder="Search a place, e.g. Bhopal (default: your farm)" value={input} onChange={(e) => setInput(e.target.value)} maxLength={100} />
          <button type="submit" className="btn btn-primary" disabled={weather.loading}>{t('common.search')}</button>
        </div>
      </form>

      {weather.loading && (
        <div className="row g-3" aria-busy="true"><div className="col-lg-5"><div className="skeleton" style={{ height: '16rem' }} /></div><div className="col-lg-7"><div className="skeleton" style={{ height: '16rem' }} /></div></div>
      )}
      {weather.error && <ErrorState message={weather.error} onRetry={weather.reload} />}

      {w && !weather.loading && (
        <div className="d-grid gap-4">
          {w.stale && <AlertBox severity="warning" title="Showing the last saved forecast">Live weather is unavailable right now. Last updated {formatDateTime(w.fetchedAt)}.</AlertBox>}
          <div className="row g-4">
            <div className="col-lg-5"><WeatherNow weather={w} /></div>
            <div className="col-lg-7">
              <section className="card section-card h-100">
                <h2 className="h5 mb-3"><i className="bi bi-megaphone me-2 text-primary" aria-hidden="true" />Weather alerts</h2>
                {w.alerts.length === 0 ? <AlertBox severity="success" title="No weather alerts">Conditions look normal for the coming week.</AlertBox> : (
                  <div className="d-grid gap-2">{w.alerts.map((a, i) => <AlertBox key={i} severity={a.severity} title={a.title}>{a.message}</AlertBox>)}</div>
                )}
              </section>
            </div>
          </div>

          <section aria-labelledby="fc-h">
            <h2 id="fc-h" className="h4 mb-2">7-day forecast</h2>
            <ForecastStrip forecast={w.forecast} />
          </section>

          <div className="row g-4">
            <div className="col-lg-6"><section className="card section-card h-100"><h2 className="h5">Temperature trend</h2><p className="small text-muted">Daily high and low (°C).</p>
              <LineChart label="Daily maximum and minimum temperature" labels={labels} datasets={[{ label: 'High °C', data: w.forecast.map((d) => d.max), color: '#d9622b', fill: false }, { label: 'Low °C', data: w.forecast.map((d) => d.min), color: '#3a86c8', fill: false }]} /></section></div>
            <div className="col-lg-6"><section className="card section-card h-100"><h2 className="h5">Will it rain?</h2><p className="small text-muted">Chance of rain per day (%) — plan irrigation and spraying around it.</p>
              <BarChart label="Daily chance of rain" labels={labels} datasets={[{ label: 'Rain chance %', data: w.forecast.map((d) => d.rainProbability ?? 0), color: '#3a86c8' }]} /></section></div>
          </div>
          <p className="small text-muted mb-0">Data: {w.source === 'open-meteo' ? 'Open-Meteo' : 'OpenWeatherMap'} · updated {formatDateTime(w.fetchedAt)}</p>
        </div>
      )}
    </>
  );
}
