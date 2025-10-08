import MapLibreMap from './components/MapLibreMap';
import './App.css';

function App() {
  const apiKey = import.meta.env.VITE_AWS_LOCATION_KEY;
  const geoJsonUrl =
    import.meta.env.VITE_GEOJSON_URL ||
    "https://zones-of-interest.s3.eu-west-2.amazonaws.com/hazard_zones.json";

  if (!apiKey) {
    return (
      <div className="map-page missing-key">
        <p>Missing AWS Location Service API key. Set VITE_AWS_LOCATION_KEY in your environment.</p>
      </div>
    );
  }

  return (
    <div className="map-page">
      <MapLibreMap apiKey={apiKey} geoJsonUrl={geoJsonUrl} height="100%" />
    </div>
  );
}

export default App;
