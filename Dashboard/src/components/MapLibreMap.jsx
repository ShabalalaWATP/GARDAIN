import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const computeBoundsFromGeoJson = (geojson) => {
  const bounds = new maplibregl.LngLatBounds();
  let hasCoordinates = false;

  const extendBounds = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      bounds.extend(coords);
      hasCoordinates = true;
      return;
    }
    coords.forEach(extendBounds);
  };

  geojson?.features?.forEach((feature) => {
    extendBounds(feature?.geometry?.coordinates);
  });

  return hasCoordinates ? bounds : null;
};

export default function MapLibreMap({
  apiKey,
  region = "eu-west-2",
  styleName = "Standard",
  colorScheme = "Light",
  center = [-123.115898, 49.295868],
  zoom = 11,
  height = "100vh",
  geoJsonUrl,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${styleName}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");
    mapRef.current = map;

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [apiKey, region, styleName, colorScheme, center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geoJsonUrl) return;

    const sourceId = "fake-s3-features";
    const polygonFillLayerId = `${sourceId}-polygon-fill`;
    const polygonOutlineLayerId = `${sourceId}-polygon-outline`;
    const pointLayerId = `${sourceId}-points`;
    const abortController = new AbortController();

    const addGeoJsonToMap = async () => {
      try {
        const response = await fetch(geoJsonUrl, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`GeoJSON fetch failed: ${response.status} ${response.statusText}`);
        }
        const geojson = await response.json();

        // Clean up hot-reload leftovers so we can re-add sources/layers safely.
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
        if (map.getLayer(polygonOutlineLayerId)) map.removeLayer(polygonOutlineLayerId);
        if (map.getLayer(polygonFillLayerId)) map.removeLayer(polygonFillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: polygonFillLayerId,
          type: "fill",
          source: sourceId,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "fill-color": ["coalesce", ["get", "color"], "#4F46E5"],
            "fill-opacity": 0.3,
          },
        });

        map.addLayer({
          id: polygonOutlineLayerId,
          type: "line",
          source: sourceId,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "line-color": "#312E81",
            "line-width": 2,
          },
        });

        map.addLayer({
          id: pointLayerId,
          type: "circle",
          source: sourceId,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 6,
            "circle-color": ["coalesce", ["get", "color"], "#DC2626"],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        });

        const bounds = computeBoundsFromGeoJson(geojson);
        if (bounds) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 13, duration: 800 });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load GeoJSON data:", error);
        }
      }
    };

    if (map.loaded()) {
      addGeoJsonToMap();
    } else {
      map.once("load", addGeoJsonToMap);
    }

    return () => {
      abortController.abort();
      map.off("load", addGeoJsonToMap);
    };
  }, [geoJsonUrl]);

  return <div ref={mapContainerRef} style={{ height, width: "100%" }} />;
}
