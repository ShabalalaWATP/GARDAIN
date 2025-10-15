import React, { useEffect, useMemo, useState } from "react";

// Displays critical AI tags from a backend feed.
// For now, we focus on the "Flood" tag with confidence and a preview image.

const DEFAULT_ENDPOINT =
  import.meta.env.VITE_AI_PHOTO_TAGS_URL ||
  "https://rvryhicxm6.execute-api.eu-west-2.amazonaws.com/Prod";

const DEFAULT_PHOTO_URL =
  "https://i.natgeofe.com/k/7d906c71-1105-4048-b32b-a55b1b04e3bc/OG_Floods_KIDS_0922.jpg?w=1436&h=922";

export default function PhotoIntel({ endpoint = DEFAULT_ENDPOINT, photoUrl = DEFAULT_PHOTO_URL }) {
  const [data, setData] = useState(null); // raw API response
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    async function run() {
      try {
        const res = await fetch(endpoint, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load AI assessment");
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => ac.abort();
  }, [endpoint]);

  const flood = useMemo(() => {
    // API returns DynamoDB JSON: each item has labels.M.{ Label: { S: "confidence" } }
    const items = Array.isArray(data?.Items) ? data.Items : [];
    let bestValue = null;
    let bestScore = -Infinity;

    items.forEach((item) => {
      const labels = item?.labels?.M;
      if (!labels) return;
      const entryKey = Object.keys(labels).find((k) => k.toLowerCase() === "flood");
      if (!entryKey) return;

      const rawValue = labels[entryKey]?.S;
      if (typeof rawValue !== "string") return;

      const numeric = parseFloat(rawValue.replace(/[^0-9.]+/g, ""));
      const score = Number.isFinite(numeric) ? numeric : 0;
      if (score > bestScore) {
        bestScore = score;
        bestValue = rawValue;
      }
    });

    return bestValue;
  }, [data]);

  const body = useMemo(() => {
    if (loading) return <div className="ai-status">Loading AI tags…</div>;
    if (error) return <div className="ai-status ai-status--error">{error}</div>;

    // If nothing present, surface a friendly message
    if (!flood) {
      return <div className="ai-status">No critical flood tags found.</div>;
    }

    return (
      <div className="ai-card" aria-label="AI assessed scene">
        <div className="ai-row">
          <div className="ai-tag">
            <span className="ai-chip ai-chip--critical" aria-label="Critical hazard">Flood</span>
            <span className="ai-conf">{flood}</span>
          </div>
          <a className="ai-thumb" href={photoUrl} target="_blank" rel="noreferrer">
            <img src={photoUrl} alt="AI-assessed flood scene" loading="lazy" />
          </a>
        </div>
      </div>
    );
  }, [loading, error, flood, photoUrl]);

  return (
    <div className="ai-wrapper">
      {body}
    </div>
  );
}
