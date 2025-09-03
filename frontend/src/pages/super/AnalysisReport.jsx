import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AnalysisReport.css";

const BASE_URL = "http://localhost:5000";

export default function AnalysisReport() {
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tickets/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="analysis-report">
      <h3>Analysis Report</h3>

      <div className="stats">
        <div className="stat-box">Total Tickets: {stats.total}</div>
        <div className="stat-box">Open: {stats.open}</div>
        <div className="stat-box">Closed: {stats.closed}</div>
      </div>

      {/* Chart Section */}
      <div className="chart-placeholder">
        <p>Charts & graphs will be added here</p>
      </div>
    </div>
  );
}
