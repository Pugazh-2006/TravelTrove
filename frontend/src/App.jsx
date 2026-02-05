import Navbar from "./Navbar.jsx"
import "./App.css"

function App() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1>Plan Smart. Travel Cheap.</h1>
          <p>
            TravelTrove helps backpackers plan budget-friendly trips
            with transparent cost estimation.
          </p>
          <button className="cta-btn">Start Planning</button>
        </div>
      </section>

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

      {/* Gallery Section */}
      <section className="gallery">
        <h2>Explore on a Budget</h2>
        <div className="gallery-grid">
          <div className="img-box1"></div>
          <div className="img-box2"></div>
          <div className="img-box3"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 TravelTrove | Backpackers Only</p>
      </footer>
    </>
  )
}

export default App
