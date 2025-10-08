import React, { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";

export default function PinDataFetcher({ pinJsonUrl, mapRef }) {
  const [pinData, setPinData] = useState(null);
  const [pinError, setPinError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Plot pins on the map when data is available
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !pinData) return;

    const markers = [];
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
              coordinates: coordinates
            },
            properties: {
              ...pin,
              id: pin.id || index
            }
          };
        });

        const geojson = {
          type: "FeatureCollection",
          features: features
        };

        map.addSource(sourceId, {
          type: "geojson",
          data: geojson
        });

        // Add layer for pins
        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": 8,
            "circle-color": ["coalesce", ["get", "color"], "#EF4444"],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2
          }
        });

        // Add click handler for pins
        map.on('click', layerId, (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const properties = e.features[0].properties;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Create window showing the info
          const popupContent = `
            <div style="font-family: sans-serif; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1F2937;">${properties.name || 'Unknown'}</h3>
              <div style="font-size: 13px; color: #4B5563; line-height: 1.5;">
                ${properties.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${properties.description}</p>` : ''}
                <p style="margin: 5px 0;"><strong>To Evacuate:</strong> ${properties.to_evacuate === 'true' ? 'Yes' : 'No'}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${parseFloat(properties.latitude).toFixed(4)}, ${parseFloat(properties.longitude).toFixed(4)}</p>
                ${properties.timestamp ? `<p style="margin: 5px 0; font-size: 11px; color: #6B7280;"><strong>Timestamp:</strong> ${new Date(properties.timestamp).toLocaleString()}</p>` : ''}
              </div>
            </div>
          `;

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });

        // Change the mouse to a pointer when hovering over pins
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to default when not hovering
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
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
      // Cleanup markers when component unmounts
      markers.forEach(marker => marker.remove());
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [pinData, mapRef]);

  if (!pinJsonUrl) {
    return null;
  }

  return (<></>
  );
}