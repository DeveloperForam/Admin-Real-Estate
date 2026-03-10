import { useEffect, useState } from "react";
import api from "../api";
import "./Inquiry.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function Inquiry() {
  const [inquiries, setInquiries] = useState([]);

  useEffect(() => {
    api.get("/contact").then((res) => {
      setInquiries(res.data);
    });
  }, []);

 
  return (
    <div className="inquiry-page">
      <h1>Project Inquiries</h1>

      {/* TABLE */}
      <div className="inquiry-table-box">
        <table>
          <thead>
            <tr>
              <th>Sr.no</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((item, i) => (
              <tr key={item._id}>
                <td>{i + 1}</td>
                <td>{item.firstName}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>{item.location}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     
    </div>
  );
}