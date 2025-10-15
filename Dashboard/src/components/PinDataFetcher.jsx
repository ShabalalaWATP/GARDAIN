import React, { useEffect, useState, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import PinStatistics from "./PinStatistics";

function InteractivePopup({ properties, onSendMessage }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetLatitude, setTargetLatitude] = useState("");
  const [targetLongitude, setTargetLongitude] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const handleSend = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSending(true);
    setSendStatus(null);

    try {
      await onSendMessage(title, description, targetLatitude, targetLongitude);
      setSendStatus("success");
      setTitle("");
      setDescription("");
      setTargetLatitude("");
      setTargetLongitude("");
    } catch (error) {
      setSendStatus("error");
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        /* Ensure popup fits small screens and map card */
        width: "auto",
        maxWidth: "min(420px, calc(100vw - 4rem))",
        padding: "12px",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#1F2937" }}>
        {properties.name || "Unknown"}
      </h3>
      <div style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.5" }}>
        {properties.id && (
          <p style={{ margin: "5px 0", wordWrap: "break-word", overflowWrap: "break-word" }}>
            <strong>ID:</strong> {properties.id}
          </p>
        )}
        {properties.description && (
          <p style={{ margin: "5px 0", wordWrap: "break-word", overflowWrap: "break-word" }}>
            <strong>Description:</strong> {properties.description}
          </p>
        )}
        <p style={{ margin: "5px 0" }}>
          <strong>To Evacuate:</strong>{" "}
          {properties.to_evacuate === "true" ? "Yes" : "No"}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>Location:</strong> {parseFloat(properties.latitude).toFixed(4)},{" "}
          {parseFloat(properties.longitude).toFixed(4)}
        </p>
        {properties.timestamp && (
          <p style={{ margin: "5px 0", fontSize: "11px", color: "#6B7280" }}>
            <strong>Timestamp:</strong>{" "}
            {new Date(properties.timestamp).toLocaleString()}
          </p>
        )}
      </div>

      <div style={{ marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #E5E7EB" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter title..."
          disabled={isSending}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "13px",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            marginBottom: "8px",
            boxSizing: "border-box"
          }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
          disabled={isSending}
          rows="3"
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "13px",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            marginBottom: "8px",
            boxSizing: "border-box",
            resize: "vertical"
          }}
        />
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input
            type="number"
            step="any"
            value={targetLatitude}
            onChange={(e) => setTargetLatitude(e.target.value)}
            placeholder="Target latitude..."
            disabled={isSending}
            style={{
              flex: 1,
              padding: "8px",
              fontSize: "13px",
              border: "1px solid #D1D5DB",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
          <input
            type="number"
            step="any"
            value={targetLongitude}
            onChange={(e) => setTargetLongitude(e.target.value)}
            placeholder="Target longitude..."
            disabled={isSending}
            style={{
              flex: 1,
              padding: "8px",
              fontSize: "13px",
              border: "1px solid #D1D5DB",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isSending || !title.trim() || !description.trim()}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "13px",
            backgroundColor: isSending || !title.trim() || !description.trim() ? "#9CA3AF" : "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSending || !title.trim() || !description.trim() ? "not-allowed" : "pointer",
            fontWeight: "500"
          }}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
        {sendStatus === "success" && (
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#10B981" }}>
            Message sent successfully!
          </p>
        )}
        {sendStatus === "error" && (
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#EF4444" }}>
            Failed to send message
          </p>
        )}
      </div>
    </div>
  );
}

export default function PinDataFetcher({ pinJsonUrl, mapRef, messageEndpoint }) {
  const [pinData, setPinData] = useState(null);
  const [pinError, setPinError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const popupRootsRef = useRef(new Map());

  useEffect(() => {
    if (!pinJsonUrl) return;

    const abortController = new AbortController();
    setIsLoading(true);

    const getPinJson = async () => {
      try {
        const response = await fetch(pinJsonUrl, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Pin data failed to fetch: ${response.status}`);
        }
        const pinjson = await response.json();
        setPinData(pinjson);
        setPinError(null);
        setIsLoading(false);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load pin data:", error);
          setPinError(error.message);
          setIsLoading(false);
        }
      }
    };

    getPinJson();

    return () => {
      abortController.abort();
    };
  }, [pinJsonUrl]);

  const handleSendMessage = useCallback(
    async (title, description, targetLatitude, targetLongitude) => {
      const endpoint =
        messageEndpoint || "https://ksip4rkha0.execute-api.eu-west-2.amazonaws.com/messaging-router";

      const payload = {
        title,
        description,
        timestamp: new Date().toISOString(),
      };

      if (targetLatitude && targetLongitude) {
        payload.targetLatitude = parseFloat(targetLatitude);
        payload.targetLongitude = parseFloat(targetLongitude);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      return response.json();
    },
    [messageEndpoint]
  );

  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !pinData) return;

    const sourceId = "pin-data-source";
    const layerId = "pin-data-layer";
    const rootsMap = popupRootsRef.current;

    const addPinsToMap = () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        const features = pinData
          .map((pin, index) => {
            const lon = Number(pin.longitude);
            const lat = Number(pin.latitude);
            if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
              console.warn("Skipping pin with invalid coordinates", pin);
              return null;
            }

            const toEvacuateRaw = pin.to_evacuate;
            const toEvacuate =
              typeof toEvacuateRaw === "boolean"
                ? toEvacuateRaw
                : typeof toEvacuateRaw === "string"
                ? toEvacuateRaw.trim().toLowerCase() === "true"
                : Boolean(toEvacuateRaw);

            return {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lon, lat],
              },
              properties: {
                ...pin,
                id: pin.id || index,
                longitude: lon,
                latitude: lat,
                to_evacuate: toEvacuate,
              },
            };
          })
          .filter(Boolean);

        console.log("Mapping pins to features", features);

        const geojson = {
          type: "FeatureCollection",
          features: features,
        };

        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": 8,
            "circle-color": [
              "case",
              ["==", ["get", "to_evacuate"], true],
              "#EF4444",
              ["==", ["get", "to_evacuate"], false],
              "#10B981",
              "#6B7280",
            ],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        });

        map.on("click", layerId, (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const properties = e.features[0].properties;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          const popupContainer = document.createElement("div");
          
          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            // Keep popups within the phone viewport accounting for page padding
            maxWidth: "min(420px, calc(100vw - 4rem))",
            offset: 15
          })
            .setLngLat(coordinates)
            .setDOMContent(popupContainer)
            .addTo(map);

          const root = createRoot(popupContainer);
          root.render(
            <InteractivePopup
              properties={properties}
              onSendMessage={handleSendMessage}
            />
          );

          rootsMap.set(popup, root);

          popup.on("close", () => {
            const root = rootsMap.get(popup);
            if (root) {
              root.unmount();
              rootsMap.delete(popup);
            }
          });
        });

        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });

        console.log(`Added ${features.length} pins to the map`);
      } catch (error) {
        console.error("Failed to add pins to map:", error);
      }
    };

    if (map.loaded()) {
      addPinsToMap();
    } else {
      map.once("load", addPinsToMap);
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      
      rootsMap.forEach((root) => root.unmount());
      rootsMap.clear();
    };
  }, [pinData, mapRef, handleSendMessage]);

  if (!pinJsonUrl) {
    return null;
  }

  return (
    <PinStatistics pinData={pinData} isLoading={isLoading} error={pinError} />
  );
}
