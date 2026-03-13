import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/sidebar";
import Navbar from "./components/navbar";

import Dashboard from "./Pages/Dashboard";
import Projects from "./Pages/Projects";
import Houses from "./Pages/Booking";          // Bookings page
import AdminLogin from "./Pages/Login";
import BookingHistory from "./Pages/BookingHistory";
import ProjectForm from "./Pages/ProjectForm";
import Inquiry from "./Pages/Inquiry";
import PrivateRoute from "./components/PrivateRoute";
import Inventory from "./Pages/Inventory";
import InventoryView from "./Pages/InventoryView";



import "./styles.css";

function Layout() {
  const location = useLocation();

  /* ================= LOGIN PAGE ================= */
  const isLoginPage = location.pathname === "/";

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/" element={<AdminLogin />} />
      </Routes>
    );
  }

  /* ================= MAIN LAYOUT ================= */
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />

        <Routes>
          <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
          <Route path="/projects" element={<Projects />} />
          <Route path="/bookings" element={<Houses />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/edit/:id" element={<ProjectForm />} />
          <Route path="/inquiry" element={<Inquiry />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/:projectId" element={<InventoryView />} />

          {/* ✅ BOOKING HISTORY ROUTE */}
       <Route
            path="/booking-history/:bookingId"
            element={<BookingHistory />}
          />
      </Routes>
      </div>
    </div>
  );
}

/* ================= APP ROOT ================= */
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
