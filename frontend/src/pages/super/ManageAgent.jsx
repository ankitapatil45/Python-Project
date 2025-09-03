import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./ManageAgent.css";

const BASE_URL = "http://localhost:5000";

export default function ManageAgent() {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // ---- Axios instance with token header ----
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: BASE_URL });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return instance;
  }, []);

  // ---- Helpers ----
  const toBool = (v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string")
      return v.toLowerCase() === "active" || v === "1" || v === "true";
    return false;
  };

  // ---- Fetch agents ----
  const fetchAgents = async () => {
    setError("");
    try {
      const res = await api.get("/superadmin/agents");
      const list = Array.isArray(res.data) ? res.data : res.data?.agents || [];
      setAgents(list);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Failed to fetch agents"
      );
      setAgents([]);
    }
  };

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Delete Agent ----
  const deleteAgent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;
    try {
      await api.delete(`/superadmin/agent/${id}`);
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(
        "Failed to delete agent: " +
          (e?.response?.data?.error || e?.message || "")
      );
    }
  };

  // ---- Toggle Agent Status ----
  const toggleStatus = async (id, currentIsActive) => {
    const newIsActive = !toBool(currentIsActive);
    try {
      await api.put(`/superadmin/agent/${id}`, { is_active: newIsActive });
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: newIsActive } : a))
      );
    } catch (e) {
      alert(
        "Failed to change status: " +
          (e?.response?.data?.error || e?.message || "")
      );
    }
  };

  const filteredAgents = agents.filter((a) => {
    const name = (a.name || "").toLowerCase();
    const idStr = (a.id ?? "").toString();
    const email = (a.email || "").toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      idStr.includes(search) ||
      email.includes(search.toLowerCase())
    );
  });

  return (
    <div className="manage-agent">
      <h3>Manage Agents</h3>

      {error && (
        <div
          style={{
            marginBottom: 12,
            color: "#b00020",
            background: "#fde7e9",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {/* Search Bar */}
      <input
        className="search-bar"
        type="text"
        placeholder="Search by ID, Name, or Email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Agents List */}
      <table className="table-container">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAgents.map((a) => {
            const isActive = toBool(a.is_active);
            const dept =
              a.department_name || a.department || a.departmentId || "N/A";
            return (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{dept}</td>
                <td>
                  <span
                    className={`status-badge ${
                      isActive ? "active" : "inactive"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button
                    className={isActive ? "btn-inactive" : "btn-active"}
                    onClick={() => toggleStatus(a.id, a.is_active)}
                  >
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => deleteAgent(a.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
          {filteredAgents.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 12, textAlign: "center" }}>
                No agents found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
