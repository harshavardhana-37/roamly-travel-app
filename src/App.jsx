import { useState } from "react";

function App() {
  const destinations = [
    {
      name: "Paris",
      country: "France",
      image:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80",
      description:
        "The city of lights, art, architecture, cafés, and unforgettable streets.",
      places: ["Eiffel Tower", "Louvre Museum", "Montmartre"],
    },
    {
      name: "Tokyo",
      country: "Japan",
      image:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1000&q=80",
      description:
        "A city where futuristic technology meets centuries of tradition.",
      places: ["Shibuya Crossing", "Senso-ji Temple", "Tokyo Skytree"],
    },
    {
      name: "Bali",
      country: "Indonesia",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80",
      description:
        "Tropical beaches, temples, waterfalls, and peaceful landscapes.",
      places: [
        "Uluwatu Temple",
        "Tegallalang Rice Terrace",
        "Kuta Beach",
      ],
    },
    {
      name: "New York",
      country: "USA",
      image:
        "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?auto=format&fit=crop&w=1000&q=80",
      description:
        "Skyscrapers, culture, food, nightlife, and endless things to explore.",
      places: ["Times Square", "Central Park", "Brooklyn Bridge"],
    },
  ];

  const [search, setSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [locationSearch, setLocationSearch] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // TRIP PLANNER STATES
  const [tripPlannerOpen, setTripPlannerOpen] = useState(false);
  const [tripDestination, setTripDestination] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripPlaces, setTripPlaces] = useState([]);
  const [tripSaved, setTripSaved] = useState(false);

  const filteredDestinations = destinations.filter((destination) =>
    destination.name.toLowerCase().includes(search.toLowerCase())
  );

  const scrollToExplore = () => {
    document
      .getElementById("explore")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // OPEN TRIP PLANNER
  const openTripPlanner = (destination) => {
    if (!destination) return;

    setTripDestination(destination);
    setTripPlaces([]);
    setStartDate("");
    setEndDate("");
    setTripSaved(false);

    setSelectedDestination(null);
    setTripPlannerOpen(true);
  };

  // ADD OR REMOVE PLACE
  const toggleTripPlace = (place) => {
    setTripPlaces((currentPlaces) =>
      currentPlaces.includes(place)
        ? currentPlaces.filter((item) => item !== place)
        : [...currentPlaces, place]
    );

    setTripSaved(false);
  };

  // SAVE TRIP
  const saveTrip = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    const trip = {
      destination: tripDestination.name,
      country: tripDestination.country,
      startDate,
      endDate,
      places: tripPlaces,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("roamlyTrip", JSON.stringify(trip));

    setTripSaved(true);
  };

  // GET WEATHER
  const fetchWeather = async (latitude, longitude) => {
    setWeatherLoading(true);
    setWeather(null);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      );

      if (!response.ok) {
        throw new Error("Weather request failed");
      }

      const data = await response.json();

      setWeather(data.current);
    } catch (error) {
      console.error(error);
      setLocationError("Unable to load weather.");
    } finally {
      setWeatherLoading(false);
    }
  };

  // WEATHER CODE TO TEXT
  const getWeatherLabel = (code) => {
    const weatherCodes = {
      0: "Clear sky ☀️",
      1: "Mainly clear 🌤️",
      2: "Partly cloudy ⛅",
      3: "Overcast ☁️",
      45: "Foggy 🌫️",
      48: "Foggy 🌫️",
      51: "Light drizzle 🌦️",
      53: "Drizzle 🌦️",
      55: "Heavy drizzle 🌧️",
      61: "Light rain 🌧️",
      63: "Rain 🌧️",
      65: "Heavy rain 🌧️",
      71: "Light snow ❄️",
      73: "Snow ❄️",
      75: "Heavy snow ❄️",
      80: "Rain showers 🌦️",
      81: "Rain showers 🌧️",
      82: "Heavy rain showers 🌧️",
      95: "Thunderstorm ⛈️",
    };

    return weatherCodes[code] || "Current weather";
  };

  // GET CURRENT LOCATION
  const getCurrentLocation = () => {
    setLocationError("");
    setLocationLoading(true);
    setWeather(null);

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setUserLocation({
          name: "Your current location",
          latitude,
          longitude,
        });

        fetchWeather(latitude, longitude);
        setLocationLoading(false);
      },
      () => {
        setLocationError(
          "Unable to access your location. Please allow location permission."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // SEARCH LOCATION
  const searchLocation = async () => {
    if (!locationSearch.trim()) return;

    setLocationLoading(true);
    setLocationError("");
    setLocationResults([]);

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          locationSearch
        )}&count=5&language=en&format=json`
      );

      const data = await response.json();

      if (!data.results) {
        setLocationError("No locations found.");
        return;
      }

      setLocationResults(data.results);
    } catch (error) {
      setLocationError("Something went wrong while searching.");
    } finally {
      setLocationLoading(false);
    }
  };

  // SELECT SEARCHED LOCATION
  const selectLocation = (place) => {
    const selectedPlace = {
      name: `${place.name}, ${
        place.admin1 ? place.admin1 + ", " : ""
      }${place.country || ""}`,
      latitude: place.latitude,
      longitude: place.longitude,
    };

    setUserLocation(selectedPlace);
    setLocationResults([]);
    setLocationSearch("");
    setLocationError("");

    fetchWeather(
      selectedPlace.latitude,
      selectedPlace.longitude
    );
  };

  return (
    <>
      {/* NAVBAR */}
      <nav>
        <h2>Roamly.</h2>

        <div className="nav-links">
          <a href="#explore">Explore</a>
          <a href="#about">About</a>
        </div>

        <button onClick={scrollToExplore}>
          Plan a Trip
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            EXPLORE WITHOUT LIMITS
          </p>

          <h1>
            The world is waiting.
            <br />
            Go find it.
          </h1>

          <p className="hero-text">
            Discover incredible destinations, explore iconic
            places, check live weather, and plan your next
            adventure.
          </p>

          <button onClick={scrollToExplore}>
            Explore destinations ↓
          </button>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section id="explore" className="destinations">
        <p className="eyebrow">WHERE TO NEXT?</p>

        <h2>Explore destinations</h2>

        <input
          type="text"
          placeholder="Search a destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="destination-grid">
          {filteredDestinations.map((destination) => (
            <div className="card" key={destination.name}>
              <img
                src={destination.image}
                alt={destination.name}
              />

              <div className="card-content">
                <p>{destination.country}</p>

                <h3>{destination.name}</h3>

                <span>{destination.description}</span>

                <button
                  onClick={() =>
                    setSelectedDestination(destination)
                  }
                >
                  Explore →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCATION */}
      <section className="location-section">
        <p className="eyebrow">
          LOCATION AWARENESS
        </p>

        <h2>Where are you planning from?</h2>

        <p className="location-description">
          Use your current location or search for any city
          around the world.
        </p>

        <div className="location-actions">
          <button
            className="location-btn"
            onClick={getCurrentLocation}
          >
            📍{" "}
            {locationLoading
              ? "Finding location..."
              : "Use my location"}
          </button>

          <div className="location-search">
            <input
              type="text"
              placeholder="Search a city..."
              value={locationSearch}
              onChange={(e) =>
                setLocationSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchLocation();
                }
              }}
            />

            <button onClick={searchLocation}>
              Search
            </button>
          </div>
        </div>

        {locationError && (
          <p className="location-error">
            {locationError}
          </p>
        )}

        {userLocation && (
          <div className="current-location">
            <span>📍</span>

            <div>
              <p>Your selected location</p>

              <h3>{userLocation.name}</h3>

              <small>
                {userLocation.latitude.toFixed(4)},{" "}
                {userLocation.longitude.toFixed(4)}
              </small>
            </div>
          </div>
        )}

        {weatherLoading && (
          <div className="weather-card">
            <p>🌤️ Loading live weather...</p>
          </div>
        )}

        {weather && (
          <div className="weather-card">
            <p className="eyebrow">
              LIVE WEATHER
            </p>

            <h3>
              {getWeatherLabel(weather.weather_code)}
            </h3>

            <div className="weather-details">
              <div>
                <span>🌡️ Temperature</span>

                <strong>
                  {Math.round(weather.temperature_2m)}°C
                </strong>
              </div>

              <div>
                <span>🤔 Feels like</span>

                <strong>
                  {Math.round(weather.apparent_temperature)}°C
                </strong>
              </div>

              <div>
                <span>💨 Wind</span>

                <strong>
                  {Math.round(weather.wind_speed_10m)} km/h
                </strong>
              </div>
            </div>
          </div>
        )}

        {locationResults.length > 0 && (
          <div className="location-results">
            {locationResults.map((place) => (
              <button
                key={`${place.id}-${place.latitude}`}
                onClick={() => selectLocation(place)}
              >
                <strong>{place.name}</strong>

                <span>
                  {place.admin1 &&
                    `${place.admin1}, `}
                  {place.country}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ABOUT */}
      <section id="about" className="about-section">
        <p className="eyebrow">TRAVEL SMARTER</p>

        <h2>
          One place to explore, discover and plan.
        </h2>

        <p>
          Roamly helps you discover destinations, find
          iconic places, check live weather and create
          your next itinerary.
        </p>
      </section>

      {/* DESTINATION MODAL */}
      {selectedDestination && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDestination(null)}
        >
          <div
            className="destination-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedDestination(null)}
            >
              ×
            </button>

            <img
              src={selectedDestination.image}
              alt={selectedDestination.name}
            />

            <div className="modal-content">
              <p className="eyebrow">
                {selectedDestination.country}
              </p>

              <h2>{selectedDestination.name}</h2>

              <p>
                {selectedDestination.description}
              </p>

              <h3>Places worth visiting</h3>

              <div className="places-list">
                {selectedDestination.places.map(
                  (place) => (
                    <div
                      className="place"
                      key={place}
                    >
                      📍 {place}
                    </div>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  openTripPlanner(selectedDestination)
                }
              >
                Plan a trip →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRIP PLANNER MODAL */}
      {tripPlannerOpen && tripDestination && (
        <div
          className="modal-overlay"
          onClick={() => setTripPlannerOpen(false)}
        >
          <div
            className="destination-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setTripPlannerOpen(false)}
            >
              ×
            </button>

            <div className="modal-content">
              <p className="eyebrow">YOUR TRIP</p>

              <h2>
                Plan your trip to {tripDestination.name} ✈️
              </h2>

              <p>
                Select your travel dates and choose the
                places you want to visit.
              </p>

              <h3>Travel dates</h3>

              <div className="trip-dates">
                <label>
                  Start date
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setTripSaved(false);
                    }}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setTripSaved(false);
                    }}
                  />
                </label>
              </div>

              <h3>Build your itinerary</h3>

              <div className="places-list">
                {tripDestination.places.map((place) => {
                  const isAdded =
                    tripPlaces.includes(place);

                  return (
                    <button
                      type="button"
                      className="place"
                      key={place}
                      onClick={() =>
                        toggleTripPlace(place)
                      }
                    >
                      <span>📍 {place}</span>

                      <strong>
                        {isAdded
                          ? "✓ Added"
                          : "+ Add"}
                      </strong>
                    </button>
                  );
                })}
              </div>

              <button onClick={saveTrip}>
                {tripSaved
                  ? "✓ Trip Saved"
                  : "Save Trip"}
              </button>

              {tripSaved && (
                <p className="trip-success">
                  🎉 Your trip to{" "}
                  {tripDestination.name} has been saved!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;