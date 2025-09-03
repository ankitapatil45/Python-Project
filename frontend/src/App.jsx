import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Layouts
import ClientLayout from "./pages/client/ClientLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/super/SuperAdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AgentDashboard from "./pages/agent/AgentDashboard";
import ClientDashboard from "./pages/client/ClientDashboard"; // ✅ yahi import karo

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Dashboard />
          </>
        }
      />

      {/* Super Admin */}
      <Route
        path="/superadmin-dashboard"
        element={
          <>
            <Navbar />
            <SuperAdminDashboard />
          </>
        }
      />

      {/* Admin */}
      <Route
        path="/admin-dashboard"
        element={
          <>
            <Navbar />
            <AdminDashboard />
          </>
        }
      />

      {/* Agent */}
      <Route
        path="/agent-dashboard/*"
        element={
          <>
            <Navbar />
            <AgentDashboard />
          </>
        }
      />

      {/* Client*/}
      <Route
        path="/customer-dashboard/*"
        element={
          <>
            <Navbar />
            <ClientDashboard />
          </>
        }
      />
    </Routes>
  );
}
