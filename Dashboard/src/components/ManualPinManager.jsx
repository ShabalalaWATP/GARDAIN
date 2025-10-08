import React, { useCallback, useEffect, useRef, useState } from "react";

const COLOR_OPTIONS = [
  { key: "red", label: "Red", hex: "#ef4444" },
  { key: "blue", label: "Blue", hex: "#3b82f6" },
  { key: "green", label: "Green", hex: "#22c55e" },
];

const MANUAL_SOURCE_ID = "manual-pin-source";
const MANUAL_LAYER_ID = "manual-pin-layer";

export default function ManualPinManager({ mapRef }) {
  const [selectedColor, setSelectedColor] = useState("red");
  const [isAdding, setIsAdding] = useState(false);
  const [pins, setPins] = useState([]);

  const isAddingRef = useRef(isAdding);

  useEffect(() => {
    isAddingRef.current = isAdding;
  }, [isAdding]);

  const removePin = useCallback((id) => {
    setPins((current) => current.filter((feature) => feature.properties.id !== id));
  }, []);

  const clearPins = useCallback(() => {
    setPins([]);
  }, []);

  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    const ensureLayer = () => {
      if (!map.getSource(MANUAL_SOURCE_ID)) {
        map.addSource(MANUAL_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
      }

      if (!map.getLayer(MANUAL_LAYER_ID)) {
        map.addLayer({
          id: MANUAL_LAYER_ID,
          type: "circle",
          source: MANUAL_SOURCE_ID,
          paint: {
            "circle-radius": 9,
            "circle-color": ["get", "color"],
            "circle-stroke-color": "#0f172a",
            "circle-stroke-width": 2,
            "circle-opacity": 0.95,
          },
        });
      }
    };

    const handleManualPinClick = (event) => {
      event.preventDefault();
      if (event.originalEvent && typeof event.originalEvent.stopPropagation === "function") {
        event.originalEvent.stopPropagation();
      }

      const feature = event.features && event.features[0];
      const id = feature?.properties?.id;
      if (id) {
        removePin(id);
      }
    };

    const handleMouseEnter = () => {
      if (!isAddingRef.current) {
        map.getCanvas().style.cursor = "pointer";
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = isAddingRef.current ? "crosshair" : "";
    };

    const initialize = () => {
      ensureLayer();
      map.on("click", MANUAL_LAYER_ID, handleManualPinClick);
      map.on("mouseenter", MANUAL_LAYER_ID, handleMouseEnter);
      map.on("mouseleave", MANUAL_LAYER_ID, handleMouseLeave);
    };

    if (map.loaded()) {
      initialize();
    } else {
      map.once("load", initialize);
    }

    return () => {
      map.off("load", initialize);
      if (map.getLayer(MANUAL_LAYER_ID)) {
        map.off("click", MANUAL_LAYER_ID, handleManualPinClick);
        map.off("mouseenter", MANUAL_LAYER_ID, handleMouseEnter);
        map.off("mouseleave", MANUAL_LAYER_ID, handleMouseLeave);
        map.removeLayer(MANUAL_LAYER_ID);
      }

      if (map.getSource(MANUAL_SOURCE_ID)) {
        map.removeSource(MANUAL_SOURCE_ID);
      }
    };
  }, [mapRef, removePin]);

  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    const handleMapClick = (event) => {
      if (!map) return;

      const manualPinsUnderCursor = map.queryRenderedFeatures(event.point, {
        layers: [MANUAL_LAYER_ID],
      });
      if (manualPinsUnderCursor.length > 0) {
        return;
      }

      const colorOption = COLOR_OPTIONS.find((option) => option.key === selectedColor);
      if (!colorOption) return;

      const { lng, lat } = event.lngLat;
      const preciseLng = Number(lng.toFixed(6));
      const preciseLat = Number(lat.toFixed(6));

      const id = `manual-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

      const feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [preciseLng, preciseLat],
        },
        properties: {
          id,
          color: colorOption.hex,
          label: colorOption.label,
          longitude: preciseLng,
          latitude: preciseLat,
        },
      };

      setPins((current) => [...current, feature]);
    };

    const enableDropMode = () => {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleMapClick);
    };

    if (isAdding) {
      if (map.loaded()) {
        enableDropMode();
      } else {
        map.once("load", enableDropMode);
      }
    }

    return () => {
      if (map && map.getCanvas()) {
        map.getCanvas().style.cursor = "";
      }
      if (map) {
        map.off("click", handleMapClick);
        map.off("load", enableDropMode);
      }
    };
  }, [isAdding, mapRef, selectedColor]);

  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    const source = map.getSource(MANUAL_SOURCE_ID);
    if (source && typeof source.setData === "function") {
      source.setData({
        type: "FeatureCollection",
        features: pins,
      });
    }
  }, [pins, mapRef]);

  return (
    <div className="manual-pin-controls" aria-live="polite">
      <div className="manual-pin-header">
        <span className="manual-pin-title">Manual Pins</span>
        {pins.length > 0 ? (
          <button
            type="button"
            className="manual-pin-clear"
            onClick={clearPins}
            aria-label="Remove all manual pins"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="manual-pin-section">
        <span className="manual-pin-section-label">Colour</span>
        <div className="manual-pin-color-row">
          {COLOR_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.key}
              className={`manual-pin-color ${selectedColor === option.key ? "is-active" : ""}`}
              style={{ "--manual-pin-color": option.hex }}
              onClick={() => setSelectedColor(option.key)}
              aria-label={`${option.label} pin`}
            >
              <span className="manual-pin-color-dot" />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={`manual-pin-toggle ${isAdding ? "is-active" : ""}`}
        onClick={() => setIsAdding((current) => !current)}
        aria-pressed={isAdding}
      >
        {isAdding ? "Click map to drop pins" : "Enable drop mode"}
      </button>

      <div className="manual-pin-hint">
        {isAdding
          ? "Tap anywhere on the map to place the selected pin."
          : "Choose a colour and enable drop mode to add pins."}
      </div>

      <div className="manual-pin-list" role="list">
        {pins.length === 0 ? (
          <div className="manual-pin-empty">No manual pins yet.</div>
        ) : (
          pins.map((feature) => {
            const { id, color, label, latitude, longitude } = feature.properties;
            return (
              <div key={id} className="manual-pin-list-item" role="listitem">
                <span
                  className="manual-pin-list-swatch"
                  style={{ "--manual-pin-color": color }}
                  aria-hidden="true"
                />
                <div className="manual-pin-list-meta">
                  <span className="manual-pin-list-label">{label}</span>
                  <span className="manual-pin-list-coordinates">
                    {latitude.toFixed(3)}, {longitude.toFixed(3)}
                  </span>
                </div>
                <button
                  type="button"
                  className="manual-pin-remove"
                  onClick={() => removePin(id)}
                  aria-label={`Remove ${label.toLowerCase()} pin at ${latitude.toFixed(
                    3
                  )}, ${longitude.toFixed(3)}`}
                >
                  &times;
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
