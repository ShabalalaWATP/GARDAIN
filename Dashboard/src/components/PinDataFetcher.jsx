import React, { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import PinStatistics from "./PinStatistics";

export default function PinDataFetcher({ pinJsonUrl, mapRef }) {
  const [pinData, setPinData] = useState(null);
  const [pinError, setPinError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  // Fetch pin data from API
  useEffect(() => {
    if (!pinJsonUrl) return;

    let isEffectActive = true;
    let currentAbortController = null;

    const fetchPins = async () => {
      if (!isEffectActive) {
        return;
      }

      if (currentAbortController) {
        currentAbortController.abort();
      }

      const abortController = new AbortController();
      currentAbortController = abortController;
      setIsLoading(true);

      try {
        const response = await fetch(pinJsonUrl, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Pin data failed to fetch: ${response.status}`);
        }
        const pinjson = await response.json();

        if (!isEffectActive || abortController.signal.aborted) {
          return;
        }

        setPinData(pinjson);
        setPinError(null);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load pin data:", error);
          if (isEffectActive) {
            setPinError(error.message);
          }
        }
      } finally {
        if (isEffectActive && !abortController.signal.aborted) {
          setIsLoading(false);
        }
        if (currentAbortController === abortController) {
          currentAbortController = null;
        }
      }
    };

    fetchPins();

    return () => {
      isEffectActive = false;
      if (currentAbortController) {
        currentAbortController.abort();
      }
    };
  }, [pinJsonUrl]);

  // Plot pins on the map when data is available
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !pinData) return;

    const sourceId = "pin-data-source";
    const layerId = "pin-data-layer";

    const handlePinClick = (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const shouldEvacuate = properties.to_evacuate === true || String(properties.to_evacuate).toLowerCase() === "true";

      const popupContent = `
            <div style="font-family: sans-serif; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1F2937;">${properties.name || 'Unknown'}</h3>
              <div style="font-size: 13px; color: #4B5563; line-height: 1.5;">
                ${properties.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${properties.description}</p>` : ''}
                <p style="margin: 5px 0;"><strong>To Evacuate:</strong> ${shouldEvacuate ? 'Yes' : 'No'}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${parseFloat(properties.latitude).toFixed(4)}, ${parseFloat(properties.longitude).toFixed(4)}</p>
                ${properties.timestamp ? `<p style="margin: 5px 0; font-size: 11px; color: #6B7280;"><strong>Timestamp:</strong> ${new Date(properties.timestamp).toLocaleString()}</p>` : ''}
              </div>
            </div>
          `;

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    const addPinsToMap = () => {
      try {
        const features = pinData.reduce((acc, pin, index) => {
          const longitude = Number(pin.longitude);
          const latitude = Number(pin.latitude);

          if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
            return acc;
          }
          acc.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            properties: {
              ...pin,
              id: pin.id || index,
            },
          });
          return acc;
        }, []);

        const geojson = {
          type: "FeatureCollection",
          features: features
        };

        const existingSource = map.getSource(sourceId);
        if (existingSource && typeof existingSource.setData === "function") {
          existingSource.setData(geojson);
          if (!map.getLayer(layerId)) {
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
          }
        } else {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (existingSource) map.removeSource(sourceId);

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
        }

        map.off('click', layerId, handlePinClick);
        map.off('mouseenter', layerId, handleMouseEnter);
        map.off('mouseleave', layerId, handleMouseLeave);

        map.on('click', layerId, handlePinClick);
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);

        console.log(`Added ${features.length} pins to the map`);
      } catch (error) {
        console.error("Failed to add pins to map:", error);
      }
    };

    const handleLoad = () => {
      addPinsToMap();
    };

    if (map.loaded()) {
      addPinsToMap();
    } else {
      map.once("load", handleLoad);
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      map.off('click', layerId, handlePinClick);
      map.off('mouseenter', layerId, handleMouseEnter);
      map.off('mouseleave', layerId, handleMouseLeave);
      map.off('load', handleLoad);
    };
  }, [pinData, mapRef]);

  if (!pinJsonUrl) {
    return null;
  }

  return (
    <PinStatistics 
      pinData={pinData}
      isLoading={isLoading}
      error={pinError}
    />
  );
}
