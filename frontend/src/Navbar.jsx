import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ user }) {
  return (
    <nav className="navbar">
      <h2>
        <Link className="nav-brand" to="/">
          TravelTrove
        </Link>
      </h2>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        {user && (
          <li>
            <Link to="/profile">Profile</Link>
          </li>
        )}
        <li>
          <Link to="/planner">Budget Planner</Link>
        </li>
        <li>
          <Link to="/blog">Blog</Link>
        </li>
        <li>
          <Link to="/login">{user ? "Account" : "Login"}</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
