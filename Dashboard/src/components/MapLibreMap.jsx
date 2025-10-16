import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import fallbackHazardZones from "../assets/data/hazard_zones.json";

// Helper function that figures out how far to zoom to show all data
const computeBoundsFromGeoJson = (geojson) => {
  const bounds = new maplibregl.LngLatBounds();
  let hasCoordinates = false;

  // Recursively walks through coordinates to extend the bounds
  const extendBounds = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      bounds.extend(coords);
      hasCoordinates = true;
      return;
    }
    coords.forEach(extendBounds);
  };

  //  Handles FeatureCollection and single Feature
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
  mapRef: externalMapRef,
}) {
  const mapContainerRef = useRef(null);
  const internalMapRef = useRef(null);
  const mapRef = externalMapRef ?? internalMapRef;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resolvedColorScheme =
      typeof colorScheme === "string" && colorScheme.toLowerCase() === "dark" ? "Dark" : "Light";
    const resolvedStyleName = encodeURIComponent(styleName);

    // Initialises the map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${resolvedStyleName}/descriptor?key=${apiKey}&color-scheme=${resolvedColorScheme}`,
      center,
      zoom,
    });

    map.on("error", (event) => {
      if (event?.error?.message?.includes("Expected value to be of type number")) {
        console.debug("MapLibre suppressed non-fatal error:", event.error?.message);
        return;
      }
      console.error("MapLibre error:", event.error || event);
    });

    map.on("load", () => {
      map.resize();
    });

    const handleWindowResize = () => {
      map.resize();
    };

    window.addEventListener("resize", handleWindowResize);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Adds zoom and rotation controls to the map.
    map.addControl(new maplibregl.NavigationControl(), "top-left");
    mapRef.current = map;

    return () => {
      mapRef.current = null;
      window.removeEventListener("resize", handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
    };
  }, [apiKey, region, styleName, colorScheme, center, zoom, mapRef]);


  //Fetches GeoJSON, draws polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "fake-s3-features";
    const polygonFillLayerId = `${sourceId}-polygon-fill`;
    const polygonOutlineLayerId = `${sourceId}-polygon-outline`;
    const pointLayerId = `${sourceId}-points`;

    let currentAbortController = null;
    let isEffectActive = true;

    // Fetches the GeoJSON file from the provided URL and updates the map
    const cloneGeoJson = (data) => JSON.parse(JSON.stringify(data));

    const applyGeoJsonToMap = (geojson) => {
      const existingSource = map.getSource(sourceId);
      if (existingSource && typeof existingSource.setData === "function") {
        existingSource.setData(geojson);
      } else {
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
        if (map.getLayer(polygonOutlineLayerId)) map.removeLayer(polygonOutlineLayerId);
        if (map.getLayer(polygonFillLayerId)) map.removeLayer(polygonFillLayerId);
        if (existingSource) map.removeSource(sourceId);

        // Adds the raw GeoJSON file to the map as a data source.
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
      }

      map.resize();

      const bounds = computeBoundsFromGeoJson(geojson);
      if (bounds) {
        map.fitBounds(bounds, { padding: 40, maxZoom: 13, duration: 800 });
      }
    };

    const addGeoJsonToMap = async () => {
      if (!isEffectActive) {
        return;
      }

      if (currentAbortController) {
        currentAbortController.abort();
      }

      const abortController = new AbortController();
      currentAbortController = abortController;

      let geojson = null;
      let usedFallback = false;

      const loadFromRemote = async () => {
        if (!geoJsonUrl) {
          return null;
        }

        const response = await fetch(geoJsonUrl, {
          mode: "cors",
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`GeoJSON fetch failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      };

      try {
        geojson = await loadFromRemote();
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.warn(
          "Remote GeoJSON failed to load – falling back to embedded hazard zones dataset.",
          error
        );
        geojson = cloneGeoJson(fallbackHazardZones);
        usedFallback = true;
      }

      if (!geojson) {
        geojson = cloneGeoJson(fallbackHazardZones);
        usedFallback = true;
      }

      if (!geojson) {
        console.error("MapLibreMap could not load any GeoJSON data for geofenced segments.");
        return;
      }

      if (!isEffectActive) {
        return;
      }

      applyGeoJsonToMap(geojson);

      if (usedFallback) {
        console.info("MapLibreMap is rendering geofence polygons from the embedded fallback dataset.");
      }
    };

    const handleInitialLoad = () => {
      addGeoJsonToMap();
    };

    if (map.loaded()) {
      addGeoJsonToMap();
    } else {
      map.once("load", handleInitialLoad);
    }

    return () => {
      isEffectActive = false;
      if (currentAbortController) {
        currentAbortController.abort();
      }
      map.off("load", handleInitialLoad);
    };
  }, [geoJsonUrl, mapRef]);

  // This is the actual piece of HTML React puts on the page.
  return <div ref={mapContainerRef} style={{ height, width: "100%" }} />;
}
