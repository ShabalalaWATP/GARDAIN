import React, { useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import PinStatistics from "./PinStatistics";

// Interactive Popup Component
function InteractivePopup({ properties, onSendMessage }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    setSendStatus(null);

    try {
      await onSendMessage(message, properties);
      setSendStatus("success");
      setMessage("");
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
        <div style={{ 
    fontFamily: "sans-serif", 
    minWidth: "250px",
    maxWidth: "350px",
    width: "100%"
    }}>
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
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter message..."
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
        <button
        onClick={handleSend}
        disabled={isSending || !message.trim()}
        style={{
            width: "100%",
            padding: "8px",
            fontSize: "13px",
            backgroundColor: isSending || !message.trim() ? "#9CA3AF" : "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSending || !message.trim() ? "not-allowed" : "pointer",
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

  // Fetch pin data from API
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

  // Handle sending message
  const handleSendMessage = async (message, properties) => {
    const endpoint = 'https://ksip4rkha0.execute-api.eu-west-2.amazonaws.com/messaging-router'
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        id: properties.id,
        name: properties.name,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    return response.json();
  };

  // Plot pins on the map when data is available
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !pinData) return;

    const sourceId = "pin-data-source";
    const layerId = "pin-data-layer";

    const addPinsToMap = () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        const features = pinData.map((pin, index) => {
          let coordinates;
          if (pin.longitude && pin.latitude) {
            coordinates = [pin.longitude, pin.latitude];
          }

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinates,
            },
            properties: {
              ...pin,
              id: pin.id || index,
            },
          };
        });

        const geojson = {
          type: "FeatureCollection",
          features: features,
        };

        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        // Add layer for pins
        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": 8,
            "circle-color": [
              "case",
              ["==", ["get", "to_evacuate"], true],
              "#EF4444", // Red for to_evacuate = true
              ["==", ["get", "to_evacuate"], false],
              "#10B981", // Green for to_evacuate = false
              "#6B7280", // Gray as fallback
            ],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        });

        // Add click handler for pins
        map.on("click", layerId, (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const properties = e.features[0].properties;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Create a container for the React component
          const popupContainer = document.createElement("div");
          
          // Create popup
          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: "350px",
          })
            .setLngLat(coordinates)
            .setDOMContent(popupContainer)
            .addTo(map);

          // Render React component into popup
          const root = createRoot(popupContainer);
          root.render(
            <InteractivePopup
              properties={properties}
              onSendMessage={handleSendMessage}
            />
          );

          // Store root for cleanup
          popupRootsRef.current.set(popup, root);

          // Cleanup when popup is closed
          popup.on("close", () => {
            const root = popupRootsRef.current.get(popup);
            if (root) {
              root.unmount();
              popupRootsRef.current.delete(popup);
            }
          });
        });

        // Change the mouse to a pointer when hovering over pins
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        // Change it back to default when not hovering
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
      // Cleanup when component unmounts
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      
      // Cleanup all popup roots
      popupRootsRef.current.forEach((root) => root.unmount());
      popupRootsRef.current.clear();
    };
  }, [pinData, mapRef]);

  if (!pinJsonUrl) {
    return null;
  }

  return (
    <PinStatistics pinData={pinData} isLoading={isLoading} error={pinError} />
  );
}