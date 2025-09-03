// ClientDashboard.jsx
/*import React from "react";
import "./ClientDashboard.css";
 
export default function ClientDashboard() {
  return (
    <div className="client-home">
      <h1>👨‍💻 Customer Dashboard</h1>
      <p>Welcome, Customer! Select an option from the menu.</p>
    </div>
  );
}*/










import React from "react";
import { Routes, Route } from "react-router-dom";

// Layout
import ClientLayout from "./ClientLayout";

// Pages
import TicketRaise from "./TicketRaise";
import TicketList from "./TicketList";
import KnowledgeBase from "./KnowledgeBase";
import ChatPage from "./ChatPage";

export default function ClientDashboard() {
  return (
    <Routes>
      {/* Client Layout ke andar nested routes */}
      <Route path="/" element={<ClientLayout />}>
        {/* Default (index) route */}
        <Route index element={<TicketRaise />} />

        <Route path="ticket-raise" element={<TicketRaise />} />
        <Route path="ticket-list" element={<TicketList />} />
        <Route path="ticket-list/:ticketId/chat" element={<ChatPage />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
      </Route>
    </Routes>
  );
}
