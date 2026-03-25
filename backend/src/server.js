const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs/promises");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const blogFilePath = path.join(__dirname, "..", "data", "blog-posts.json");
const serpApiKey = process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY;
const serpApiBaseUrl = "https://serpapi.com/search.json";
const serpCache = new Map();
const serpCacheTtlMs = 30 * 60 * 1000;
const airportCodeByCity = {
  CHENNAI: "MAA",
  BANGALORE: "BLR",
  BENGALURU: "BLR",
  MUMBAI: "BOM",
  DELHI: "DEL",
  DUBAI: "DXB",
  SINGAPORE: "SIN",
  BANGKOK: "BKK",
  "KUALA LUMPUR": "KUL",
  BALI: "DPS",
  GOA: "GOI",
  MANALI: "KUU",
  JAIPUR: "JAI",
  PONDICHERRY: "PNY",
  RISHIKESH: "DED",
};

app.use(
  cors({
    origin: clientUrl,
  })
);
app.use(express.json());

async function readBlogPosts() {
  try {
    const fileContent = await fs.readFile(blogFilePath, "utf-8");
    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeBlogPosts(posts) {
  await fs.mkdir(path.dirname(blogFilePath), { recursive: true });
  await fs.writeFile(blogFilePath, JSON.stringify(posts, null, 2), "utf-8");
}

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, message: "TravelTrove backend running" });
});

app.get("/api/trips", (req, res) => {
  res.status(200).json({
    trips: [
      { id: 1, place: "Munnar", days: 3 },
      { id: 2, place: "Goa", days: 4 },
    ],
  });
});

function buildCacheKey(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function readCache(key) {
  const cached = serpCache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.createdAt > serpCacheTtlMs) {
    serpCache.delete(key);
    return null;
  }

  return cached.value;
}

function writeCache(key, value) {
  serpCache.set(key, { createdAt: Date.now(), value });
}

function parsePrice(rawPrice) {
  const numeric = Number(rawPrice);
  if (!Number.isNaN(numeric)) {
    return Math.round(numeric);
  }

  if (typeof rawPrice === "string") {
    const cleaned = rawPrice.replace(/[^\d.]/g, "");
    const parsed = Number(cleaned);
    if (!Number.isNaN(parsed)) {
      return Math.round(parsed);
    }
  }

  return 0;
}

function formatDuration(durationInMinutes) {
  const minutes = Number(durationInMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (!hours) {
    return `${restMinutes}m`;
  }
  return restMinutes ? `${hours}h ${restMinutes}m` : `${hours}h`;
}

function toFlightLocationId(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  if (/^\/m\//i.test(value)) {
    return value;
  }

  if (/^[a-z]{3}$/i.test(value)) {
    return value.toUpperCase();
  }

  const normalized = value.toUpperCase();
  return airportCodeByCity[normalized] || normalized;
}

async function querySerpApi(params) {
  if (!serpApiKey) {
    const error = new Error("SERPAPI_API_KEY is missing on the backend.");
    error.statusCode = 500;
    throw error;
  }

  const cacheKey = buildCacheKey(params);
  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }

  const searchParams = new URLSearchParams({
    ...params,
    api_key: serpApiKey,
  });
  const response = await fetch(`${serpApiBaseUrl}?${searchParams.toString()}`);
  const data = await response.json();

  if (!response.ok || data.error) {
    const error = new Error(data.error || "Failed to fetch from SerpApi.");
    error.statusCode = response.status || 500;
    throw error;
  }

  writeCache(cacheKey, data);
  return data;
}

app.get("/api/search/flights", async (req, res) => {
  const departureId = toFlightLocationId(req.query.from);
  const arrivalId = toFlightLocationId(req.query.to);
  const adults = Math.max(1, Math.min(9, Number(req.query.adults) || 1));
  const outboundDate = String(req.query.date || "").trim();

  if (!departureId || !arrivalId) {
    res.status(400).json({ message: "Both 'from' and 'to' are required." });
    return;
  }

  try {
    const response = await querySerpApi({
      engine: "google_flights",
      type: 2,
      departure_id: departureId,
      arrival_id: arrivalId,
      outbound_date: outboundDate || undefined,
      adults,
      hl: "en",
      gl: "in",
      currency: "INR",
    });

    const mappedFlights = [...(response.best_flights || []), ...(response.other_flights || [])]
      .map((flight, index) => {
        const firstLeg = flight.flights?.[0];
        const airline = firstLeg?.airline || "Flight";
        const duration = formatDuration(flight.total_duration);
        const departureTime = firstLeg?.departure_airport?.time || "";
        const arrivalTime =
          flight.flights?.[flight.flights.length - 1]?.arrival_airport?.time || "";

        return {
          id: `${airline}-${index}`,
          airline,
          price: parsePrice(flight.price),
          duration,
          departureTime,
          arrivalTime,
        };
      })
      .filter((flight) => flight.price > 0);

    res.status(200).json({ flights: mappedFlights });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Failed to fetch flights." });
  }
});

app.get("/api/search/places", async (req, res) => {
  const destination = String(req.query.destination || "").trim();

  if (!destination) {
    res.status(400).json({ message: "'destination' is required." });
    return;
  }

  try {
    const response = await querySerpApi({
      engine: "google_maps",
      type: "search",
      q: `top attractions in ${destination}`,
      hl: "en",
      gl: "in",
    });

    const places = (response.local_results || [])
      .slice(0, 10)
      .map((place, index) => ({
        id: place.place_id || `${destination}-${index}`,
        place: place.title || "Unknown Place",
        charge: parsePrice(place.price) || 0,
        rating: Number(place.rating) || null,
        reviews: Number(place.reviews) || 0,
        address: place.address || "",
      }));

    res.status(200).json({ places });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Failed to fetch places." });
  }
});

app.get("/api/blog-posts", async (req, res) => {
  try {
    const posts = await readBlogPosts();
    res.status(200).json({ posts });
  } catch {
    res.status(500).json({ message: "Failed to load blog posts." });
  }
});

app.post("/api/blog-posts", async (req, res) => {
  const { title, story, location, author, authorUid } = req.body;

  if (!title || !story || !location || !author || !authorUid) {
    res.status(400).json({ message: "Missing required fields." });
    return;
  }

  const newPost = {
    id: Date.now(),
    title: String(title).trim(),
    story: String(story).trim(),
    excerpt: String(story).trim().slice(0, 220),
    author: String(author).trim(),
    authorUid: String(authorUid).trim(),
    location: String(location).trim(),
    date: new Date().toISOString(),
    category: "Community",
    likes: 0,
    comments: 0,
    image:
      "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80",
  };

  try {
    const posts = await readBlogPosts();
    const updatedPosts = [newPost, ...posts];
    await writeBlogPosts(updatedPosts);
    res.status(201).json({ post: newPost });
  } catch {
    res.status(500).json({ message: "Failed to save blog post." });
  }
});

app.delete("/api/blog-posts/:id", async (req, res) => {
  const postId = String(req.params.id || "").trim();
  const authorUid = String(req.body?.authorUid || "").trim();

  if (!postId || !authorUid) {
    res.status(400).json({ message: "Post id and author uid are required." });
    return;
  }

  try {
    const posts = await readBlogPosts();
    const targetIndex = posts.findIndex((post) => String(post.id) === postId);

    if (targetIndex === -1) {
      res.status(404).json({ message: "Post not found." });
      return;
    }

    const targetPost = posts[targetIndex];
    if (String(targetPost.authorUid || "") !== authorUid) {
      res.status(403).json({ message: "You can delete only your own posts." });
      return;
    }

    const updatedPosts = posts.filter((post) => String(post.id) !== postId);
    await writeBlogPosts(updatedPosts);
    res.status(200).json({ message: "Post deleted successfully." });
  } catch {
    res.status(500).json({ message: "Failed to delete blog post." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
