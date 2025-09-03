// import React, { useState } from "react";
// import "./ProfileSettings.css";

// const ProfileSettings = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [message, setMessage] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (password !== confirmPassword) {
//       setMessage("Passwords do not match!");
//       return;
//     }

//     // Here you would call your backend API (e.g., /api/superadmin/update_profile)
//     console.log("Profile Updated:", { email, password });

//     setMessage("Profile updated successfully!");
//     setEmail("");
//     setPassword("");
//     setConfirmPassword("");
//   };

//   return (
//     <div className="profile-settings">
//       <h2>Profile Settings</h2>
//       <form onSubmit={handleSubmit} className="profile-form">
//         <div className="form-group">
//           {/* <label>New Email</label> */}
//           <input
//             type="email"
//             placeholder="Enter new email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//         </div>

//         <div className="form-group">
//           {/* <label>New Password</label> */}
//           <input
//             type="password"
//             placeholder="Enter new password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>

//         <div className="form-group">
//           {/* <label>Confirm Password</label> */}
//           <input
//             type="password"
//             placeholder="Confirm new password"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//           />
//         </div>

//         {message && <p className="message">{message}</p>}

//         <button type="submit" className="save-btn">
//           Save Changes
//         </button>
//       </form>
//     </div>
//   );
// };

// export default ProfileSettings;
