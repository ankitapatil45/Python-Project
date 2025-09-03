import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="logo">Helper App</h2>
      <ul className="nav-links">
        <li>
          <Link to="/" className="home-btn">Home</Link>
        </li>
        <li>
          <Link to="/login" className="login-btn">Login</Link>
        </li>
      </ul>
    </nav>
  );
}
