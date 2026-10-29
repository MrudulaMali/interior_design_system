"use client";

import { useState } from "react";
import Link from "next/link";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      window.location.href = data.redirectUrl || "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-image">
        <span className="eyebrow">MAKE ROOM FOR INSPIRATION</span>
        <h1>Create Your Dream Space with the Right Designer</h1>
        <p>Join a community of homeowners and talented design professionals.</p>
        <div className="feature-pills">
          <span>✦ Verified Designers</span>
          <span>⌂ Inspiring Portfolios</span>
          <span>♡ Personalised Matches</span>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <span className="eyebrow">GET STARTED</span>
        <h2>Create your account</h2>
        <p>It only takes a minute to get started.</p>

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
              marginBottom: "12px",
            }}
          >
            {error}
          </div>
        )}

        <label>
          Full name *
          <input
            required
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            disabled={loading}
          />
        </label>

        <label>
          Email address *
          <input
            required
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
        </label>

        <label>
          Phone number
          <input
            type="tel"
            name="phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />
        </label>

        <label>
          Password *
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              required
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              style={{ width: "100%", paddingRight: "40px" }}
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
                fontSize: "14px",
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

        <label>
          I am a
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="customer">Customer looking for a designer</option>
            <option value="designer">Interior designer</option>
          </select>
        </label>

        <button className="btn full" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="form-note">
          By registering, you agree to our Terms and Privacy Policy.
        </p>

        <p className="center">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
