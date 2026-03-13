import { useEffect, useState, useMemo } from "react";
import api from "../api";
import "./Dashboard.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function Dashboard() {
  const [allInquiries, setAllInquiries] = useState([]);
  const [projectBookings, setProjectBookings] = useState([]);
  const [projects, setProjects] = useState([]);

  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState("today");


  const currencyOptions = {
   plugins: {
    tooltip: {
      callbacks: {
        label: function(context) {
          return formatIndianCurrency(context.raw);
        }
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: function(value) {
          return formatIndianCurrency(value);
        }
      }
    }
  }
};

 const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true
    },
    datalabels: {
      anchor: "end",   // attach to top of bar
      align: "top",    // show above bar
      color: "",
      font: {
        weight: "bold",
        size: 0
      },
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,           // show 1,2,3,4
        callback: function(value) {
          return Number.isInteger(value) ? value : null;
        }
      }
    }
  }
};

  /* ================= FETCH DATA ================= */

  const fetchDashboardData = async () => {
    try {
      const [projectRes, inquiryRes, bookingRes, projectListRes] =
        await Promise.all([
          api.get("/lily/count"),
          api.get("/contact"),
          api.get("/bookings"),
          api.get("/lily"),
        ]);

      setTotalProjects(projectRes?.data?.totalProjects || 0);

      setAllInquiries(inquiryRes?.data || []);

      setProjectBookings(bookingRes?.data?.data || []);

      setProjects(Array.isArray(projectListRes?.data) ? projectListRes.data : []);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* ================= FILTER ================= */

  const getFilteredData = (data, field) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (filterType === "today") {
      return data.filter(
        (i) => new Date(i[field]).toISOString().split("T")[0] === todayStr
      );
    }

    if (filterType === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];

      return data.filter(
        (i) => new Date(i[field]).toISOString().split("T")[0] === yStr
      );
    }

    if (filterType === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      return data.filter((i) => new Date(i[field]) >= weekAgo);
    }


        if (filterType === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      return data.filter((i) => new Date(i[field]) >= monthAgo);
    }

    return data;
  };

  const filteredBookings = useMemo(() => {
    return getFilteredData(projectBookings, "bookingDate");
  }, [projectBookings, filterType]);

  const filteredInquiries = useMemo(() => {
    return getFilteredData(allInquiries, "createdAt");
  }, [allInquiries, filterType]);

  /* ================= TOTALS ================= */

  const totalBookings = filteredBookings.length;
  const totalInquiries = filteredInquiries.length;

  const totalBookingAmount = useMemo(() => {
    return filteredBookings.reduce(
      (sum, b) => sum + Number(b.totalAmount || 0),
      0
    );
  }, [filteredBookings]);

  /* ================= CITY COUNT ================= */

  const cityCount = useMemo(() => {
    return filteredInquiries.reduce((acc, item) => {
      const city = item.location || "Unknown";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
  }, [filteredInquiries]);

  /* ================= PROJECT BOOKING COUNT ================= */

  const projectBookingCount = useMemo(() => {
    const map = {};

    filteredBookings.forEach((booking) => {
      const id = booking.projectId;
      map[id] = (map[id] || 0) + 1;
    });

    return map;
  }, [filteredBookings]);

 const projectMap = useMemo(() => {
  const map = {};

  projects.forEach((p) => {
    map[p._id || p.id] = p.projectName;
  });

  return map;
}, [projects]);

  /* ================= MONTHLY REVENUE ================= */

  const monthlyRevenue = useMemo(() => {
    const months = {};

    projectBookings.forEach((b) => {
      const d = new Date(b.bookingDate);

      const month =
        d.toLocaleString("default", { month: "short" }) +
        " " +
        d.getFullYear();

      months[month] = (months[month] || 0) + Number(b.totalAmount || 0);
    });

    return months;
  }, [projectBookings]);

  /* ================= CHART DATA ================= */

  const cityChartData = {
    labels: Object.keys(cityCount),
    datasets: [
      {
        label: "Inquiries per City",
        data: Object.values(cityCount),
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
      },
    ],
  };

  const projectChartData = {
    labels: Object.keys(projectBookingCount).map(
      (id) => projectMap[id] || `Project ${id}`
    ),
    datasets: [
      {
        label: "Bookings",
        data: Object.values(projectBookingCount),
        backgroundColor: "#16a34a",
      },
    ],
  };

  const revenueChartData = {
    labels: Object.keys(monthlyRevenue),
    datasets: [
      {
        label: "Monthly Revenue",
        data: Object.values(monthlyRevenue),
        backgroundColor: "#f59e0b",
      },
    ],
  };

  /* ================= EXPORT EXCEL ================= */

  const exportExcel = () => {
    const data = filteredBookings.map((b) => ({
      Project: projectMap[b.projectId],
      Amount: b.totalAmount,
      Date: b.bookingDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([buffer], {
      type: "application/octet-stream",
    });

    saveAs(file, "booking-report.xlsx");
  };

  /* ================= PROJECT SALES ================= */

const projectSales = useMemo(() => {
  const map = {};

  filteredBookings.forEach((booking) => {
    const id = booking.projectId;
    const amount = Number(booking.totalAmount || 0);

    map[id] = (map[id] || 0) + amount;
  });

  return map;
}, [filteredBookings]);

/* ================= PROJECT SALES CHART ================= */

const projectSalesChartData = {
  labels: Object.keys(projectSales).map(
    (id) => projectMap[id] || `Project ${id}`
  ),
  datasets: [
    {
      label: "Project Sales (₹)",
      data: Object.values(projectSales),
      backgroundColor: "#9333ea",
    },
  ],
};

function formatIndianCurrency(num) {

  num  = Math.round(num); // Round to nearest integer
  if (num >= 10000000) {
    return "₹ " + (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) {
    return "₹ " + (num / 100000).toFixed(2) + " L";
  } else if (num >= 1000) {
    return "₹ " + (num / 1000).toFixed(2) + " K";
  } else {
    return "₹ " + num;
  }
}

  /* ================= UI ================= */

  return (
    <div className="dashboard">
      <h1>Welcome to Dream D'wello</h1>

      {/* QUICK FILTERS */}

      <div className="quick-filters">
        <button
          className={filterType === "today" ? "active" : ""}
          onClick={() => setFilterType("today")}
        >
          Today
        </button>

        <button
          className={filterType === "yesterday" ? "active" : ""}
          onClick={() => setFilterType("yesterday")}
        >
          Yesterday
        </button>

        <button
          className={filterType === "week" ? "active" : ""}
          onClick={() => setFilterType("week")}
        >
          This Week
        </button>

                <button
          className={filterType === "month" ? "active" : ""}
          onClick={() => setFilterType("month")}
        >
          This Month
        </button>
      </div>

      {/* STATS */}
<div className="dashboard-row">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p className="stat-number">{totalBookings}</p>
        </div>

        <div className="stat-card">
          <h3>Total Booking Amount</h3>
          <p className="stat-number"> ₹{new Intl.NumberFormat("en-IN").format(totalBookingAmount)}</p>
        </div>

        <div className="stat-card">
          <h3>Total Inquiries</h3>
          <p className="stat-number">{totalInquiries}</p>
        </div>
      </div>

      <div className="small-chart-box">
          <h3>City Inquiry Chart</h3>
          <div className="chart-wrapper">
            <Line data={cityChartData} options={chartOptions} />
          </div>
        </div>

        <div className="small-chart-box">
          <h3>Project Booking Chart</h3>
          <div className="chart-wrapper">
            <Bar data={projectChartData}  options={chartOptions }/>
          </div>
        </div>
</div>
      

      {/* CHARTS */}
       <div className="dashboard-row"> 

          {/* INQUIRIES */}

      <div className="notification-box">
        <h2>Recent Inquiries</h2>

        <div className="notification-list">
          {filteredInquiries.map((item) => (
            <div key={item._id} className="notification-item">
              <div>
                <strong>{item.firstName}</strong>
                <div className="location">{item.location}</div>
              </div>

              <div className="date">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
<div className="small-chart-box">
  <h3>Project Wise Sales</h3>
  <div className="chart-wrapper">
    <Bar data={projectSalesChartData} options={{ ...chartOptions, ...currencyOptions}}/>
  </div>
</div>
      </div>
    </div>
  );
}