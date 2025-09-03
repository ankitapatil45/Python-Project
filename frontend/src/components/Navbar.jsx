import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";

const BASE_URL = "http://127.0.0.1:5000"; // Flask backend

export default function Navbar() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("access_token"));

  // keep token state in sync with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("access_token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (token) {
        await axios.post(
          `${BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("access_token");
      setToken(null);
      navigate("/");
    }
  };

  return (
    <nav className="navbar">
      <h2 className="logo">Helper App</h2>
      <ul className="nav-links">
        <li>
          <Link to="/" className="home-btn">
            Home
          </Link>
        </li>
        {!token ? (
          <li>
            <Link to="/login" className="login-btn">
              Login
            </Link>
          </li>
        ) : (
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
