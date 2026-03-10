import { useEffect, useState } from "react";
import api from "../api";
import LocationPicker from "../components/LocationPicker"; // Fixed import path
import "./Projects.css";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [images, setImages] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [amenitiesInput, setAmenitiesInput] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const [replaceImages, setReplaceImages] = useState(false);
  const [replaceFloorPlans, setReplaceFloorPlans] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  

  // Add this at the top of your Projects.js (after imports) to test
const testLocationSelect = (address, lat, lng) => {
  console.log('Location selected:', { address, lat, lng });
};

  // Location state
  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [form, setForm] = useState({
    projectName: "",
    projectType: "flat",
    totalWings: "",
    totalFloors: "",
    perFloorHouse: "",
    totalPlots: "",
     bhkTypes: ""
  });

  /* ================= FETCH PROJECTS ================= */
  const fetchProjects = async () => {
    try {
      const res = await api.get("/lily/");
      setProjects(res.data.data || []);
      setImageErrors({});
    } catch (err) {
      console.error("Failed to fetch projects", err);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // ===== BASIC INFO =====
    formData.append("projectName", form.projectName);
    formData.append("projectType", form.projectType);
    formData.append("bhkTypes", form.bhkTypes);
    formData.append("replaceImages", replaceImages);
    formData.append("replaceFloorPlans", replaceFloorPlans);
    
    // ===== LOCATION - SEPARATE FIELDS =====
    formData.append("location", locationAddress);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    // ===== PROJECT TYPE SPECIFIC =====
    if (form.projectType === "flat") {
      formData.append("totalWings", form.totalWings || 0);
      formData.append("totalFloors", form.totalFloors || 0);
      formData.append("perFloorHouse", form.perFloorHouse || 0);
    } else {
      formData.append("totalPlots", form.totalPlots || 0);
    }

    // ===== AMENITIES =====
    if (amenitiesInput) {
      amenitiesInput
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a)
        .forEach((a) => formData.append("amenities", a));
    }

    // ===== FILES =====
    if (images.length > 0) {
      Array.from(images).forEach((img) => {
        formData.append("images", img);
      });
    }

    if (floorPlans.length > 0) {
      Array.from(floorPlans).forEach((fp) => {
        formData.append("floorPlans", fp);
      });
    }

    try {
      let response;
      if (editingId) {
        response = await api.put(`/lily/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await api.post("/lily/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (response.data.success) {
        resetForm();
        fetchProjects();
        alert(editingId ? "Project updated successfully!" : "Project created successfully!");
      }
    } catch (err) {
      console.error("Save failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to save project");
    }
  };

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setForm({
      projectName: "",
      projectType: "flat",
      totalWings: "",
      totalFloors: "",
      perFloorHouse: "",
      totalPlots: "",
      bhkTypes: ""
    });
    setLocationAddress("");
    setLatitude("");
    setLongitude("");
    setAmenitiesInput("");
    setImages([]);
    setFloorPlans([]);
    setEditingId(null);
    setShowForm(false);
    setExistingImages([]);
    setImagePreview([]);
  };

  /* ================= EDIT PROJECT ================= */
  const handleEdit = (project) => {
    setEditingId(project.id);
    
    setForm({
      projectName: project.projectName || "",
      projectType: project.projectType || "flat",
      totalWings: project.totalWings || "",
      totalFloors: project.totalFloors || "",
      perFloorHouse: project.perFloorHouse || "",
      totalPlots: project.totalPlots || "",
      bhkTypes: project.bhkTypes || ""
    });
    
    // Set location data
    setLocationAddress(project.location || "");
    setLatitude(project.latitude || "");
    setLongitude(project.longitude || "");
    
    setAmenitiesInput((project.amenities || []).join(", "));
    setShowForm(true);

   if (project.images && project.images.length > 0) {
  const previews = project.images.map((img) => getImageUrl(img.url));
  setExistingImages(previews);
}
  };

  /* ================= DELETE PROJECT ================= */
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await api.delete(`/lily/${id}`);
        if (response.data.success) {
          fetchProjects();
          alert("Project deleted successfully!");
        }
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete project");
      }
    }
  };

  /* ================= RENDER LOCATION DISPLAY ================= */
  const renderLocation = (project) => {
    if (!project.location) return "N/A";
    return project.location;
  };

  /* ================= GET FULL IMAGE URL ================= */
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const baseURL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseURL}${imageUrl}`;
  };

  /* ================= GET FIRST IMAGE ================= */
  const getFirstImage = (project) => {
    if (project.images && project.images.length > 0) {
      return getImageUrl(project.images[0].url);
    }
    return null;
  };

  /* ================= HANDLE IMAGE ERROR ================= */
  const handleImageError = (projectId) => {
    setImageErrors(prev => ({ ...prev, [projectId]: true }));
  };

  /* ================= UI ================= */
  return (
    <div className="projects-page">

      <button className="btn-add" onClick={() => setShowForm(true)}>
        + Add New Project
      </button>

      {/* ================= FORM MODAL ================= */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingId ? "Edit Project" : "Add New Project"}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  required
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>

              <div className="form-group">
                <label>Project Type *</label>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                >
                  <option value="flat">Flat / Apartment</option>
                  <option value="banglow">Banglow</option>
                  <option value="row-house">Row House</option>
                </select>
              </div>

              
              {form.projectType === "flat" ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Total Wings</label>
                      <input
                        type="text"
                        min="1"
                        value={form.totalWings}
                        onChange={(e) => setForm({ ...form, totalWings: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Floors</label>
                      <input
                        type="text"
                        min="1"
                        value={form.totalFloors}
                        onChange={(e) => setForm({ ...form, totalFloors: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Houses Per Floor</label>
                      <input
                        type="text"
                        min="1"
                        value={form.perFloorHouse}
                        onChange={(e) => setForm({ ...form, perFloorHouse: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Total Plots</label>
                  <input
                    type="text"
                    min="1"
                    value={form.totalPlots}
                    onChange={(e) => setForm({ ...form, totalPlots: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
  <label>BHK</label>
  <input
    type="text"
    // min="1"
    placeholder="1, 2, 3"
    value={form.bhkTypes}
    onChange={(e) => setForm({ ...form, bhkTypes: e.target.value })}
  />
</div>

              <div className="form-group">
                <label>Amenities</label>
                <input
                  type="text"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="Swimming Pool, Gym, Garden, etc. (comma separated)"
                />
              </div>
              {imagePreview.length > 0 && (
  <div className="image-preview-container">
    <p>New Images</p>
    {imagePreview.map((src, index) => (
      <img
        key={index}
        src={src}
        alt="preview"
        className="image-preview"
      />
    ))}
  </div>
)}

{existingImages.length > 0 && (
  <div className="image-preview-container">
    <p>Existing Images</p>
    {existingImages.map((src, index) => (
      <img
        key={index}
        src={src}
        alt="existing"
        className="image-preview"
      />
    ))}
  </div>
)}

              <input
  type="file"
  multiple
  accept="image/*"
  onChange={(e) => {
  const files = Array.from(e.target.files);
  setImages(files);

  const previewUrls = files.map((file) => URL.createObjectURL(file));
  setImagePreview(previewUrls);
}}
/>

              <div className="form-group">
                <label>Floor Plans</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => setFloorPlans(e.target.files)}
                />
                <small>Upload floor plans (max 3 files)</small>
              </div>
              
              {/* ===== LOCATION PICKER COMPONENT ===== */}
              <LocationPicker
                onLocationSelect={(address, lat, lng) => {
                  setLocationAddress(address);
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                initialAddress={locationAddress}
                initialLat={latitude}
                initialLng={longitude}
              />

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? "Update Project" : "Create Project"}
                </button>
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PROJECTS TABLE ================= */}
      <div className="projects-table-container">
        <h2>Projects List</h2>
        {projects.length === 0 ? (
          <div className="no-projects">
            <p>No projects found. Click "Add New Project" to create one.</p>
          </div>
        ) : (
          <table className="projects-table">
            <thead>
              <tr>
                <th>No. </th>
                <th>Image</th>
                <th>Project Name</th>
                <th>Type</th>
                <th>Location</th>
                {/* <th>Total Houses</th> */}
                <th>Amenities</th>
                <th>BHK</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => {
                const imageUrl = getFirstImage(project);
                const hasImageError = imageErrors[project.id];
                
                return (
                  <tr key={project.id}>
                    <td>{index + 1}</td>
                    <td className="project-image-cell">
                      {imageUrl && !hasImageError ? (
                        <div className="project-thumbnail">
                          <img 
                            src={imageUrl} 
                            alt={project.projectName}
                            onError={() => handleImageError(project.id)}
                          />
                        </div>
                      ) : (
                        <div className="project-thumbnail no-image">
                          🏗️
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{project.projectName}</strong>
                    </td>
                    <td>
                      {project.projectType === 'flat' ? 'Flat' : 
                       project.projectType === 'banglow' ? 'Banglow' : 'Row House'}
                    </td>
                    <td>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '6px',
                        maxWidth: '300px'
                      }}>
                        <span style={{ fontSize: '14px', marginTop: '2px' }}>📍</span>
                        <span style={{ 
                          fontSize: '13px', 
                          color: '#374151',
                          lineHeight: '1.5',
                          wordBreak: 'break-word'
                        }}>
                          {renderLocation(project)}
                        </span>
                      </div>
                    </td>
                    {/* <td>
                      {project.totalHouse || project.houseNumbers?.length || 0}
                    </td> */}
                    <td>
                      {project.amenities && project.amenities.length > 0 ? (
                        <div className="amenities-tags">
                          {project.amenities.slice(0, 3).map((a, i) => (
                            <span key={i} className="amenity-tag">{a}</span>
                          ))}
                          {project.amenities.length > 3 && (
                            <span className="amenity-tag more">+{project.amenities.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>{project.bhkTypes || "-"} BHK</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(project)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(project.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}