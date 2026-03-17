import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Booking.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Bookings() {

  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [projects, setProjects] = useState([]);
  const [houses, setHouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingMap, setPendingMap] = useState({});
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const [form, setForm] = useState({
    projectId: "",
    houseNumber: "",
    customerName: "",
    mobileNo: "",
    paymentType: "cash",
    totalSqFeet: "",
    pricePerSqFeet: "",
    totalAmount: "",
    advancePayment: "",
    pendingAmount: "",
    bookingDate: today,
  });

  useEffect(() => {
    loadProjects();
    loadBookings();
  }, []);

  useEffect(() => {
    const handleFocus = () => loadBookings();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const loadProjects = async () => {
    const res = await api.get("/lily");
    setProjects(res.data.data);
  };

  const loadBookings = async () => {

    const res = await api.get("/bookings");
    let bookingList = res.data.data;

    bookingList = bookingList.sort((a, b) => a.bookingId - b.bookingId);

    setBookings(bookingList);

    const newPendingMap = {};

    for (let b of bookingList) {
      try {

        const historyRes = await api.get(
          `/payment-history?bookingId=${b._id}`
        );

        const payments = historyRes.data.data?.payments || [];

        const totalPaid = payments.reduce(
          (sum, p) => sum + Number(p.amountReceived),
          0
        );

        const realPending =
          Number(b.totalAmount) - totalPaid;

        newPendingMap[b._id] =
          realPending <= 0 ? 0 : realPending;

      } catch {
        newPendingMap[b._id] = b.totalAmount;
      }
    }

    setPendingMap(newPendingMap);
  };

  const projectMap = {};
  projects.forEach((p) => (projectMap[p.id] = p.projectName));

  const handleProjectChange = async (pid) => {

    setForm({
      projectId: pid,
      houseNumber: "",
      customerName: "",
      mobileNo: "",
      paymentType: "cash",
      totalSqFeet: "",
      pricePerSqFeet: "",
      totalAmount: "",
      advancePayment: "",
      pendingAmount: "",
      bookingDate: today,
    });

    try {

      const res = await api.get(`/lily/houses/${pid}`);

      setHouses(
        res.data.data.filter((h) => h.status === "available")
      );

    } catch {

      setHouses([]);

    }
  };

  const handleHouseChange = (houseNo) => {

    const house = houses.find(
      (h) => h.houseNumber === houseNo
    );

    const totalSqFeet = house?.totalSqFeet || 0;
    const pricePerSqFeet = house?.pricePerSqFeet || 0;

    const totalAmount = totalSqFeet * pricePerSqFeet;

    setForm((prev) => ({
      ...prev,
      houseNumber: houseNo,
      totalSqFeet,
      pricePerSqFeet,
      totalAmount,
      pendingAmount:
        totalAmount - Number(prev.advancePayment || 0),
    }));
  };

  const formatINR = (v) =>
    new Intl.NumberFormat("en-IN").format(v || 0);

  const submitBooking = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      await api.post("/bookings/create", {
        projectId: Number(form.projectId),
        houseNumber: form.houseNumber,
        customerName: form.customerName,
        mobileNo: form.mobileNo,
        paymentType: form.paymentType,
        totalSqFeet: Number(form.totalSqFeet),
        pricePerSqFeet: Number(form.pricePerSqFeet),
        advancePayment: Number(form.advancePayment || 0),
      });

      alert("Booking Created Successfully");

      setForm({
        projectId: "",
        houseNumber: "",
        customerName: "",
        mobileNo: "",
        paymentType: "cash",
        totalSqFeet: "",
        pricePerSqFeet: "",
        totalAmount: "",
        advancePayment: "",
        pendingAmount: "",
        bookingDate: today,
      });

      setShowForm(false);

      await loadBookings();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (err) {

      alert(
        err.response?.data?.message ||
          "Something went wrong"
      );

    }

    setLoading(false);
  };

  const filteredBookings = bookings.filter((b) => {

    const matchesSearch = b.customerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesProject = selectedProjectFilter
      ? String(b.projectId) ===
        String(selectedProjectFilter)
      : true;

    const bookingDate = new Date(b.bookingDate)
      .toISOString()
      .split("T")[0];

    const matchesFromDate = fromDate
      ? bookingDate >= fromDate
      : true;

    const matchesToDate = toDate
      ? bookingDate <= toDate
      : true;

    return (
      matchesSearch &&
      matchesProject &&
      matchesFromDate &&
      matchesToDate
    );
  });

  /* PAGINATION LOGIC */

  const totalPages = Math.ceil(
    filteredBookings.length / recordsPerPage
  );

  const indexOfLastRecord =
    currentPage * recordsPerPage;

  const indexOfFirstRecord =
    indexOfLastRecord - recordsPerPage;

  const currentBookings = filteredBookings.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const nextPage = () => {

    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }

  };

  const prevPage = () => {

    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }

  };

  const clearFilters = () => {

    setSearchTerm("");
    setSelectedProjectFilter("");
    setFromDate("");
    setToDate("");

    setCurrentPage(1);
  };

  const exportToExcel = () => {

  const exportData = filteredBookings.map((b) => ({
    ID: b.bookingId,
    Project: projectMap[b.projectId],
    House: b.houseNumber,
    Customer: b.customerName,
    Mobile: b.mobileNo,
    Payment: b.paymentType,
    TotalAmount: b.totalAmount,
    Advance: b.advancePayment,
    Pending: pendingMap[b._id] || b.totalAmount,
    BookingDate: new Date(b.bookingDate).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const data = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(data, "Bookings_Filtered.xlsx");
};

  return (
    <div className="booking-container">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >

        <h2 className="page-title">Booking List</h2>

        <button
          className="add-booking-btn"
          onClick={() => setShowForm(true)}
        >
          + Add Booking
        </button>

      </div>

      {/* FILTER SECTION */}

      <div className="filter-section">

        <select
          value={selectedProjectFilter}
          onChange={(e) => {
            setSelectedProjectFilter(e.target.value);
            setCurrentPage(1);
          }}
        >

          <option value="">All Projects</option>

          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectName}
            </option>
          ))}

        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setCurrentPage(1);
          }}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setCurrentPage(1);
          }}
        />

        <input
          type="text"
          placeholder="Search Customer..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />

        <button
          onClick={clearFilters}
          className="clear-filter-btn"
        >
          Clear Filters
        </button>
        <button
  onClick={exportToExcel}
  className="export-btn"
>
  Export Excel
</button>

      </div>

      {showForm && (
  <div className="modal-overlay" onClick={() => setShowForm(false)}>
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="close-btn"
        onClick={() => setShowForm(false)}
      >
        ✖
      </button>

      <h2 className="page-title">Create Booking</h2>

      <form onSubmit={submitBooking} className="booking-form">

        <label>Booking Date</label>
        <input
          type="date"
          value={form.bookingDate}
          max={today}
          required
          onChange={(e) =>
            setForm({ ...form, bookingDate: e.target.value })
          }
        />

        <label>Select Project</label>
        <select
          required
          value={form.projectId}
          onChange={(e) => handleProjectChange(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectName}
            </option>
          ))}
        </select>

        <label>Select House</label>
        <select
          required
          value={form.houseNumber}
          onChange={(e) => handleHouseChange(e.target.value)}
        >
          <option value="">Select House</option>
          {houses.map((h) => (
            <option key={h.houseNumber} value={h.houseNumber}>
              {h.houseNumber}
            </option>
          ))}
        </select>

        <label>Customer Name</label>
        <input
          required
          value={form.customerName}
          onChange={(e) =>
            setForm({ ...form, customerName: e.target.value })
          }
        />

        <label>Mobile No</label>
        <input
          required
          maxLength={10}
          value={form.mobileNo}
          onChange={(e) =>
            setForm({ ...form, mobileNo: e.target.value })
          }
        />

        <label>Total Sq.Ft</label>
        <input
          type="text"
          value={form.totalSqFeet}
          onChange={(e) => {
            const sqFt = Number(e.target.value || 0);
            const price = Number(form.pricePerSqFeet || 0);
            const total = sqFt * price;

            setForm((prev) => ({
              ...prev,
              totalSqFeet: sqFt,
              totalAmount: total,
              pendingAmount: total - Number(prev.advancePayment || 0),
            }));
          }}
        />

        <label>Price per Sq.Ft</label>
        <input
          type="text"
          value={form.pricePerSqFeet}
          onChange={(e) => {
            const price = Number(e.target.value || 0);
            const sqFt = Number(form.totalSqFeet || 0);
            const total = sqFt * price;

            setForm((prev) => ({
              ...prev,
              pricePerSqFeet: price,
              totalAmount: total,
              pendingAmount: total - Number(prev.advancePayment || 0),
            }));
          }}
        />

        <label>Total Amount</label>
        <input readOnly value={formatINR(form.totalAmount)} />

        <label>Booking Amount</label>
        <input
          type="text"
          value={form.advancePayment}
          onChange={(e) => {
            const adv = Number(e.target.value || 0);
            setForm((prev) => ({
              ...prev,
              advancePayment: adv,
              pendingAmount: Number(prev.totalAmount || 0) - adv,
            }));
          }}
        />

        <label>Pending Amount</label>
        <input readOnly value={formatINR(form.pendingAmount)} />

        <button disabled={loading}>
          {loading ? "Booking..." : "Book House"}
        </button>
      </form>
    </div>
  </div>
)}


      {/* TABLE */}

      <table>

        <thead>

          <tr>

            <th>ID</th>
            <th>Project</th>
            <th>House</th>
            <th>Customer</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Advance</th>
            <th>Pending</th>
            <th>Date</th>
            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {currentBookings.map((b) => (

            <tr key={b._id}>

              <td>{b.bookingId}</td>
              <td>{projectMap[b.projectId]}</td>
              <td>{b.houseNumber}</td>
              <td>{b.customerName}</td>
              <td>{b.paymentType.toUpperCase()}</td>

              <td>₹{formatINR(b.totalAmount)}</td>

              <td>₹{formatINR(b.advancePayment)}</td>

              <td>

                {pendingMap[b._id] <= 0 ? (

                  <strong style={{ color: "green" }}>
                    SOLD
                  </strong>

                ) : (

                  `₹${formatINR(
                    pendingMap[b._id] || b.totalAmount
                  )}`

                )}

              </td>

              <td>
                {new Date(
                  b.bookingDate
                ).toLocaleDateString()}
              </td>

              <td>

                <button
                  className="history-btn"
                  onClick={() =>
                    navigate(`/booking-history/${b._id}`)
                  }
                >
                  Payment History
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {/* PAGINATION */}

      <div className="pagination">

        <button
          onClick={prevPage}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        <span>
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>

      </div>

    </div>
  );
}