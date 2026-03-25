import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "./Navbar";
import Home from "./Home.jsx";
import Profile from "./profile.jsx";
import Login from "./Login.jsx";
import Blog from "./Blog.jsx";
import BudgetPlanner from "./BudgetPlanner.jsx";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return <p style={{ padding: "80px 20px" }}>Loading...</p>;
  }

  return (
    <>
      <Navbar user={user} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/profile"
          element={user ? <Profile user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/profile" replace /> : <Login />}
        />
        <Route path="/planner" element={<BudgetPlanner user={user} />} />
        <Route path="/blog" element={<Blog user={user} />} />
      </Routes>
    </>
  );
}

export default App;
