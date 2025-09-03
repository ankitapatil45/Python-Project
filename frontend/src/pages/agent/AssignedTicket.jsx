import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AssignedTicket.css"; // optional CSS styling (similar to TicketList.css)
 
function AssignedTicket() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("No access token found. Please log in again.");
          setLoading(false);
          return;
        }
 
        const res = await axios.get("http://127.0.0.1:5000/agent/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });
 
        setTickets(res.data.tickets || []);
      } catch (err) {
        console.error("Error fetching assigned tickets:", err);
        setError("Failed to fetch assigned tickets.");
      } finally {
        setLoading(false);
      }
    };
 
    fetchTickets();
  }, []);
 
  // Filtering
  const filteredTickets = tickets.filter((t) => {
    if (filter === "open") return t.status === "open";
    if (filter === "closed") return t.status === "closed";
    return true;
  });
 
  const toggleFilter = () => {
    if (filter === "all") setFilter("open");
    else if (filter === "open") setFilter("closed");
    else setFilter("all");
  };
 
  if (loading) return <p className="p-4">Loading assigned tickets...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
 
  return (
    <div className="p-6">
      {/*<h2 className="text-xl font-bold mb-4">My Assigned Tickets</h2>*/}
 
      <button
        onClick={toggleFilter}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {filter === "all" && "Show Open"}
        {filter === "open" && "Show Closed"}
        {filter === "closed" && "Show All"}
      </button>
 
      {filteredTickets.length === 0 ? (
        <p>No assigned tickets found.</p>
      ) : (
        <div className="ticket-list-container">
          <table className="ticket-list-table">
            <thead className="bg-gray-100">
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Attachments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="text-center">
                  <td>{ticket.id}</td>
                  <td>{ticket.title}</td>
                  <td>{ticket.priority}</td>
                  <td>{ticket.status}</td>
                  <td>{ticket.created_by || "Unknown"}</td>
                  <td>
                    {ticket.attachments.length > 0
                      ? `${ticket.attachments.length} file(s)`
                      : "None"}
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        navigate(`/agent-dashboard/tickets/${ticket.id}/chat`)
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 
export default AssignedTicket;