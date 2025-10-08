import React, { useRef, useEffect, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import fakePinLocations from "../../fakepinlocation.json";

const fakePinSourceId = "fake-pin-locations";
const fakePinLayerId = `${fakePinSourceId}-circles`;
const fakePinLabelLayerId = `${fakePinSourceId}-labels`;

// Normalises the raw JSON data into a GeoJSON feature collection
const convertLocationsToGeoJson = (locations = []) => ({
  type: "FeatureCollection",
  features: locations
    .map((location) => {
      const { id, name, description, coordinates = {} } = location ?? {};
      const { longitude, latitude } = coordinates;
      if (
        typeof longitude !== "number" ||
        typeof latitude !== "number"
      ) {
        return null;
      }

      return {
        type: "Feature",
        id,
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        properties: {
          name: name ?? "Unknown location",
          description: description ?? "No description provided.",
        },
      };
    })
    .filter(Boolean),
});

// Builds the HTML used inside a popup when a pin is clicked
const buildPopupHtml = (name, description) => {
  const safeName = name ?? "Unknown location";
  const safeDescription = description ?? "No description provided.";
  return `
    <div style="min-width: 200px;">
      <h3 style="margin: 0 0 4px; font-size: 16px;">${safeName}</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.4;">${safeDescription}</p>
    </div>
  `;
};

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
  const activePopupRef = useRef(null);

  const fakePinFeatureCollection = useMemo(
    () => convertLocationsToGeoJson(fakePinLocations?.locations ?? []),
    []
  );

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
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
      mapRef.current = null;
      map.remove();
    };
  }, [apiKey, region, styleName, colorScheme, center, zoom]);

  // Adds fake pin locations from the bundled JSON file
  useEffect(() => {
    const map = mapRef.current;
    if (!map || fakePinFeatureCollection.features.length === 0) return;

    let popup = null;
    const handlePinClick = (event) => {
      const feature = event.features?.[0];
      if (!feature?.geometry?.coordinates) return;

      const [lng, lat] = feature.geometry.coordinates;
      const { name, description } = feature.properties ?? {};
      const popupHtml = buildPopupHtml(name, description);

      if (popup) {
        popup.remove();
      }

      popup = new maplibregl.Popup({ offset: 12, closeButton: true })
        .setLngLat([lng, lat])
        .setHTML(popupHtml)
        .addTo(map);

      activePopupRef.current = popup;
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const registerLayerEvents = () => {
      map.on("click", fakePinLayerId, handlePinClick);
      map.on("mouseenter", fakePinLayerId, handleMouseEnter);
      map.on("mouseleave", fakePinLayerId, handleMouseLeave);
    };

    const deregisterLayerEvents = () => {
      map.off("click", fakePinLayerId, handlePinClick);
      map.off("mouseenter", fakePinLayerId, handleMouseEnter);
      map.off("mouseleave", fakePinLayerId, handleMouseLeave);
    };

    const addPinsToMap = () => {
      deregisterLayerEvents();
      if (map.getLayer(fakePinLabelLayerId)) map.removeLayer(fakePinLabelLayerId);
      if (map.getLayer(fakePinLayerId)) map.removeLayer(fakePinLayerId);
      if (map.getSource(fakePinSourceId)) map.removeSource(fakePinSourceId);

      map.addSource(fakePinSourceId, {
        type: "geojson",
        data: fakePinFeatureCollection,
      });

      map.addLayer({
        id: fakePinLayerId,
        type: "circle",
        source: fakePinSourceId,
        paint: {
          "circle-radius": 8,
          "circle-color": "#047857",
          "circle-stroke-color": "#F9FAFB",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: fakePinLabelLayerId,
        type: "symbol",
        source: fakePinSourceId,
        layout: {
          "text-field": ["get", "name"],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-size": 12,
        },
        paint: {
          "text-color": "#111827",
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1,
        },
      });

      const pinBounds = computeBoundsFromGeoJson(fakePinFeatureCollection);
      if (pinBounds) {
        map.fitBounds(pinBounds, { padding: 40, maxZoom: 14, duration: 600 });
      }

      registerLayerEvents();
    };

    if (map.loaded()) {
      addPinsToMap();
    } else {
      map.once("load", addPinsToMap);
    }

    return () => {
      deregisterLayerEvents();
      map.off("load", addPinsToMap);

      if (map.getLayer(fakePinLabelLayerId)) map.removeLayer(fakePinLabelLayerId);
      if (map.getLayer(fakePinLayerId)) map.removeLayer(fakePinLayerId);
      if (map.getSource(fakePinSourceId)) map.removeSource(fakePinSourceId);

      if (popup) {
        popup.remove();
        popup = null;
      }
      activePopupRef.current = null;
    };
  }, [fakePinFeatureCollection]);


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
        let bounds = computeBoundsFromGeoJson(geojson);
        const pinBounds = computeBoundsFromGeoJson(fakePinFeatureCollection);

        if (bounds && pinBounds) {
          bounds.extend(pinBounds.getNorthEast());
          bounds.extend(pinBounds.getSouthWest());
        } else if (!bounds) {
          bounds = pinBounds;
        }

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
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
    };
  }, [geoJsonUrl, fakePinFeatureCollection]);

  // This is the actual piece of HTML React puts on the page.
  return <div ref={mapContainerRef} style={{ height, width: "100%" }} />;
}
