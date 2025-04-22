import React, { useEffect, useState } from "react";
import axios from "axios";
import KpiChartWithForecast from "./components/KpiChartWithForecast";
import ForecastWithAnomalies from "./components/ForecastWithAnomalies";
import TopDriversChart from "./components/TopDriversChart";
import Narrative from "./components/Narrative";

function App() {
  const [kpis, setKpis] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [narratives, setNarratives] = useState({
    KPI_SUMMARY: "",
    FORECAST_OVERVIEW: "",
    ANOMALY_SUMMARY: "", 
    TOP_DRIVERS: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [kpisRes, forecastRes, anomaliesRes, driversRes, narrativesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/kpis"),
          axios.get("http://localhost:5000/api/forecast"),
          axios.get("http://localhost:5000/api/anomalies"),
          axios.get("http://localhost:5000/api/drivers"),
          axios.get("http://localhost:5000/api/narratives")
        ]);
        
        setKpis(kpisRes.data);
        setForecast(forecastRes.data);
        setAnomalies(anomaliesRes.data);
        setDrivers(driversRes.data);
        setNarratives(narrativesRes.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h2 className="h4 text-secondary">Loading dashboard data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center p-5 bg-white rounded shadow">
          <div className="text-danger display-1 mb-4">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h2 className="h4 mb-2">Error</h2>
          <p className="text-muted">{error}</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasAnomalies = anomalies.filter(a => a.isAnomaly).length > 0;

  return (
    <div className="min-vh-100 bg-light">
      <div className="container-fluid py-4 px-md-4">
        {/* Header */}
        <header className="mb-4 p-3 bg-white rounded shadow-sm">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="h2 mb-1">Drug X Performance Dashboard</h1>
              <p className="text-muted mb-0">Real-time analytics and insights</p>
            </div>
            <div className="col-auto">
              <div className="bg-light p-2 rounded">
                <small className="text-muted me-2">Last updated:</small>
                <small className="fw-bold">{new Date().toLocaleString()}</small>
              </div>
            </div>
          </div>
        </header>

        {/* KPI + Forecast Section */}
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white border-bottom-0">
                <h5 className="mb-0">Drug X: Volume & 30‑Day Forecast</h5>
              </div>
              <div className="card-body">
                <KpiChartWithForecast
                  data={kpis}
                  forecastData={forecast}
                  height={350}
                />
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="row g-4 h-100">
              <div className="col-md-6 col-lg-12">
                <Narrative 
                  title="KPI Summary" 
                  text={narratives.KPINARRATIVE} 
                  icon="bi-graph-up"
                />
              </div>
              <div className="col-md-6 col-lg-12">
                <Narrative 
                  title="Forecast Overview" 
                  text={narratives.FORECASTNARRATIVE} 
                  icon="bi-calendar-range"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Anomalies Section */}
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white border-bottom-0">
                <h5 className="mb-0">Anomaly Detection & Analysis</h5>
              </div>
              <div className="card-body">
                <ForecastWithAnomalies 
                  data={anomalies} 
                  height={350} 
                />
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <Narrative 
              title="Recent Anomalies" 
              text={narratives.ANOMALYNARRATIVE} 
              icon="bi-exclamation-triangle" 
              variant={hasAnomalies ? "warning" : "info"}
            />
          </div>
        </div>

        {/* Top-Drivers Section */}
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white border-bottom-0">
                <h5 className="mb-0">Top Drivers of Prescription Change</h5>
              </div>
              <div className="card-body">
                <TopDriversChart 
                  data={drivers} 
                  height={350} 
                />
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <Narrative 
              title="Top‑Drivers Insight" 
              text={narratives.INSIGHTNARRATIVE} 
              icon="bi-lightbulb"
              variant="light"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-muted mt-4 pt-3 pb-4">
          <p className="small mb-0">© {new Date().getFullYear()} Pharma Analytics. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;