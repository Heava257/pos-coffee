import React from "react";

const LandingStats = () => {
  return (
    <section className="stats-section">
      <div className="stat-card">
        <div className="stat-value">99.99%</div>
        <div className="stat-label">System Uptime</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">&lt; 100ms</div>
        <div className="stat-label">API Latency</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">Real-Time</div>
        <div className="stat-label">Data Sync</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">Multi-Branch</div>
        <div className="stat-label">Architecture</div>
      </div>
    </section>
  );
};

export default LandingStats;
// Force refresh
