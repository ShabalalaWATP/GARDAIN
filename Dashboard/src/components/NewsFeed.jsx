import React, { useEffect, useMemo, useState } from "react";

const INCIDENT_KEYWORDS = [
  "severe weather",
  "storm",
  "flood",
  "flash flooding",
  "wildfire",
  "brush fire",
  "earthquake",
  "landslide",
  "mudslide",
  "hurricane",
  "typhoon",
  "tsunami",
  "volcanic eruption",
  "heatwave",
  "riot",
  "civil unrest",
  "casualties",
  "fatalities",
];

const DEFAULT_LOCATION = {
  lat: 51.5074,
  lon: -0.1278,
  city: "London",
  locality: "London",
  principalSubdivision: "England",
  countryName: "United Kingdom",
  countryCode: "GB",
};

const LOCATION_ENDPOINT = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = ONE_DAY_MS * 365;

const rtf =
  typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat !== "undefined"
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    : null;

function stripTags(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(text) {
  if (!text || typeof text !== "string") return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return text;
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  return doc.documentElement?.textContent || doc.body?.textContent || text;
}

function wrapTerm(term) {
  if (!term || typeof term !== "string") return "";
  const clean = term.replace(/"/g, "").trim();
  if (!clean) return "";
  return /\s/.test(clean) ? `"${clean}"` : clean;
}

function normaliseLocationTerm(term) {
  if (!term || typeof term !== "string") return "";
  let cleaned = term.replace(/\([^)]*\)/g, " ");
  cleaned = cleaned.split(",")[0] || cleaned;
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (/united kingdom/i.test(cleaned)) {
    return "United Kingdom";
  }
  const words = cleaned.split(" ");
  if (words.length > 4) {
    cleaned = words.slice(0, 4).join(" ");
  }
  if (/^the\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^the\s+/i, "");
  }
  return cleaned;
}

function formatDateOnly(date) {
  if (!(date instanceof Date)) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatGdeltTimestamp(date) {
  if (!(date instanceof Date)) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function resolveGuardianUrl(pathname = "/search") {
  const proxyBase = (import.meta.env.VITE_GUARDIAN_PROXY_URL || "").trim();
  if (proxyBase) {
    try {
      const base = proxyBase.endsWith("/") ? proxyBase : `${proxyBase}/`;
      return new URL(pathname.replace(/^\//, ""), base);
    } catch (err) {
      console.warn("Invalid VITE_GUARDIAN_PROXY_URL – falling back to direct Guardian endpoint.", err);
    }
  }
  if (import.meta.env.DEV && typeof window !== "undefined" && window?.location?.origin) {
    return new URL(`/guardian-api${pathname.startsWith("/") ? pathname : `/${pathname}`}`, window.location.origin);
  }
  return new URL(`https://content.guardianapis.com${pathname}`);
}

function buildAnnualRange() {
  const end = new Date();
  const start = new Date(end.getTime() - ONE_YEAR_MS);
  return { start, end };
}

function normaliseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{8}T\d{6}Z$/.test(trimmed)) {
      const year = trimmed.slice(0, 4);
      const month = trimmed.slice(4, 6);
      const day = trimmed.slice(6, 8);
      const hour = trimmed.slice(9, 11);
      const minute = trimmed.slice(11, 13);
      const second = trimmed.slice(13, 15);
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }
    if (/^\d{14}$/.test(trimmed)) {
      const year = trimmed.slice(0, 4);
      const month = trimmed.slice(4, 6);
      const day = trimmed.slice(6, 8);
      const hour = trimmed.slice(8, 10);
      const minute = trimmed.slice(10, 12);
      const second = trimmed.slice(12, 14);
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function getTime(value) {
  const iso = normaliseDate(value);
  if (!iso) return 0;
  return new Date(iso).getTime();
}

function formatRelative(value) {
  const iso = normaliseDate(value);
  if (!iso) return "";
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "";
  const diffMs = target - Date.now();
  const minutes = Math.round(diffMs / 60000);
  if (!rtf) {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 90) return rtf.format(minutes, "minute");
  const hours = Math.round(diffMs / 3600000);
  if (Math.abs(hours) < 36) return rtf.format(hours, "hour");
  const days = Math.round(diffMs / 86400000);
  if (Math.abs(days) < 14) return rtf.format(days, "day");
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

async function resolveLocation(signal) {
  const fallback = { ...DEFAULT_LOCATION };
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return fallback;
  }

  const position = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { maximumAge: 300000, timeout: 8000 }
    );
  });

  if (!position) return fallback;

  const { latitude, longitude } = position.coords || {};
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return fallback;
  }

  try {
    const url = new URL(LOCATION_ENDPOINT);
    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set("localityLanguage", "en");
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);
    const data = await res.json();
    return {
      lat: latitude,
      lon: longitude,
      city: data.city || data.locality || fallback.city,
      locality: data.locality,
      principalSubdivision: data.principalSubdivision || data.region || fallback.principalSubdivision,
      countryName: data.countryName || fallback.countryName,
      countryCode: (data.countryCode || fallback.countryCode || "GB").toUpperCase(),
    };
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    return {
      ...fallback,
      lat: latitude,
      lon: longitude,
    };
  }
}

function dedupeArticles(articles) {
  const seen = new Set();
  return (articles || [])
    .filter((item) => item && (item.title || item.description || item.url))
    .filter((item) => {
      const key = (item.url || item.title || item.id || "").toLowerCase();
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => getTime(b.publishedAt) - getTime(a.publishedAt));
}

async function fetchGNews(location, signal) {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GNEWS_API_KEY");
  }
  const broadLocationParts = [
    location?.principalSubdivision,
    location?.countryName,
  ]
    .filter((part, idx, arr) => part && arr.indexOf(part) === idx)
    .map(wrapTerm);
  if (location?.city && broadLocationParts.length < 3) {
    const city = wrapTerm(location.city);
    if (city && !broadLocationParts.includes(city)) {
      broadLocationParts.unshift(city);
    }
  }

  const locationParts = [...broadLocationParts];
  const keywords = [...INCIDENT_KEYWORDS];
  const minKeywordCount = 6;
  const maxQueryLength = 190;

  const buildQuery = () => {
    const topicClause = `(${keywords.map(wrapTerm).join(" OR ")})`;
    const locationClause = locationParts.length ? `(${locationParts.join(" OR ")})` : "";
    return locationClause ? `${topicClause} AND ${locationClause}` : topicClause;
  };

  let query = buildQuery();
  while (query.length > maxQueryLength && keywords.length > minKeywordCount) {
    keywords.pop();
    query = buildQuery();
  }
  while (query.length > maxQueryLength && locationParts.length > 1) {
    locationParts.pop();
    query = buildQuery();
  }
  if (query.length > maxQueryLength && locationParts.length) {
    locationParts.length = 0;
    query = buildQuery();
  }
  if (query.length > maxQueryLength && keywords.length > minKeywordCount) {
    keywords.length = minKeywordCount;
    query = buildQuery();
  }

  const { start, end } = buildAnnualRange();
  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", query);
  url.searchParams.set("token", apiKey);
  url.searchParams.set("lang", "en");
  if (location?.countryCode) {
    url.searchParams.set("country", location.countryCode.toLowerCase());
  }
  url.searchParams.set("max", "15");
  url.searchParams.set("in", "title,description");
  url.searchParams.set("from", start.toISOString());
  url.searchParams.set("to", end.toISOString());

  const res = await fetch(url.toString(), { signal });
  const raw = await res.text();
  if (!res.ok) {
    const msg = raw.trim().split(/\r?\n/).filter(Boolean)[0] || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Received malformed JSON from GDELT");
    }
  } else {
    const msg = raw.trim().split(/\r?\n/).filter(Boolean)[0] || "Unexpected response from GDELT";
    throw new Error(msg);
  }
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.map((article, idx) => ({
    id: `gnews-${article.url || idx}`,
    source: article.source?.name || "GNews",
    title: (article.title || "").trim(),
    description: (article.description || "").trim(),
    url: article.url,
    imageUrl: article.image,
    publishedAt: article.publishedAt,
  }));
}

async function fetchGuardian(location, signal) {
  const apiKey = import.meta.env.VITE_GUARDIAN_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GUARDIAN_API_KEY");
  }
  const minKeywordCount = 6;
  const maxQueryLength = 240;

  const initialLocationTerms = [
    location?.city,
    location?.locality,
    location?.principalSubdivision,
    location?.countryName,
  ]
    .map(normaliseLocationTerm)
    .filter((part, idx, arr) => part && arr.indexOf(part) === idx)
    .map(wrapTerm);

  const keywords = [...INCIDENT_KEYWORDS];
  const workingLocationTerms = [...initialLocationTerms];

  const buildPrimaryQuery = () => {
    const topicClause = `(${keywords.map(wrapTerm).join(" OR ")})`;
    const locationClause = workingLocationTerms.length
      ? `(${workingLocationTerms.join(" OR ")})`
      : "";
    return locationClause ? `${topicClause} AND ${locationClause}` : topicClause;
  };

  let primaryQuery = buildPrimaryQuery();
  while (primaryQuery.length > maxQueryLength && keywords.length > minKeywordCount) {
    keywords.pop();
    primaryQuery = buildPrimaryQuery();
  }
  while (primaryQuery.length > maxQueryLength && workingLocationTerms.length > 1) {
    workingLocationTerms.pop();
    primaryQuery = buildPrimaryQuery();
  }
  if (primaryQuery.length > maxQueryLength && workingLocationTerms.length) {
    workingLocationTerms.length = 0;
    primaryQuery = buildPrimaryQuery();
  }
  if (primaryQuery.length > maxQueryLength && keywords.length > minKeywordCount) {
    keywords.length = minKeywordCount;
    primaryQuery = buildPrimaryQuery();
  }

  const fallbackKeywordTerms = ["storm", "flood", "wildfire", "earthquake", "hurricane"]
    .map(wrapTerm)
    .filter(Boolean);
  const fallbackLocationTerm = wrapTerm(
    normaliseLocationTerm(
      location?.city ||
        location?.locality ||
        location?.principalSubdivision ||
        location?.countryName
    )
  );
  let fallbackQuery = fallbackKeywordTerms.join(" OR ");
  if (fallbackKeywordTerms.length > 1) {
    fallbackQuery = `(${fallbackQuery})`;
  }
  if (fallbackLocationTerm) {
    fallbackQuery = `${fallbackQuery} AND ${fallbackLocationTerm}`;
  }

  const buildUrl = (query) => {
    const { start, end } = buildAnnualRange();
    const url = resolveGuardianUrl("/search");
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", "20");
    url.searchParams.set("show-fields", "trailText,thumbnail");
    url.searchParams.set("q", query);
    url.searchParams.set("from-date", formatDateOnly(start));
    url.searchParams.set("to-date", formatDateOnly(end));
    return url;
  };

  const attempts = [primaryQuery];
  if (fallbackQuery && fallbackQuery.trim()) {
    if (fallbackQuery !== primaryQuery) {
      attempts.push(fallbackQuery);
    } else {
      const minimalKeyword = fallbackKeywordTerms[0] || "storm";
      const minimalQuery = fallbackLocationTerm
        ? `${minimalKeyword} AND ${fallbackLocationTerm}`
        : minimalKeyword;
      if (minimalQuery !== primaryQuery) {
        attempts.push(minimalQuery);
      }
    }
  }

  const attemptQueries = Array.from(
    new Set(
      attempts.filter((value) => typeof value === "string" && value.trim())
    )
  );

  let lastError = null;
  for (const query of attemptQueries) {
    const url = buildUrl(query);
    let res;
    try {
      res = await fetch(url.toString(), { signal });
    } catch (err) {
      if (err?.name === "TypeError") {
        lastError = new Error(
          "Guardian request blocked by browser. Configure VITE_GUARDIAN_PROXY_URL or use the bundled /guardian-api proxy."
        );
        continue;
      }
      throw err;
    }

    const raw = await res.text();
    if (!res.ok) {
      if (res.status === 400) {
        try {
          const parsed = JSON.parse(raw);
          const message =
            parsed?.response?.message ||
            parsed?.message ||
            "Guardian rejected the search query.";
          lastError = new Error(message);
          continue;
        } catch {
          lastError = new Error("Guardian rejected the search query.");
          continue;
        }
      }
      throw new Error(`Guardian HTTP ${res.status}`);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Received malformed JSON from Guardian");
    }
    const results = Array.isArray(data?.response?.results) ? data.response.results : [];
    return results.map((item) => ({
      id: `guardian-${item.id}`,
      source: "The Guardian",
      title: (item.webTitle || "").trim(),
      description: decodeEntities(stripTags(item.fields?.trailText)),
      url: item.webUrl,
      imageUrl: item.fields?.thumbnail,
      publishedAt: item.webPublicationDate,
    }));
  }

  throw lastError || new Error("Unable to fetch Guardian articles.");
}

export default function NewsFeed() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [sourceErrors, setSourceErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setStatus("loading");
        setError(null);
        setSourceErrors([]);

        const resolvedLocation = await resolveLocation(controller.signal);
        if (cancelled) return;
        setLocation(resolvedLocation);

        const tasks = [
          { label: "GNews", runner: () => fetchGNews(resolvedLocation, controller.signal) },
          { label: "The Guardian", runner: () => fetchGuardian(resolvedLocation, controller.signal) },
        ];

        const results = await Promise.all(
          tasks.map(async ({ label, runner }) => {
            try {
              const payload = await runner();
              return { label, ok: true, payload };
            } catch (err) {
              return { label, ok: false, error: err };
            }
          })
        );
        if (cancelled) return;

        const aggregated = [];
        const errors = [];
        results.forEach((result) => {
          if (result.ok) {
            aggregated.push(...(result.payload || []));
          } else if (result.error?.name !== "AbortError") {
            let message = result.error?.message || String(result.error);
            if (typeof message === "string" && message.startsWith("Missing VITE_")) {
              const varName = message.replace("Missing ", "");
              message = `set ${varName} in your .env`;
            }
            errors.push(`${result.label}: ${message}`);
          }
        });

        const deduped = dedupeArticles(aggregated);
        setItems(deduped);
        setSourceErrors(errors);

        if (!deduped.length) {
          setStatus("empty");
          if (errors.length) {
            setError("Unable to find relevant articles in every source.");
          } else {
            setError("No recent incident reports found for this area.");
          }
        } else {
          setStatus("loaded");
          if (errors.length) {
            setError("Some sources did not respond. Showing partial results.");
          }
        }
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        setStatus("error");
        setError(err?.message || "Failed to load news feed.");
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const locationLabel = useMemo(() => {
    if (!location) return "";
    const parts = [
      location.city,
      location.principalSubdivision,
      location.countryName,
    ].filter((part, idx, arr) => part && arr.indexOf(part) === idx);
    return parts.join(", ");
  }, [location]);

  const body = useMemo(() => {
    if (status === "loading") {
      return (
        <div className="news-status" aria-live="polite">
          Locating and fetching live incident reports…
        </div>
      );
    }
    if (status === "error") {
      return (
        <div className="news-status news-status--error" role="alert">
          {error || "Unable to load news feed."}
        </div>
      );
    }
    if (status === "empty") {
      return (
        <div className="news-status" aria-live="polite">
          {error || "No recent incident reports found."}
        </div>
      );
    }
    return (
      <ul className="news-list" aria-label="Incident news items">
        {items.map((item) => (
          <li key={item.id} className="news-item">
            {item.imageUrl ? (
              <div className="news-thumb">
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}
            <div className="news-body">
              {item.title ? (
                <div className="news-title">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </div>
              ) : null}
              {(item.source || item.publishedAt) ? (
                <div className="news-meta">
                  {item.source ? <span className="news-tag">{item.source}</span> : null}
                  {item.publishedAt ? (
                    <span className="news-meta-time">{formatRelative(item.publishedAt)}</span>
                  ) : null}
                </div>
              ) : null}
              {item.description ? (
                <div className="news-desc">{item.description}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  }, [status, items, error]);

  return (
    <div className="news-feed">
      {locationLabel ? (
        <div className="news-context" aria-live="polite">
          Monitoring incidents near <strong>{locationLabel}</strong>
        </div>
      ) : null}
      {body}
      {sourceErrors.length ? (
        <div className="news-footnote" role="note">
          {sourceErrors.map((msg, idx) => (
            <div key={idx}>- {msg}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
