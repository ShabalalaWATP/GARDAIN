import { useRef } from 'react';
import MapLibreMap from './components/MapLibreMap';
import PinDataFetcher from './components/PinDataFetcher';
import topRightLogo from './assets/logos/GARDIAN.jpg';
import ukGovLogo from './assets/logos/UKGovLogo.jpg';
import ukMilLogo from './assets/logos/UKMilLogo.jpg';
import NewsFeed from './components/NewsFeed';
import WeatherInfo from './components/WeatherInfo';
import PhotoIntel from './components/PhotoIntel';
import './App.css';

function App() {
  const contactDirectory = [
    {
      name: "PJHQ Watchkeeper",
      summary: "Permanent Joint Headquarters - UK Strategic Command",
      channel: "24/7 Ops Room",
      value: "+44 1923 956 100",
      href: "tel:+441923956100",
      secondary: "Secure Email: pjhq-watchkeeper@mod.uk",
      external: false,
    },
    {
      name: "Land Operations Centre",
      summary: "Army Headquarters Land Ops Centre",
      channel: "Immediate Tasking Desk",
      value: "+44 1980 615 555",
      href: "tel:+441980615555",
      secondary: "Signal: land.ops@classified.mod.uk",
      external: false,
    },
    {
      name: "GCHQ GCO",
      summary: "GCHQ Global Communications Operations",
      channel: "Secure Coordination Cell",
      value: "+44 1242 221 491",
      href: "tel:+441242221491",
      secondary: "CTS Link: gco-ops@gchq.gov.uk",
      external: false,
    },
    {
      name: "UK Embassy Duty Officer",
      summary: "FCDO Consular Liaison",
      channel: "Consular Hotline",
      value: "+44 20 7008 5000",
      href: "tel:+442070085000",
      secondary: "Web: https://www.gov.uk/guidance/contact-the-fcdo",
      external: true,
    },
    {
      name: "FCDO Crisis Coordination Cell",
      summary: "Foreign, Commonwealth & Development Office",
      channel: "Crisis Response Desk",
      value: "+44 20 7008 1500",
      href: "tel:+442070081500",
      secondary: "Secure Email: crisis.cell@fcdo.gov.uk",
      external: false,
    },
    {
      name: "Local Police Station",
      summary: "Host Nation Law Enforcement Liaison",
      channel: "Duty Desk",
      value: "+00 123 456 7890",
      href: "tel:+001234567890",
      secondary: "Radio: VHF Channel 12",
      external: false,
    },
    {
      name: "Local Hospital Command",
      summary: "Medical Coordination Centre",
      channel: "Clinical Operations",
      value: "+00 123 456 7811",
      href: "tel:+001234567811",
      secondary: "MedNet: hospital.ops@health.gov",
      external: false,
    },
    {
      name: "Local Government Liaison",
      summary: "Regional Emergency Management Office",
      channel: "Civil Authority Liaison",
      value: "+00 123 456 7822",
      href: "tel:+001234567822",
      secondary: "Email: liaison@region.gov",
      external: false,
    },
    {
      name: "UKSF HQ Duty Officer",
      summary: "United Kingdom Special Forces Headquarters",
      channel: "Duty Officer",
      value: "+44 1980 555 990",
      href: "tel:+441980555990",
      secondary: "Secure Voice: STU III 7412",
      external: false,
    },
    {
      name: "Fire and Rescue HQ",
      summary: "Host Nation Fire and Rescue Command",
      channel: "Incident Coordination",
      value: "+00 123 456 7833",
      href: "tel:+001234567833",
      secondary: "Dispatch: firecontrol@civdef.gov",
      external: false,
    },
  ];

  const apiKey = import.meta.env.VITE_AWS_LOCATION_KEY;
  const geoJsonUrl =
    import.meta.env.VITE_GEOJSON_URL ||
    "https://zones-of-interest.s3.eu-west-2.amazonaws.com/hazard_zones.json";
  
  const pinJsonUrl = "https://ksip4rkha0.execute-api.eu-west-2.amazonaws.com/entitled-persons";
  const mapRef = useRef(null);

  const renderDashboard = () => (
    <>
      <section className="map-panel">
        <div className="map-card">
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
        <div className="map-footnote">
          <span className="status-indicator">Live Feed</span>
          <span className="refresh-indicator" aria-label="Map refreshes every ninety seconds">
            <span className="refresh-indicator__icon" aria-hidden="true" />
            <span className="refresh-indicator__copy">90s auto-refresh</span>
          </span>
          <span className="footnote-text">
            Data refreshes automatically as new JDP field reports arrive.
          </span>
        </div>
      </section>

      <section className="intel-panel">
        <div className="intel-content">
          <h2>Local News Reports</h2>
          <NewsFeed />
        </div>
      </section>

      <section className="ai-panel">
        <div className="ai-content">
          <h2>AI Scene Assessment</h2>
          <PhotoIntel />
        </div>
      </section>

      <section className="weather-panel">
        <div className="weather-header">
          <h2>Operational Weather Outlook</h2>
          <span className="weather-badge">Live</span>
        </div>
        <WeatherInfo
          placeQuery="De Vere Cotswold Water Park, Cirencester, GB"
          lat={51.671305633027536}
          lon={-1.898614152826156}
          units="metric"
        />
      </section>

      <section className="requests-panel">
        <div className="requests-header">
          <h2>Evacuation & Assistance Requests</h2>
          <span className="requests-badge">Queue Placeholder</span>
        </div>
        <p className="requests-copy">
          This area will surface outstanding evacuation requests, humanitarian assistance calls,
          and priority NEO support tickets from allied teams. Integrate the live feed here when the
          data service comes online.
        </p>
      </section>

      <section className="contacts-panel">
        <div className="contacts-content">
          <div className="contacts-header">
            <h2>Quick Contacts</h2>
            <span className="contacts-subtitle">Priority lines for command coordination and reachback</span>
          </div>
          <div className="contacts-grid">
            {contactDirectory.map((contact) => {
              const cardProps = contact.external
                ? { target: "_blank", rel: "noreferrer" }
                : {};

              return (
                <a key={contact.name} className="contact-card" href={contact.href} {...cardProps}>
                  <span className="contact-title">{contact.name}</span>
                  <span className="contact-subtitle">{contact.summary}</span>
                  <span className="contact-channel">{contact.channel}</span>
                  <span className="contact-value">{contact.value}</span>
                  {contact.secondary ? (
                    <span className="contact-secondary">{contact.secondary}</span>
                  ) : null}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="reference-panel">
        <div className="reference-content">
          <h2>Doctrine & Support References</h2>
          <div className="reference-links">
            <a
              className="reference-card"
              href="https://www.gov.uk/government/publications/jdp-3-51-non-combatant-evacuation-operations"
              target="_blank"
              rel="noreferrer"
            >
              <span className="reference-label">JDP 3-51</span>
              <span className="reference-title">Non-Combatant Evacuation Operations Guidance</span>
              <span className="reference-meta">gov.uk - Doctrine Publication</span>
            </a>
            <a
              className="reference-card"
              href="https://www.gov.uk/government/publications/allied-joint-doctrine-for-non-combatant-evacuation-operations-ajp-342"
              target="_blank"
              rel="noreferrer"
            >
              <span className="reference-label">AJP-3.4.2</span>
              <span className="reference-title">Allied Joint Doctrine for Non-Combatant Evacuation Operations</span>
              <span className="reference-meta">gov.uk - NATO Reference</span>
            </a>
            <a
              className="reference-card"
              href="https://www.gov.uk/guidance/contact-the-fcdo"
              target="_blank"
              rel="noreferrer"
            >
              <span className="reference-label">FCDO Support</span>
              <span className="reference-title">Contact the Foreign, Commonwealth & Development Office</span>
              <span className="reference-meta">gov.uk - Assistance Channel</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <div className="map-page">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>GARDIAN</h1>
            <div className="header-meta">
              <p className="header-subtitle">
                <span>Geospatial Aid Response &amp; Disaster Information Analysis Network</span>
              </p>
              <p className="header-doctrine">
                <span>Aligned to JDP-3-51 to assist with disaster relief and non-combatant evacuations (NEO)</span>
              </p>
            </div>
          </div>
          <div className="header-logo" aria-hidden="true">
            <img className="header-logo__primary" src={topRightLogo} alt="GARDIAN crest" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {apiKey ? (
          renderDashboard()
        ) : (
          <div className="missing-key">
            <p>
              Missing AWS Location Service API key. Set VITE_AWS_LOCATION_KEY in your
              environment.
            </p>
          </div>
        )}
      </main>
      <footer className="dashboard-footer" aria-label="Solution attribution">
        <div className="footer-content">
          <img
            className="footer-logo"
            src={ukGovLogo}
            alt="UK Government crest"
          />
          <p className="footer-credit">Created by Team 3 for the Defence Hackathon 2025</p>
          <img
            className="footer-logo"
            src={ukMilLogo}
            alt="UK Military crest"
          />
        </div>
      </footer>
    </div>
  );
}

export default App;
