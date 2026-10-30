"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const availableSpecializations = [
  "Modern & Minimal",
  "Contemporary",
  "Luxury & Classical",
  "Scandinavian",
  "Traditional Indian",
  "Industrial",
  "Bohemian",
  "Eco-Friendly & Sustainable",
];

const availableServices = [
  "Full Home Turnkey Design",
  "Space Planning & Layouts",
  "Modular Kitchen & Wardrobe",
  "Living & Dining Styling",
  "Commercial & Office Interiors",
  "3D Visualization & Walkthroughs",
  "Renovation & Remodeling",
];

const availableProjectTypes = [
  "Apartments (1/2/3 BHK)",
  "Villas & Bungalows",
  "Penthouses",
  "Offices & Co-working",
  "Retail & Restaurants",
];

export default function EditDesignerProfile() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [showPhonePublicly, setShowPhonePublicly] = useState(true);
  const [city, setCity] = useState("Pune");
  const [serviceLocations, setServiceLocations] = useState<string[]>(["Pune"]);
  const [newLocation, setNewLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState(5);
  const [specializations, setSpecializations] = useState<string[]>(["Modern & Minimal"]);
  const [services, setServices] = useState<string[]>(["Full Home Turnkey Design"]);
  const [projectTypes, setProjectTypes] = useState<string[]>(["Apartments (1/2/3 BHK)"]);
  const [profileImage, setProfileImage] = useState("");
  const [startingBudget, setStartingBudget] = useState("₹5–10 lakh");

  // Avatar upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setFetching(true);
        const res = await fetch("/api/designer/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setDisplayName(data.profile.displayName || "");
            setTitle(data.profile.title || "");
            setBio(data.profile.bio || "");
            setPhone(data.profile.phone || "");
            setShowPhonePublicly(data.profile.showPhonePublicly ?? true);
            setCity(data.profile.city || "Pune");
            setServiceLocations(data.profile.serviceLocations || ["Pune"]);
            setYearsExperience(data.profile.yearsExperience || 0);
            setSpecializations(data.profile.specializations || []);
            setServices(data.profile.services || []);
            setProjectTypes(data.profile.projectTypes || []);
            setProfileImage(data.profile.profileImage || "");
            setStartingBudget(data.profile.startingBudget || "");
            setExistingStatus(data.profile.status);
            setRejectionReason(data.profile.rejectionReason || null);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setFetching(false);
      }
    }
    void loadProfile();
  }, []);

  function toggleChip(
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  }

  function addLocation() {
    if (newLocation.trim() && !serviceLocations.includes(newLocation.trim())) {
      setServiceLocations([...serviceLocations, newLocation.trim()]);
      setNewLocation("");
    }
  }

  async function uploadAvatarFromDevice(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setUploadingAvatar(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload profile photo.");
      }

      const data = await res.json();
      if (data.url) {
        setProfileImage(data.url);
      }
    } catch (err) {
      console.warn("Avatar upload failed, falling back to data URL:", err);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = "";
      }
    }
  }

  async function handleSave(isDraft: boolean) {
    setError("");
    setNotice("");

    if (!displayName.trim() || !title.trim() || !city.trim()) {
      setError("Please fill in Professional / Studio Name, Title, and Primary City.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        displayName,
        title,
        bio,
        phone,
        showPhonePublicly,
        city,
        serviceLocations,
        yearsExperience,
        specializations,
        services,
        projectTypes,
        profileImage,
        startingBudget,
        isDraft,
      };

      const res = await fetch("/api/designer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save profile.");
      }

      setExistingStatus(result.status);
      setNotice(
        isDraft
          ? "Profile saved as draft. You can continue editing anytime."
          : "Profile submitted successfully! It is now pending administrator review."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="page-wrap" style={{ textAlign: "center", padding: "80px 20px" }}>
        <p style={{ color: "var(--muted)" }}>Loading your profile data...</p>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth: "1000px", margin: "34px auto 80px" }}>
      {/* Hero */}
      <section className="page-hero">
        <span className="eyebrow">DESIGNER STUDIO</span>
        <h1>Edit Profile & Studio Details</h1>
        <p>
          Configure your studio identity, specialties, contact preferences, and design philosophy.
        </p>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/designer/dashboard" className="outline-btn btn-small" style={{ fontSize: "12px" }}>
            ← Back to Workspace Overview
          </Link>
          <Link href="/designer/portfolio" className="btn btn-small" style={{ fontSize: "12px" }}>
            🖼 Manage Portfolio Projects →
          </Link>

          {existingStatus && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                background:
                  existingStatus === "approved"
                    ? "#e4f3e8"
                    : existingStatus === "pending"
                      ? "#fff1d8"
                      : "#f4f5ef",
                color:
                  existingStatus === "approved"
                    ? "#2d8050"
                    : existingStatus === "pending"
                      ? "#9a6b15"
                      : "#526158",
              }}
            >
              Status: {existingStatus.toUpperCase()}
              {existingStatus === "pending" && " (Awaiting Admin Review)"}
              {existingStatus === "approved" && " (Live on Public Directory)"}
              {existingStatus === "rejected" && " (Revision Requested)"}
            </div>
          )}
        </div>
      </section>

      {rejectionReason && existingStatus === "rejected" && (
        <div
          role="alert"
          style={{
            padding: "16px 20px",
            borderRadius: "8px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#9f1239",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          <strong>Admin Feedback for Revision:</strong> {rejectionReason}
        </div>
      )}

      {notice && (
        <div
          role="status"
          style={{
            padding: "14px 18px",
            borderRadius: "6px",
            background: "#edf4ef",
            border: "1px solid #d9e6dc",
            color: "#14594c",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          ✓ {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: "14px 18px",
            borderRadius: "6px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          ✕ {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "28px" }}>
        {/* Step 1: Professional Details */}
        <section className="content-panel">
          <h2>1. Professional Studio Details</h2>
          <p className="muted">This information appears at the top of your public profile card.</p>

          <div className="field-grid">
            <label>
              Professional / Studio Display Name *
              <input
                required
                placeholder="e.g. Riya Sharma Designs"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>

            <label>
              Professional Title *
              <input
                required
                placeholder="e.g. Principal Interior Designer & Space Planner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label>
              Primary City *
              <input
                required
                placeholder="e.g. Pune"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            <label>
              Years of Experience
              <input
                type="number"
                min="0"
                max="50"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
              />
            </label>

            <label>
              Contact Phone
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label>
              Starting Budget Bracket
              <select
                value={startingBudget}
                onChange={(e) => setStartingBudget(e.target.value)}
              >
                <option value="Under ₹2 lakh">Under ₹2 lakh</option>
                <option value="₹2–5 lakh">₹2–5 lakh</option>
                <option value="₹5–10 lakh">₹5–10 lakh</option>
                <option value="₹10–20 lakh">₹10–20 lakh</option>
                <option value="₹20 lakh+">₹20 lakh+</option>
              </select>
            </label>

            <label className="wide check-label" style={{ margin: "4px 0" }}>
              <input
                type="checkbox"
                checked={showPhonePublicly}
                onChange={(e) => setShowPhonePublicly(e.target.checked)}
              />
              Show phone number publicly on profile (otherwise clients contact via enquiry form)
            </label>

            {/* Profile Photo / Avatar */}
            <div className="wide" style={{ background: "#fbfcfb", border: "1px solid #e7ede6", padding: "16px", borderRadius: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--deep)", display: "block", marginBottom: "8px" }}>
                Profile Photo / Studio Avatar
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "50%",
                    backgroundImage: profileImage ? `url(${profileImage})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "var(--mint)",
                    display: "grid",
                    placeItems: "center",
                    border: "2px solid #cfdad2",
                    color: "var(--green)",
                    fontWeight: 700,
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {!profileImage && (displayName ? displayName.charAt(0).toUpperCase() : "👤")}
                </div>

                <div style={{ flex: 1, minWidth: "240px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadAvatarFromDevice(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="outline-btn"
                      disabled={uploadingAvatar}
                      style={{ fontSize: "12px", padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <span>💻</span> {uploadingAvatar ? "Uploading photo..." : "Upload Photo from PC / Device"}
                    </button>
                    {profileImage && (
                      <button
                        type="button"
                        onClick={() => setProfileImage("")}
                        style={{ background: "none", border: "none", color: "#991b1b", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <input
                    placeholder="Or enter image URL (https://...)"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    style={{ fontSize: "11px", padding: "7px 10px" }}
                  />
                </div>
              </div>
            </div>

            <label className="wide">
              About Me & Design Philosophy
              <textarea
                rows={4}
                placeholder="Introduce yourself, your design journey, and how you approach interior projects..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Step 2: Specializations & Services */}
        <section className="content-panel">
          <h2>2. Specializations & Services</h2>
          <p className="muted">Select all styles and services you offer to help clients find you.</p>

          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#24352f", display: "block", marginBottom: "8px" }}>
              Design Styles & Aesthetics:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {availableSpecializations.map((item) => {
                const active = specializations.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleChip(item, specializations, setSpecializations)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      border: active ? "1px solid #14594c" : "1px solid #dce4dd",
                      background: active ? "#e9f0e9" : "#fff",
                      color: active ? "#14594c" : "#526158",
                      fontWeight: active ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {active ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#24352f", display: "block", marginBottom: "8px" }}>
              Services Provided:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {availableServices.map((item) => {
                const active = services.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleChip(item, services, setServices)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      border: active ? "1px solid #14594c" : "1px solid #dce4dd",
                      background: active ? "#e9f0e9" : "#fff",
                      color: active ? "#14594c" : "#526158",
                      fontWeight: active ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {active ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#24352f", display: "block", marginBottom: "8px" }}>
              Project Types Supported:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {availableProjectTypes.map((item) => {
                const active = projectTypes.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleChip(item, projectTypes, setProjectTypes)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      border: active ? "1px solid #14594c" : "1px solid #dce4dd",
                      background: active ? "#e9f0e9" : "#fff",
                      color: active ? "#14594c" : "#526158",
                      fontWeight: active ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {active ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#24352f", display: "block", marginBottom: "8px" }}>
              Service Locations:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              {serviceLocations.map((loc) => (
                <span
                  key={loc}
                  style={{
                    background: "#f4f5ef",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ⌖ {loc}
                  <button
                    type="button"
                    onClick={() =>
                      setServiceLocations(serviceLocations.filter((l) => l !== loc))
                    }
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div style={{ display: "inline-flex", gap: "6px" }}>
                <input
                  placeholder="Add location (e.g. Mumbai)"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: "12px", width: "160px" }}
                />
                <button
                  type="button"
                  onClick={addLocation}
                  className="outline-btn"
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Link Promotion Card */}
        <section
          style={{
            background: "#f9faf8",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "var(--deep)" }}>
              Manage Your Portfolio Photos & Projects
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
              Upload and organize project photo galleries separately in the dedicated portfolio manager.
            </p>
          </div>
          <Link href="/designer/portfolio" className="btn btn-small" style={{ fontSize: "12px" }}>
            Open Portfolio Manager ↗
          </Link>
        </section>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end", alignItems: "center" }}>
          <Link
            href="/designer/dashboard"
            style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "underline", marginRight: "auto" }}
          >
            ← Back to Workspace Overview
          </Link>

          <button
            type="button"
            className="outline-btn"
            disabled={loading}
            onClick={() => void handleSave(true)}
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => void handleSave(false)}
          >
            {loading ? "Submitting..." : "Submit for Admin Approval ↗"}
          </button>
        </div>
      </div>
    </div>
  );
}
