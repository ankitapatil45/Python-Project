import React, { useState } from "react";
import AddAgent from "./AddAgent";
import GetAgents from "./GetAgents";
import TicketsPage from "./TicketsPage";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [activeComponent, setActiveComponent] = useState("addAgent");

  const renderComponent = () => {
    switch (activeComponent) {
      case "addAgent":
        return <AddAgent />;
      case "getAgents":
        return <GetAgents />;
      case "viewTickets":
        return <TicketsPage />;
      default:
        return <h2>Welcome to Admin Dashboard</h2>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <h2>Admin Menu</h2>
        <ul>
          <li
            className={activeComponent === "addAgent" ? "active" : ""}
            onClick={() => setActiveComponent("addAgent")}
          >
            Create Agent
          </li>
          <li
            className={activeComponent === "getAgents" ? "active" : ""}
            onClick={() => setActiveComponent("getAgents")}
          >
            Get Agents
          </li>
          <li
            className={activeComponent === "viewTickets" ? "active" : ""}
            onClick={() => setActiveComponent("viewTickets")}
          >
            View Tickets
          </li>
        </ul>
      </div>

      <div className="main-content">{renderComponent()}</div>
    </div>
  );
};

export default AdminDashboard;
