// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/super/SuperAdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AgentDashboard from "./pages/agent/AgentDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";

export default function App() {
  return (
    <>
      <Routes>
        {/* Login page - without Navbar */}
        <Route path="/login" element={<Login />} />

        {/* All other pages - with Navbar */}
        <Route path="/" element={<><Navbar /><Dashboard /></>} />
        <Route path="/superadmin-dashboard" element={<><Navbar /><SuperAdminDashboard /></>} />
        <Route path="/admin-dashboard" element={<><Navbar /><AdminDashboard /></>} />
        <Route path="/agent-dashboard" element={<><Navbar /><AgentDashboard /></>} />
        <Route path="/client-dashboard" element={<><Navbar /><ClientDashboard /></>} />
      </Routes>
    </>
  );
}
