import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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

// Defines the main MapLibreMap React component
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

  // Keeps references to the map container and map object
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);  

  // Creates the base map when the component appears
  useEffect(() => {
    if (!mapContainerRef.current) return;


    // Initialises the map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${styleName}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
      center,
      zoom,
    });

    // Adds zoom and rotation controls to the map.
    map.addControl(new maplibregl.NavigationControl(), "top-left");
    mapRef.current = map;

    // Cleans up on unmount
    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [apiKey, region, styleName, colorScheme, center, zoom]);


  //Fetches GeoJSON, draws polygons/points, adjusts view
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geoJsonUrl) return;

    const sourceId = "fake-s3-features";
    const polygonFillLayerId = `${sourceId}-polygon-fill`;
    const polygonOutlineLayerId = `${sourceId}-polygon-outline`;
    const pointLayerId = `${sourceId}-points`;
    const abortController = new AbortController();

    // Function that fetches the GeoJSON and adds it to the map
    const addGeoJsonToMap = async () => {
      try {

        // Fetches the GeoJSON file from the provided URL
        const response = await fetch(geoJsonUrl, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`GeoJSON fetch failed: ${response.status} ${response.statusText}`);
        }
        const geojson = await response.json();

        // Removes existing layers and source if they exist
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
        if (map.getLayer(polygonOutlineLayerId)) map.removeLayer(polygonOutlineLayerId);
        if (map.getLayer(polygonFillLayerId)) map.removeLayer(polygonFillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        // Adds the raw GeoJSON file to the map as a data source.
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        // Fills colour for polygon features
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

        // Outline colour for polygon features
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

        // Circle style for point features
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

        // Fit the map view
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

    // If the map is loaded, add GeoJSON. Otherwise, wait for load event.
    if (map.loaded()) {
      addGeoJsonToMap();
    } else {
      map.once("load", addGeoJsonToMap);
    }

    // Cleanup for this effect
    return () => {
      abortController.abort();
      map.off("load", addGeoJsonToMap);
    };
  }, [geoJsonUrl]);

  // This is the actual piece of HTML React puts on the page.
  return <div ref={mapContainerRef} style={{ height, width: "100%" }} />;
}
