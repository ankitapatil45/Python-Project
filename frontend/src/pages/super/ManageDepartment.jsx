import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManageDepartment.css";

const BASE_URL = "http://127.0.0.1:5000"; // keep consistent with Postman

export default function ManageDepartment() {
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDescription, setNewDeptDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 🔹 Fetch all departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/departments`, {
        headers: authHeaders(),
      });
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // 🔹 Add Department
  const handleAdd = async () => {
    if (!newDeptName.trim()) {
      alert("Department name is required");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/departments`,
        {
          name: newDeptName.trim(),
          description: newDeptDescription.trim() || null,
        },
        { headers: authHeaders() }
      );

      setNewDeptName("");
      setNewDeptDescription("");
      fetchDepartments();
    } catch (err) {
      console.error("Error adding department:", err);
      alert(
        err.response?.data?.error || "Failed to add department. Try again."
      );
    }
  };

  return (
    <div className="manage-departments">
      <h2>Manage Departments</h2>

      {/* 🔹 Add Department Form */}
      <div className="add-form">
        <input
          type="text"
          placeholder="Department Name"
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={newDeptDescription}
          onChange={(e) => setNewDeptDescription(e.target.value)}
        />
        <button onClick={handleAdd}>Add Department</button>
      </div>

      {/* 🔹 Department List */}
      {loading ? (
        <p>Loading departments...</p>
      ) : (
        <table className="dept-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan="4">No departments found</td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.id}</td>
                  <td>{dept.name}</td>
                  <td>{dept.description || "-"}</td>
                  <td>{new Date(dept.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
