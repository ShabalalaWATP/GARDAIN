import React, { useEffect, useMemo, useState } from "react";

// Renders a scrollable list of news items (title + description) from the API
export default function NewsFeed({
  feedUrl = import.meta.env.VITE_NEWS_FEED_URL ||
    "https://oqwz797yb0.execute-api.eu-west-2.amazonaws.com/prod/news",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fixJsonCommonIssues = (s) => {
    if (typeof s !== "string") return s;
    // Replace invalid fields like: "risk_level": , -> null
    s = s.replace(/"risk_level"\s*:\s*,/g, '"risk_level": null,');
    // Replace missing arrays like: "main_topics": , -> []
    s = s.replace(/"main_topics"\s*:\s*,/g, '"main_topics": [],');
    // Or when "main_topics" is directly before a closing brace
    s = s.replace(/"main_topics"\s*:\s*(?=\})/g, '"main_topics": []');
    return s;
  };

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const fetchFeed = async () => {
      try {
        const res = await fetch(feedUrl, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Try to parse strictly first, then leniently if needed
        const raw = await res.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e1) {
          const fixed = fixJsonCommonIssues(raw);
          try {
            data = JSON.parse(fixed);
          } catch (_e2) {
            throw e1; // bubble original syntax error
          }
        }

        // Normalise: allow either direct array or { items: [] }
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.items)) list = data.items;

        const cleaned = (list || [])
          .filter((x) => x && (x.title || x.description))
          .map((x, idx) => ({
            id: x.clusterId || x.id || idx,
            title: typeof x.title === "string" ? x.title.trim() : "",
            description:
              typeof x.description === "string" ? x.description.trim() : "",
            imageUrl: typeof x.imageUrl === "string" ? x.imageUrl.trim() : "",
          }));

        setItems(cleaned);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message || "Failed to load feed");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    return () => ac.abort();
  }, [feedUrl]);

  const body = useMemo(() => {
    if (loading) {
      return (
        <div className="news-status" aria-live="polite">
          Loading news…
        </div>
      );
    }
    if (error) {
      return (
        <div className="news-status news-status--error" role="alert">
          Unable to load news feed ({error}).
        </div>
      );
    }
    if (!items.length) {
      return (
        <div className="news-status" aria-live="polite">
          No news items available.
        </div>
      );
    }
    return (
      <ul className="news-list" aria-label="News items">
        {items.map((it) => (
          <li key={it.id} className="news-item">
            {it.imageUrl ? (
              <div className="news-thumb">
                <img
                  src={it.imageUrl}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}
            <div className="news-body">
              {it.title ? <div className="news-title">{it.title}</div> : null}
              {it.description ? (
                <div className="news-desc">{it.description}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  }, [loading, error, items]);

  return <div className="news-feed">{body}</div>;
}
