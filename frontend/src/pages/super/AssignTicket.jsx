// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./AssignTicket.css";

// const BASE_URL = "http://127.0.0.1:5000"; // use the same URL that works in AllTickets

// export default function AssignTicket() {
//   const [tickets, setTickets] = useState([]);
//   const [agents, setAgents] = useState([]);
//   const [departments, setDepartments] = useState([]);

//   const [selectedTicket, setSelectedTicket] = useState("");
//   const [selectedAgent, setSelectedAgent] = useState("");
//   const [selectedDepartment, setSelectedDepartment] = useState("");

//   // Fetch tickets, agents, departments
//   const fetchData = async () => {
//     try {
//       const token = localStorage.getItem("access_token");
//       if (!token) throw new Error("No access token found");

//       // Fetch tickets from normal /tickets route (like AllTickets.jsx)
//       const ticketsRes = await axios.get(`${BASE_URL}/tickets`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const [agentsRes, deptRes] = await Promise.all([
//         axios.get(`${BASE_URL}/superadmin/agents`, {
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//         axios.get(`${BASE_URL}/superadmin/departments`, {
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//       ]);

//       // Only unassigned tickets
//       const unassignedTickets = ticketsRes.data.tickets.filter(
//         (t) => !t.assigned_to
//       );

//       setTickets(unassignedTickets);
//       setAgents(agentsRes.data.agents);
//       setDepartments(deptRes.data.departments);
//     } catch (err) {
//       console.error("Error fetching data:", err);
//       alert("Failed to fetch tickets, agents, or departments");
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const assignTicket = async () => {
//     if (!selectedTicket || !selectedDepartment) {
//       alert("Please select ticket and department");
//       return;
//     }

//     try {
//       const token = localStorage.getItem("access_token");

//       await axios.put(
//         `${BASE_URL}/superadmin/tickets/${selectedTicket}/assign`,
//         {
//           agent_id: selectedAgent || null,
//           department_id: selectedDepartment,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       alert("Ticket assigned successfully!");
//       setSelectedTicket("");
//       setSelectedAgent("");
//       setSelectedDepartment("");

//       fetchData(); // refresh
//     } catch (err) {
//       console.error("Error assigning ticket:", err);
//       alert(err.response?.data?.error || "Failed to assign ticket");
//     }
//   };

//   return (
//     <div className="assign-ticket">
//       <h3>Assign Ticket</h3>

//       <div className="assign-controls">
//         {/* Ticket Dropdown */}
//         <select
//           value={selectedTicket}
//           onChange={(e) => setSelectedTicket(e.target.value)}
//         >
//           <option value="">Select Ticket</option>
//           {tickets.map((t) => (
//             <option key={t.id} value={t.id}>
//               {t.id} - {t.title}
//             </option>
//           ))}
//         </select>

//         {/* Agent Dropdown */}
//         <select
//           value={selectedAgent}
//           onChange={(e) => setSelectedAgent(e.target.value)}
//         >
//           <option value="">Select Agent (Optional)</option>
//           {agents.map((a) => (
//             <option key={a.id} value={a.id}>
//               {a.name} ({a.department})
//             </option>
//           ))}
//         </select>

//         {/* Department Dropdown */}
//         <select
//           value={selectedDepartment}
//           onChange={(e) => setSelectedDepartment(e.target.value)}
//         >
//           <option value="">Select Department</option>
//           {departments.map((d) => (
//             <option key={d.id} value={d.id}>
//               {d.name}
//             </option>
//           ))}
//         </select>

//         <button
//           onClick={assignTicket}
//           disabled={!selectedTicket || !selectedDepartment}
//         >
//           Assign
//         </button>
//       </div>
//     </div>
//   );
// }
