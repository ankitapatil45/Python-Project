import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ChatPage.css";
 
const BASE_URL = "http://127.0.0.1:5000";
 
export default function ChatPage() {
  const { ticketId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, url: "" });
  const messagesEndRef = useRef(null);
 
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const currentUserName = localStorage.getItem("name") || "Me";
 
  // Fetch ticket chat
  const fetchChat = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/${ticketId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Fetch chat error:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    if (!ticketId) return;
    fetchChat();
  }, [ticketId]);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);
 
  // Send new message
  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    const formData = new FormData();
    formData.append("text", newMessage);
    if (file) formData.append("files", file);
 
    try {
      await axios.post(`${BASE_URL}/${ticketId}/messages`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setNewMessage("");
      setFile(null);
      await fetchChat();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Send message error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to send message");
    }
  };
 
  // Ticket action handlers
  const handleResolve = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/tickets/${data.ticket.id}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      fetchChat();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to resolve ticket");
    }
  };
 
  const handleConfirm = async (rating) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/tickets/${data.ticket.id}/confirm`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      fetchChat();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to confirm ticket");
    }
  };
 
  const handleReopen = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/tickets/${data.ticket.id}/reopen`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      fetchChat();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to reopen ticket");
    }
  };
 
  if (loading) return <p className="loading">Loading chat...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>No data found.</p>;
 
  const { ticket, messages } = data;
 
  const chatDisabled =
    ticket.status === "resolved" || ticket.status === "closed";
 
  return (
    <div className="chat-page">
      {/* Ticket Info */}
      <div className="ticket-info">
        <h2>{ticket.title}</h2>
        <p>{ticket.description}</p>
        <p>
          <b>Status:</b> {ticket.status} | <b>Priority:</b> {ticket.priority}
        </p>
 
        {/* Ticket Attachments Grid */}
        {ticket.attachments.length > 0 && (
          <div className="attachments-grid">
            {ticket.attachments
              .filter((att) => att.content_type.startsWith("image/"))
              .map((att) => (
                <img
                  key={att.id}
                  src={att.url}
                  alt={att.filename}
                  className="grid-image"
                  onClick={() => setLightbox({ open: true, url: att.url })}
                />
              ))}
          </div>
        )}
 
        {/* Ticket Actions */}
        <div className="ticket-actions">
          {role === "agent" && ticket.status === "in_progress" && (
            <button onClick={handleResolve} className="btn btn-resolve">
              Resolve Ticket
            </button>
          )}
          {role === "customer" && ticket.status === "resolved" && (
            <div className="confirm-section">
              <p>Rate this ticket:</p>
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => handleConfirm(r)}
                  className="btn btn-confirm"
                >
                  {r} ⭐
                </button>
              ))}
            </div>
          )}
          {role === "customer" && ticket.status === "closed" && (
            <button onClick={handleReopen} className="btn btn-reopen">
              Reopen Ticket
            </button>
          )}
        </div>
      </div>
 
      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${
              msg.user === currentUserName ? "sent" : "received"
            }`}
          >
            <div className="message-user">{msg.user}</div>
            {msg.body && <div className="message-text">{msg.body}</div>}
 
            {/* Message Attachments Grid */}
            {msg.attachments &&
              msg.attachments.filter((a) => a.content_type.startsWith("image/"))
                .length > 0 && (
                <div className="attachments-grid">
                  {msg.attachments
                    .filter((a) => a.content_type.startsWith("image/"))
                    .map((a) => (
                      <img
                        key={a.id}
                        src={a.url}
                        alt={a.filename}
                        className="grid-image"
                        onClick={() =>
                          setLightbox({ open: true, url: a.url })
                        }
                      />
                    ))}
                </div>
              )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
 
      {/* Send New Message */}
      <div className="chat-input">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            chatDisabled
              ? "Chat disabled, ticket resolved or closed"
              : "Type your message..."
          }
          disabled={chatDisabled}
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={chatDisabled}
        />
        <button onClick={handleSend} disabled={chatDisabled}>
          Send
        </button>
      </div>
 
      {/* Info if disabled */}
      {chatDisabled && (
        <p className="chat-disabled-note">
          Chat is disabled because this ticket has been {ticket.status}.
        </p>
      )}
 
      {/* Lightbox */}
      {lightbox.open && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightbox({ open: false, url: "" })}
        >
          <img className="lightbox-image" src={lightbox.url} alt="Preview" />
        </div>
      )}
    </div>
  );
}