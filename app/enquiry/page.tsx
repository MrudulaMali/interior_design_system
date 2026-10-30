"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const roomOptions = [
  "Living room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining room",
  "Balcony",
  "Full home",
  "Other",
];

const contactMethods = ["Phone", "Email", "WhatsApp"];

export default function Enquiry() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [assignedDesignerId, setAssignedDesignerId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    propertyType: "",
    propertySize: "",
    budget: "",
    designStyle: "",
    contactMethod: "Phone",
    startDate: "",
    description: "",
    rooms: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedData, setSubmittedData] = useState<{
    fullName: string;
    propertyType: string;
    city: string;
    contactMethod?: string;
    budget?: string;
  } | null>(null);

  useEffect(() => {
    // Read query parameter ?designer=...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const des = params.get("designer");
      if (des && !isNaN(Number(des))) {
        setAssignedDesignerId(Number(des));
      }
    }

    // Auto-fill logged-in user's details if available
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUserRole(data.user.role || null);
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || data.user.fullName || "",
            email: prev.email || data.user.email || "",
            phone: prev.phone || data.user.phone || "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function toggleRoom(room: string) {
    setFormData((prev) => {
      const exists = prev.rooms.includes(room);
      return {
        ...prev,
        rooms: exists
          ? prev.rooms.filter((r) => r !== room)
          : [...prev.rooms, room],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          assignedDesignerId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit enquiry.");
      }

      setSubmittedData({
        fullName: result.enquiry?.fullName || formData.fullName,
        propertyType: result.enquiry?.propertyType || formData.propertyType,
        city: result.enquiry?.city || formData.city,
        contactMethod: formData.contactMethod,
        budget: formData.budget,
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        propertyType: "",
        propertySize: "",
        budget: "",
        designStyle: "",
        contactMethod: "Phone",
        startDate: "",
        description: "",
        rooms: [],
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <section className="page-hero">
        <span className="eyebrow">LET'S CREATE SOMETHING BEAUTIFUL</span>
        <h1>Share Your Project Details</h1>
        <p>
          Tell us a little about your space. The right designer will be in
          touch.
        </p>
      </section>

      {currentUserRole === "designer" && (
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto 24px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <b style={{ color: "#065f46", fontSize: "14px" }}>Looking for Customers?</b>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#047857" }}>
              You are logged in as an Interior Designer. Homeowners use this form to hire you. To view customer briefs and manage your client leads, visit your workspace.
            </p>
          </div>
          <Link href="/designer/dashboard" className="btn btn-small" style={{ fontSize: "12px" }}>
            Go to Find Customers ↗
          </Link>
        </div>
      )}

      {submittedData ? (
        <div
          className="content-panel"
          style={{
            maxWidth: "680px",
            margin: "20px auto 60px",
            padding: "48px 36px",
            textAlign: "center",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              width: "64px",
              height: "64px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "#e4f3e8",
              color: "#14594c",
              fontSize: "30px",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            ✓
          </span>

          <h2 style={{ fontSize: "28px", color: "var(--deep)", marginBottom: "12px" }}>
            Enquiry Submitted Successfully!
          </h2>

          <p style={{ color: "#52665b", fontSize: "15px", lineHeight: "1.6", maxWidth: "520px", margin: "0 auto 28px" }}>
            Thank you, <strong>{submittedData.fullName}</strong>. We have received your project details for{" "}
            <strong>{submittedData.propertyType || "Interior Design"}</strong> in <strong>{submittedData.city}</strong>.
          </p>

          {/* Project Summary Card */}
          <div
            style={{
              background: "#f8faf8",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              padding: "20px 24px",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #eef2ed",
                paddingBottom: "12px",
                marginBottom: "14px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "var(--green)", textTransform: "uppercase" }}>
                Enquiry Summary
              </span>
              <span
                style={{
                  background: "#e4f3e8",
                  color: "#14594c",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                ● Received & In Review
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--muted)", fontSize: "12px", display: "block" }}>Project Type</span>
                <strong style={{ color: "var(--deep)" }}>{submittedData.propertyType || "Interior Design"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)", fontSize: "12px", display: "block" }}>Location</span>
                <strong style={{ color: "var(--deep)" }}>{submittedData.city}</strong>
              </div>
              {submittedData.budget && (
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "12px", display: "block" }}>Estimated Budget</span>
                  <strong style={{ color: "var(--deep)" }}>{submittedData.budget}</strong>
                </div>
              )}
              <div>
                <span style={{ color: "var(--muted)", fontSize: "12px", display: "block" }}>Preferred Contact</span>
                <strong style={{ color: "var(--deep)" }}>{submittedData.contactMethod || "Phone / Email"}</strong>
              </div>
            </div>
          </div>

          {/* What happens next guidance */}
          <div
            style={{
              background: "#ffffff",
              border: "1px dashed #d5ded6",
              borderRadius: "10px",
              padding: "18px 22px",
              marginBottom: "32px",
              textAlign: "left",
            }}
          >
            <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "var(--deep)" }}>
              What happens next?
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#55675e", lineHeight: "1.7" }}>
              <li>The interior designer will review your space requirements and aesthetic style.</li>
              <li>You will be contacted via {submittedData.contactMethod || "phone or email"} for an initial consultation.</li>
              <li>Track your consultation progress anytime from your customer dashboard.</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="outline-btn"
              onClick={() => setSubmittedData(null)}
              style={{ padding: "11px 20px" }}
            >
              Submit Another Enquiry
            </button>
            <Link href="/customer/dashboard" className="btn" style={{ padding: "11px 22px" }}>
              Track in My Dashboard ↗
            </Link>
          </div>
        </div>
      ) : (
        <div className="enquiry-layout">
          <form className="content-panel enquiry-form" onSubmit={handleSubmit}>
            <h2>Enquiry Form</h2>
            <p className="muted">Fields marked * are required.</p>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "18px",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            <div className="field-grid">
              <label>
                Full name *
                <input
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                />
              </label>

              <label>
                Email address *
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Phone number *
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Your contact number"
                />
              </label>

              <label>
                City *
                <input
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Pune, Mumbai, Kolhapur"
                />
              </label>

              <label>
                Project type *
                <select
                  required
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                >
                  <option value="">Choose project type</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Villa">Villa / Bungalow</option>
                  <option value="Apartment / Flat">Apartment / Flat</option>
                </select>
              </label>

              <label>
                Space size
                <select
                  name="propertySize"
                  value={formData.propertySize}
                  onChange={handleInputChange}
                >
                  <option value="">Select approximate area</option>
                  <option value="Under 500 sq. ft.">Under 500 sq. ft.</option>
                  <option value="500–1000 sq. ft.">500–1000 sq. ft.</option>
                  <option value="1000–2000 sq. ft.">1000–2000 sq. ft.</option>
                  <option value="2000+ sq. ft.">2000+ sq. ft.</option>
                </select>
              </label>

              <label>
                Estimated budget *
                <select
                  required
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                >
                  <option value="">Select your budget</option>
                  <option value="Under ₹2 lakh">Under ₹2 lakh</option>
                  <option value="₹2–5 lakh">₹2–5 lakh</option>
                  <option value="₹5–10 lakh">₹5–10 lakh</option>
                  <option value="₹10–20 lakh">₹10–20 lakh</option>
                  <option value="₹20 lakh+">₹20 lakh+</option>
                </select>
              </label>

              <label>
                Preferred style
                <select
                  name="designStyle"
                  value={formData.designStyle}
                  onChange={handleInputChange}
                >
                  <option value="">Choose a style</option>
                  <option value="Modern & Minimal">Modern & Minimal</option>
                  <option value="Contemporary">Contemporary</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Luxury / Neo-Classical">Luxury / Neo-Classical</option>
                  <option value="Bohemian">Bohemian</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </label>

              <label>
                Preferred contact method
                <select
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleInputChange}
                >
                  {contactMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Expected start date
                <select
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                >
                  <option value="">When do you plan to start?</option>
                  <option value="Immediately">Immediately</option>
                  <option value="Within 1 month">Within 1 month</option>
                  <option value="1–3 months">1–3 months</option>
                  <option value="Just planning / exploring">Just planning / exploring</option>
                </select>
              </label>

              <div className="wide">
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#526158", display: "block", marginBottom: "8px" }}>
                  Select rooms included in project:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {roomOptions.map((room) => {
                    const isSelected = formData.rooms.includes(room);
                    return (
                      <button
                        type="button"
                        key={room}
                        onClick={() => toggleRoom(room)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          border: isSelected ? "1px solid #14594c" : "1px solid #cfdad2",
                          background: isSelected ? "#e9f0e9" : "#fff",
                          color: isSelected ? "#14594c" : "#526158",
                          fontWeight: isSelected ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {room}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="wide">
                Tell us about your project
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Share your requirements, ideas, themes, or special considerations..."
                />
              </label>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Submitting enquiry..." : "Submit Enquiry ↗"}
            </button>
          </form>

          <aside className="enquiry-aside">
            <div className="aside-image" />
            <h3>Great design starts with a conversation.</h3>
            <p>
              Share your vision and let a professional help you plan the next
              step.
            </p>
            <ul>
              <li>✓ Direct consultation with verified designers</li>
              <li>✓ Personalized layouts and custom concepts</li>
              <li>✓ Tailored solutions matching your budget</li>
              <li>✓ Transparent timelines and quotes</li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
