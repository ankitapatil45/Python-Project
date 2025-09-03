// 1st version of AddAgent.jsx fullRunning code with backend integration and css

import React, { useState } from "react";
import axios from "axios";
import "./AddAgent.css";

const AddAgent = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Retrieve token from localStorage (make sure this matches your login setItem)
    const token = localStorage.getItem("access_token"); // or "token" based on your auth logic

    if (!token) {
      setError("You are not logged in!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/admin/create-agent",
        {
          name,
          email,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(response.data.message);
      setError("");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to create agent. Please try again.");
      }
    }
  };

  return (
    <div className="add-agent-container">
      <h2>Create Agent</h2>
      <form className="add-agent-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn-submit" type="submit">
          Create Agent
        </button>
      </form>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default AddAgent;
