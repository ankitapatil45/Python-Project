// ClientLayout.jsx
/*import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./ClientLayout.css";
 
export default function ClientLayout() {
  return (
    <div className="client-dashboard">
      <div className="sidebar">
        <h2>Customer Menu</h2>
        <ul>
          <li><Link to="/customer-dashboard/ticket-raise">Raise Ticket</Link></li>
          <li><Link to="/customer-dashboard/ticket-list">My Tickets</Link></li>
          <li><Link to="/customer-dashboard/chat-box">ChatBox</Link></li>
          <li><Link to="/customer-dashboard/knowledge-base">KnowledgeBase</Link></li>
          
        </ul>
      </div>
      <div className="content">
        <Outlet />             //🔑 Child pages load here 
      </div>
    </div>
  );
}*/
 








import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./ClientLayout.css";

export default function ClientLayout() {
  return (
    <div className="client-dashboard">
      {/* 🔹 Sidebar + Content */}
      <div className="main-layout">
        <div className="sidebar">
          <ul>
            <li><Link to="/customer-dashboard/ticket-raise">Raise Ticket</Link></li>
            <li><Link to="/customer-dashboard/ticket-list">My Tickets</Link></li>
            <li><Link to="/customer-dashboard/knowledge-base">KnowledgeBase</Link></li>
          </ul>
        </div>

        <div className="content">
          <Outlet /> {/* 🔑 Child pages load here */}
        </div>
      </div>
    </div>
  );
}
