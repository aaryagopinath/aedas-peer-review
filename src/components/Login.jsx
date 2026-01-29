import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // Ensure this path is correct based on where you made the file

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    // We stick to your custom "employees" table logic for the demo
    const { data: user, error } = await supabase
      .from("employees")
      .select("*")
      .eq("email", email.trim())
      .eq("password", password.trim())
      .single();

    if (error || !user) {
      alert("Login failed. Please check your credentials.");
      setLoading(false);
    } else {
      // Pass the user data back up to App.jsx
      onLogin(user);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-logo-wrap">
          <img src="/LogoPNG.png" alt="AEDAS" className="auth-logo" />
          <p className="auth-subtitle">Performance Review</p>
        </div>

        <div className="field">
          <div className="label">Email</div>
          <input
            className="input"
            type="email"
            placeholder="name@aedas.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <div className="label">Password</div>
          <input
            className="input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="auth-actions">
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
            type="button"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <div className="auth-footnote">© AEDAS ME</div>
      </div>
    </div>
  );
};

export default Login;
