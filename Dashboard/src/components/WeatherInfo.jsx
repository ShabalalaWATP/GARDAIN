import React, { useEffect, useMemo, useState } from "react";

// Modern, lightweight OpenWeather integration (client-side).
// For production, prefer a server-side proxy to keep your API key secret.

const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const CURRENT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FORECAST_TTL_MS = 10 * 60 * 1000; // 10 minutes

function readCache(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || !parsed.data) return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore
  }
}

function formatTemp(t, units) {
  if (t == null || Number.isNaN(t)) return "–";
  const unit = units === "imperial" ? "°F" : units === "metric" ? "°C" : "K";
  return `${Math.round(t)}${unit}`;
}

function kmh(windMs) {
  if (typeof windMs !== "number") return "–";
  return Math.round(windMs * 3.6);
}

function groupDaily(forecast, tzShiftSeconds) {
  if (!forecast?.list?.length) return [];
  const byDay = new Map();
  for (const item of forecast.list) {
    const dtLocalMs = (item.dt + tzShiftSeconds) * 1000;
    const d = new Date(dtLocalMs);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    let entry = byDay.get(key);
    if (!entry) {
      entry = { items: [], min: Infinity, max: -Infinity, repr: item };
      byDay.set(key, entry);
    }
    entry.items.push(item);
    entry.min = Math.min(entry.min, item.main?.temp_min ?? item.main?.temp ?? Infinity);
    entry.max = Math.max(entry.max, item.main?.temp_max ?? item.main?.temp ?? -Infinity);
    // Prefer around midday for representative icon
    const hour = new Date(dtLocalMs).getUTCHours();
    const reprHour = new Date((entry.repr.dt + tzShiftSeconds) * 1000).getUTCHours();
    if (Math.abs(hour - 12) < Math.abs(reprHour - 12)) entry.repr = item;
  }

  // Return next 5 days including today
  return Array.from(byDay.values()).slice(0, 5);
}

export default function WeatherInfo({
  placeQuery = "De Vere Cotswold Water Park, Cirencester, GB",
  lat: latOverride,
  lon: lonOverride,
  units = "metric", // 'metric' | 'imperial' | 'standard'
  lang = "en",
  showHourly = 6, // number of 3-hour steps to show
}) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const [geo, setGeo] = useState(null); // { lat, lon, name }
  const [current, setCurrent] = useState(null); // current weather payload
  const [forecast, setForecast] = useState(null); // 5-day/3-hour payload
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let abort = false;
    async function run() {
      setLoading(true);
      setError(null);

      try {
        let lat = latOverride;
        let lon = lonOverride;
        let displayName = null;

        if (!(lat && lon)) {
          if (!apiKey) throw new Error("Missing VITE_OPENWEATHER_API_KEY");
          const key = `owm:geocode:${placeQuery}`;
          const cached = readCache(key, GEOCODE_TTL_MS);
          let gc = cached;
          if (!gc) {
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
              placeQuery
            )}&limit=1&appid=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
            const arr = await res.json();
            if (!arr?.length) throw new Error("Location not found");
            const g = arr[0];
            gc = { lat: g.lat, lon: g.lon, name: `${g.name}${g.state ? ", " + g.state : ""}, ${g.country}` };
            writeCache(key, gc);
          }
          lat = gc.lat;
          lon = gc.lon;
          displayName = gc.name;
        }

        setGeo({ lat, lon, name: displayName || placeQuery });

        // Fetch current & forecast (with cache)
        const curKey = `owm:wx:${lat},${lon},${units}`;
        const fcKey = `owm:fc:${lat},${lon},${units}`;

        let cur = readCache(curKey, CURRENT_TTL_MS);
        if (!cur) {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&lang=${lang}&appid=${apiKey}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Weather failed (${res.status})`);
          cur = await res.json();
          writeCache(curKey, cur);
        }

        let fc = readCache(fcKey, FORECAST_TTL_MS);
        if (!fc) {
          const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&lang=${lang}&appid=${apiKey}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Forecast failed (${res.status})`);
          fc = await res.json();
          writeCache(fcKey, fc);
        }

        if (!abort) {
          setCurrent(cur);
          setForecast(fc);
        }
      } catch (e) {
        if (!abort) setError(e.message || "Weather fetch failed");
      } finally {
        if (!abort) setLoading(false);
      }
    }

    run();
    return () => {
      abort = true;
    };
  }, [placeQuery, latOverride, lonOverride, units, lang, apiKey]);

  const tzShift = useMemo(() => {
    // Prefer forecast city timezone, then current.weather timezone
    return (
      forecast?.city?.timezone ?? current?.timezone ?? 0
    );
  }, [forecast, current]);

  const daily = useMemo(() => groupDaily(forecast, tzShift), [forecast, tzShift]);

  const hourly = useMemo(() => {
    if (!forecast?.list?.length) return [];
    return forecast.list.slice(0, showHourly);
  }, [forecast, showHourly]);

  if (!apiKey) {
    return (
      <div className="weather-status weather-status--error" role="alert">
        Missing OpenWeather key. Add VITE_OPENWEATHER_API_KEY to your .env.
      </div>
    );
  }

  if (loading) {
    return <div className="weather-status">Loading weather…</div>;
  }
  if (error) {
    return (
      <div className="weather-status weather-status--error" role="alert">
        {error}
      </div>
    );
  }
  if (!current || !forecast) {
    return <div className="weather-status">No data.</div>;
  }

  const icon = current.weather?.[0]?.icon;
  const desc = current.weather?.[0]?.description;
  const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : null;
  const wind = kmh(current.wind?.speed);
  const gust = kmh(current.wind?.gust);
  const humidity = current.main?.humidity;
  const visibilityKm = current.visibility != null ? Math.round(current.visibility / 1000) : null;

  return (
    <div className="weather-grid" aria-live="polite">
      <section className="wx-card wx-card--current" aria-label="Current conditions">
        <div className="wx-current-head">
          <div className="wx-current-title">
            <div className="wx-place">{geo?.name || placeQuery}</div>
            <div className="wx-desc">{desc ? desc[0].toUpperCase() + desc.slice(1) : ""}</div>
          </div>
          {iconUrl ? (
            <img className="wx-icon" src={iconUrl} alt={desc || ""} />
          ) : null}
        </div>
        <div className="wx-current-body">
          <div className="wx-temp">{formatTemp(current.main?.temp, units)}</div>
          <ul className="wx-meta" aria-label="Weather details">
            <li>
              <span>Feels</span>
              <strong>{formatTemp(current.main?.feels_like, units)}</strong>
            </li>
            <li>
              <span>Wind</span>
              <strong>
                {wind} km/h{gust ? ` (gust ${gust})` : ""}
              </strong>
            </li>
            <li>
              <span>Humidity</span>
              <strong>{humidity != null ? `${humidity}%` : "–"}</strong>
            </li>
            <li>
              <span>Visibility</span>
              <strong>{visibilityKm != null ? `${visibilityKm} km` : "–"}</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="wx-card wx-card--hourly" aria-label="Upcoming hours">
        <h3 className="wx-subtitle">Next {hourly.length * 3} hours</h3>
        <div className="wx-hourly">
          {hourly.map((h, i) => {
            const icon = h.weather?.[0]?.icon;
            const d = new Date((h.dt + tzShift) * 1000);
            const hh = d.getUTCHours().toString().padStart(2, "0");
            return (
              <div key={h.dt + ":" + i} className="wx-hour">
                <div className="wx-hour-time">{hh}:00</div>
                {icon ? (
                  <img
                    className="wx-hour-icon"
                    src={`https://openweathermap.org/img/wn/${icon}.png`}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
                <div className="wx-hour-temp">{formatTemp(h.main?.temp, units)}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="wx-card wx-card--daily" aria-label="5-day forecast">
        <h3 className="wx-subtitle">5-day outlook</h3>
        <div className="wx-daily">
          {daily.map((d, i) => {
            const dt = new Date((d.repr.dt + tzShift) * 1000);
            const day = dt.toLocaleDateString(undefined, { weekday: "short" });
            const icon = d.repr.weather?.[0]?.icon;
            return (
              <div key={i} className="wx-day">
                <div className="wx-day-name">{day}</div>
                {icon ? (
                  <img
                    className="wx-day-icon"
                    src={`https://openweathermap.org/img/wn/${icon}.png`}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
                <div className="wx-day-range">
                  <span className="wx-min">{formatTemp(d.min, units)}</span>
                  <span className="wx-max">{formatTemp(d.max, units)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

