import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ onLocationSelect, initialAddress = '', initialLat = '', initialLng = '' }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize map
  useEffect(() => {
    // Wait for the DOM element to be ready
    if (!mapRef.current) return;

    // Default center (Mumbai if no coordinates)
    const defaultCenter = (initialLat && initialLng) 
      ? [parseFloat(initialLat), parseFloat(initialLng)] 
      : [19.0760, 72.8777];

    // Create map instance
    const mapInstance = L.map(mapRef.current).setView(defaultCenter, 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // If we have initial coordinates, add a marker
    if (initialLat && initialLng) {
      const marker = L.marker([parseFloat(initialLat), parseFloat(initialLng)], {
        draggable: true
      }).addTo(mapInstance);
      
      marker.on('dragend', function(e) {
        const { lat, lng } = e.target.getLatLng();
        fetchAddress(lat, lng);
      });
      
      markerRef.current = marker;
    }

    // Add click handler to map
    mapInstance.on('click', function(e) {
      const { lat, lng } = e.latlng;
      
      // Remove existing marker if any
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          draggable: true
        }).addTo(mapInstance);
        
        marker.on('dragend', function(e) {
          const { lat, lng } = e.target.getLatLng();
          fetchAddress(lat, lng);
        });
        
        markerRef.current = marker;
      }
      
      // Fetch address for this location
      fetchAddress(lat, lng);
    });

    setMap(mapInstance);

    // Cleanup
    return () => {
      mapInstance.remove();
    };
  }, []); // Run only once on mount

  // Separate function to fetch address
  const fetchAddress = async (latitude, longitude) => {
    setIsLoading(true);
    try {
      // Using Nominatim API with proper headers
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'YourAppName/1.0' // Replace with your app name
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      let addressText = '';
      if (data.display_name) {
        // Get a shorter address
        const parts = data.display_name.split(',');
        if (parts.length > 3) {
          addressText = parts.slice(0, 3).join(',');
        } else {
          addressText = data.display_name;
        }
      } else {
        addressText = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      
      // Update state
      setAddress(addressText);
      setLat(latitude.toFixed(6));
      setLng(longitude.toFixed(6));
      
      // Send to parent component
      onLocationSelect(addressText, latitude.toFixed(6), longitude.toFixed(6));
      
    } catch (error) {
      console.error('Error fetching address:', error);
      // Fallback: just show coordinates
      const fallbackAddress = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setAddress(fallbackAddress);
      setLat(latitude.toFixed(6));
      setLng(longitude.toFixed(6));
      onLocationSelect(fallbackAddress, latitude.toFixed(6), longitude.toFixed(6));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="location-picker">
      <div className="location-header">
        <h3>📍 Project Location</h3>
        <p className="location-subtitle">Click on the map or drag the marker to set the location</p>
        {isLoading && <p className="loading-text">Fetching address...</p>}
      </div>

      <div className="map-container">
        <div 
          ref={mapRef} 
          style={{ 
            height: '350px', 
            width: '100%', 
            borderRadius: '8px',
            border: '2px solid #e2e8f0'
          }}
        ></div>
      </div>

      <div className="location-details">
        <div className="detail-item">
          <label>Address:</label>
          <input
            type="text"
            value={address || ''}
            readOnly
            placeholder="Click on map to select location"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              background: '#f1f5f9'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Latitude:</label>
            <input
              type="text"
              value={lat || ''}
              readOnly
              placeholder="Latitude"
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                background: '#f1f5f9'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Longitude:</label>
            <input
              type="text"
              value={lng || ''}
              readOnly
              placeholder="Longitude"
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                background: '#f1f5f9'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;  