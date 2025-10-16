import React, { useMemo } from "react";

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }

  return null;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Time unknown";

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Time unknown";
  }

  return parsed.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
};

const buildSummary = (items) => {
  const summary = {
    total: items.length,
    evacuate: 0,
    hold: 0,
    unknown: 0,
  };

  items.forEach((item) => {
    const status = normalizeBoolean(item?.to_evacuate);
    if (status === true) {
      summary.evacuate += 1;
    } else if (status === false) {
      summary.hold += 1;
    } else {
      summary.unknown += 1;
    }
  });

  return summary;
};

const sortRequests = (items) => {
  const priority = (item) => {
    const status = normalizeBoolean(item?.to_evacuate);
    if (status === true) return 0;
    if (status === false) return 1;
    return 2;
  };

  return [...items].sort((a, b) => {
    const priorityDelta = priority(a) - priority(b);
    if (priorityDelta !== 0) return priorityDelta;

    const dateA = new Date(a?.timestamp || 0).getTime();
    const dateB = new Date(b?.timestamp || 0).getTime();
    return dateB - dateA;
  });
};

export default function EvacuationRequests({ items, isLoading, error }) {
  const safeItems = Array.isArray(items) ? items : [];

  const { orderedRequests, summary } = useMemo(() => {
    return {
      orderedRequests: sortRequests(safeItems),
      summary: buildSummary(safeItems),
    };
  }, [safeItems]);

  if (isLoading) {
    return (
      <div className="requests-placeholder">
        <div className="requests-loading-line requests-loading-line--wide" />
        <div className="requests-loading-line" />
        <div className="requests-loading-line requests-loading-line--short" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="requests-error">
        <span className="requests-error__title">Unable to load requests</span>
        <span className="requests-error__detail">{error}</span>
      </div>
    );
  }

  if (summary.total === 0) {
    return (
      <div className="requests-empty">
        <span className="requests-empty__title">No active requests</span>
        <span className="requests-empty__detail">
          New evacuation or assistance calls will appear here as field teams log them.
        </span>
      </div>
    );
  }

  return (
    <div className="requests-content">
      <div className="requests-summary">
        <div className="requests-summary__metric">
          <span className="metric-label">Total tracked</span>
          <span className="metric-value">{summary.total}</span>
        </div>
        <div className="requests-summary__metric requests-summary__metric--urgent">
          <span className="metric-label">Evac required</span>
          <span className="metric-value">{summary.evacuate}</span>
        </div>
        <div className="requests-summary__metric requests-summary__metric--stable">
          <span className="metric-label">Shelter in place</span>
          <span className="metric-value">{summary.hold}</span>
        </div>
        <div className="requests-summary__metric requests-summary__metric--unknown">
          <span className="metric-label">Pending triage</span>
          <span className="metric-value">{summary.unknown}</span>
        </div>
      </div>

      <div className="requests-list">
        {orderedRequests.map((request) => {
          const status = normalizeBoolean(request?.to_evacuate);
          const statusLabel =
            status === true ? "Evacuation required" : status === false ? "Holding safe" : "Pending review";
          const statusClass =
            status === true
              ? "request-card__status--urgent"
              : status === false
              ? "request-card__status--stable"
              : "request-card__status--pending";

          return (
            <article key={request?.id || request?.name} className="request-card">
              <div className="request-card__header">
                <div>
                  <h3 className="request-card__title">{request?.name || "Unknown individual"}</h3>
                  {request?.id ? <p className="request-card__id">ID: {request.id}</p> : null}
                </div>
                <span className={`request-card__status ${statusClass}`}>{statusLabel}</span>
              </div>
              {request?.description ? (
                <p className="request-card__description">{request.description}</p>
              ) : (
                <p className="request-card__description request-card__description--muted">
                  Awaiting field note update.
                </p>
              )}
              <div className="request-card__meta">
                <span className="request-card__meta-item">
                  <span className="meta-label">Last update</span>
                  <span className="meta-value">{formatTimestamp(request?.timestamp)}</span>
                </span>
                <span className="request-card__meta-item">
                  <span className="meta-label">Location</span>
                  <span className="meta-value">
                    {request?.latitude && request?.longitude
                      ? `${Number.parseFloat(request.latitude).toFixed(3)}, ${Number.parseFloat(
                          request.longitude
                        ).toFixed(3)}`
                      : "Unknown"}
                  </span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
