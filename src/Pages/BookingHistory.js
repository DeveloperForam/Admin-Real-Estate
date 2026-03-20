import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "./BookingHistory.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function BookingHistory() {
  const { bookingId } = useParams();

  const [history, setHistory] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];


  const [form, setForm] = useState({
    amountReceived: "",
    paymentMethod: "cash",
    paymentReceivedDate: today,
    paymentDetails: {},
  });

  useEffect(() => {
    if (bookingId) {
      loadBooking();
      loadHistory();
    }
  }, [bookingId]);

  // Load main booking info
  const loadBooking = async () => {
    const res = await api.get(`/payment-history/${bookingId}`);
    setBooking(res.data.data);
  };

  // Load all payment history
  const loadHistory = async () => {
    const res = await api.get(`/payment-history?bookingId=${bookingId}`);
    setHistory(res.data.data?.payments || []);
  };

  // Calculate current pending amount
  const getCurrentPending = () => {
  if (!booking) return 0;

  //Advance already exists inside history array
  const totalPaid = history.reduce(
    (sum, h) => sum + Number(h.amountReceived),
    0
  );

  const pending = booking.totalAmount - totalPaid;

  return pending < 0 ? 0 : pending;
};

  const currentPending = getCurrentPending();

  // Add a new payment
  const addPayment = async (e) => {
    e.preventDefault();

    if (Number(form.amountReceived) > currentPending)
      return alert("Amount exceeds pending");

    setLoading(true);

    try {
      await api.post("/payment-history/add-payment", {
        bookingId,
        amountReceived: Number(form.amountReceived.replace(/,/g, "")),
        paymentMethod: form.paymentMethod,
        paymentDetails: form.paymentDetails,
        paymentReceivedDate: form.paymentReceivedDate,
      });

      // Reset form
      setForm({
        amountReceived: "",
        paymentMethod: "cash",
        paymentReceivedDate: today,
        paymentDetails: {},
      });

      // Reload data
      await loadHistory();
      await loadBooking();
    } finally {
      setLoading(false);
    }
  };

  // Format number as INR
  const formatINR = (v) => new Intl.NumberFormat("en-IN").format(v || 0);

 const exportInvoicePDF = () => {
  if (!booking) return;

  const doc = new jsPDF();
  const pending = getCurrentPending();

  const projectName = booking.projectName || "-";

  // ===== HEADER =====
  doc.setFillColor(0, 102, 204);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("DREAM D'WELLO", 14, 18);

  doc.setFontSize(10);
  doc.text("Surat, Gujarat | +91 9876543210", 14, 25);

  doc.setTextColor(0, 0, 0);

  // ===== INVOICE INFO =====
  const todayDate = new Date().toLocaleDateString();

  doc.setFontSize(11);
  doc.text(`Invoice Date: ${todayDate}`, 140, 40);
  doc.text(`Invoice No: INV-${booking.houseNumber}`, 140, 46);

  // ===== BOOKING DETAILS BOX =====
  doc.setDrawColor(180);
  doc.rect(14, 50, 182, 45); // increased height

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Booking Details", 16, 58);

  doc.setFont(undefined, "normal");
  doc.setFontSize(11);

  doc.text(`Project Name: ${projectName}`, 16, 66);
  doc.text(`House Number: ${booking.houseNumber}`, 16, 72);
  doc.text(`Total Amount: Rs. ${formatINR(booking.totalAmount)}`, 16, 78);
  doc.text(`Advance Paid: Rs. ${formatINR(booking.advancePayment)}`, 16, 84);

  // ===== PAYMENT TABLE =====
  const tableData = history.map((h) => [
    new Date(h.paymentReceivedDate).toLocaleDateString(),
    h.paymentMethod.toUpperCase(),
    "Rs. " + formatINR(h.amountReceived),
  ]);


  autoTable(doc, {
    startY: 100,
    head: [["Date", "Method", "Amount"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
      halign: "center",
    },
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  // ===== TOTAL =====
  const totalPaid = history.reduce(
    (sum, p) => sum + Number(p.amountReceived),
    0
  );

  const finalY = doc.lastAutoTable.finalY + 10;

  // ===== SUMMARY BOX =====
  doc.setDrawColor(180);
  doc.rect(120, finalY, 76, 32);

  doc.setFontSize(11);
  doc.text(`Total Paid: Rs. ${formatINR(totalPaid)}`, 125, finalY + 10);

  doc.text(
    `Pending: ${
      pending <= 0 ? "SOLD" : "Rs. " + formatINR(pending)
    }`,
    125,
    finalY + 18
  );

  // ===== STATUS =====
  doc.setFontSize(14);

  if (pending <= 0) {
    doc.setTextColor(0, 150, 0);
    doc.text("PAID", 150, finalY + 28);
  } else {
    doc.setTextColor(200, 0, 0);
    doc.text("PENDING", 140, finalY + 28);
  }

  doc.setTextColor(0, 0, 0);

  // ===== SIGNATURE =====
  doc.line(140, finalY + 50, 195, finalY + 50);
  doc.setFontSize(10);
  doc.text("Authorized Signature", 140, finalY + 58);

  // ===== FOOTER =====
  doc.text("Thank you for your business!", 105, 285, {
    align: "center",
  });

  // SAVE
  doc.save(`Invoice_${booking.houseNumber}.pdf`);
};

  return (
    <div className="booking-container">
      <h2 className="page-title">Booking Payment History</h2>

      <button
  onClick={exportInvoicePDF}
  style={{
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "10px"
  }}
>
  Export Invoice
</button>
      {booking && (
        <div className="summary-box">
          <div><b>Project:</b> {booking.projectId || history.projectId || "-"}</div>
          <div><b>House:</b> {booking.houseNumber}</div>
          <div><b>Total Amount:</b> ₹{formatINR(booking.totalAmount)}</div>
          <div><b>Advance Amount:</b> ₹{formatINR(booking.advancePayment)}</div>

          <div>
            <b>Status:</b>{" "}
            {currentPending <= 0 ? (
              <span style={{ color: "green", fontWeight: "bold" }}>
                SOLD
              </span>
            ) : (
              <span style={{ color: "red", fontWeight: "bold" }}>
                ₹{formatINR(currentPending)} Pending
              </span>
            )}
          </div>
        </div>
      )}

      {currentPending > 0 && (
        <form onSubmit={addPayment} className="booking-form">
          <input
  required
  type="text"
  placeholder="Amount Received"
  value={form.amountReceived}
  onChange={(e) => {
    let value = e.target.value;

    // Remove everything except digits
    value = value.replace(/\D/g, "");

    // Prevent exceeding pending
  //  if (Number(value) > currentPending) return;

    // Format in Indian number system
    const formatted = new Intl.NumberFormat("en-IN").format(value);

    setForm({
      ...form,
      amountReceived: formatted,
    });
  }}
/>

         <select
  value={form.paymentMethod}
  onChange={(e) =>
    setForm({
      ...form,
      paymentMethod: e.target.value,
      paymentDetails: {} // reset details when changing method
    })
  }
>
  <option value="cash">Cash</option>
  {/* <option value="upi">UPI</option> */}
  <option value="bank">Bank</option>
  <option value="cheque">Cheque</option>
  <option value="card">Card</option>
</select>

{/*Dynamic Payment Fields */}

{form.paymentMethod === "bank" && (
  <>
    <input
      required
      placeholder="Bank Name"
      value={form.paymentDetails.bankName || ""}
      onChange={(e) =>
        setForm({
          ...form,
          paymentDetails: {
            ...form.paymentDetails,
            bankName: e.target.value,
          },
        })
      }
    />

    <input
      required
      type="text"
      maxLength={12}
      placeholder="Account Number (12 digits)"
      value={form.paymentDetails.accountNumber || ""}
      onChange={(e) => {
        if (e.target.value.length <= 12) {
          setForm({
            ...form,
            paymentDetails: {
              ...form.paymentDetails,
              accountNumber: e.target.value,
            },
          });
        }
      }}
    />
  </>
)}

{form.paymentMethod === "cheque" && (
  <input
    required
    type="text"
    placeholder="Cheque Number (12 digits)"
    value={form.paymentDetails.chequeNumber || ""}
    onChange={(e) => {
      if (e.target.value.length <= 12) {
        setForm({
          ...form,
          paymentDetails: {
            chequeNumber: e.target.value,
          },
        });
      }
    }}
  />
)}

{form.paymentMethod === "card" && (
  <input
    required
    type="text"
    placeholder="Card Number (16 digits)"
    value={form.paymentDetails.cardNumber || ""}
    onChange={(e) => {
      if (e.target.value.length <= 16) {
        setForm({
          ...form,
          paymentDetails: {
            cardNumber: e.target.value,
          },
        });
      }
    }}
  />
)}

          <input
  required
  type="date"
  value={form.paymentReceivedDate}
  onChange={(e) =>
    setForm({
      ...form,
      paymentReceivedDate: e.target.value,
    })
  }
/>

          <button disabled={loading}>
            {loading ? "Saving..." : "Add Payment"}
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Pending</th>
          </tr>
        </thead>
      <tbody>
  {history.length === 0 ? (
    <tr>
      <td colSpan="4">No payments yet</td>
    </tr>
  ) : (
    (() => {
      if (!booking) return null;

      const orderedPayments = history; // entry-wise order

      let runningPending = booking.totalAmount;

      return orderedPayments.map((h) => {
        runningPending -= Number(h.amountReceived);

        if (runningPending < 0) runningPending = 0;

        return (
          <tr key={h._id}>
            <td>
              {new Date(h.paymentReceivedDate).toLocaleDateString()}
            </td>

            <td>{h.paymentMethod.toUpperCase()}</td>

            <td>₹{formatINR(h.amountReceived)}</td>

            <td>
              {runningPending <= 0 ? (
                <span style={{ color: "green", fontWeight: "bold" }}>
                  SOLD
                </span>
              ) : (
                <>₹{formatINR(runningPending)}</>
              )}
            </td>
          </tr>
        );
      });
    })()
  )}
</tbody>
      </table>
    </div>
  );
}