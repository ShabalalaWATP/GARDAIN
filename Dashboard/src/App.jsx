import { useRef } from 'react';
import MapLibreMap from './components/MapLibreMap';
import PinDataFetcher from './components/PinDataFetcher';
import './App.css';

function App() {
  const apiKey = import.meta.env.VITE_AWS_LOCATION_KEY;
  const geoJsonUrl =
    import.meta.env.VITE_GEOJSON_URL ||
    "https://zones-of-interest.s3.eu-west-2.amazonaws.com/hazard_zones.json";
  
  const pinJsonUrl = "https://ksip4rkha0.execute-api.eu-west-2.amazonaws.com/entitled-persons";
  const mapRef = useRef(null);

  return (
    <div className="map-page">
      <MapLibreMap 
        apiKey={apiKey} 
        geoJsonUrl={geoJsonUrl} 
        height="100%"
        mapRef={mapRef}
      />
      <PinDataFetcher 
        pinJsonUrl={pinJsonUrl}
        mapRef={mapRef}
      />
    </div>
  );
}

export default App;