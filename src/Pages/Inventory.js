import { useEffect, useState } from "react";
import api from "../api";
import "./Inventory.css";

export default function Inventory() {

  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchData = async () => {
    try {

      const projectRes = await api.get("/lily");
      const bookingRes = await api.get("/bookings");

      if (projectRes.data.success) {
        setProjects(projectRes.data.data);
      }

      if (bookingRes.data.success) {
        setBookings(bookingRes.data.data);
      }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getInventory = (project) => {

    const projectBookings = bookings.filter(
      (b) => b.projectId === project.id
    );

    const soldHouse = projectBookings.length;

    const soldAmount = projectBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    const totalHouse = project.totalHouse || 0;

    const availableHouse = totalHouse - soldHouse;

    const totalSellingPrice = totalHouse * (project.price || 0);

    const remainingAmount = totalSellingPrice - soldAmount;

    return {
      totalHouse,
      soldHouse,
      availableHouse,
      totalSellingPrice,
      soldAmount,
      remainingAmount,
    };
  };

  return (
    <div className="inventory-page">

      <h2>Project Inventory</h2>

      <table className="inventory-table">

        <thead>
          <tr>
            <th>Project</th>
            <th>Total Houses</th>
            <th>Sold</th>
            <th>Available</th>
            <th>Total Price</th>
          </tr>
        </thead>

        <tbody>

          {projects.map((project) => {

            const inv = getInventory(project);

            return (
              <tr key={project.id}>

                <td>{project.projectName}</td>

                <td>{inv.totalHouse}</td>

                <td className="sold">{inv.soldHouse}</td>

                <td className="available">{inv.availableHouse}</td>

                <td>
                  ₹{new Intl.NumberFormat("en-IN").format(
                    inv.soldAmount
                  )}
                </td>
              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}