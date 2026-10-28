const WeatherData = require('../models/WeatherData');
const WeatherAlert = require('../models/WeatherAlert');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { weatherApiKey } = require('../config/env');

const CACHE_MINUTES = 30;
const REQUEST_TIMEOUT_MS = 8000;

const WMO_CODES = {
  0: ['Clear sky', 'bi-sun'],
  1: ['Mainly clear', 'bi-sun'],
  2: ['Partly cloudy', 'bi-cloud-sun'],
  3: ['Overcast', 'bi-clouds'],
  45: ['Fog', 'bi-cloud-fog'],
  48: ['Freezing fog', 'bi-cloud-fog'],
  51: ['Light drizzle', 'bi-cloud-drizzle'],
  53: ['Drizzle', 'bi-cloud-drizzle'],
  55: ['Heavy drizzle', 'bi-cloud-drizzle'],
  56: ['Freezing drizzle', 'bi-cloud-drizzle'],
  57: ['Freezing drizzle', 'bi-cloud-drizzle'],
  61: ['Light rain', 'bi-cloud-rain'],
  63: ['Rain', 'bi-cloud-rain'],
  65: ['Heavy rain', 'bi-cloud-rain-heavy'],
  66: ['Freezing rain', 'bi-cloud-rain'],
  67: ['Heavy freezing rain', 'bi-cloud-rain-heavy'],
  71: ['Light snow', 'bi-snow'],
  73: ['Snow', 'bi-snow'],
  75: ['Heavy snow', 'bi-snow'],
  77: ['Snow grains', 'bi-snow'],
  80: ['Rain showers', 'bi-cloud-rain'],
  81: ['Heavy showers', 'bi-cloud-rain-heavy'],
  82: ['Violent showers', 'bi-cloud-rain-heavy'],
  85: ['Snow showers', 'bi-snow'],
  86: ['Heavy snow showers', 'bi-snow'],
  95: ['Thunderstorm', 'bi-cloud-lightning-rain'],
  96: ['Thunderstorm with hail', 'bi-cloud-lightning-rain'],
  99: ['Severe thunderstorm with hail', 'bi-cloud-lightning-rain'],
};

const normalizeKey = (name) => String(name).trim().toLowerCase().replace(/\s+/g, ' ');
const round = (n, digits = 0) => (Number.isFinite(n) ? Number(n.toFixed(digits)) : null);

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new AppError(502, `Weather provider responded with status ${response.status}.`);
    return await response.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(503, 'The weather service could not be reached.');
  } finally {
    clearTimeout(timer);
  }
}

const notFoundError = (name) => new AppError(404, `We could not find a location called "${name}". Check the spelling or try a nearby city.`);

// ---------------------------------------------------------------- Open-Meteo (no API key)
async function fromOpenMeteo(locationName) {
  // "Bhopal, Madhya Pradesh" -> search for "Bhopal"
  const searchTerm = locationName.split(',')[0].trim();
  const geo = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=1&language=en&format=json`
  );
  const place = geo.results && geo.results[0];
  if (!place) throw notFoundError(locationName);

  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    timezone: 'auto',
    forecast_days: '7',
  });
  const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!data.current || !data.daily) throw new AppError(502, 'The weather provider returned incomplete data.');

  const describe = (code) => WMO_CODES[code] || ['Unknown', 'bi-cloud'];
  const [condition, icon] = describe(data.current.weather_code);

  return {
    location: { name: place.name, region: place.admin1, country: place.country, latitude: place.latitude, longitude: place.longitude },
    current: {
      temperature: round(data.current.temperature_2m),
      feelsLike: round(data.current.apparent_temperature),
      condition,
      icon,
      humidity: round(data.current.relative_humidity_2m),
      windSpeed: round(data.current.wind_speed_10m),
      rainProbability: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[0] : null,
      precipitation: round(data.current.precipitation, 1),
    },
    forecast: data.daily.time.map((date, i) => {
      const [dayCondition, dayIcon] = describe(data.daily.weather_code[i]);
      return {
        date,
        min: round(data.daily.temperature_2m_min[i]),
        max: round(data.daily.temperature_2m_max[i]),
        condition: dayCondition,
        icon: dayIcon,
        rainProbability: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : null,
        rainfall: round(data.daily.precipitation_sum[i], 1),
      };
    }),
    source: 'open-meteo',
  };
}

// ---------------------------------------------------------------- OpenWeatherMap (needs WEATHER_API_KEY)
function owmIcon(id) {
  if (id >= 200 && id < 300) return 'bi-cloud-lightning-rain';
  if (id >= 300 && id < 400) return 'bi-cloud-drizzle';
  if (id >= 500 && id < 600) return id >= 502 ? 'bi-cloud-rain-heavy' : 'bi-cloud-rain';
  if (id >= 600 && id < 700) return 'bi-snow';
  if (id >= 700 && id < 800) return 'bi-cloud-fog';
  if (id === 800) return 'bi-sun';
  if (id === 801 || id === 802) return 'bi-cloud-sun';
  return 'bi-clouds';
}

const capitalise = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

async function fromOpenWeather(locationName) {
  const key = encodeURIComponent(weatherApiKey);
  const geo = await fetchJson(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=${key}`);
  const place = Array.isArray(geo) && geo[0];
  if (!place) throw notFoundError(locationName);

  const base = `lat=${place.lat}&lon=${place.lon}&units=metric&appid=${key}`;
  const [now, forecast] = await Promise.all([
    fetchJson(`https://api.openweathermap.org/data/2.5/weather?${base}`),
    fetchJson(`https://api.openweathermap.org/data/2.5/forecast?${base}`),
  ]);

  // Collapse the 3-hourly forecast into one entry per calendar day.
  const days = new Map();
  (forecast.list || []).forEach((slot) => {
    const date = slot.dt_txt.slice(0, 10);
    const day = days.get(date) || { date, temps: [], pops: [], rain: 0, slots: [] };
    day.temps.push(slot.main.temp_min, slot.main.temp_max);
    day.pops.push((slot.pop || 0) * 100);
    day.rain += (slot.rain && slot.rain['3h']) || 0;
    day.slots.push(slot);
    days.set(date, day);
  });

  const weather = now.weather && now.weather[0] ? now.weather[0] : { id: 800, description: 'clear sky' };

  return {
    location: { name: place.name, region: place.state, country: place.country, latitude: place.lat, longitude: place.lon },
    current: {
      temperature: round(now.main.temp),
      feelsLike: round(now.main.feels_like),
      condition: capitalise(weather.description),
      icon: owmIcon(weather.id),
      humidity: round(now.main.humidity),
      windSpeed: round((now.wind ? now.wind.speed : 0) * 3.6),
      rainProbability: forecast.list && forecast.list[0] ? round((forecast.list[0].pop || 0) * 100) : null,
      precipitation: round((now.rain && (now.rain['1h'] || now.rain['3h'])) || 0, 1),
    },
    forecast: [...days.values()].map((day) => {
      const midday = day.slots[Math.floor(day.slots.length / 2)].weather[0];
      return {
        date: day.date,
        min: round(Math.min(...day.temps)),
        max: round(Math.max(...day.temps)),
        condition: capitalise(midday.description),
        icon: owmIcon(midday.id),
        rainProbability: round(Math.max(...day.pops)),
        rainfall: round(day.rain, 1),
      };
    }),
    source: 'openweathermap',
  };
}

async function fetchFresh(locationName) {
  if (weatherApiKey) {
    try {
      return await fromOpenWeather(locationName);
    } catch (err) {
      if (err.statusCode === 404) throw err;
      logger.warn('OpenWeatherMap failed, falling back to Open-Meteo', { message: err.message });
    }
  }
  return fromOpenMeteo(locationName);
}

// ---------------------------------------------------------------- Alerts
function deriveAlerts(weather) {
  const alerts = [];
  const forecast = weather.forecast || [];
  const rainyDay = forecast.find((d) => (d.rainProbability || 0) >= 70 || (d.rainfall || 0) >= 25);
  if (rainyDay) {
    const heavy = (rainyDay.rainfall || 0) >= 60;
    alerts.push({
      title: heavy ? 'Very heavy rainfall expected' : 'Heavy rainfall expected',
      message: `Around ${rainyDay.date}: ${rainyDay.rainProbability ?? '—'}% chance of rain${rainyDay.rainfall ? ` (~${rainyDay.rainfall} mm)` : ''}. Hold back irrigation and fertiliser, and make sure fields can drain.`,
      severity: heavy ? 'danger' : 'warning',
      source: 'forecast',
    });
  }
  const hotDay = forecast.find((d) => (d.max || 0) >= 40);
  if (hotDay) {
    alerts.push({
      title: 'Heat stress risk',
      message: `Temperatures may reach ${hotDay.max}°C around ${hotDay.date}. Irrigate in the early morning or evening and protect young plants.`,
      severity: 'warning',
      source: 'forecast',
    });
  }
  const coldDay = forecast.find((d) => d.min !== null && d.min <= 4);
  if (coldDay) {
    alerts.push({
      title: 'Frost risk',
      message: `Night temperature may fall to ${coldDay.min}°C around ${coldDay.date}. Light irrigation in the evening helps protect sensitive crops.`,
      severity: 'warning',
      source: 'forecast',
    });
  }
  if ((weather.current.windSpeed || 0) >= 40) {
    alerts.push({
      title: 'Strong winds',
      message: `Wind speed is ${weather.current.windSpeed} km/h. Postpone spraying and secure tall or staked crops.`,
      severity: 'warning',
      source: 'forecast',
    });
  }
  return alerts;
}

async function adminAlertsFor(locationName) {
  const now = new Date();
  const alerts = await WeatherAlert.find({ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).lean();
  const lowered = locationName.toLowerCase();
  return alerts
    .filter((a) => a.region.toLowerCase() === 'all' || lowered.includes(a.region.toLowerCase()))
    .map((a) => ({ title: a.title, message: a.message, severity: a.severity, source: 'advisory' }));
}

// ---------------------------------------------------------------- Public API
async function getWeather(locationName) {
  const key = normalizeKey(locationName);
  const cached = await WeatherData.findOne({ locationKey: key });
  const isFresh = cached && Date.now() - cached.fetchedAt.getTime() < CACHE_MINUTES * 60 * 1000;

  let record = cached;
  let stale = false;

  if (!isFresh) {
    try {
      const fresh = await fetchFresh(locationName);
      record = await WeatherData.findOneAndUpdate(
        { locationKey: key },
        { ...fresh, locationKey: key, fetchedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (!cached || err.statusCode === 404) throw err;
      logger.warn('Weather service unavailable; serving cached data', { location: key, message: err.message });
      stale = true;
    }
  }

  const plain = record.toObject();
  const advisories = await adminAlertsFor(locationName);
  return {
    location: plain.location,
    current: plain.current,
    forecast: plain.forecast,
    alerts: [...advisories, ...deriveAlerts(plain)],
    source: plain.source,
    fetchedAt: plain.fetchedAt,
    stale,
  };
}

module.exports = { getWeather, deriveAlerts, normalizeKey };
