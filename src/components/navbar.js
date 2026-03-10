import { useState } from "react";
import "./navbar.css";
import { FaUserCircle } from "react-icons/fa";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const admin = {
    name: "Dream D'wello Builders Ltd.",
    mobile: "+91 9876543210",
    email: "admin@gmail.com",
  };

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout"); // backend logout

      localStorage.removeItem("adminToken");

      navigate("/");

    } catch (err) {
      console.error("Logout failed");
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-title">Dream D'Wello</div>

      <div className="admin-section">
        <div className="admin-logo" onClick={() => setOpen(!open)}>
          <FaUserCircle size={32} />
        </div>

        {open && (
          <div className="admin-dropdown">
            <p><strong>{admin.name}</strong></p>
            <p>Mobile:{admin.mobile}</p>
            <p>Email: {admin.email}</p>
            <hr />
            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}