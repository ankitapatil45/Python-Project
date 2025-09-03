import React from "react";
import { Routes, Route } from "react-router-dom";
import "./AgentDashboard.css";

// Import components
import AssignedTicket from "./AssignedTicket";
import ChatPage from "./ChatPage";

export default function AgentDashboard() {
  return (
    <div className="agent-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="app-title">Agent Dashboard</h2>
        <ul>
          <li className="active">Assigned Tickets</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <h2>My Assigned Tickets</h2>
        </header>

        <div className="dashboard-body">
          {/* Define internal routes */}
          <Routes>
            <Route path="/" element={<AssignedTicket />} />
            <Route path="/tickets/:ticketId/chat" element={<ChatPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
