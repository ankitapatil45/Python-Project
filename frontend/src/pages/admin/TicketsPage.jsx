// src/components/admin/AllTickets.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TicketsPage.css";

const BASE_URL = "http://127.0.0.1:5000";

export default function AllTickets() {
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${BASE_URL}/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnassignedTickets(res.data.unassigned_tickets);
      setAssignedTickets(res.data.assigned_tickets);
    } catch (err) {
      console.error("Error fetching tickets", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents for dropdown
  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${BASE_URL}/admin/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(res.data.agents);
    } catch (err) {
      console.error("Error fetching agents", err);
    }
  };

  // Assign ticket
  const handleAssign = async (ticketId, agentId) => {
    if (!agentId) return alert("Please select an agent");
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${BASE_URL}/admin/tickets/${ticketId}/assign`,
        { agent_id: agentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Ticket assigned successfully!");
      fetchTickets(); // refresh after assignment
    } catch (err) {
      console.error("Error assigning ticket", err);
      alert("Failed to assign ticket");
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAgents();
  }, []);

  if (loading) return <p>Loading tickets...</p>;

  return (
    <div className="all-tickets">
      <h3>Unassigned Tickets</h3>
      {unassignedTickets.length === 0 ? (
        <p>No unassigned tickets</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Department</th>
              <th>Assign To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {unassignedTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.title}</td>
                <td>{ticket.description}</td>
                <td>{ticket.department}</td>
                <td>
                  <select id={`agent-${ticket.id}`} defaultValue="">
                    <option value="" disabled>
                      Select Agent
                    </option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => {
                      const agentId = document.getElementById(
                        `agent-${ticket.id}`
                      ).value;
                      handleAssign(ticket.id, agentId);
                    }}
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Assigned Tickets</h3>
      {assignedTickets.length === 0 ? (
        <p>No assigned tickets</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Department</th>
              <th>Assigned To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignedTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.title}</td>
                <td>{ticket.description}</td>
                <td>{ticket.department}</td>
                <td>{ticket.assigned_to}</td>
                <td>{ticket.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
