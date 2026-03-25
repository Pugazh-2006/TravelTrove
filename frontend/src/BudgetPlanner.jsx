import { useMemo, useState } from "react";
import Planner from "./Planner.jsx";
import TripDashboard from "./TripDashboard.jsx";
import "./BudgetPlanner.css";

function BudgetPlanner({ user }) {
  const storageKey = useMemo(
    () => `traveltrove_trips_${user?.uid || "guest"}`,
    [user?.uid]
  );
  const [trips, setTrips] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const saveTrips = (nextTrips) => {
    setTrips(nextTrips);
    localStorage.setItem(storageKey, JSON.stringify(nextTrips));
  };

  const handleCreateTrip = (tripInput) => {
    const tripName = typeof tripInput === "string" ? tripInput : tripInput?.name || "";
    const destination = typeof tripInput === "string" ? "" : tripInput?.destination || "";
    const startDate = typeof tripInput === "string" ? "" : tripInput?.startDate || "";
    const days = typeof tripInput === "string" ? undefined : Number(tripInput?.days);
    const newTrip = {
      id: Date.now(),
      name: tripName,
      destination,
      startDate,
      days: Number.isFinite(days) && days > 0 ? Math.round(days) : undefined,
      createdAt: new Date().toISOString(),
    };
    saveTrips([newTrip, ...trips]);
    setSelectedTrip(newTrip);
    setPlannerOpen(true);
  };

  const handleOpenTrip = (trip) => {
    setSelectedTrip(trip);
    setPlannerOpen(true);
  };

  const handleDeleteTrip = (tripId) => {
    const nextTrips = trips.filter((trip) => trip.id !== tripId);
    saveTrips(nextTrips);
    if (selectedTrip?.id === tripId) {
      setSelectedTrip(null);
      setPlannerOpen(false);
    }
  };

  const handlePlanSaved = (savedPlan) => {
    if (!selectedTrip?.id || !savedPlan) {
      return;
    }

    const nextTrips = trips.map((trip) =>
      trip.id === selectedTrip.id
        ? {
            ...trip,
            lastSavedPlan: savedPlan,
            lastSavedAt: new Date().toISOString(),
          }
        : trip
    );
    saveTrips(nextTrips);
    const updatedTrip = nextTrips.find((trip) => trip.id === selectedTrip.id) || selectedTrip;
    setSelectedTrip(updatedTrip);
  };

  return (
    <main className="budget-page">
      <section className="budget-header">
        <p className="budget-kicker">Backpacker Tools</p>
        <h1>Budget Planner</h1>
        <p className="budget-copy">
          Start from your trip board and jump into a destination-level cost estimate.
        </p>
      </section>

      {!plannerOpen && (
        <TripDashboard
          trips={trips}
          onCreateTrip={handleCreateTrip}
          onOpenTrip={handleOpenTrip}
          onDeleteTrip={handleDeleteTrip}
        />
      )}

      {plannerOpen && (
        <section className="planner-wrapper">
          <div className="planner-topbar">
            <button type="button" className="planner-back-btn" onClick={() => setPlannerOpen(false)}>
              Back to Trips
            </button>
            <p className="planner-current-trip">
              {selectedTrip ? selectedTrip.name : "New Trip"}
            </p>
          </div>
          <Planner
            key={selectedTrip?.id || "new-trip"}
            initialTrip={selectedTrip}
            user={user}
            onSavePlan={handlePlanSaved}
          />
        </section>
      )}
    </main>
  );
}

export default BudgetPlanner;
