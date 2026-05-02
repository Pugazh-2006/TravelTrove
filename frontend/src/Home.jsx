import { Link } from "react-router-dom";
import "./Home.css"

function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <span className="badge">For Backpackers Only</span>
          <h1>Budget-First Travel Planning for Backpackers.</h1>
          <p>
            TravelTrove is a backpacker-focused planner that builds
            realistic budgets first, so you can travel smart and spend less.
          </p>
          <Link to="/login">
            <button className="cta-btn">Login</button>
          </Link>
        </div>
      </section>

      <div className="section-head">
        <h2 className="section-title">Why TravelTrove?</h2>
        <p className="section-subtitle">
          Built for backpackers who want clear costs and confident planning.
        </p>
      </div>

      {/* Features Section */}
      <section className="features">
        <div className="feature-card">
          <h3>Budget Planning</h3>
          <p>Plan trips based on lowest transport and stay cost.</p>
        </div>
        <div className="feature-card">
          <h3>Backpacker Friendly</h3>
          <p>Designed only for backpackers and budget travelers.</p>
        </div>
        <div className="feature-card">
          <h3>Cost Transparency</h3>
          <p>Know the total estimated cost before you travel.</p>
        </div>
      </section>

      <section className="gallery">
        <h2>Explore on a Budget</h2>

        <div className="gallery-grid">
          <div className="img-box img-1">
            <span className="img-label">Destinations</span>
          </div>
          <div className="img-box img-2">
            <span className="img-label">Budget Stays</span>
          </div>
          <div className="img-box img-3">
            <span className="img-label">Low-Cost Transport</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <h3>TravelTrove</h3>
          <p className="footer-quote" style={{ fontStyle: "italic", color: "var(--primary)", fontWeight: "600", margin: "8px 0 16px", fontSize: "15px" }}>
            "Take only memories, leave only footprints. Adventure awaits."
          </p>
          <p>
            A backpacker-focused travel planning platform for
            budget-friendly and transparent trip planning.
          </p>

          <div className="footer-links">
            <span>Home</span>
            <span>Budget Planner</span>
            <span>Blog</span>
            <span>Login</span>
          </div>
        </div>

        <div className="footer-bottom">
          (c) 2026 TravelTrove | Backpackers Only
        </div>
      </footer>
    </>
  )
}

export default Home
