"use client";

import { useEffect, useState } from "react";
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

export default function DesignerOnboarding() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

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

  // Portfolio project state
  const [projectTitle, setProjectTitle] = useState("");
  const [projectCategory, setProjectCategory] = useState("Residential");
  const [projectDescription, setProjectDescription] = useState("");
  const [images, setImages] = useState<{ url: string; caption: string }[]>([
    {
      url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
      caption: "Living Room Design",
    },
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  // Load existing profile if user already started
  useEffect(() => {
    async function loadProfile() {
      try {
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
          }
          if (data.projects && data.projects.length > 0) {
            const p = data.projects[0];
            setProjectTitle(p.title || "");
            setProjectCategory(p.category || "Residential");
            setProjectDescription(p.description || "");
            if (Array.isArray(p.images) && p.images.length > 0) {
              setImages(p.images);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load designer profile:", err);
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

  function addImage() {
    if (newImageUrl.trim()) {
      setImages([
        ...images,
        { url: newImageUrl.trim(), caption: newImageCaption.trim() || "Project Image" },
      ]);
      setNewImageUrl("");
      setNewImageCaption("");
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function handleSave(isDraft: boolean) {
    setError("");
    setNotice("");

    if (!displayName.trim() || !title.trim() || !city.trim()) {
      setError("Please fill in Display Name, Professional Title, and Primary City.");
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
        portfolioProject: projectTitle
          ? {
              title: projectTitle,
              category: projectCategory,
              description: projectDescription,
              images,
            }
          : null,
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
        <p style={{ color: "#77827c" }}>Loading your profile data...</p>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth: "1000px", margin: "34px auto 80px" }}>
      <section className="page-hero">
        <span className="eyebrow">OPTION B — DESIGNER ONBOARDING</span>
        <h1>Create Your Professional Designer Profile</h1>
        <p>
          Showcase your style, add portfolio galleries, and connect with homeowners looking for your expertise.
        </p>

        {existingStatus && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "16px",
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
          </div>
        )}
      </section>

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
        {/* Step 1: Basic Professional Identity */}
        <section className="content-panel">
          <h2>1. Professional Details</h2>
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

            <label className="wide">
              Profile Photo URL
              <input
                placeholder="https://... (or image link)"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
              />
            </label>

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

        {/* Step 3: Portfolio Showcase Project */}
        <section className="content-panel">
          <h2>3. Feature Portfolio Project</h2>
          <p className="muted">Upload your best project photos to display on your profile.</p>

          <div className="field-grid">
            <label>
              Project Title
              <input
                placeholder="e.g. Warm Minimalist 3 BHK Apartment"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </label>

            <label>
              Project Category
              <select
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Kitchen">Kitchen Design</option>
                <option value="Living Room">Living Room</option>
                <option value="Bedroom">Bedroom</option>
              </select>
            </label>

            <label className="wide">
              Project Description
              <textarea
                rows={3}
                placeholder="Describe the client brief, materials used, color palette, and special highlights..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginTop: "16px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#24352f", display: "block", marginBottom: "8px" }}>
              Project Images ({images.length}):
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #dce4dd",
                    borderRadius: "6px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "120px",
                      backgroundImage: `url(${img.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: "#e4e8e2",
                    }}
                  />
                  <div style={{ padding: "8px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {img.caption || `Image ${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontWeight: 700 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", background: "#f9faf8", padding: "14px", borderRadius: "6px" }}>
              <input
                placeholder="Image URL (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                style={{ flex: 1, minWidth: "220px", fontSize: "12px" }}
              />
              <input
                placeholder="Caption (e.g. Master Bedroom View)"
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                style={{ width: "200px", fontSize: "12px" }}
              />
              <button
                type="button"
                onClick={addImage}
                className="btn btn-small"
                style={{ fontSize: "12px" }}
              >
                + Add Image
              </button>
            </div>
          </div>
        </section>

        {/* Step 4: Submission Actions */}
        <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
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
