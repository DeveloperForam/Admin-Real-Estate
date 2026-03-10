import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "./ProjectForm.css";

export default function ProjectForm() {
  const { id } = useParams(); // Will be undefined for Add, defined for Edit
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [images, setImages] = useState([]); // New images to upload
  const [existingImages, setExistingImages] = useState([]); // Existing images from DB
  const [floorPlans, setFloorPlans] = useState([]); // New floor plans to upload
  const [existingFloorPlans, setExistingFloorPlans] = useState([]); // Existing floor plans from DB
  const [amenitiesInput, setAmenitiesInput] = useState("");

  const [form, setForm] = useState({
    projectName: "",
    projectType: "flat",
    location: "",
    totalWings: "",
    totalFloors: "",
    perFloorHouse: "",
    totalPlots: "",
  });

  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState("");

  /* ================= FETCH PROJECT DATA IF EDIT MODE ================= */
  useEffect(() => {
    if (!isEditMode) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/lily/${id}`);
        const project = res.data.data;

        // Fill form with existing data
        setForm({
          projectName: project.projectName || "",
          projectType: project.projectType || "flat",
          location: project.location || "",
          totalWings: project.totalWings || "",
          totalFloors: project.totalFloors || "",
          perFloorHouse: project.perFloorHouse || "",
          totalPlots: project.totalPlots || "",
        });

        // Set existing images and floor plans
        setExistingImages(project.images || []);
        setExistingFloorPlans(project.floorPlans || []);

        // Set amenities as comma-separated string
        if (project.amenities && project.amenities.length > 0) {
          setAmenitiesInput(project.amenities.join(", "));
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch project", err);
        setError("Failed to load project data");
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, isEditMode]);

  /* ================= REMOVE EXISTING IMAGE ================= */
  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  /* ================= REMOVE NEW IMAGE ================= */
  const removeNewImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  /* ================= REMOVE EXISTING FLOOR PLAN ================= */
  const removeExistingFloorPlan = (index) => {
    setExistingFloorPlans(existingFloorPlans.filter((_, i) => i !== index));
  };

  /* ================= REMOVE NEW FLOOR PLAN ================= */
  const removeNewFloorPlan = (index) => {
    setFloorPlans(floorPlans.filter((_, i) => i !== index));
  };

  /* ================= SUBMIT FORM ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Append basic form data
    formData.append("projectName", form.projectName);
    formData.append("projectType", form.projectType);
    formData.append("location", form.location);

    if (form.projectType === "flat") {
      formData.append("totalWings", form.totalWings);
      formData.append("totalFloors", form.totalFloors);
      formData.append("perFloorHouse", form.perFloorHouse);
    } else {
      formData.append("totalPlots", form.totalPlots);
    }

    // Append amenities
    if (amenitiesInput.trim()) {
      const amenitiesArray = amenitiesInput
        .split(",")
        .map(a => a.trim())
        .filter(a => a !== "");
      
      amenitiesArray.forEach((amenity, index) => {
        formData.append(`amenities[${index}]`, amenity);
      });
    }

    // For Edit mode: Send existing images that are not removed
    if (isEditMode) {
      formData.append("existingImages", JSON.stringify(existingImages));
      formData.append("existingFloorPlans", JSON.stringify(existingFloorPlans));
    }

    // Append new images
    images.forEach((img) => {
      formData.append("images", img);
    });

    // Append new floor plans
    floorPlans.forEach((fp) => {
      formData.append("floorPlans", fp);
    });

    try {
      if (isEditMode) {
        // Update existing project
        await api.put(`/lily/${id}`, formData);
        alert("Project Updated Successfully!");
      } else {
        // Create new project
        await api.post("/lily/", formData);
        alert("Project Added Successfully!");
      }
      
      navigate("/projects");
    } catch (err) {
      console.error("Failed to save project", err);
      alert("Failed to save project: " + (err.response?.data?.message || err.message));
    }
  };

  /* ================= HANDLE FORM INPUT CHANGE ================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  /* ================= HANDLE FILE UPLOAD ================= */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const handleFloorPlanUpload = (e) => {
    const files = Array.from(e.target.files);
    // Limit to 3 floor plans
    const remainingSlots = 3 - floorPlans.length;
    const filesToAdd = files.slice(0, remainingSlots);
    setFloorPlans((prev) => [...prev, ...filesToAdd]);
  };

  /* ================= SHOW LOADING ================= */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading project data...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h2>{isEditMode ? "Edit Project" : "Add New Project"}</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Project Name */}
        <label>Project Name</label>
        <input
          name="projectName"
          required
          value={form.projectName}
          onChange={handleInputChange}
        />

        {/* Project Type */}
        <label>Project Type</label>
        <select
          name="projectType"
          value={form.projectType}
          onChange={handleInputChange}
        >
          <option value="flat">Flat</option>
          <option value="banglow">Banglow</option>
          <option value="row-house">Row House</option>
        </select>

        {/* Location */}
        <label>Location</label>
        <input
          name="location"
          required
          value={form.location}
          onChange={handleInputChange}
        />

        {/* Conditional Fields */}
        {form.projectType === "flat" ? (
          <>
            <label>Total Wings</label>
            <input
              name="totalWings"
              type="text"
              min="1"
              value={form.totalWings}
              onChange={handleInputChange}
            />

            <label>Total Floors</label>
            <input
              name="totalFloors"
              type="text"
              min="1"
              value={form.totalFloors}
              onChange={handleInputChange}
            />

            <label>Per Floor Houses</label>
            <input
              name="perFloorHouse"
              type="text"
              min="1"
              value={form.perFloorHouse}
              onChange={handleInputChange}
            />
          </>
        ) : (
          <>
            <label>Total Plots</label>
            <input
              name="totalPlots"
              type="text"
              min="1"
              value={form.totalPlots}
              onChange={handleInputChange}
            />
          </>
        )}

        {/* Amenities */}
        <label>Amenities</label>
        <input
          placeholder="Parking, Gym, Garden, Pool"
          value={amenitiesInput}
          onChange={(e) => setAmenitiesInput(e.target.value)}
        />

        {/* Existing Images Section - Only in Edit Mode */}
        {isEditMode && existingImages.length > 0 && (
          <div className="preview-box">
            <h4>Existing Project Images:</h4>
            <p className="help-text">Click ✖ to remove images</p>
            <div className="preview-grid">
              {existingImages.map((img, index) => (
                <div key={`existing-${index}`} className="preview-card">
                  <span className="image-number">{index + 1}</span>
                  <img
                    src={`http://localhost:5000${img.url}`}
                    alt={`project-${index}`}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150x100?text=Image";
                    }}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeExistingImage(index)}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Images */}
        <label>{isEditMode ? "Add More Images" : "Project Images"}</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
        />

        {/* New Images Preview */}
        {images.length > 0 && (
          <div className="preview-box">
            <h4>New Images to Upload:</h4>
            <div className="preview-grid">
              {images.map((img, index) => (
                <div key={`new-${index}`} className="preview-card">
                  <span className="image-number">{index + 1}</span>
                  <img
                    src={URL.createObjectURL(img)}
                    alt="preview"
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeNewImage(index)}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Floor Plans - Only in Edit Mode */}
        {isEditMode && existingFloorPlans.length > 0 && (
          <div className="preview-box">
            <h4>Existing Floor Plans:</h4>
            <p className="help-text">Click ✖ to remove floor plans</p>
            <div className="preview-grid">
              {existingFloorPlans.map((fp, index) => (
                <div key={`existing-fp-${index}`} className="preview-card">
                  <span className="image-number">{index + 1}</span>
                  <img
                    src={`http://localhost:5000${fp.url}`}
                    alt={`floorplan-${index}`}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150x100?text=Floor+Plan";
                    }}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeExistingFloorPlan(index)}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Floor Plans */}
        <label>{isEditMode ? "Add More Floor Plans" : "Floor Plans (max 3)"}</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFloorPlanUpload}
          disabled={floorPlans.length >= 3}
        />
        {floorPlans.length >= 3 && (
          <p className="help-text">Maximum 3 floor plans allowed</p>
        )}

        {/* New Floor Plans Preview */}
        {floorPlans.length > 0 && (
          <div className="preview-box">
            <h4>New Floor Plans to Upload:</h4>
            <div className="preview-grid">
              {floorPlans.map((fp, index) => (
                <div key={`new-fp-${index}`} className="preview-card">
                  <span className="image-number">{index + 1}</span>
                  <img
                    src={URL.createObjectURL(fp)}
                    alt="floorplan-preview"
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeNewFloorPlan(index)}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="form-buttons">
          <button className="btn-submit" type="submit">
            {isEditMode ? "Update Project" : "Create Project"}
          </button>
          <button
            type="button"
            className="btn-close"
            onClick={() => navigate("/projects")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}