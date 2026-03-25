import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  const formTitle = isLoginMode ? "Login" : "Create Account";
  const formButtonText = isLoginMode ? "Login" : "Sign Up";

  const validatePassword = () => {
    if (password.length !== 8) {
      setError("Password must be exactly 8 characters");
      return false;
    }

    if (!specialCharRegex.test(password)) {
      setError("Password must include at least one special character");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validatePassword()) {
      return;
    }

    if (isLoginMode) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/profile");
      } catch {
        setError("Invalid email or password");
      }
      return;
    }

    if (!name.trim()) {
      setError("Name is required for sign up");
      return;
    }

    const ageValue = Number(age);
    if (!Number.isInteger(ageValue) || ageValue < 10 || ageValue > 100) {
      setError("Age must be a valid number between 10 and 100");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });
      localStorage.setItem(
        `traveltrove_profile_${credential.user.uid}`,
        JSON.stringify({ name: name.trim(), age: ageValue })
      );
      navigate("/profile");
    } catch {
      setError("Failed to create account. Try a different email.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter email to reset password");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent!");
      setError("");
    } catch {
      setError("Failed to send reset email");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <div style={styles.box}>
          <h1 style={styles.title}>TravelTrove</h1>
          <p style={styles.subtitle}>Explore - Experience - Enjoy</p>
          <h2 style={styles.formTitle}>{formTitle}</h2>

          <form onSubmit={handleSubmit}>
            {!isLoginMode && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  min={10}
                  max={100}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  style={styles.input}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password (8 chars)"
              maxLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />

            <button type="submit" style={styles.button}>
              {formButtonText}
            </button>
          </form>

          {isLoginMode && (
            <p style={styles.forgot} onClick={handleForgotPassword}>
              Forgot Password?
            </p>
          )}

          <p
            style={styles.toggleMode}
            onClick={() => {
              setIsLoginMode((prev) => !prev);
              setName("");
              setAge("");
              setError("");
              setSuccess("");
            }}
          >
            {isLoginMode
              ? "New user? Create account"
              : "Already have an account? Login"}
          </p>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    height: "100vh",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  overlay: {
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    background: "rgba(0,0,0,0.85)",
    padding: "40px",
    width: "380px",
    borderRadius: "15px",
    textAlign: "center",
  },
  title: {
    color: "#ff8c00",
    fontSize: "32px",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#ccc",
    marginBottom: "10px",
  },
  formTitle: {
    color: "#fff",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    backgroundColor: "#ff8c00",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  forgot: {
    marginTop: "15px",
    color: "#ff8c00",
    cursor: "pointer",
  },
  toggleMode: {
    marginTop: "12px",
    color: "#f2b066",
    cursor: "pointer",
    textDecoration: "underline",
  },
  error: {
    marginTop: "10px",
    color: "red",
  },
  success: {
    marginTop: "10px",
    color: "#3ddc84",
  },
};

export default Login;
