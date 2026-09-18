import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

function App() {
  const [medicine, setMedicine] = useState("");
  const [quantity, setQuantity] = useState("");

  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

  const [userLocation, setUserLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  // Page can be: search, results, location
  const [page, setPage] = useState("search");

  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  // Calculate distance between two locations
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get user's current location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Location tracking is not supported by your browser."
      );
      return;
    }

    setLocationMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const location = {
          latitude,
          longitude,
        };

        setUserLocation(location);

        // Calculate distance from user to pharmacies
        const updatedResults = results.map((item) => ({
          ...item,
          distance: calculateDistance(
            latitude,
            longitude,
            item.latitude,
            item.longitude
          ),
        }));

        // Sort nearest pharmacy first
        updatedResults.sort((a, b) => a.distance - b.distance);

        setResults(updatedResults);

        // Also update selected pharmacy distance
        if (selectedPharmacy) {
          const updatedSelectedPharmacy = {
            ...selectedPharmacy,
            distance: calculateDistance(
              latitude,
              longitude,
              selectedPharmacy.latitude,
              selectedPharmacy.longitude
            ),
          };

          setSelectedPharmacy(updatedSelectedPharmacy);
        }

        setLocationMessage("📍 Location detected successfully!");
      },
      (error) => {
        console.error(error);

        setLocationMessage(
          "Unable to get your location. Please allow location permission."
        );
      }
    );
  };

  // Search medicine
  const searchMedicine = async () => {
    if (medicine === "" || quantity === "") {
      setMessage("Please enter medicine name and quantity.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicine: medicine,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      setMessage(data.message);
      setResults(data.results || []);

      // Open results page
      setPage("results");
    } catch (error) {
      console.error(error);

      setMessage("Cannot connect to the server.");
      setResults([]);

      setPage("results");
    }
  };

  // Open pharmacy location page
  const openPharmacyLocation = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setPage("location");
  };

  // Go back to results
  const backToResults = () => {
    setPage("results");
  };

  // Go back to search
  const backToSearch = () => {
    setPage("search");
    setSelectedPharmacy(null);
  };

  // Open Google Maps directions
  const getDirections = () => {
    if (!selectedPharmacy) {
      return;
    }

    if (userLocation) {
      const url =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${userLocation.latitude},${userLocation.longitude}` +
        `&destination=${selectedPharmacy.latitude},${selectedPharmacy.longitude}` +
        `&travelmode=driving`;

      window.open(url, "_blank");
    } else {
      const url =
        `https://www.google.com/maps/search/?api=1` +
        `&query=${selectedPharmacy.latitude},${selectedPharmacy.longitude}`;

      window.open(url, "_blank");
    }
  };

  // ==========================================
  // PHARMACY LOCATION PAGE
  // ==========================================

  if (page === "location" && selectedPharmacy) {
    return (
      <div className="app">

        <nav className="navbar">
          <div className="logo">💊 MediFind</div>

          <button
            className="back-button"
            onClick={backToResults}
          >
            ← Back to Results
          </button>
        </nav>

        <section className="location-page">

          <h1>📍 Pharmacy Location</h1>

          <p className="location-subtitle">
            View the selected pharmacy location and get directions.
          </p>

          {/* Pharmacy Information */}
          <div className="pharmacy-location-card">

            <h2>
              🏪 {selectedPharmacy.pharmacyName}
            </h2>

            <p>
              <strong>📍 Address:</strong>{" "}
              {selectedPharmacy.address}
            </p>

            <p>
              <strong>📞 Phone:</strong>{" "}
              {selectedPharmacy.phone}
            </p>

            <p>
              <strong>💊 Medicine:</strong>{" "}
              {selectedPharmacy.medicineName}
            </p>

            <p>
              <strong>📦 Available Quantity:</strong>{" "}
              {selectedPharmacy.quantityAvailable}
            </p>

            {selectedPharmacy.distance !== undefined && (
              <p>
                <strong>📏 Distance:</strong>{" "}
                {selectedPharmacy.distance.toFixed(2)} km
              </p>
            )}

          </div>

          {/* Map */}
          <div className="map-container">

            <MapContainer
              center={[
                selectedPharmacy.latitude,
                selectedPharmacy.longitude,
              ]}
              zoom={15}
              style={{
                height: "500px",
                width: "100%",
              }}
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Pharmacy Marker */}
              <CircleMarker
                center={[
                  selectedPharmacy.latitude,
                  selectedPharmacy.longitude,
                ]}
                radius={14}
              >
                <Popup>
                  <strong>
                    🏪 {selectedPharmacy.pharmacyName}
                  </strong>

                  <br />

                  {selectedPharmacy.address}

                  <br />

                  📞 {selectedPharmacy.phone}
                </Popup>
              </CircleMarker>

              {/* User Marker */}
              {userLocation && (
                <CircleMarker
                  center={[
                    userLocation.latitude,
                    userLocation.longitude,
                  ]}
                  radius={10}
                >
                  <Popup>
                    👤 Your Current Location
                  </Popup>
                </CircleMarker>
              )}

            </MapContainer>

          </div>

          {/* Map Information */}
          <div className="map-info">

            <div>
              <span>🏪</span>
              <strong> Pharmacy</strong>
            </div>

            {userLocation && (
              <div>
                <span>👤</span>
                <strong> Your Location</strong>
              </div>
            )}

          </div>

          {/* Directions */}
          <button
            className="directions-button"
            onClick={getDirections}
          >
            🧭 Get Directions
          </button>

        </section>

      </div>
    );
  }

  // ==========================================
  // RESULTS PAGE
  // ==========================================

  if (page === "results") {
    return (
      <div className="app">

        <nav className="navbar">
          <div className="logo">💊 MediFind</div>

          <button
            className="back-button"
            onClick={backToSearch}
          >
            ← Back to Search
          </button>
        </nav>

        <section className="results-page">

          <h1>Medicine Search Results</h1>

          <p className="search-summary">
            Medicine: <strong>{medicine}</strong> | Required quantity:{" "}
            <strong>{quantity}</strong>
          </p>

          <p className="message">
            {message}
          </p>

          {results.length === 0 ? (
            <div className="no-results">

              <h2>😕 No pharmacies found</h2>

              <p>
                Try another medicine or reduce the required quantity.
              </p>

            </div>
          ) : (
            <>

              {/* User Location */}
              <div className="location-box">

                <button onClick={getLocation}>
                  📍 Use My Current Location
                </button>

                {locationMessage && (
                  <p className="location-message">
                    {locationMessage}
                  </p>
                )}

              </div>

              {/* Pharmacy Results */}
              <div className="results">

                {results.map((item, index) => (

                  <div
                    className="pharmacy-card"
                    key={index}
                  >

                    <h3>
                      🏪 {item.pharmacyName}
                    </h3>

                    {item.distance !== undefined && (
                      <p>
                        <strong>📍 Distance:</strong>{" "}
                        {item.distance.toFixed(2)} km
                      </p>
                    )}

                    <p>
                      <strong>📍 Address:</strong>{" "}
                      {item.address}
                    </p>

                    <p>
                      <strong>📞 Phone:</strong>{" "}
                      {item.phone}
                    </p>

                    <p>
                      <strong>💊 Medicine:</strong>{" "}
                      {item.medicineName}
                    </p>

                    <p>
                      <strong>📦 Available Quantity:</strong>{" "}
                      {item.quantityAvailable}
                    </p>

                    <p>
                      <strong>🏭 Manufacturer:</strong>{" "}
                      {item.manufacturer}
                    </p>

                    <p>
                      <strong>🔢 Batch Number:</strong>{" "}
                      {item.batchNumber}
                    </p>

                    <p>
                      <strong>📅 Expiry Date:</strong>{" "}
                      {new Date(
                        item.expiryDate
                      ).toLocaleDateString()}
                    </p>

                    <p>
                      <strong>💰 Price:</strong>{" "}
                      ₹{item.price}
                    </p>

                    {/* Location Button */}
                    <button
                      className="location-button"
                      onClick={() =>
                        openPharmacyLocation(item)
                      }
                    >
                      📍 View Location
                    </button>

                  </div>

                ))}

              </div>

            </>
          )}

        </section>

      </div>
    );
  }

  // ==========================================
  // SEARCH PAGE
  // ==========================================

  return (
    <div className="app">

      <nav className="navbar">

        <div className="logo">
          💊 MediFind
        </div>

        <div>
          Find Medicines Near You
        </div>

      </nav>

      <section className="hero">

        <h1>
          Find Your Medicine Nearby
        </h1>

        <h2>
          Search. Find. Get Your Medicine.
        </h2>

        <p>
          Find nearby pharmacies and check medicine
          availability before you visit.
        </p>

        <div className="search-box">

          <input
            type="text"
            placeholder="Enter medicine name"
            value={medicine}
            onChange={(e) =>
              setMedicine(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Required quantity"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
          />

          <button onClick={searchMedicine}>
            Search Medicine
          </button>

        </div>

      </section>

    </div>
  );
}

export default App;