import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";
const TOKEN_KEY = "access_token"; // ✅ Consistent key

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function formatDateSafe(value) {
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value ?? "") : d.toLocaleString();
  } catch {
    return String(value ?? "");
  }
}

export default function ManageUser() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState(getStoredToken() || "");

  const [editingCustomer, setEditingCustomer] = useState(null); // current customer in edit mode
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });

  // Axios instance with token interceptor
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: BASE_URL });
    instance.interceptors.request.use((config) => {
      const t = getStoredToken();
      if (t) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${t}`;
      }
      return config;
    });
    return instance;
  }, []);

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const t = getStoredToken();
      if (!t) {
        setError(
          "No token found. Paste your access_token below and click Save."
        );
        setCustomers([]);
        return;
      }
      const res = await api.get("/superadmin/customers");
      setCustomers(res.data?.customers || []);
    } catch (err) {
      const status = err?.response?.status;
      const msgFromServer =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch customers";

      let hint = "";
      if (status === 401) hint = " (Unauthorized: token missing/expired)";
      if (status === 422) hint = " (JWT missing or malformed)";
      if (status === 403) hint = " (Forbidden: requires super_admin role)";
      if (status === 404) hint = " (Route not found)";

      setError(`${msgFromServer}${hint}`);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save token manually
  const handleSaveToken = () => {
    if (!token || token.trim() === "") return;
    storeToken(token.trim());
    fetchCustomers();
  };

  // Delete customer
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      await api.delete(`/superadmin/customer/${id}`);
      setCustomers(customers.filter((c) => c.id !== id));
    } catch (err) {
      alert(
        "Failed to delete customer: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  // Toggle status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/superadmin/customer/${id}`, { is_active: newStatus });
      setCustomers(
        customers.map((c) => (c.id === id ? { ...c, is_active: newStatus } : c))
      );
    } catch (err) {
      alert(
        "Failed to change status: " + (err.response?.data?.error || err.message)
      );
    }
  };

  // Start editing
  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email,
      
    });
  };

  // Save edit
  const handleSaveEdit = async () => {
    try {
      await api.put(`/superadmin/customer/${editingCustomer.id}`, editForm);
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...editForm } : c
        )
      );
      setEditingCustomer(null);
    } catch (err) {
      alert(
        "Failed to update customer: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Inter, system-ui, Arial" }}>
      <h2 style={{ marginBottom: 12 }}>Manage Customers</h2>

      {/* Token input UI */}
      {(!getStoredToken() || /token/i.test(error)) && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            border: "1px solid #eee",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Access Token</div>
          <input
            type="text"
            placeholder="Paste your access_token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleSaveToken}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background:
                "linear-gradient(135deg, rgba(30,60,114,1) 0%, rgba(42,82,152,1) 100%)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Save Token & Retry
          </button>
        </div>
      )}

      {loading && <p>Loading customers...</p>}
      {!loading && error && (
        <p style={{ color: "crimson", marginBottom: 12 }}>{error}</p>
      )}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              background: "#fff",
              border: "1px solid #eee",
            }}
          >
            <thead>
              <tr style={{ background: "#f6f8fb" }}>
                <th style={th}>ID</th>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
                <th style={th}>Created At</th>
                {/* <th style={th}>Created By</th> */}
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={td}>{c.id}</td>
                    <td style={td}>
                      {editingCustomer?.id === c.id ? (
                        <input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td style={td}>
                      {editingCustomer?.id === c.id ? (
                        <input
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                        />
                      ) : (
                        c.email
                      )}
                    </td>
                    <td style={td}>
                      {editingCustomer?.id === c.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({ ...editForm, role: e.target.value })
                          }
                        >
                          <option value="customer">Customer</option>
                        
                        </select>
                      ) : (
                        c.role
                      )}
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => handleToggleStatus(c.id, c.is_active)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: c.is_active ? "green" : "gray",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={td}>{formatDateSafe(c.created_at)}</td>
                    {/* <td style={td}>{c.created_by ?? "N/A"}</td> */}
                    <td style={td}>
                      {editingCustomer?.id === c.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            style={actionBtn("blue")}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCustomer(null)}
                            style={actionBtn("gray")}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            style={actionBtn("blue")}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={actionBtn("red")}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={td} colSpan={8}>
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "12px 10px",
  fontWeight: 600,
  fontSize: 14,
  color: "#2a2a2a",
  borderBottom: "1px solid #eaeaea",
  whiteSpace: "nowrap",
};

const td = {
  padding: "10px",
  fontSize: 14,
  color: "#333",
  verticalAlign: "top",
};

function actionBtn(color) {
  return {
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    background: color,
    color: "#fff",
    marginRight: 6,
    cursor: "pointer",
  };
}
