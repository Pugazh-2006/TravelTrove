import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import "./Login.css";

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
    <div className="login-page">
      <div className="login-container">
        <h1 className="title">TravelTrove</h1>
        <p className="subtitle">Explore - Experience - Enjoy</p>
        <h2 className="form-title">{formTitle}</h2>

        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="login-input"
              />
              <input
                type="number"
                placeholder="Age"
                value={age}
                min={10}
                max={100}
                onChange={(e) => setAge(e.target.value)}
                required
                className="login-input"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />

          <input
            type="password"
            placeholder="Password (8 chars)"
            maxLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />

          <button type="submit" className="login-btn">
            {formButtonText}
          </button>
        </form>

        {isLoginMode && (
          <p className="forgot" onClick={handleForgotPassword}>
            Forgot Password?
          </p>
        )}

        <p
          className="toggle-mode"
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

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
      </div>
    </div>
  );
};

export default Login;
