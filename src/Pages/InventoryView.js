import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "./InventoryView.css";

export default function InventoryView() {

  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [houses, setHouses] = useState([]);

  const fetchData = async () => {
    try {

      const projectRes = await api.get(`/lily/${projectId}`);
      const houseRes = await api.get(`/lily/houses/${projectId}`);

      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }

      if (houseRes.data.success) {
        setHouses(houseRes.data.data);
      }

    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!project) return <p>Loading...</p>;

  const isFlatProject = project.projectType === "Flat";

  /* WING LIST */
  const wings = [...new Set(houses.map(h => h.wing))];

  return (
    <div className="inventory-view">

      <h2>{project.projectName}</h2>

      {/* ================= FLAT PROJECT ================= */}

      {isFlatProject && wings.map((wing) => {

        const wingHouses = houses.filter(h => h.wing === wing);

        const floors = [...new Set(wingHouses.map(h => h.floor))]
          .sort((a, b) => b - a);

        return (
          <div key={wing} className="wing-section">

            <h3>Wing {wing}</h3>

            {floors.map((floor) => {

              const floorFlats = wingHouses.filter(
                h => h.floor === floor
              );

              return (
                <div key={floor} className="floor-row">

                  <div className="floor-label">
                    Floor {floor}
                  </div>

                  <div className="house-grid">

                    {floorFlats.map((flat) => (
                      <div
                        key={flat._id}
                        className={`house-box ${flat.status}`}
                      >
                        {flat.houseNumber}
                      </div>
                    ))}

                  </div>

                </div>
              );

            })}

          </div>
        );

      })}

      {/* ================= BUNGALOW / RAW HOUSE ================= */}

      {!isFlatProject && (

        <div className="plot-section">

          <h3></h3>

          <div className="house-grid">

            {houses.map((house) => (
              <div
                key={house._id}
                className={`house-box ${house.status}`}
              >
                {house.houseNumber}
              </div>
            ))}

          </div>

        </div>

      )}

    </div>
  );
}