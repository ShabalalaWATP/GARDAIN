import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLibreMap({
  apiKey,
  region = "eu-west-2",
  styleName = "Standard",
  colorScheme = "Light",
  center = [-123.115898, 49.295868],
  zoom = 11,
  height = "100vh",
}) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${styleName}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");

    return () => {
      map.remove();
    };
  }, [apiKey, region, styleName, colorScheme, center, zoom]);

  return <div ref={mapContainerRef} style={{ height, width: "100%" }} />;
}
