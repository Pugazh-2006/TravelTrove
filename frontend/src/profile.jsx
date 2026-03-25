import { useEffect, useMemo, useState } from "react";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "./firebase";
import "./Profile.css";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Profile({ user }) {
  const preferenceOptions = {
    budget: ["Low", "Medium"],
    transport: ["Train", "Bus", "Mixed"],
    stay: ["Hostel", "Shared"],
    pace: ["Slow", "Fast"],
  };

  const badgeOptions = ["Solo Backpacker", "Group Backpacker"];

  const storedProfile = useMemo(() => {
    const raw = localStorage.getItem(`traveltrove_profile_${user.uid}`);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, [user.uid]);

  const myTrips = useMemo(() => {
    try {
      const raw = localStorage.getItem(`traveltrove_trips_${user.uid}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [user.uid]);

  const [myBlogs, setMyBlogs] = useState([]);
  const [profile, setProfile] = useState({
    name: user.displayName || storedProfile.name || "Traveler",
    email: user.email || "",
    age: storedProfile.age || "",
    badge: "Solo Backpacker",
  });

  const [preferences, setPreferences] = useState({
    budget: "Low",
    transport: "Train",
    stay: "Hostel",
    pace: "Slow",
  });

  const [editMode, setEditMode] = useState(false);
  const [draftProfile, setDraftProfile] = useState(profile);
  const [draftPreferences, setDraftPreferences] = useState(preferences);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBlogs = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/blog-posts`);
        if (!response.ok) {
          throw new Error("Failed to load");
        }

        const data = await response.json();
        if (isMounted) {
          const authored = (data.posts || []).filter((post) => post.authorUid === user.uid);
          setMyBlogs(authored);
        }
      } catch {
        if (isMounted) {
          setMyBlogs([]);
        }
      }
    };

    loadBlogs();

    return () => {
      isMounted = false;
    };
  }, [user.uid]);

  const handleEditToggle = () => {
    setDraftProfile(profile);
    setDraftPreferences(preferences);
    setSaveError("");
    setEditMode(true);
  };

  const handleSave = async () => {
    const nextName = draftProfile.name.trim();
    const nextAge = Number(draftProfile.age);

    if (!nextName || !Number.isInteger(nextAge) || nextAge < 10 || nextAge > 100) {
      setSaveError("Enter a valid name and age between 10 and 100.");
      return;
    }

    try {
      if (auth.currentUser && auth.currentUser.displayName !== nextName) {
        await updateProfile(auth.currentUser, { displayName: nextName });
      }

      localStorage.setItem(
        `traveltrove_profile_${user.uid}`,
        JSON.stringify({ name: nextName, age: nextAge })
      );

      setProfile((prev) => ({
        ...prev,
        name: nextName,
        age: nextAge,
        badge: draftProfile.badge,
      }));
      setPreferences(draftPreferences);
      setSaveError("");
      setEditMode(false);
    } catch {
      setSaveError("Could not save profile changes. Try again.");
    }
  };

  const handleCancel = () => {
    setDraftProfile(profile);
    setDraftPreferences(preferences);
    setSaveError("");
    setEditMode(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const activePreferences = editMode ? draftPreferences : preferences;
  const avatarInitials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className={`profile-page ${editMode ? "editing" : ""}`}>
      <section className="profile-header">
        <div className="profile-identity">
          <div className="avatar">{avatarInitials || "TT"}</div>
          <div>
            {editMode ? (
              <>
                <input
                  className="text-input"
                  value={draftProfile.name}
                  onChange={(event) =>
                    setDraftProfile((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
                <input
                  className="text-input"
                  type="number"
                  min={10}
                  max={100}
                  value={draftProfile.age}
                  onChange={(event) =>
                    setDraftProfile((prev) => ({
                      ...prev,
                      age: event.target.value,
                    }))
                  }
                />
                <p className="email">{profile.email}</p>
                <div className="badge-group">
                  {badgeOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`pref-btn ${
                        draftProfile.badge === option ? "active" : ""
                      }`}
                      onClick={() =>
                        setDraftProfile((prev) => ({
                          ...prev,
                          badge: option,
                        }))
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h1>{profile.name}</h1>
                <p className="email">{profile.email}</p>
                <p className="email">Age: {profile.age || "Not set"}</p>
                <span className="profile-badge">{profile.badge}</span>
              </>
            )}
          </div>
        </div>

        <div className="profile-actions">
          {editMode ? (
            <>
              <button className="btn secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={handleSave}>
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button className="btn secondary" onClick={handleEditToggle}>
                Edit Profile
              </button>
              <button type="button" className="btn primary" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
          {editMode && <span className="mode-pill">Edit Mode</span>}
          {saveError && <span className="mode-pill">{saveError}</span>}
        </div>
      </section>

      <section className="profile-grid">
        <div className="card">
          <h2>Backpacker Preferences</h2>
          <p className="card-subtitle">
            Tune your travel style to keep plans realistic and budget-first.
          </p>

          <div className="preference-list">
            {Object.keys(preferenceOptions).map((key) => (
              <div className="preference-item" key={key}>
                <span className="pref-label">
                  {key === "budget" && "Budget Style"}
                  {key === "transport" && "Preferred Transport"}
                  {key === "stay" && "Stay Type"}
                  {key === "pace" && "Travel Pace"}
                </span>

                {editMode ? (
                  <div className="pref-options">
                    {preferenceOptions[key].map((option) => (
                      <button
                        type="button"
                        key={option}
                        className={`pref-btn ${
                          activePreferences[key] === option ? "active" : ""
                        }`}
                        onClick={() =>
                          setDraftPreferences((prev) => ({
                            ...prev,
                            [key]: option,
                          }))
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="pref-value">{activePreferences[key]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card summary-card">
          <h2>Activity Summary</h2>
          <div className="summary-grid">
            <div>
              <h3>{myTrips.length}</h3>
              <p>Total Trips Created</p>
            </div>
            <div>
              <h3>{myBlogs.length}</h3>
              <p>Blogs Published</p>
            </div>
            <div>
              <h3>{myTrips[0]?.destination || "-"}</h3>
              <p>Latest Destination</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card plans-card">
        <div className="card-head">
          <h2>My Trips</h2>
          <span className="card-subtitle">Short summary of your created trips</span>
        </div>

        <div className="plans-grid">
          {myTrips.length === 0 && <p className="card-subtitle">No trips created yet.</p>}
          {myTrips.map((trip) => (
            <div className="plan-item" key={trip.id}>
              <h3>{trip.name}</h3>
              <div className="plan-row">
                <span>Destination</span>
                <span>{trip.destination}</span>
              </div>
              <div className="plan-row">
                <span>Created</span>
                <span>{new Date(trip.createdAt).toLocaleDateString("en-US")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card plans-card">
        <div className="card-head">
          <h2>My Blogs</h2>
          <span className="card-subtitle">Short summary of blogs authored by you</span>
        </div>

        <div className="plans-grid">
          {myBlogs.length === 0 && <p className="card-subtitle">No blogs published yet.</p>}
          {myBlogs.map((blog) => (
            <div className="plan-item" key={blog.id}>
              <h3>{blog.title}</h3>
              <div className="plan-row">
                <span>Location</span>
                <span>{blog.location}</span>
              </div>
              <div className="plan-row">
                <span>Date</span>
                <span>{new Date(blog.date).toLocaleDateString("en-US")}</span>
              </div>
              <div className="plan-row">
                <span>Preview</span>
                <span>{(blog.excerpt || blog.story || "").slice(0, 55)}...</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Profile;
