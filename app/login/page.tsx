"use client";

import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      // Hard redirect to the target URL (admin or dashboard) so session cookies and header refresh
      window.location.href = data.redirectUrl || "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout" style={{ maxWidth: "1200px", minHeight: "680px" }}>
      {/* Informative Showcase Panel: Explains What Interior Finder Provides */}
      <div className="auth-image login-image" style={{ padding: "50px 40px" }}>
        <span className="eyebrow" style={{ color: "#c8e6c9", letterSpacing: "2px" }}>
          INTERIOR FINDER PLATFORM
        </span>
        <h1 style={{ fontSize: "34px", lineHeight: "1.25", marginBottom: "16px" }}>
          Transform Your Space With Verified Designers
        </h1>
        <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#e8f5e9", maxWidth: "420px" }}>
          Your all-in-one destination to find top-rated interior designers, explore inspiring room portfolios, and manage your custom home decor projects.
        </p>

        {/* Feature Cards Explaining What We Provide */}
        <div style={{ display: "grid", gap: "12px", marginTop: "24px" }}>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              maxWidth: "420px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>✦</span>
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "#fff" }}>
                  Verified Design Experts
                </strong>
                <small style={{ fontSize: "11px", color: "#d1e7dd" }}>
                  Connect with curated, rated interior designers across multiple cities.
                </small>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              maxWidth: "420px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>▤</span>
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "#fff" }}>
                  Inspiring Room Portfolios
                </strong>
                <small style={{ fontSize: "11px", color: "#d1e7dd" }}>
                  Browse real projects for living rooms, kitchens, bedrooms, and offices.
                </small>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              maxWidth: "420px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>✉</span>
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "#fff" }}>
                  Custom Enquiries & Budget Matching
                </strong>
                <small style={{ fontSize: "11px", color: "#d1e7dd" }}>
                  Submit space size and budget requirements to receive tailored proposals.
                </small>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              maxWidth: "420px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>⚙</span>
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "#fff" }}>
                  Unified Client & Admin Workspace
                </strong>
                <small style={{ fontSize: "11px", color: "#d1e7dd" }}>
                  Seamless dashboards to track enquiry statuses from 'New' to 'Completed'.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px", fontSize: "11px", color: "#c8e6c9" }}>
          ✓ Over 500+ spaces designed · 100% verified professionals
        </div>
      </div>

      {/* Shared Login Form */}
      <form className="form-card" onSubmit={handleSubmit} noValidate style={{ padding: "45px 38px" }}>
        <span className="eyebrow">SECURE ACCESS</span>
        <h2>Login to InteriorFinder</h2>
        <p style={{ marginBottom: "18px" }}>
          Enter your credentials to access your personalized workspace.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              padding: "11px 14px",
              borderRadius: "6px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "12px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <label>
          Email address *
          <input
            required
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </label>

        <label>
          Password *
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              style={{ width: "100%", paddingRight: "42px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                fontSize: "15px",
                color: "#77827c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showPassword ? "👁" : "👁‍🗨"}
            </button>
          </div>
        </label>

        <div className="form-row" style={{ margin: "4px 0 16px" }}>
          <label className="check-label" style={{ margin: 0 }}>
            <input type="checkbox" /> Remember me
          </label>
          <Link href="/login" style={{ fontSize: "11px" }}>
            Forgot password?
          </Link>
        </div>

        <button className="btn full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login to Account ↗"}
        </button>

        <div className="or" style={{ margin: "18px 0" }}>
          <span /> or continue with <span />
        </div>

        

        <p className="center" style={{ marginTop: "18px" }}>
          Don't have an account yet? <Link href="/register">Register here</Link>
        </p>

        <div
          style={{
            marginTop: "16px",
            padding: "10px",
            borderRadius: "6px",
            background: "#f7f8f5",
            fontSize: "11px",
            color: "#68756d",
            textAlign: "center",
          }}
        >
          Shared login for both <strong>Administrators</strong> and <strong>Clients</strong>.
        </div>
      </form>
    </section>
  );
}
