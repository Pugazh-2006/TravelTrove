import { useEffect, useMemo, useRef, useState } from "react";

const internationalDestinations = ["Dubai", "Singapore", "Bangkok", "Kuala Lumpur", "Bali"];
const indiaDestinations = ["Mumbai", "Delhi", "Bangalore"];
const cities = [...indiaDestinations, ...internationalDestinations];
const passengerOptions = [1, 2, 3];
const transportOptions = [
  { type: "Train", price: 850 },
  { type: "Bus", price: 1200 },
];
const topPlacesData = {
  Dubai: [
    { place: "Burj Khalifa (Outside View)", charge: 0 },
    { place: "Dubai Marina Walk", charge: 0 },
    { place: "Al Fahidi Historical District", charge: 20 },
  ],
  Singapore: [
    { place: "Merlion Park", charge: 0 },
    { place: "Gardens by the Bay (Outdoor)", charge: 0 },
    { place: "Little India", charge: 0 },
  ],
  Bangkok: [
    { place: "Wat Arun", charge: 120 },
    { place: "Chatuchak Market", charge: 0 },
    { place: "Chao Phraya Riverside", charge: 0 },
  ],
  "Kuala Lumpur": [
    { place: "Petronas Towers (Outside)", charge: 0 },
    { place: "Batu Caves", charge: 0 },
    { place: "Bukit Bintang", charge: 0 },
  ],
  Bali: [
    { place: "Uluwatu Temple", charge: 150 },
    { place: "Ubud Market", charge: 0 },
    { place: "Canggu Beach", charge: 0 },
  ],
  Mumbai: [
    { place: "Gateway of India", charge: 0 },
    { place: "Marine Drive", charge: 0 },
    { place: "Bandra Fort", charge: 0 },
  ],
  Delhi: [
    { place: "India Gate", charge: 0 },
    { place: "Humayun's Tomb", charge: 50 },
    { place: "Lodhi Garden", charge: 0 },
  ],
  Bangalore: [
    { place: "Cubbon Park", charge: 0 },
    { place: "Lalbagh", charge: 40 },
    { place: "Church Street", charge: 0 },
  ],
};
const hostelData = {
  Dubai: [
    { name: "Backpacker 16 Hostel", price: 2100 },
    { name: "Heartland Hostel Dubai", price: 2500 },
  ],
  Singapore: [
    { name: "Code Hostel Singapore", price: 2800 },
    { name: "Downtown Capsule", price: 3100 },
  ],
  Bangkok: [
    { name: "Siam Backpack Lodge", price: 1400 },
    { name: "Khao San Social Hostel", price: 1600 },
  ],
  "Kuala Lumpur": [
    { name: "KL Central Hostel", price: 1500 },
    { name: "Bukit Budget Pods", price: 1700 },
  ],
  Bali: [
    { name: "Ubud Nomad Hostel", price: 1300 },
    { name: "Canggu Surf Stay", price: 1800 },
  ],
  Mumbai: [
    { name: "Mumbai Backpackers", price: 1100 },
    { name: "City Nest Hostel", price: 1300 },
  ],
  Delhi: [
    { name: "Zostel Delhi", price: 900 },
    { name: "Backpack Hub Delhi", price: 1000 },
  ],
  Bangalore: [
    { name: "Indiranagar Hostel", price: 950 },
    { name: "Metro Backpackers", price: 1050 },
  ],
};

const airlineTemplates = [
  { airline: "IndiGo", multiplier: 1.0 },
  { airline: "Air India", multiplier: 1.18 },
  { airline: "AirAsia", multiplier: 0.92 },
  { airline: "Akasa Air", multiplier: 1.08 },
];
const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const formatInr = (amount) => `INR ${amount}`;
const DEFAULT_TRIP_DAYS = 4;
const MAX_TRIP_DAYS = 14;
const tripTypeOptions = [
  { value: "single", label: "Single destination" },
  { value: "continue", label: "Continue to another country" },
];
const currencyByDestination = {
  Dubai: "AED",
  Singapore: "SGD",
  Bangkok: "THB",
  "Kuala Lumpur": "MYR",
  Bali: "IDR",
  Mumbai: "INR",
  Delhi: "INR",
  Bangalore: "INR",
};
const inrPerUnitByCurrency = {
  INR: 1,
  AED: 22.5,
  SGD: 62,
  THB: 2.3,
  MYR: 17.8,
  IDR: 0.0052,
};

function createDefaultDayPlan(dayNumber) {
  return {
    dayNumber,
    stayName: "",
    sameAsPrevious: false,
    placeNames: [],
    foodBudget: 0,
    transportBudget: 0,
  };
}

function resizeDayPlans(previousPlans, nextDays) {
  return Array.from({ length: nextDays }, (_, index) => {
    const existing = previousPlans[index];
    return existing ? { ...existing, dayNumber: index + 1 } : createDefaultDayPlan(index + 1);
  });
}

function sanitizeBudgetValue(value) {
  const asNumber = Number(value);
  if (Number.isNaN(asNumber) || asNumber < 0) {
    return 0;
  }
  return Math.round(asNumber);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseYmdDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatLocalCurrency(inrAmount, destination) {
  const currency = currencyByDestination[destination] || "INR";
  const inrPerUnit = inrPerUnitByCurrency[currency] || 1;
  const localAmount = inrPerUnit > 0 ? inrAmount / inrPerUnit : inrAmount;
  return `${currency} ${localAmount.toFixed(currency === "IDR" ? 0 : 2)}`;
}

function Planner({ initialTrip, user, onSavePlan }) {
  const initialDestination = initialTrip?.destination || initialTrip?.name?.replace(" Trip", "") || "";
  const tripName = initialTrip?.name || "My Trip";
  const initialTripDays = Math.max(
    1,
    Math.min(MAX_TRIP_DAYS, Number(initialTrip?.days) || DEFAULT_TRIP_DAYS)
  );
  const initialFilter = indiaDestinations.includes(initialDestination) ? "india" : "international";
  const [destinationFilter, setDestinationFilter] = useState(initialFilter);
  const [destination, setDestination] = useState(initialDestination);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [departureCity, setDepartureCity] = useState("");
  const [tripType, setTripType] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [flightResults, setFlightResults] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [onwardDestination, setOnwardDestination] = useState("");
  const [onwardDate, setOnwardDate] = useState("");
  const [onwardFlightResults, setOnwardFlightResults] = useState([]);
  const [selectedOnwardFlight, setSelectedOnwardFlight] = useState(null);
  const [onwardFlightSort, setOnwardFlightSort] = useState("low");
  const [showSecondFlight, setShowSecondFlight] = useState(false);
  const [flightSort, setFlightSort] = useState("low");
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [placesResults, setPlacesResults] = useState([]);
  const [tripDays, setTripDays] = useState(initialTripDays);
  const [dailyPlans, setDailyPlans] = useState(() => resizeDayPlans([], initialTripDays));
  const [secondSegmentDays, setSecondSegmentDays] = useState(3);
  const [secondDailyPlans, setSecondDailyPlans] = useState(() => resizeDayPlans([], 3));
  const [secondSelectedHostel, setSecondSelectedHostel] = useState(null);
  const [segment1DailyTarget, setSegment1DailyTarget] = useState(2500);
  const [segment1MaxBudget, setSegment1MaxBudget] = useState(12000);
  const [segment2DailyTarget, setSegment2DailyTarget] = useState(2500);
  const [segment2MaxBudget, setSegment2MaxBudget] = useState(10000);
  const [includeContingency, setIncludeContingency] = useState(true);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [flightLoading, setFlightLoading] = useState(false);
  const [onwardFlightLoading, setOnwardFlightLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [flightError, setFlightError] = useState("");
  const [onwardFlightError, setOnwardFlightError] = useState("");
  const [placesError, setPlacesError] = useState("");
  const [outboundDate, setOutboundDate] = useState(initialTrip?.startDate || "");
  const [summaryMessage, setSummaryMessage] = useState("");
  const [guideMessage, setGuideMessage] = useState("");
  const flightCacheRef = useRef(new Map());
  const placesCacheRef = useRef(new Map());
  const planStorageKey = useMemo(() => `traveltrove_saved_plans_${user?.uid || "guest"}`, [user?.uid]);

  const sortedTransportOptions = [...transportOptions].sort((a, b) => a.price - b.price);
  const destinations = destinationFilter === "international" ? internationalDestinations : indiaDestinations;
  const topPlaces = placesResults.length > 0 ? placesResults : topPlacesData[destination] || [];
  const hostels = hostelData[destination] || [];
  const secondSegmentPlaces = topPlacesData[onwardDestination] || [];
  const secondSegmentHostels = hostelData[onwardDestination] || [];
  const departureOptions = cities.filter((city) => city !== destination);
  const onwardDestinationOptions = internationalDestinations.filter((city) => city !== destination);
  const selectedPlacesCost = selectedPlaces.reduce((sum, place) => sum + place.charge, 0);

  const sortedFlights = useMemo(() => {
    const sorted = [...flightResults].sort((a, b) => a.price - b.price);
    return flightSort === "low" ? sorted : sorted.reverse();
  }, [flightResults, flightSort]);
  const sortedOnwardFlights = useMemo(() => {
    const sorted = [...onwardFlightResults].sort((a, b) => a.price - b.price);
    return onwardFlightSort === "low" ? sorted : sorted.reverse();
  }, [onwardFlightResults, onwardFlightSort]);

  const placeChargeMap = useMemo(() => {
    const map = new Map();
    topPlaces.forEach((place) => map.set(place.place, place.charge || 0));
    return map;
  }, [topPlaces]);

  const hostelPriceMap = useMemo(() => {
    const map = new Map();
    hostels.forEach((hostel) => map.set(hostel.name, hostel.price || 0));
    return map;
  }, [hostels]);
  const secondPlaceChargeMap = useMemo(() => {
    const map = new Map();
    secondSegmentPlaces.forEach((place) => map.set(place.place, place.charge || 0));
    return map;
  }, [secondSegmentPlaces]);
  const secondHostelPriceMap = useMemo(() => {
    const map = new Map();
    secondSegmentHostels.forEach((hostel) => map.set(hostel.name, hostel.price || 0));
    return map;
  }, [secondSegmentHostels]);

  const resolvedDailyPlans = useMemo(() => {
    const resolved = [];
    for (let index = 0; index < dailyPlans.length; index += 1) {
      const plan = dailyPlans[index];
      const previous = index > 0 ? resolved[index - 1] : null;
      const stayNameResolved =
        plan.sameAsPrevious && previous
          ? previous.stayNameResolved
          : plan.stayName || selectedHostel?.name || "";
      const placesCost = plan.placeNames.reduce((sum, placeName) => sum + (placeChargeMap.get(placeName) || 0), 0);
      const stayCost = stayNameResolved ? hostelPriceMap.get(stayNameResolved) || 0 : 0;
      const foodBudget = sanitizeBudgetValue(plan.foodBudget);
      const transportBudget = sanitizeBudgetValue(plan.transportBudget);
      resolved.push({
        ...plan,
        dayNumber: index + 1,
        stayNameResolved,
        placesCost,
        stayCost,
        foodBudget,
        transportBudget,
        dayTotal: stayCost + placesCost + foodBudget + transportBudget,
      });
    }
    return resolved;
  }, [dailyPlans, hostelPriceMap, placeChargeMap, selectedHostel]);
  const resolvedSecondDailyPlans = useMemo(() => {
    const resolved = [];
    for (let index = 0; index < secondDailyPlans.length; index += 1) {
      const plan = secondDailyPlans[index];
      const previous = index > 0 ? resolved[index - 1] : null;
      const stayNameResolved =
        plan.sameAsPrevious && previous
          ? previous.stayNameResolved
          : plan.stayName || secondSelectedHostel?.name || "";
      const placesCost = plan.placeNames.reduce(
        (sum, placeName) => sum + (secondPlaceChargeMap.get(placeName) || 0),
        0
      );
      const stayCost = stayNameResolved ? secondHostelPriceMap.get(stayNameResolved) || 0 : 0;
      const foodBudget = sanitizeBudgetValue(plan.foodBudget);
      const transportBudget = sanitizeBudgetValue(plan.transportBudget);
      resolved.push({
        ...plan,
        dayNumber: index + 1,
        stayNameResolved,
        placesCost,
        stayCost,
        foodBudget,
        transportBudget,
        dayTotal: stayCost + placesCost + foodBudget + transportBudget,
      });
    }
    return resolved;
  }, [secondDailyPlans, secondHostelPriceMap, secondPlaceChargeMap, secondSelectedHostel]);

  const itineraryTotal = resolvedDailyPlans.reduce((sum, dayPlan) => sum + dayPlan.dayTotal, 0);
  const secondItineraryTotal = resolvedSecondDailyPlans.reduce((sum, dayPlan) => sum + dayPlan.dayTotal, 0);
  const outboundDateObject = parseYmdDate(outboundDate);
  const onwardDateObject = parseYmdDate(onwardDate);
  const minOnwardDate = outboundDateObject ? addDays(outboundDateObject, Math.max(tripDays, 0)) : null;
  const onwardDateValid = !minOnwardDate || !onwardDateObject || onwardDateObject >= minOnwardDate;
  const onwardFlightCost = tripType === "continue" && showSecondFlight ? selectedOnwardFlight?.price || 0 : 0;
  const preContingencyTotal =
    (selectedFlight?.price || 0) +
    itineraryTotal +
    onwardFlightCost +
    (tripType === "continue" && showSecondFlight ? secondItineraryTotal : 0);
  const contingencyAmount = includeContingency
    ? Math.round((preContingencyTotal * sanitizeBudgetValue(contingencyPercent)) / 100)
    : 0;
  const totalCost = preContingencyTotal + contingencyAmount;
  const tripTypeLabel =
    tripTypeOptions.find((option) => option.value === tripType)?.label || "Decision pending";
  const segment1CompletedDays = resolvedDailyPlans.filter(
    (dayPlan) =>
      Boolean(dayPlan.stayNameResolved) &&
      sanitizeBudgetValue(dayPlan.foodBudget) > 0 &&
      sanitizeBudgetValue(dayPlan.transportBudget) > 0
  ).length;
  const segment1Complete = Boolean(destination) && Boolean(selectedFlight) && segment1CompletedDays === tripDays;
  const segment2IsActive = tripType === "continue" && showSecondFlight && onwardDestination;
  const segment2CompletedDays = resolvedSecondDailyPlans.filter(
    (dayPlan) =>
      Boolean(dayPlan.stayNameResolved) &&
      sanitizeBudgetValue(dayPlan.foodBudget) > 0 &&
      sanitizeBudgetValue(dayPlan.transportBudget) > 0
  ).length;
  const segment2Complete =
    !segment2IsActive ||
    (Boolean(selectedOnwardFlight) && secondSegmentDays > 0 && segment2CompletedDays === secondSegmentDays);
  const setupComplete = Boolean(destination) && tripDays > 0;
  const currentMission =
    !setupComplete
      ? "setup"
      : !selectedFlight
        ? "flights"
        : !segment1Complete
          ? "itinerary-segment1"
          : !tripType
            ? "continue-choice"
            : tripType === "continue" && !onwardDestination
              ? "continue-choice"
              : tripType === "continue" && !selectedOnwardFlight
                ? "flights"
                : segment2IsActive && !segment2Complete
                  ? "itinerary-segment2"
                  : "summary";
  const showSetupSection = currentMission === "setup";
  const showFlightsSection = currentMission === "flights";
  const showSegment1PlanningSection = currentMission === "itinerary-segment1";
  const showSegment2PlanningSection = currentMission === "itinerary-segment2";
  const showContinueChoiceSection = currentMission === "continue-choice";
  const showItinerarySection = showSegment1PlanningSection || showSegment2PlanningSection;
  const showSummarySection = currentMission === "summary";
  const missionTitle =
    currentMission === "setup"
      ? "Trip setup"
      : currentMission === "flights"
        ? "Set up flights"
        : currentMission === "itinerary-segment1"
          ? `Complete Segment 1 day plan (${destination})`
          : currentMission === "itinerary-segment2"
            ? `Complete Segment 2 day plan (${onwardDestination})`
            : currentMission === "continue-choice"
              ? "Continue trip or return"
              : "Review and save";
  const missionHint =
    currentMission === "setup"
      ? "Set first destination and number of days."
      : currentMission === "flights"
        ? "Choose Flight 1 first. Flight 2 unlocks only after Segment 1 day cards are complete."
        : currentMission === "itinerary-segment1"
          ? `Complete all ${tripDays} days with stay + food + local transport.`
          : currentMission === "itinerary-segment2"
            ? `Complete all ${secondSegmentDays} days for ${onwardDestination}.`
            : currentMission === "continue-choice"
              ? "Choose whether to end this trip or add a second destination with Flight 2."
              : "Everything is complete. Save or download summary.";
  const segment1OverDailyTarget =
    tripDays > 0 && itineraryTotal / tripDays > sanitizeBudgetValue(segment1DailyTarget);
  const segment1OverMax = itineraryTotal > sanitizeBudgetValue(segment1MaxBudget);
  const segment2OverDailyTarget =
    segment2IsActive &&
    secondSegmentDays > 0 &&
    secondItineraryTotal / secondSegmentDays > sanitizeBudgetValue(segment2DailyTarget);
  const segment2OverMax = segment2IsActive && secondItineraryTotal > sanitizeBudgetValue(segment2MaxBudget);

  useEffect(() => {
    if (!showSecondFlight || !minOnwardDate) {
      return;
    }
    const suggested = minOnwardDate.toISOString().slice(0, 10);
    if (!onwardDate || (onwardDateObject && onwardDateObject < minOnwardDate)) {
      setOnwardDate(suggested);
    }
  }, [showSecondFlight, minOnwardDate, onwardDate, onwardDateObject]);

  useEffect(() => {
    if (tripType === "continue" && segment1Complete) {
      setShowSecondFlight(true);
      return;
    }
    setShowSecondFlight(false);
  }, [tripType, segment1Complete]);

  const handleDestinationChange = (event) => {
    const nextDestination = event.target.value;
    setDestination(nextDestination);
    setSelectedHostel(null);
    setSelectedPlaces([]);
    setSelectedFlight(null);
    setOnwardFlightResults([]);
    setSelectedOnwardFlight(null);
    setShowSecondFlight(false);
    setOnwardDestination("");
    setOnwardDate("");
    setSecondSegmentDays(3);
    setSecondDailyPlans(resizeDayPlans([], 3));
    setSecondSelectedHostel(null);
    setFlightResults([]);
    setPlacesResults([]);
    setDailyPlans(resizeDayPlans([], tripDays));
    setFlightError("");
    setOnwardFlightError("");
    setPlacesError("");
    const cachedPlaces = placesCacheRef.current.get(nextDestination);
    if (cachedPlaces) setPlacesResults(cachedPlaces);
    if (departureCity === nextDestination) setDepartureCity("");
  };

  const handleDestinationFilterChange = (event) => {
    const nextFilter = event.target.value;
    const filteredDestinations = nextFilter === "international" ? internationalDestinations : indiaDestinations;
    setDestinationFilter(nextFilter);
    if (!filteredDestinations.includes(destination)) {
      setDestination("");
      setSelectedHostel(null);
      setSelectedPlaces([]);
      setSelectedFlight(null);
      setOnwardFlightResults([]);
      setSelectedOnwardFlight(null);
      setShowSecondFlight(false);
      setOnwardDestination("");
      setOnwardDate("");
      setSecondSegmentDays(3);
      setSecondDailyPlans(resizeDayPlans([], 3));
      setSecondSelectedHostel(null);
      setFlightResults([]);
      setPlacesResults([]);
      setDailyPlans(resizeDayPlans([], tripDays));
      setFlightError("");
      setOnwardFlightError("");
      setPlacesError("");
    }
  };

  const handleTripDaysChange = (event) => {
    const requestedDays = Number(event.target.value);
    const safeDays = Number.isNaN(requestedDays)
      ? 1
      : Math.max(1, Math.min(MAX_TRIP_DAYS, Math.round(requestedDays)));
    setTripDays(safeDays);
    setDailyPlans((previous) => resizeDayPlans(previous, safeDays));
  };
  const handleSecondSegmentDaysChange = (event) => {
    const requestedDays = Number(event.target.value);
    const safeDays = Number.isNaN(requestedDays)
      ? 1
      : Math.max(1, Math.min(MAX_TRIP_DAYS, Math.round(requestedDays)));
    setSecondSegmentDays(safeDays);
    setSecondDailyPlans((previous) => resizeDayPlans(previous, safeDays));
  };

  const handleTripTypeChange = (event) => {
    const nextType = event.target.value;
    setTripType(nextType);
    if (nextType !== "continue") {
      setOnwardDestination("");
      setOnwardDate("");
      setOnwardFlightResults([]);
      setSelectedOnwardFlight(null);
      setOnwardFlightError("");
      setShowSecondFlight(false);
      setSecondSegmentDays(3);
      setSecondDailyPlans(resizeDayPlans([], 3));
      setSecondSelectedHostel(null);
    }
  };


  const updateDayPlan = (index, patch) => {
    setDailyPlans((previous) => previous.map((plan, planIndex) => (planIndex !== index ? plan : { ...plan, ...patch })));
  };
  const updateSecondDayPlan = (index, patch) => {
    setSecondDailyPlans((previous) =>
      previous.map((plan, planIndex) => (planIndex !== index ? plan : { ...plan, ...patch }))
    );
  };

  const handleDayPlaceToggle = (index, placeName) => {
    setDailyPlans((previous) =>
      previous.map((plan, planIndex) => {
        if (planIndex !== index) return plan;
        const exists = plan.placeNames.includes(placeName);
        return {
          ...plan,
          placeNames: exists
            ? plan.placeNames.filter((name) => name !== placeName)
            : [...plan.placeNames, placeName],
        };
      })
    );
  };
  const handleSecondDayPlaceToggle = (index, placeName) => {
    setSecondDailyPlans((previous) =>
      previous.map((plan, planIndex) => {
        if (planIndex !== index) return plan;
        const exists = plan.placeNames.includes(placeName);
        return {
          ...plan,
          placeNames: exists
            ? plan.placeNames.filter((name) => name !== placeName)
            : [...plan.placeNames, placeName],
        };
      })
    );
  };

  const applySelectedHostelToAllDays = () => {
    if (!selectedHostel) return;
    setDailyPlans((previous) =>
      previous.map((plan, index) => ({
        ...plan,
        stayName: selectedHostel.name,
        sameAsPrevious: index > 0,
      }))
    );
  };

  const handleFlightSearch = async () => {
    if (!destination || !departureCity) {
      setFlightResults([]);
      setSelectedFlight(null);
      setFlightError("Select both Flight 1 From and Flight 1 To.");
      return;
    }

    const cacheKey = `${departureCity}|${destination}|${passengers}|${outboundDate}`;
    const cachedFlights = flightCacheRef.current.get(cacheKey);
    if (cachedFlights) {
      setFlightResults(cachedFlights);
      setSelectedFlight([...cachedFlights].sort((a, b) => a.price - b.price)[0] || null);
      setFlightError("");
      return;
    }

    setFlightLoading(true);
    setFlightError("");

    try {
      const query = new URLSearchParams({ from: departureCity, to: destination, adults: String(passengers) });
      if (outboundDate) query.set("date", outboundDate);

      const response = await fetch(`${apiBaseUrl}/api/search/flights?${query.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to fetch flights.");

      const apiFlights = Array.isArray(data.flights) ? data.flights : [];
      if (apiFlights.length === 0) {
        setFlightError("No live flights found for this route/date. Try another date or city.");
      }
      const results =
        apiFlights.length > 0
          ? apiFlights
          : airlineTemplates.map((airlineData, index) => ({
              id: `${airlineData.airline}-${index}`,
              airline: airlineData.airline,
              price: 2800 + index * 500 + passengers * 350,
              duration: `${2 + index}h ${15 + index * 10}m`,
              departureTime: "",
              arrivalTime: "",
            }));

      flightCacheRef.current.set(cacheKey, results);
      setFlightResults(results);
      const lowest = [...results].sort((a, b) => a.price - b.price)[0];
      setSelectedFlight(lowest || null);
    } catch (error) {
      setFlightResults([]);
      setSelectedFlight(null);
      setFlightError(error.message || "Unable to fetch flights.");
    } finally {
      setFlightLoading(false);
    }
  };
  const applySecondSelectedHostelToAllDays = () => {
    if (!secondSelectedHostel) return;
    setSecondDailyPlans((previous) =>
      previous.map((plan, index) => ({
        ...plan,
        stayName: secondSelectedHostel.name,
        sameAsPrevious: index > 0,
      }))
    );
  };
  const copyDayOneTemplateToAll = () => {
    if (dailyPlans.length === 0) return;
    const dayOne = dailyPlans[0];
    setDailyPlans((previous) =>
      previous.map((plan, index) => ({
        ...plan,
        stayName: dayOne.stayName,
        sameAsPrevious: index > 0,
        placeNames: [...dayOne.placeNames],
        foodBudget: dayOne.foodBudget,
        transportBudget: dayOne.transportBudget,
      }))
    );
  };
  const copyDayOnePlacesToAllDays = () => {
    if (dailyPlans.length === 0) return;
    const dayOnePlaces = dailyPlans[0].placeNames || [];
    setDailyPlans((previous) =>
      previous.map((plan) => ({
        ...plan,
        placeNames: [...dayOnePlaces],
      }))
    );
  };
  const copySecondDayOneTemplateToAll = () => {
    if (secondDailyPlans.length === 0) return;
    const dayOne = secondDailyPlans[0];
    setSecondDailyPlans((previous) =>
      previous.map((plan, index) => ({
        ...plan,
        stayName: dayOne.stayName,
        sameAsPrevious: index > 0,
        placeNames: [...dayOne.placeNames],
        foodBudget: dayOne.foodBudget,
        transportBudget: dayOne.transportBudget,
      }))
    );
  };
  const copySecondDayOnePlacesToAll = () => {
    if (secondDailyPlans.length === 0) return;
    const dayOnePlaces = secondDailyPlans[0].placeNames || [];
    setSecondDailyPlans((previous) =>
      previous.map((plan) => ({
        ...plan,
        placeNames: [...dayOnePlaces],
      }))
    );
  };

  const handleOnwardFlightSearch = async () => {
    if (tripType !== "continue" || !showSecondFlight) {
      return;
    }
    if (!destination || !onwardDestination) {
      setOnwardFlightResults([]);
      setSelectedOnwardFlight(null);
      setOnwardFlightError("Select both Flight 2 From and Flight 2 To.");
      return;
    }
    if (!onwardDateValid) {
      setOnwardFlightResults([]);
      setSelectedOnwardFlight(null);
      setOnwardFlightError("Date you leave must be on/after your last day in segment 1.");
      return;
    }

    const cacheKey = `onward|${destination}|${onwardDestination}|${passengers}|${onwardDate}`;
    const cachedFlights = flightCacheRef.current.get(cacheKey);
    if (cachedFlights) {
      setOnwardFlightResults(cachedFlights);
      setSelectedOnwardFlight([...cachedFlights].sort((a, b) => a.price - b.price)[0] || null);
      setOnwardFlightError("");
      return;
    }

    setOnwardFlightLoading(true);
    setOnwardFlightError("");
    try {
      const query = new URLSearchParams({
        from: destination,
        to: onwardDestination,
        adults: String(passengers),
      });
      if (onwardDate) {
        query.set("date", onwardDate);
      }

      const response = await fetch(`${apiBaseUrl}/api/search/flights?${query.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch onward flights.");
      }

      const apiFlights = Array.isArray(data.flights) ? data.flights : [];
      if (apiFlights.length === 0) {
        setOnwardFlightError("No onward flights found for this route/date. Try another date or destination.");
      }
      const results =
        apiFlights.length > 0
          ? apiFlights
          : airlineTemplates.map((airlineData, index) => ({
              id: `onward-${airlineData.airline}-${index}`,
              airline: airlineData.airline,
              price: 3500 + index * 600 + passengers * 400,
              duration: `${3 + index}h ${10 + index * 10}m`,
              departureTime: "",
              arrivalTime: "",
            }));

      flightCacheRef.current.set(cacheKey, results);
      setOnwardFlightResults(results);
      const lowest = [...results].sort((a, b) => a.price - b.price)[0];
      setSelectedOnwardFlight(lowest || null);
    } catch (error) {
      setOnwardFlightResults([]);
      setSelectedOnwardFlight(null);
      setOnwardFlightError(error.message || "Unable to fetch onward flights.");
    } finally {
      setOnwardFlightLoading(false);
    }
  };

  const handleLoadPlaces = async () => {
    if (!destination) return;

    const cachedPlaces = placesCacheRef.current.get(destination);
    if (cachedPlaces) {
      setPlacesResults(cachedPlaces);
      setPlacesError("");
      return;
    }

    setPlacesLoading(true);
    setPlacesError("");
    try {
      const query = new URLSearchParams({ destination });
      const response = await fetch(`${apiBaseUrl}/api/search/places?${query.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to fetch places.");

      const apiPlaces = Array.isArray(data.places) ? data.places : [];
      placesCacheRef.current.set(destination, apiPlaces);
      setPlacesResults(apiPlaces);
    } catch (error) {
      setPlacesResults([]);
      setPlacesError(error.message || "Unable to fetch places.");
    } finally {
      setPlacesLoading(false);
    }
  };

  const handlePlaceToggle = (place) => {
    setSelectedPlaces((previous) => {
      const exists = previous.some((selected) => selected.place === place.place);
      if (exists) return previous.filter((selected) => selected.place !== place.place);
      return [...previous, place];
    });
  };

  const summaryPayload = {
    website: "TravelTrove",
    generatedAt: new Date().toISOString(),
    tripName,
    tripType: tripTypeLabel,
    destination,
    outboundDate: outboundDate || "Not selected",
    departureCity: departureCity || "Not selected",
    onwardDestination: onwardDestination || "Not selected",
    onwardDate: onwardDate || "Not selected",
    passengers,
    days: tripDays,
    secondSegmentDays: segment2IsActive ? secondSegmentDays : 0,
    flight: selectedFlight
      ? { airline: selectedFlight.airline, price: selectedFlight.price, duration: selectedFlight.duration || "N/A" }
      : null,
    itineraryDays: resolvedDailyPlans.map((dayPlan) => ({
      day: dayPlan.dayNumber,
      stay: dayPlan.stayNameResolved || "Not selected",
      stayCost: dayPlan.stayCost,
      places: dayPlan.placeNames,
      placesCost: dayPlan.placesCost,
      foodBudget: dayPlan.foodBudget,
      transportBudget: dayPlan.transportBudget,
      dayTotal: dayPlan.dayTotal,
    })),
    secondSegmentItineraryDays: segment2IsActive
      ? resolvedSecondDailyPlans.map((dayPlan) => ({
          day: dayPlan.dayNumber,
          stay: dayPlan.stayNameResolved || "Not selected",
          stayCost: dayPlan.stayCost,
          places: dayPlan.placeNames,
          placesCost: dayPlan.placesCost,
          foodBudget: dayPlan.foodBudget,
          transportBudget: dayPlan.transportBudget,
          dayTotal: dayPlan.dayTotal,
        }))
      : [],
    shortlistedPlaces: selectedPlaces.map((place) => ({ name: place.place, charge: place.charge || 0 })),
    transport: sortedTransportOptions,
    totals: {
      itineraryTotal,
      secondItineraryTotal: segment2IsActive ? secondItineraryTotal : 0,
      selectedPlacesCost,
      preContingencyTotal,
      contingencyAmount,
      estimatedTotal: totalCost,
      outboundFlightCost: selectedFlight?.price || 0,
      onwardFlightCost,
    },
    budgets: {
      segment1DailyTarget: sanitizeBudgetValue(segment1DailyTarget),
      segment1MaxBudget: sanitizeBudgetValue(segment1MaxBudget),
      segment2DailyTarget: sanitizeBudgetValue(segment2DailyTarget),
      segment2MaxBudget: sanitizeBudgetValue(segment2MaxBudget),
    },
    currencies: {
      segment1Currency: currencyByDestination[destination] || "INR",
      segment2Currency: currencyByDestination[onwardDestination] || "INR",
    },
    onwardFlight:
      tripType === "continue" && showSecondFlight && selectedOnwardFlight
        ? {
            airline: selectedOnwardFlight.airline,
            price: selectedOnwardFlight.price,
            duration: selectedOnwardFlight.duration || "N/A",
          }
        : null,
  };

  const handleSavePlan = () => {
    try {
      const raw = localStorage.getItem(planStorageKey);
      const existing = raw ? JSON.parse(raw) : [];
      const record = { id: Date.now(), ...summaryPayload };
      localStorage.setItem(planStorageKey, JSON.stringify([record, ...existing]));
      if (typeof onSavePlan === "function") {
        onSavePlan(record);
      }
      setSummaryMessage("Plan saved to TravelTrove.");
    } catch {
      setSummaryMessage("Could not save plan.");
    }
  };

  const handleDownloadSummary = () => {
    const itineraryMarkup =
      summaryPayload.itineraryDays.length > 0
        ? summaryPayload.itineraryDays
            .map((dayPlan) => {
              const placesMarkup = dayPlan.places.length > 0 ? escapeHtml(dayPlan.places.join(", ")) : "No places selected";
              return `<li>
                <strong>Day ${dayPlan.day}</strong><br />
                Stay: ${escapeHtml(dayPlan.stay)} (${escapeHtml(formatInr(dayPlan.stayCost))})<br />
                Places: ${placesMarkup} (${escapeHtml(formatInr(dayPlan.placesCost))})<br />
                Food: ${escapeHtml(formatInr(dayPlan.foodBudget))} | Transport: ${escapeHtml(formatInr(dayPlan.transportBudget))}<br />
                Day Total: ${escapeHtml(formatInr(dayPlan.dayTotal))}
              </li>`;
            })
            .join("")
        : "<li>No itinerary days planned.</li>";
    const secondItineraryMarkup =
      summaryPayload.secondSegmentItineraryDays.length > 0
        ? summaryPayload.secondSegmentItineraryDays
            .map((dayPlan) => {
              const placesMarkup = dayPlan.places.length > 0 ? escapeHtml(dayPlan.places.join(", ")) : "No places selected";
              return `<li>
                <strong>Day ${dayPlan.day}</strong><br />
                Stay: ${escapeHtml(dayPlan.stay)} (${escapeHtml(formatInr(dayPlan.stayCost))})<br />
                Places: ${placesMarkup} (${escapeHtml(formatInr(dayPlan.placesCost))})<br />
                Food: ${escapeHtml(formatInr(dayPlan.foodBudget))} | Transport: ${escapeHtml(formatInr(dayPlan.transportBudget))}<br />
                Day Total: ${escapeHtml(formatInr(dayPlan.dayTotal))}
              </li>`;
            })
            .join("")
        : "<li>No second destination day plan.</li>";

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TravelTrove Trip Summary</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    .card { border: 2px solid #0f172a; border-radius: 12px; padding: 20px; max-width: 720px; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    .sub { color: #475569; margin: 0 0 18px; }
    h2 { margin: 16px 0 8px; font-size: 18px; }
    p, li { font-size: 14px; line-height: 1.45; margin: 4px 0; }
    ul { padding-left: 18px; }
    .total { margin-top: 14px; font-size: 20px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <h1>TravelTrove Trip Summary</h1>
    <p class="sub">Generated by TravelTrove on ${escapeHtml(new Date(summaryPayload.generatedAt).toLocaleString())}</p>
    <h2>Trip</h2>
    <p><strong>Name:</strong> ${escapeHtml(summaryPayload.tripName)}</p>
    <p><strong>Destination:</strong> ${escapeHtml(summaryPayload.destination || "Not selected")}</p>
    <p><strong>Departure City:</strong> ${escapeHtml(summaryPayload.departureCity)}</p>
    <p><strong>Flight 1 Date:</strong> ${escapeHtml(summaryPayload.outboundDate)}</p>
    <p><strong>Trip Style:</strong> ${escapeHtml(summaryPayload.tripType)}</p>
    <p><strong>Passengers:</strong> ${summaryPayload.passengers}</p>
    <p><strong>Days:</strong> ${summaryPayload.days}</p>
    <h2>Flight 1</h2>
    <p>${summaryPayload.flight ? `${escapeHtml(summaryPayload.flight.airline)} | ${escapeHtml(formatInr(summaryPayload.flight.price))} | ${escapeHtml(summaryPayload.flight.duration)}` : "No flight selected."}</p>
    <h2>Flight 2 (Optional)</h2>
    <p>${summaryPayload.onwardFlight ? `${escapeHtml(summaryPayload.onwardDestination)} on ${escapeHtml(summaryPayload.onwardDate)} | ${escapeHtml(summaryPayload.onwardFlight.airline)} | ${escapeHtml(formatInr(summaryPayload.onwardFlight.price))} | ${escapeHtml(summaryPayload.onwardFlight.duration)}` : "No second flight selected."}</p>
    <h2>Day-wise Itinerary</h2>
    <p><strong>Segment 1:</strong> ${escapeHtml(summaryPayload.destination || "Not selected")}</p>
    <ul>${itineraryMarkup}</ul>
    <h2>Second Destination Itinerary</h2>
    <p><strong>Segment 2:</strong> ${escapeHtml(summaryPayload.onwardDestination || "Not selected")}</p>
    <ul>${secondItineraryMarkup}</ul>
    <p><strong>Subtotal before buffer:</strong> ${escapeHtml(formatInr(summaryPayload.totals.preContingencyTotal))}</p>
    <p><strong>Contingency:</strong> ${escapeHtml(formatInr(summaryPayload.totals.contingencyAmount))}</p>
    <div class="total">Estimated Total: ${escapeHtml(formatInr(summaryPayload.totals.estimatedTotal))}</div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTripName = tripName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    anchor.href = url;
    anchor.download = `traveltrove-summary-${safeTripName || "trip"}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setSummaryMessage("Summary downloaded.");
  };

  return (
    <div className="planner-page">
      {initialTrip?.lastSavedPlan && (
        <div className="planner-subcard planner-progress-card">
          <p className="planner-label">Last Saved Plan Snapshot</p>
          <p className="planner-current-step">{initialTrip.lastSavedPlan.tripName}</p>
          <p className="planner-selected-hostel">
            Destination: {initialTrip.lastSavedPlan.destination || "Not selected"} | Days:{" "}
            {initialTrip.lastSavedPlan.days || 0}
          </p>
          <p className="planner-selected-hostel">
            Estimated Total: {formatInr(initialTrip.lastSavedPlan?.totals?.estimatedTotal || 0)}
          </p>
          <div className="planner-days-list">
            {(initialTrip.lastSavedPlan.itineraryDays || []).map((dayPlan) => (
              <div className="planner-day-card" key={`saved-day-${dayPlan.day}`}>
                <p className="planner-day-title">Day {dayPlan.day}</p>
                <p className="planner-day-note">Stay: {dayPlan.stay || "Not selected"}</p>
                <p className="planner-day-note">
                  Places: {dayPlan.places?.length ? dayPlan.places.join(", ") : "No places selected"}
                </p>
                <p className="planner-day-note">
                  Food: {formatInr(dayPlan.foodBudget || 0)} | Transport: {formatInr(dayPlan.transportBudget || 0)}
                </p>
                <p className="planner-day-total">Day Total: {formatInr(dayPlan.dayTotal || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="planner-subcard planner-progress-card">
        <p className="planner-label">Trip Journey</p>
        <p className="planner-current-step">{missionTitle}</p>
        <p className="planner-selected-hostel">{missionHint}</p>
        <div className="planner-transport-list">
          <div className="planner-transport-card">
            <p className="planner-transport-type">Segment 1 ({destination || "Not started"})</p>
            <p className="planner-transport-price">
              {segment1Complete ? "Complete" : `${segment1CompletedDays}/${tripDays} days complete`}
            </p>
          </div>
          <div className="planner-transport-card">
            <p className="planner-transport-type">Segment 2 ({onwardDestination || "Locked"})</p>
            <p className="planner-transport-price">
              {!tripType
                ? "Decision pending"
                : tripType !== "continue"
                  ? "Return selected"
                : !showSecondFlight
                  ? segment1Complete
                    ? "Ready to add Flight 2"
                    : "Locked until Segment 1 complete"
                  : segment2Complete
                    ? "Complete"
                    : `${segment2CompletedDays}/${secondSegmentDays} days complete`}
            </p>
          </div>
        </div>
        <p className="planner-selected-hostel">Current estimate: {formatInr(totalCost)}</p>
        {guideMessage && <p className="planner-inline-error">{guideMessage}</p>}
      </div>
      <div className="planner-dashboard">
        <div className="planner-column">
          {showSetupSection && (
          <div className="planner-card">
            <h2 className="planner-title">Trip Setup</h2>

            <label className="planner-label" htmlFor="destination-filter">
              Destination Focus
            </label>
            <select
              id="destination-filter"
              className="planner-select"
              value={destinationFilter}
              onChange={handleDestinationFilterChange}
            >
              <option value="international">International (Recommended)</option>
              <option value="india">India (Limited)</option>
            </select>

            <label className="planner-label" htmlFor="destination">
              First destination
            </label>
            <select id="destination" className="planner-select" value={destination} onChange={handleDestinationChange}>
              <option value="">Select a destination</option>
              {destinations.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>

            <label className="planner-label" htmlFor="setup-first-days">
              Days in first destination
            </label>
            <input
              id="setup-first-days"
              type="number"
              min="1"
              max={MAX_TRIP_DAYS}
              className="planner-select"
              value={tripDays}
              onChange={handleTripDaysChange}
            />

            {!setupComplete && (
              <p className="planner-inline-error">
                Complete first destination and days.
              </p>
            )}
          </div>
          )}

          {showFlightsSection && (
          <div className="planner-subcard">
            <h3 className="planner-subtitle">Flight 1</h3>

            <label className="planner-label" htmlFor="departure-city">
              Flight 1 From
            </label>
            <select
              id="departure-city"
              className="planner-select"
              value={departureCity}
              onChange={(event) => setDepartureCity(event.target.value)}
            >
              <option value="">Select departure city</option>
              {departureOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <p className="planner-label">Flight 1 To</p>
            <p className="planner-arrival-city">{destination || "Select destination above"}</p>

            <label className="planner-label" htmlFor="passengers">
              Passengers
            </label>
            <select
              id="passengers"
              className="planner-select"
              value={passengers}
              onChange={(event) => setPassengers(Number(event.target.value))}
            >
              {passengerOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>

            <p className="planner-label">Plan Type</p>
            <p className="planner-arrival-city">{tripTypeLabel}</p>

            <label className="planner-label" htmlFor="outbound-date">
              Date you start trip
            </label>
            <input
              id="outbound-date"
              type="date"
              className="planner-select"
              value={outboundDate}
              onChange={(event) => setOutboundDate(event.target.value)}
            />

            <button type="button" className="planner-button" onClick={handleFlightSearch}>
              {flightLoading ? "Loading Flight 1..." : "Load Flight 1"}
            </button>
            {flightError && <p className="planner-inline-error">{flightError}</p>}

            {flightResults.length > 0 && (
              <>
                <label className="planner-label" htmlFor="flight-sort">
                  Sort by price
                </label>
                <select
                  id="flight-sort"
                  className="planner-select"
                  value={flightSort}
                  onChange={(event) => setFlightSort(event.target.value)}
                >
                  <option value="low">Lowest to Highest</option>
                  <option value="high">Highest to Lowest</option>
                </select>

                <div className="planner-flight-options">
                  {sortedFlights.map((flight) => (
                    <label
                      key={flight.id}
                      className={`planner-flight-card${selectedFlight?.id === flight.id ? " is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="flight-option"
                        checked={selectedFlight?.id === flight.id}
                        onChange={() => setSelectedFlight(flight)}
                      />
                      <div>
                        <p>{flight.airline}</p>
                        <p>{formatInr(flight.price)}</p>
                        <span>
                          {flight.duration}
                          {flight.departureTime && flight.arrivalTime
                            ? ` | ${flight.departureTime} - ${flight.arrivalTime}`
                            : ""}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedFlight && (
                  <p className="planner-selected-hostel">
                    Selected Flight 1: {selectedFlight.airline} ({formatInr(selectedFlight.price)})
                  </p>
                )}
              </>
            )}

            {tripType === "continue" && (
              <>
                {showSecondFlight && (
                  <>
                    <h4 className="planner-subtitle">Flight 2 (Optional)</h4>
                    <p className="planner-label">Flight 2 From</p>
                    <p className="planner-arrival-city">{destination || "Select destination above"}</p>
                    <label className="planner-label" htmlFor="onward-destination">
                      Flight 2 To
                    </label>
                    <select
                      id="onward-destination"
                      className="planner-select"
                      value={onwardDestination}
                      onChange={(event) => setOnwardDestination(event.target.value)}
                    >
                      <option value="">Select next country/city</option>
                      {onwardDestinationOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>

                    <label className="planner-label" htmlFor="onward-date">
                      Date you leave {destination || "this city"}
                    </label>
                    <input
                      id="onward-date"
                      type="date"
                      className="planner-select"
                      value={onwardDate}
                      onChange={(event) => setOnwardDate(event.target.value)}
                    />
                    {minOnwardDate && (
                      <p className="planner-label">
                        Earliest date based on stay: {minOnwardDate.toLocaleDateString()}
                      </p>
                    )}
                    {!onwardDateValid && (
                      <p className="planner-inline-error">
                        Date you leave must be on/after {minOnwardDate?.toLocaleDateString()}.
                      </p>
                    )}
                    <button type="button" className="planner-button" onClick={handleOnwardFlightSearch}>
                      {onwardFlightLoading ? "Loading Flight 2..." : "Load Flight 2"}
                    </button>
                    {onwardFlightError && <p className="planner-inline-error">{onwardFlightError}</p>}

                    {onwardFlightResults.length > 0 && (
                      <>
                        <label className="planner-label" htmlFor="onward-flight-sort">
                          Flight 2 sort by price
                        </label>
                        <select
                          id="onward-flight-sort"
                          className="planner-select"
                          value={onwardFlightSort}
                          onChange={(event) => setOnwardFlightSort(event.target.value)}
                        >
                          <option value="low">Lowest to Highest</option>
                          <option value="high">Highest to Lowest</option>
                        </select>

                        <div className="planner-flight-options">
                          {sortedOnwardFlights.map((flight) => (
                            <label
                              key={flight.id}
                              className={`planner-flight-card${
                                selectedOnwardFlight?.id === flight.id ? " is-selected" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="onward-flight-option"
                                checked={selectedOnwardFlight?.id === flight.id}
                                onChange={() => setSelectedOnwardFlight(flight)}
                              />
                              <div>
                                <p>{flight.airline}</p>
                                <p>{formatInr(flight.price)}</p>
                                <span>
                                  {flight.duration}
                                  {flight.departureTime && flight.arrivalTime
                                    ? ` | ${flight.departureTime} - ${flight.arrivalTime}`
                                    : ""}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                        {selectedOnwardFlight && (
                          <p className="planner-selected-hostel">
                            Selected Flight 2: {selectedOnwardFlight.airline} ({formatInr(selectedOnwardFlight.price)})
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className="planner-day-note">
                  <p>Timeline preview</p>
                  <p>Day 1-{tripDays}: Stay in {destination || "your destination"}.</p>
                  {showSecondFlight && onwardDestination && onwardDate && (
                    <p>
                      Day {tripDays + 1}: Fly to {onwardDestination} on{" "}
                      {new Date(`${onwardDate}T00:00:00`).toLocaleDateString()}.
                    </p>
                  )}
                  {segment2IsActive && <p>Then spend {secondSegmentDays} day(s) in {onwardDestination}.</p>}
                </div>
              </>
            )}
          </div>
          )}

          {showContinueChoiceSection && (
            <div className="planner-subcard">
              <h3 className="planner-subtitle">Continue or Return</h3>
              <p className="planner-selected-hostel">
                Segment 1 is complete. Do you want to continue to a next destination?
              </p>
              <div className="planner-summary-actions">
                <button
                  type="button"
                  className="planner-button"
                  onClick={() => handleTripTypeChange({ target: { value: "continue" } })}
                >
                  Continue to Next
                </button>
                <button
                  type="button"
                  className="planner-back-btn"
                  onClick={() => handleTripTypeChange({ target: { value: "single" } })}
                >
                  Return / Finish
                </button>
              </div>

              {tripType === "continue" && (
                <>
                  <label className="planner-label" htmlFor="continue-next-destination">
                    Next destination
                  </label>
                  <select
                    id="continue-next-destination"
                    className="planner-select"
                    value={onwardDestination}
                    onChange={(event) => setOnwardDestination(event.target.value)}
                  >
                    <option value="">Select next country/city</option>
                    {onwardDestinationOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>

                  <label className="planner-label" htmlFor="continue-next-days">
                    Days in next destination
                  </label>
                  <input
                    id="continue-next-days"
                    type="number"
                    min="1"
                    max={MAX_TRIP_DAYS}
                    className="planner-select"
                    value={secondSegmentDays}
                    onChange={handleSecondSegmentDaysChange}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div className="planner-column">
          {destination && showSegment1PlanningSection && (
            <>
              <div className="planner-subcard">
                <h3 className="planner-subtitle">Top Places to Visit</h3>
                <button type="button" className="planner-button" onClick={handleLoadPlaces}>
                  {placesLoading ? "Loading Places..." : "Load Live Places"}
                </button>
                {placesError && <p className="planner-inline-error">{placesError}</p>}
                <div className="planner-places-list">
                  {topPlaces.map((place) => {
                    const isSelected = selectedPlaces.some(
                      (selectedPlace) => selectedPlace.place === place.place
                    );

                    return (
                      <button
                        type="button"
                        className={`planner-place-row planner-place-button${isSelected ? " is-selected" : ""}`}
                        key={place.place}
                        onClick={() => handlePlaceToggle(place)}
                      >
                        <div>
                          <p className="planner-place-name">{place.place}</p>
                          <p className="planner-place-cost">
                            {place.charge > 0 ? formatInr(place.charge) : "Entry fee not listed"}
                          </p>
                        </div>
                        <span>{isSelected ? "Shortlisted" : "Shortlist"}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedPlaces.length > 0 && (
                  <p className="planner-selected-hostel">
                    Shortlisted place cost (reference): {formatInr(selectedPlacesCost)}
                  </p>
                )}
              </div>

            </>
          )}

          {destination && showSegment1PlanningSection && (
            <>
              <div className="planner-subcard">
                <h3 className="planner-subtitle">Hostel / Stay</h3>
                <div className="planner-hostel-list">
                  {hostels.map((hostel) => (
                    <div className="planner-hostel-row" key={hostel.name}>
                      <div>
                        <p className="planner-hostel-name">{hostel.name}</p>
                        <p className="planner-hostel-price">{formatInr(hostel.price)} / night</p>
                      </div>
                      <button
                        type="button"
                        className={`planner-button planner-hostel-button${selectedHostel?.name === hostel.name ? " is-selected" : ""}`}
                        onClick={() => setSelectedHostel(hostel)}
                      >
                        {selectedHostel?.name === hostel.name ? "Selected" : "Select"}
                      </button>
                    </div>
                  ))}
                </div>
                {selectedHostel && (
                  <>
                    <p className="planner-selected-hostel">
                      Selected Stay: {selectedHostel.name} ({formatInr(selectedHostel.price)})
                    </p>
                    <button type="button" className="planner-button" onClick={applySelectedHostelToAllDays}>
                      Apply selected stay to all days
                    </button>
                  </>
                )}
              </div>

            </>
          )}

          {destination && showItinerarySection && (
            <>
              <div className="planner-subcard">
                <h3 className="planner-subtitle">Day-wise Itinerary & Budget</h3>
                <label className="planner-label" htmlFor="trip-days">
                  Number of travel days
                </label>
                <input
                  id="trip-days"
                  type="number"
                  min="1"
                  max={MAX_TRIP_DAYS}
                  className="planner-select"
                  value={tripDays}
                  onChange={handleTripDaysChange}
                />
                <label className="planner-label" htmlFor="segment1-daily-target">
                  Segment 1 daily target (INR)
                </label>
                <input
                  id="segment1-daily-target"
                  type="number"
                  min="0"
                  className="planner-select"
                  value={segment1DailyTarget}
                  onChange={(event) => setSegment1DailyTarget(sanitizeBudgetValue(event.target.value))}
                />
                <label className="planner-label" htmlFor="segment1-max-budget">
                  Segment 1 max budget (INR)
                </label>
                <input
                  id="segment1-max-budget"
                  type="number"
                  min="0"
                  className="planner-select"
                  value={segment1MaxBudget}
                  onChange={(event) => setSegment1MaxBudget(sanitizeBudgetValue(event.target.value))}
                />
                <button type="button" className="planner-button" onClick={copyDayOneTemplateToAll}>
                  Copy Day 1 to all days
                </button>
                <button type="button" className="planner-button" onClick={copyDayOnePlacesToAllDays}>
                  Copy Day 1 places to all days
                </button>

                <div className="planner-days-list">
                  {dailyPlans.map((plan, index) => {
                    const resolved = resolvedDailyPlans[index];
                    const resolvedStayName = resolved?.stayNameResolved || "";

                    return (
                      <div className="planner-day-card" key={`day-plan-${plan.dayNumber}`}>
                        <p className="planner-day-title">Day {plan.dayNumber}</p>

                        {index > 0 && (
                          <label className="planner-day-checkbox-row" htmlFor={`same-stay-${plan.dayNumber}`}>
                            <input
                              id={`same-stay-${plan.dayNumber}`}
                              type="checkbox"
                              checked={plan.sameAsPrevious}
                              onChange={(event) => updateDayPlan(index, { sameAsPrevious: event.target.checked })}
                            />
                            Same stay as previous day
                          </label>
                        )}

                        {!plan.sameAsPrevious && (
                          <>
                            <label className="planner-label" htmlFor={`stay-${plan.dayNumber}`}>
                              Stay for Day {plan.dayNumber}
                            </label>
                            <select
                              id={`stay-${plan.dayNumber}`}
                              className="planner-select"
                              value={plan.stayName}
                              onChange={(event) => updateDayPlan(index, { stayName: event.target.value })}
                            >
                              <option value="">Select stay</option>
                              {hostels.map((hostel) => (
                                <option key={`${plan.dayNumber}-${hostel.name}`} value={hostel.name}>
                                  {hostel.name} ({formatInr(hostel.price)})
                                </option>
                              ))}
                            </select>
                          </>
                        )}

                        {plan.sameAsPrevious && (
                          <p className="planner-day-note">
                            Stay copied: {resolvedStayName || "Select stay on previous day"}
                          </p>
                        )}

                        <p className="planner-label">Places for this day</p>
                        <div className="planner-day-places-grid">
                          {topPlaces.map((place) => {
                            const isDayPlaceSelected = plan.placeNames.includes(place.place);
                            return (
                              <button
                                type="button"
                                key={`${plan.dayNumber}-${place.place}`}
                                className={`planner-day-place-chip${isDayPlaceSelected ? " is-selected" : ""}`}
                                onClick={() => handleDayPlaceToggle(index, place.place)}
                              >
                                {place.place} ({formatInr(place.charge || 0)})
                              </button>
                            );
                          })}
                        </div>

                        <label className="planner-label" htmlFor={`food-budget-${plan.dayNumber}`}>
                          Food budget
                        </label>
                        <input
                          id={`food-budget-${plan.dayNumber}`}
                          type="number"
                          min="0"
                          className="planner-select"
                          value={plan.foodBudget}
                          onChange={(event) => updateDayPlan(index, { foodBudget: sanitizeBudgetValue(event.target.value) })}
                        />

                        <label className="planner-label" htmlFor={`transport-budget-${plan.dayNumber}`}>
                          Local transport budget
                        </label>
                        <input
                          id={`transport-budget-${plan.dayNumber}`}
                          type="number"
                          min="0"
                          className="planner-select"
                          value={plan.transportBudget}
                          onChange={(event) =>
                            updateDayPlan(index, { transportBudget: sanitizeBudgetValue(event.target.value) })
                          }
                        />

                        <p className="planner-day-total">Day Total: {formatInr(resolved?.dayTotal || 0)}</p>
                      </div>
                    );
                  })}
                </div>

                <p className="planner-selected-hostel">All days total: {formatInr(itineraryTotal)}</p>
                <p className="planner-selected-hostel">
                  Local view ({currencyByDestination[destination] || "INR"}):{" "}
                  {formatLocalCurrency(itineraryTotal, destination)}
                </p>
                {segment1OverDailyTarget && (
                  <p className="planner-inline-error">
                    Segment 1 average/day is above target ({formatInr(Math.round(itineraryTotal / Math.max(tripDays, 1)))}
                    ).
                  </p>
                )}
                {segment1OverMax && (
                  <p className="planner-inline-error">Segment 1 total exceeded your max budget.</p>
                )}

                <div className="planner-summary-actions">
                  <button
                    type="button"
                    className="planner-button"
                    onClick={() => handleTripTypeChange({ target: { value: "continue" } })}
                    disabled={!segment1Complete}
                  >
                    Continue to Next Destination
                  </button>
                  <button
                    type="button"
                    className="planner-back-btn"
                    onClick={() => handleTripTypeChange({ target: { value: "single" } })}
                    disabled={!segment1Complete}
                  >
                    Return / Finish Trip
                  </button>
                </div>
                {!segment1Complete && (
                  <p className="planner-day-note">
                    Complete all {tripDays} day cards and select Flight 1 to unlock next step.
                  </p>
                )}
              </div>

              {showSegment2PlanningSection && (
                <div className="planner-subcard">
                  <h3 className="planner-subtitle">Second Destination Day-wise Plan ({onwardDestination})</h3>
                  <label className="planner-label" htmlFor="second-segment-days">
                    Number of days in {onwardDestination}
                  </label>
                  <input
                    id="second-segment-days"
                    type="number"
                    min="1"
                    max={MAX_TRIP_DAYS}
                    className="planner-select"
                    value={secondSegmentDays}
                    onChange={handleSecondSegmentDaysChange}
                  />
                  <label className="planner-label" htmlFor="segment2-daily-target">
                    Segment 2 daily target (INR)
                  </label>
                  <input
                    id="segment2-daily-target"
                    type="number"
                    min="0"
                    className="planner-select"
                    value={segment2DailyTarget}
                    onChange={(event) => setSegment2DailyTarget(sanitizeBudgetValue(event.target.value))}
                  />
                  <label className="planner-label" htmlFor="segment2-max-budget">
                    Segment 2 max budget (INR)
                  </label>
                  <input
                    id="segment2-max-budget"
                    type="number"
                    min="0"
                    className="planner-select"
                    value={segment2MaxBudget}
                    onChange={(event) => setSegment2MaxBudget(sanitizeBudgetValue(event.target.value))}
                  />
                  <div className="planner-hostel-list">
                    {secondSegmentHostels.map((hostel) => (
                      <div className="planner-hostel-row" key={`segment2-${hostel.name}`}>
                        <div>
                          <p className="planner-hostel-name">{hostel.name}</p>
                          <p className="planner-hostel-price">{formatInr(hostel.price)} / night</p>
                        </div>
                        <button
                          type="button"
                          className={`planner-button planner-hostel-button${
                            secondSelectedHostel?.name === hostel.name ? " is-selected" : ""
                          }`}
                          onClick={() => setSecondSelectedHostel(hostel)}
                        >
                          {secondSelectedHostel?.name === hostel.name ? "Selected" : "Select"}
                        </button>
                      </div>
                    ))}
                  </div>
                  {secondSelectedHostel && (
                    <button type="button" className="planner-button" onClick={applySecondSelectedHostelToAllDays}>
                      Apply selected stay to all segment 2 days
                    </button>
                  )}
                  <button type="button" className="planner-button" onClick={copySecondDayOneTemplateToAll}>
                    Copy Segment 2 Day 1 to all
                  </button>
                  <button type="button" className="planner-button" onClick={copySecondDayOnePlacesToAll}>
                    Copy Segment 2 Day 1 places to all
                  </button>

                  <div className="planner-days-list">
                    {secondDailyPlans.map((plan, index) => {
                      const resolved = resolvedSecondDailyPlans[index];
                      const resolvedStayName = resolved?.stayNameResolved || "";
                      return (
                        <div className="planner-day-card" key={`segment2-day-plan-${plan.dayNumber}`}>
                          <p className="planner-day-title">
                            {onwardDestination} Day {plan.dayNumber}
                          </p>
                          {index > 0 && (
                            <label className="planner-day-checkbox-row" htmlFor={`segment2-same-stay-${plan.dayNumber}`}>
                              <input
                                id={`segment2-same-stay-${plan.dayNumber}`}
                                type="checkbox"
                                checked={plan.sameAsPrevious}
                                onChange={(event) =>
                                  updateSecondDayPlan(index, { sameAsPrevious: event.target.checked })
                                }
                              />
                              Same stay as previous day
                            </label>
                          )}
                          {!plan.sameAsPrevious && (
                            <>
                              <label className="planner-label" htmlFor={`segment2-stay-${plan.dayNumber}`}>
                                Stay for Day {plan.dayNumber}
                              </label>
                              <select
                                id={`segment2-stay-${plan.dayNumber}`}
                                className="planner-select"
                                value={plan.stayName}
                                onChange={(event) => updateSecondDayPlan(index, { stayName: event.target.value })}
                              >
                                <option value="">Select stay</option>
                                {secondSegmentHostels.map((hostel) => (
                                  <option key={`segment2-${plan.dayNumber}-${hostel.name}`} value={hostel.name}>
                                    {hostel.name} ({formatInr(hostel.price)})
                                  </option>
                                ))}
                              </select>
                            </>
                          )}
                          {plan.sameAsPrevious && (
                            <p className="planner-day-note">
                              Stay copied: {resolvedStayName || "Select stay on previous day"}
                            </p>
                          )}
                          <p className="planner-label">Places for this day</p>
                          <div className="planner-day-places-grid">
                            {secondSegmentPlaces.map((place) => {
                              const isSelected = plan.placeNames.includes(place.place);
                              return (
                                <button
                                  type="button"
                                  key={`segment2-${plan.dayNumber}-${place.place}`}
                                  className={`planner-day-place-chip${isSelected ? " is-selected" : ""}`}
                                  onClick={() => handleSecondDayPlaceToggle(index, place.place)}
                                >
                                  {place.place} ({formatInr(place.charge || 0)})
                                </button>
                              );
                            })}
                          </div>
                          <label className="planner-label" htmlFor={`segment2-food-budget-${plan.dayNumber}`}>
                            Food budget
                          </label>
                          <input
                            id={`segment2-food-budget-${plan.dayNumber}`}
                            type="number"
                            min="0"
                            className="planner-select"
                            value={plan.foodBudget}
                            onChange={(event) =>
                              updateSecondDayPlan(index, {
                                foodBudget: sanitizeBudgetValue(event.target.value),
                              })
                            }
                          />
                          <label className="planner-label" htmlFor={`segment2-transport-budget-${plan.dayNumber}`}>
                            Local transport budget
                          </label>
                          <input
                            id={`segment2-transport-budget-${plan.dayNumber}`}
                            type="number"
                            min="0"
                            className="planner-select"
                            value={plan.transportBudget}
                            onChange={(event) =>
                              updateSecondDayPlan(index, {
                                transportBudget: sanitizeBudgetValue(event.target.value),
                              })
                            }
                          />
                          <p className="planner-day-total">Day Total: {formatInr(resolved?.dayTotal || 0)}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="planner-selected-hostel">Second segment total: {formatInr(secondItineraryTotal)}</p>
                  <p className="planner-selected-hostel">
                    Local view ({currencyByDestination[onwardDestination] || "INR"}):{" "}
                    {formatLocalCurrency(secondItineraryTotal, onwardDestination)}
                  </p>
                  {segment2OverDailyTarget && (
                    <p className="planner-inline-error">
                      Segment 2 average/day is above target ({formatInr(
                        Math.round(secondItineraryTotal / Math.max(secondSegmentDays, 1))
                      )}).
                    </p>
                  )}
                  {segment2OverMax && (
                    <p className="planner-inline-error">Segment 2 total exceeded your max budget.</p>
                  )}
                </div>
              )}

              <div className="planner-transport-list">
                {sortedTransportOptions.map((option) => (
                  <div className="planner-transport-card" key={option.type}>
                    <p className="planner-transport-type">{option.type}</p>
                    <p className="planner-transport-price">{formatInr(option.price)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {showSummarySection && (
            <>
              <div className="planner-subcard">
                <h3 className="planner-subtitle">Segment 1 Summary ({destination || "Not selected"})</h3>
                <p className="planner-selected-hostel">Flight 1: {formatInr(selectedFlight?.price || 0)}</p>
                <p className="planner-selected-hostel">Stay + daily budget: {formatInr(itineraryTotal)}</p>
                <p className="planner-selected-hostel">
                  Local view: {formatLocalCurrency((selectedFlight?.price || 0) + itineraryTotal, destination)}
                </p>
              </div>
              {segment2IsActive && (
                <div className="planner-subcard">
                  <h3 className="planner-subtitle">Segment 2 Summary ({onwardDestination})</h3>
                  <p className="planner-selected-hostel">Flight 2: {formatInr(onwardFlightCost)}</p>
                  <p className="planner-selected-hostel">Stay + daily budget: {formatInr(secondItineraryTotal)}</p>
                  <p className="planner-selected-hostel">
                    Local view: {formatLocalCurrency(onwardFlightCost + secondItineraryTotal, onwardDestination)}
                  </p>
                </div>
              )}
              <div className="planner-subcard planner-total-card">
                <h3 className="planner-subtitle">Grand Total</h3>
                <label className="planner-day-checkbox-row" htmlFor="contingency-toggle">
                  <input
                    id="contingency-toggle"
                    type="checkbox"
                    checked={includeContingency}
                    onChange={(event) => setIncludeContingency(event.target.checked)}
                  />
                  Add contingency buffer
                </label>
                {includeContingency && (
                  <>
                    <label className="planner-label" htmlFor="contingency-percent">
                      Contingency percent
                    </label>
                    <input
                      id="contingency-percent"
                      type="number"
                      min="0"
                      max="50"
                      className="planner-select"
                      value={contingencyPercent}
                      onChange={(event) => setContingencyPercent(sanitizeBudgetValue(event.target.value))}
                    />
                  </>
                )}
                <p className="planner-selected-hostel">Subtotal: {formatInr(preContingencyTotal)}</p>
                <p className="planner-selected-hostel">Contingency: {formatInr(contingencyAmount)}</p>
                <p className="planner-total-value">{formatInr(totalCost)}</p>
                <div className="planner-summary-actions">
                  <button type="button" className="planner-button" onClick={handleSavePlan}>
                    Save Plan
                  </button>
                  <button type="button" className="planner-button" onClick={handleDownloadSummary}>
                    Download Summary
                  </button>
                </div>
                <p className="planner-summary-brand">TravelTrove Trip Summary</p>
                {summaryMessage && <p className="planner-summary-message">{summaryMessage}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Planner;
