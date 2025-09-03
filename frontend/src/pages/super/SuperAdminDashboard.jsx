import React, { useState } from "react";
import "./SuperAdminDashboard.css";

// Import components
import AllTickets from "./AllTickets";
import ManageDepartment from "./ManageDepartment";
import ManageUser from "./ManageUser";
import ManageAdmin from "./ManageAdmin";
import ManageAgent from "./ManageAgent";
import AnalysisReport from "./AnalysisReport";
// import ProfileSettings from "./ProfileSettings";
// import AssignTicket from "./AssignTicket";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("allTickets");

  const renderContent = () => {
    switch (activeTab) {
      case "allTickets":
        return <AllTickets />;
      case "manageDepartment":
        return <ManageDepartment />;
      case "manageUser":
        return <ManageUser />;
      case "manageAdmin":
        return <ManageAdmin />;
      case "manageAgent":
        return <ManageAgent />;
      case "analysisReport":
        return <AnalysisReport />;
      // case "profileSettings":
      //   return <ProfileSettings />;
      default:
        return <AllTickets />;
    }
  };

  return (
    <div className="superadmin-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="app-title">Manage Dashboard</h2>
        <ul>
          <li
            className={activeTab === "allTickets" ? "active" : ""}
            onClick={() => setActiveTab("allTickets")}
          >
            All Tickets
          </li>
          <li
            className={activeTab === "manageDepartment" ? "active" : ""}
            onClick={() => setActiveTab("manageDepartment")}
          >
            Manage Department
          </li>
          <li
            className={activeTab === "manageUser" ? "active" : ""}
            onClick={() => setActiveTab("manageUser")}
          >
            Manage Customer
          </li>
          <li
            className={activeTab === "manageAdmin" ? "active" : ""}
            onClick={() => setActiveTab("manageAdmin")}
          >
            Manage Admins
          </li>
          <li
            className={activeTab === "manageAgent" ? "active" : ""}
            onClick={() => setActiveTab("manageAgent")}
          >
            Manage Agents
          </li>
          {/* <li
            className={activeTab === "assignTicket" ? "active" : ""}
            onClick={() => setActiveTab("assignTicket")}
          >
            Assign Ticket
          </li> */}
          <li
            className={activeTab === "analysisReport" ? "active" : ""}
            onClick={() => setActiveTab("analysisReport")}
          >
            Analysis Report
          </li>
          {/* <li
            className={activeTab === "profileSettings" ? "active" : ""}
            onClick={() => setActiveTab("profileSettings")}
          >
            Profile Settings
          </li> */}
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <h2>Super Admin Dashboard</h2>
          {/* <button className="logout-btn">Logout</button> */}
        </header>
        <div className="dashboard-body">{renderContent()}</div>
      </div>
    </div>
  );
}
