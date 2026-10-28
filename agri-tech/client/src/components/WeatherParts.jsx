import { BackdropImage } from './SmartImage';
import { weatherImage } from '../utils/images';
import { formatDate } from '../utils/format';

export function WeatherNow({ weather, compact = false }) {
  const { current, location } = weather;
  const place = [location.name, location.region].filter(Boolean).join(', ');
  return (
    <div className="weather-now has-backdrop">
      <BackdropImage image={weatherImage(current.condition)} strength="sky" />
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div className="fw-bold"><i className="bi bi-geo-alt-fill me-1" aria-hidden="true" />{place}</div>
          <div className="temp mt-2">{current.temperature}°C</div>
          <div className="fs-5 fw-semibold">{current.condition}</div>
          {current.feelsLike !== null && current.feelsLike !== undefined && <div className="small opacity-75">Feels like {current.feelsLike}°C</div>}
        </div>
        <i className={`bi ${current.icon || 'bi-cloud-sun'}`} style={{ fontSize: compact ? '3rem' : '4.5rem' }} aria-hidden="true" />
      </div>
      <div className="row g-2 mt-3">
        {[['bi-droplet-half', 'Humidity', current.humidity === null ? '—' : `${current.humidity}%`],
          ['bi-wind', 'Wind', current.windSpeed === null ? '—' : `${current.windSpeed} km/h`],
          ['bi-cloud-rain', 'Rain chance', current.rainProbability === null || current.rainProbability === undefined ? '—' : `${current.rainProbability}%`]].map(([icon, label, value]) => (
          <div key={label} className="col-4"><div className="metric text-center"><i className={`bi ${icon}`} aria-hidden="true" /><div className="fw-bold">{value}</div><div className="small opacity-75">{label}</div></div></div>
        ))}
      </div>
    </div>
  );
}

export function ForecastStrip({ forecast }) {
  return (
    <div className="row g-2">
      {forecast.map((day, index) => (
        <div key={day.date} className="col-6 col-md-3 col-xl">
          <div className="forecast-day">
            <div className="fw-bold small">{index === 0 ? 'Today' : formatDate(day.date, { weekday: 'short', day: 'numeric' })}</div>
            <i className={`bi ${day.icon || 'bi-cloud'}`} aria-hidden="true" />
            <div className="small text-muted line-clamp-2" style={{ minHeight: '2.4em' }}>{day.condition}</div>
            <div className="fw-bold">{day.max}° <span className="text-muted fw-normal">/ {day.min}°</span></div>
            <div className="small" style={{ color: 'var(--sky)' }}><i className="bi bi-droplet-fill me-1" aria-hidden="true" />{day.rainProbability ?? '—'}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}
