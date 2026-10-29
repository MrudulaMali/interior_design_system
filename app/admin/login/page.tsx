"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          requiredRole: "admin", // Enforce that only admins can sign in via this screen
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid administrator credentials.");
      }

      window.location.href = data.redirectUrl || "/admin";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: "#f7f8f5",
      }}
    >
      <div
        className="form-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#fff",
          border: "1px solid #dce4dd",
          borderRadius: "8px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(20, 89, 76, 0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#14594c",
              color: "#fff",
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "12px",
            }}
          >
            🛡
          </span>
          <span className="eyebrow" style={{ display: "block", color: "#14594c" }}>
            ADMINISTRATOR PORTAL
          </span>
          <h2 style={{ fontSize: "24px", color: "#24352f", margin: "4px 0 8px" }}>
            Admin Sign In
          </h2>
          <p style={{ fontSize: "12px", color: "#77827c", margin: 0 }}>
            Restricted area. Authorized system administrators only.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
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

        <form onSubmit={handleSubmit} noValidate>
          <label style={{ display: "block", marginBottom: "14px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#526158" }}>
              Administrator Email *
            </span>
            <input
              required
              type="email"
              placeholder="admin@interiorfinder.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="username"
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #dce3dc",
                borderRadius: "5px",
                marginTop: "6px",
                fontSize: "13px",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#526158" }}>
              Master Password *
            </span>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 12px",
                  border: "1px solid #dce3dc",
                  borderRadius: "5px",
                  marginTop: "6px",
                  fontSize: "13px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#77827c",
                }}
              >
                {showPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
          </label>

          <button
            className="btn full"
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px" }}
          >
            {loading ? "Authenticating Admin..." : "Access Admin Console ↗"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            borderTop: "1px solid #edf0eb",
            paddingTop: "16px",
            textAlign: "center",
            fontSize: "12px",
            color: "#77827c",
          }}
        >
          <p style={{ margin: "0 0 6px" }}>Not an administrator?</p>
          <Link href="/login" style={{ color: "#14594c", fontWeight: 600 }}>
            ← Return to Customer & Designer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
