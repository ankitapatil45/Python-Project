import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000"; // Flask backend

export default function SuperAdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [agents, setagents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all"); // all | assigned | unassigned

  // Per-row selection state
  const [selectedDepartments, setSelectedDepartments] = useState({});
  const [selectedagents, setSelectedagents] = useState({});

  const authHeaders = () => {
    const token = localStorage.getItem("access_token");
    return { Authorization: `Bearer ${token}` };
  };

  // ---- Fetch helpers ----
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/superadmin/departments`, {
        headers: authHeaders(),
      });
      setDepartments(res.data?.departments || []);
    } catch {
      const res2 = await axios.get(`${BASE_URL}/departments`, {
        headers: authHeaders(),
      });
      setDepartments(res2.data?.departments || []);
    }
  };

  const fetchagents = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/superadmin/agents`, {
        headers: authHeaders(),
      });
      setagents(res.data?.agents || []);
    } catch {
      const res2 = await axios.get(`${BASE_URL}/agents`, {
        headers: authHeaders(),
      });
      setagents(res2.data?.agents || []);
    }
  };

  // ✅ Fetch tickets
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("No access token found. Please login.");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${BASE_URL}/tickets`, {
          headers: authHeaders(),
        });

        setTickets(res.data?.tickets || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch tickets.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ Fetch departments & agents
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchDepartments(), fetchagents()]);
      } catch (err) {
        console.error("Failed to fetch departments/agents:", err);
      }
    })();
  }, []);

  // ✅ Filter agents by department (compare by name, since backend gives name not id)
  const getagentsByDepartment = (deptId) => {
    if (!deptId) return [];

    // Find the department object by its id
    const dept = departments.find((d) => String(d.id) === String(deptId));
    if (!dept) return [];

    // Match agents whose department name equals the selected department name
    return agents.filter((a) => String(a.department) === String(dept.name));
  };

  // ✅ Assign ticket to department + agent
  const handleAssign = async (ticketId) => {
    let departmentId = selectedDepartments[ticketId];
    let agentId = selectedagents[ticketId] || null;

    if (!departmentId) {
      alert("Please select a department first.");
      return;
    }

    departmentId = Number(departmentId);
    agentId = agentId ? Number(agentId) : null;

    try {
      const res = await axios.put(
        `${BASE_URL}/tickets/${ticketId}/assign`,
        { department_id: departmentId, agent_id: agentId },
        { headers: authHeaders() }
      );

      const updated = res?.data?.ticket;
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                department: updated?.department ?? t.department,
                assigned_to: updated?.assigned_to ?? t.assigned_to,
              }
            : t
        )
      );

      setSelectedDepartments((p) => ({ ...p, [ticketId]: "" }));
      setSelectedagents((p) => ({ ...p, [ticketId]: "" }));

      alert("Ticket assigned successfully!");
    } catch (err) {
      console.error("Failed to assign:", err.response?.data || err.message);
      alert(
        "Failed to assign ticket: " + (err.response?.data?.error || err.message)
      );
    }
  };

  // ✅ Apply search + filters
  const filteredTickets = tickets.filter((t) => {
    const s = (search || "").toLowerCase();
    const matchSearch =
      (t.title && t.title.toLowerCase().includes(s)) ||
      (t.created_by && t.created_by.toLowerCase().includes(s)) ||
      (t.assigned_to && t.assigned_to.toLowerCase().includes(s)) ||
      (t.department && t.department.toLowerCase().includes(s)) ||
      String(t.id).includes(s);

    const matchStatus =
      statusFilter === "all"
        ? true
        : String(t.status || "").toLowerCase() === statusFilter;

    const matchPriority =
      priorityFilter === "all"
        ? true
        : String(t.priority || "").toLowerCase() === priorityFilter;

    const matchAssignment =
      assignmentFilter === "all"
        ? true
        : assignmentFilter === "assigned"
        ? !!t.assigned_to
        : !t.assigned_to;

    return matchSearch && matchStatus && matchPriority && matchAssignment;
  });

  if (loading) return <p className="p-4 text-gray-600">Loading tickets...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">🎟 Super Admin - Tickets</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title, creator, assignee, department, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-72"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={assignmentFilter}
          onChange={(e) => setAssignmentFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Tickets</option>
          <option value="assigned">Assigned Only</option>
          <option value="unassigned">Unassigned Only</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Title</th>
              <th className="px-4 py-2 border">Priority</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Created By</th>
              <th className="px-4 py-2 border">Assigned To</th>
              <th className="px-4 py-2 border">Department</th>
              <th className="px-4 py-2 border">Created At</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                const deptId = selectedDepartments[t.id] || "";
                const agentId = selectedagents[t.id] || "";
                const agentsForDept = getagentsByDepartment(deptId);

                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-gray-50 ${
                      !t.assigned_to ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2 border text-center">{t.id}</td>
                    <td className="px-4 py-2 border">{t.title}</td>
                    <td className="px-4 py-2 border text-center">
                      {t.priority}
                    </td>
                    <td className="px-4 py-2 border text-center">{t.status}</td>
                    <td className="px-4 py-2 border">{t.created_by || "-"}</td>
                    <td className="px-4 py-2 border">{t.assigned_to || "-"}</td>
                    <td className="px-4 py-2 border">{t.department || "-"}</td>
                    <td className="px-4 py-2 border">{t.created_at}</td>
                    <td className="px-4 py-2 border text-center">
                      {!t.assigned_to ? (
                        <div className="flex gap-2 items-center">
                          {/* Department Dropdown */}
                          <select
                            className="border px-2 py-1 rounded"
                            value={deptId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedDepartments((prev) => ({
                                ...prev,
                                [t.id]: val,
                              }));
                              setSelectedagents((prev) => ({
                                ...prev,
                                [t.id]: "",
                              }));
                            }}
                          >
                            <option value="">Select Department</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>

                          {/* Agent Dropdown */}
                          <select
                            className="border px-2 py-1 rounded"
                            value={agentId}
                            onChange={(e) =>
                              setSelectedagents((prev) => ({
                                ...prev,
                                [t.id]: e.target.value,
                              }))
                            }
                            disabled={!deptId}
                          >
                            <option value="">Select Agent (optional)</option>
                            {agentsForDept.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleAssign(t.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={!deptId}
                          >
                            Assign
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
