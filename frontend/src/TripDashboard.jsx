import { useState } from "react";

const internationalDestinations = ["Dubai", "Singapore", "Bangkok", "Kuala Lumpur", "Bali"];
const indiaDestinations = ["Mumbai", "Delhi", "Bangalore"];

function TripDashboard({ trips, onCreateTrip, onOpenTrip, onDeleteTrip }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tripName, setTripName] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripDays, setTripDays] = useState(4);
  const [destinationFocus, setDestinationFocus] = useState("international");
  const destinationOptions =
    destinationFocus === "international" ? internationalDestinations : indiaDestinations;

  const handleCreate = () => {
    if (!tripName.trim() || !tripDestination || !tripStartDate || !tripDays) {
      return;
    }

    onCreateTrip({
      name: tripName.trim(),
      destination: tripDestination,
      startDate: tripStartDate,
      days: tripDays,
    });
    setTripName("");
    setTripDestination("");
    setTripStartDate("");
    setTripDays(4);
    setShowCreateForm(false);
  };

  return (
    <div className="trip-page">
      <section className="trip-row" aria-label="Trips">
        {!showCreateForm && (
          <button
            type="button"
            className="trip-card trip-create-card"
            onClick={() => setShowCreateForm(true)}
          >
            <span className="trip-create-plus">+</span>
            <span className="trip-create-text">Create Trip</span>
          </button>
        )}

        {trips.map((trip) => (
          <div key={trip.id} className="trip-card trip-item-card">
            <button type="button" className="trip-open-btn" onClick={() => onOpenTrip(trip)}>
              <p className="trip-name">{trip.name}</p>
              <p className="trip-destination">{trip.destination}</p>
              {trip.lastSavedPlan && (
                <p className="trip-saved-meta">
                  Saved total: INR {trip.lastSavedPlan?.totals?.estimatedTotal || 0}
                </p>
              )}
            </button>
            <button
              type="button"
              className="trip-delete-btn"
              onClick={(event) => {
                event.stopPropagation();
                const approved = window.confirm(`Delete trip "${trip.name}"?`);
                if (approved) {
                  onDeleteTrip(trip.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </section>

      {showCreateForm && (
        <div className="trip-modal-backdrop" role="presentation" onClick={() => setShowCreateForm(false)}>
          <div className="trip-modal trip-create-form" onClick={(event) => event.stopPropagation()}>
            <p className="trip-form-title">Create New Trip</p>
            <input
              type="text"
              placeholder="Trip name"
              value={tripName}
              onChange={(event) => setTripName(event.target.value)}
            />
            <select
              value={destinationFocus}
              onChange={(event) => {
                setDestinationFocus(event.target.value);
                setTripDestination("");
              }}
            >
              <option value="international">International (Recommended)</option>
              <option value="india">India (Limited)</option>
            </select>
            <select
              value={tripDestination}
              onChange={(event) => setTripDestination(event.target.value)}
            >
              <option value="">Choose destination</option>
              {destinationOptions.map((destination) => (
                <option key={destination} value={destination}>
                  {destination}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={tripStartDate}
              onChange={(event) => setTripStartDate(event.target.value)}
            />
            <input
              type="number"
              min="1"
              max="14"
              placeholder="How many days?"
              value={tripDays}
              onChange={(event) => setTripDays(Math.max(1, Math.min(14, Number(event.target.value) || 1)))}
            />
            <div className="trip-form-actions">
              <button type="button" onClick={handleCreate}>
                Create Trip
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripDashboard;
