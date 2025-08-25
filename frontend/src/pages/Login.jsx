import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      console.log("Login Response:", res.data); // 🔎 Debug

      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("role", res.data.role);

      // Normalize role to lowercase
      const role = res.data.role.toLowerCase();

if (role === "superadmin" || role === "super_admin") {
  navigate("/superadmin-dashboard");
} else if (role === "admin") {
  navigate("/admin-dashboard");
} else if (role === "agent") {
  navigate("/agent-dashboard");
} else if (role === "customer") {
  navigate("/customer-dashboard");
} else {
  navigate("/");
}

    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
