// export default GetAgents;

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./GetAgents.css";

const BASE_URL = "http://localhost:5000";

const GetAgents = () => {
  const [agents, setAgents] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("access_token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError("");

      // First try superadmin endpoint
      const res = await axios.get(
        `${BASE_URL}/admin/agents?name=${filterName}`,
        { headers: authHeaders() }
      );

      setAgents(res.data?.agents || []);
    } catch (err) {
      try {
        // fallback → normal agents endpoint
        const res2 = await axios.get(
          `${BASE_URL}/admin/agents?name=${filterName}`,
          { headers: authHeaders() }
        );
        setAgents(res2.data?.agents || []);
      } catch (err2) {
        console.error("Error fetching agents:", err2);
        setError("Failed to load agents. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="agents-container">
      <h2>Agents List</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by agent name"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <button onClick={fetchAgents}>Search</button>
      </div>

      {loading && <p className="loading">Loading agents...</p>}
      {error && <p className="error">{error}</p>}

      <table className="agents-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody>
          {agents.length > 0 ? (
            agents.map((agent) => (
              <tr key={agent.id}>
                <td>{agent.id}</td>
                <td>{agent.name}</td>
                <td>{agent.email}</td>
                <td>{agent.department || "N/A"}</td>
                <td>{agent.is_active ? "Active" : "Inactive"}</td>
                <td>{agent.created_at || "N/A"}</td>
                <td>{agent.created_by || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No agents found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GetAgents;
