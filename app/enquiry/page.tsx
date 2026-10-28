"use client";

import { useState } from "react";
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
    id: number;
    fullName: string;
    propertyType: string;
    city: string;
  } | null>(null);

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
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit enquiry.");
      }

      setSubmittedData({
        id: result.enquiry.id,
        fullName: result.enquiry.fullName,
        propertyType: result.enquiry.propertyType,
        city: result.enquiry.city,
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

      {submittedData ? (
        <div className="content-panel" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px" }}>
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                display: "inline-flex",
                width: "56px",
                height: "56px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "#e4f3e8",
                color: "#14594c",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              ✓
            </span>
            <h2 style={{ marginBottom: "12px" }}>Enquiry Submitted Successfully!</h2>
            <p style={{ color: "#68756d", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
              Thank you, <strong>{submittedData.fullName}</strong>. Your enquiry for{" "}
              <strong>{submittedData.propertyType}</strong> in <strong>{submittedData.city}</strong>{" "}
              has been recorded with Enquiry ID <strong>#{submittedData.id}</strong>.
            </p>

            <div
              style={{
                background: "#f7f8f5",
                padding: "18px 24px",
                borderRadius: "8px",
                marginBottom: "28px",
                display: "inline-block",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <div><strong>Reference ID:</strong> #{submittedData.id}</div>
              <div style={{ marginTop: "6px" }}>
                <strong>Status:</strong> <span className="status new">New</span>
              </div>
              <div style={{ marginTop: "6px" }}>
                <strong>Recorded in Database:</strong> PostgreSQL
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                className="outline-btn"
                onClick={() => setSubmittedData(null)}
              >
                Submit Another Enquiry
              </button>
              <Link href="/dashboard" className="btn">
                View in Dashboard ↗
              </Link>
            </div>
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
              {loading ? "Submitting to Database..." : "Submit Enquiry ↗"}
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
              <li>✓ Connected to PostgreSQL via Drizzle ORM</li>
              <li>✓ Direct review on the Designer Dashboard</li>
              <li>✓ Connect with verified interior designers</li>
              <li>✓ Discuss your budget and timeline</li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
