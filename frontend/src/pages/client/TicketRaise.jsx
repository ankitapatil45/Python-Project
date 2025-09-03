import React, { useState } from "react";
import axios from "axios";
import "./TicketRaise.css";
 
export default function TicketRaise() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
 
  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
 
    try {
      const token = localStorage.getItem("access_token");
 
      // 1. Create Ticket
      const ticketRes = await axios.post(
        "http://127.0.0.1:5000/customer_raise/tickets",
        {
          title,
          description,
          priority,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
 
      const ticketId = ticketRes.data.ticket.id;
 
      // 2. Upload Attachments (if any)
      if (files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
 
        await axios.post(
          `http://127.0.0.1:5000/tickets/${ticketId}/attachments`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }
 
      setMessage("✅ Ticket created successfully!");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setFiles([]);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to create ticket. Check console.");
    }
  };
 
  return (
    <div className="ticket-container">
      <h2>🎫 Raise a New Ticket</h2>
      <form onSubmit={handleSubmit} className="ticket-form">
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
 
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
 
        <label>Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
 
        <label>Attachments</label>
        <input type="file" multiple onChange={handleFileChange} />
 
        <button type="submit">Submit Ticket</button>
      </form>
 
      {message && <p className="ticket-message">{message}</p>}
    </div>
  );
}
 