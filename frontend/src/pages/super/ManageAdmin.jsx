import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./ManageAdmin.css";

const BASE_URL = "http://localhost:5000"; // or 127.0.0.1

export default function ManageAdmin() {
  const [admins, setAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
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

  // ---- Fetch admins ----
  const fetchAdmins = async () => {
    setError("");
    try {
      const res = await api.get("/superadmin/admins");
      const list = Array.isArray(res.data) ? res.data : res.data?.admins || [];
      setAdmins(list);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Failed to fetch admins"
      );
      setAdmins([]);
    }
  };

  // ---- Fetch departments (same as AllTickets.jsx) ----
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/superadmin/departments");
      setDepartments(res.data?.departments || []);
    } catch {
      try {
        const res2 = await api.get("/departments");
        setDepartments(res2.data?.departments || []);
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        setDepartments([]);
      }
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Add Admin ----
  const addAdmin = async () => {
    if (!newAdmin.department) {
      alert("Please select a department");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post("/superadmin/create-admin", {
        ...newAdmin,
        role: "admin",
        is_active: true,
      });
      setNewAdmin({
        name: "",
        email: "",
        password: "",
        department: "",
      });
      fetchAdmins();
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Error adding admin"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---- Delete Admin ----
  const deleteAdmin = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      await api.delete(`/superadmin/admin/${id}`);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(
        "Failed to delete admin: " +
          (e?.response?.data?.error || e?.message || "")
      );
    }
  };

  // ---- Toggle Admin Status ----
  const toggleStatus = async (id, currentIsActive) => {
    const newIsActive = !toBool(currentIsActive);
    try {
      await api.put(`/superadmin/admin/${id}`, { is_active: newIsActive });
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: newIsActive } : a))
      );
    } catch (e) {
      alert(
        "Failed to change status: " +
          (e?.response?.data?.error || e?.message || "")
      );
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const name = (a.name || "").toLowerCase();
    const idStr = (a.id ?? "").toString();
    const email = (a.email || "").toLowerCase();
    return name.includes(search.toLowerCase()) || idStr.includes(search);
  });

  return (
    <div className="manage-admin">
      <h3>Manage Admins</h3>

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

      {/* Add Admin Form */}
      <div className="add-admin-form">
        <input
          type="text"
          placeholder="Name"
          value={newAdmin.name}
          onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newAdmin.email}
          onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={newAdmin.password}
          onChange={(e) =>
            setNewAdmin({ ...newAdmin, password: e.target.value })
          }
        />

        <select
          value={newAdmin.department}
          onChange={(e) =>
            setNewAdmin({ ...newAdmin, department: e.target.value })
          }
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        <button onClick={addAdmin} disabled={loading}>
          {loading ? "Adding..." : "Add Admin"}
        </button>
      </div>

      {/* Search Bar */}
      <input
        className="search-bar"
        type="text"
        placeholder="Search by ID or Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Admins List */}
      <table className="manage-admin">
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th style={{ whiteSpace: "nowrap" }}>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAdmins.map((a) => {
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
                  <button
                    onClick={() => toggleStatus(a.id, a.is_active)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: isActive ? "green" : "gray",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => deleteAdmin(a.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: "red",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
          {filteredAdmins.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 12, textAlign: "center" }}>
                No admins found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
