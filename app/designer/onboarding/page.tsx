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

  // Upload states
  const [uploadTab, setUploadTab] = useState<"device" | "url">("device");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

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

  function updateImageCaption(index: number, newCaption: string) {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption: newCaption } : img))
    );
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function uploadFilesFromDevice(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setError("Please select valid image files (JPG, PNG, WEBP, GIF, etc.).");
      return;
    }

    setUploadingImages(true);
    setError("");

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload image(s).");
      }

      const data = await res.json();
      if (Array.isArray(data.files) && data.files.length > 0) {
        const newItems = data.files.map((f: { url: string; caption?: string }) => ({
          url: f.url,
          caption: f.caption || "Project Image",
        }));
        setImages((prev) => [...prev, ...newItems]);
      }
    } catch (err) {
      console.warn("Upload endpoint failed, falling back to in-browser file reading:", err);
      // Browser fallback using FileReader
      try {
        const fallbackItems: { url: string; caption: string }[] = [];
        for (const file of files) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const cleanCaption = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
          fallbackItems.push({ url: dataUrl, caption: cleanCaption });
        }
        setImages((prev) => [...prev, ...fallbackItems]);
      } catch {
        setError(err instanceof Error ? err.message : "Error reading files from device.");
      }
    } finally {
      setUploadingImages(false);
      if (projectFileInputRef.current) {
        projectFileInputRef.current.value = "";
      }
    }
  }

  async function uploadAvatarFromDevice(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file for your profile photo.");
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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void uploadFilesFromDevice(e.dataTransfer.files);
    }
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
        <span className="eyebrow">DESIGNER STUDIO</span>
        <h1>Manage Your Professional Designer Profile</h1>
        <p>
          Showcase your style, upload high-resolution portfolio photos directly from your device, and get approved to connect with clients.
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
            {existingStatus === "rejected" && " (Revision Requested)"}
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

            {/* Profile Photo / Avatar with PC Upload */}
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
          <p className="muted">Upload your best project photos from your PC or device to display on your profile.</p>

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

          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#24352f" }}>
                Project Images ({images.length}):
              </span>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                The first image serves as the main cover photo for this project.
              </span>
            </div>

            {/* Existing and Newly Added Images Preview Grid */}
            {images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #dce4dd",
                      borderRadius: "8px",
                      overflow: "hidden",
                      position: "relative",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        height: "135px",
                        backgroundImage: `url(${img.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#e4e8e2",
                        position: "relative",
                      }}
                    >
                      {idx === 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            background: "var(--green)",
                            color: "#fff",
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "3px 7px",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                          }}
                        >
                          Cover Image
                        </span>
                      )}
                    </div>

                    <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "10px", color: "var(--muted)", margin: 0, fontWeight: 600 }}>
                        Caption:
                      </label>
                      <input
                        value={img.caption}
                        onChange={(e) => updateImageCaption(idx, e.target.value)}
                        placeholder="e.g. Master Bedroom"
                        style={{
                          fontSize: "11px",
                          border: "1px solid #dce4dd",
                          borderRadius: "4px",
                          padding: "5px 7px",
                          width: "100%",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#b91c1c",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "11px",
                            padding: "2px 4px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image Options: PC/Device Upload vs URL */}
            <div
              style={{
                background: "#f9faf8",
                border: "1px solid #e2e8e0",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "14px",
                  borderBottom: "1px solid #e0e7df",
                  paddingBottom: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setUploadTab("device")}
                  style={{
                    background: uploadTab === "device" ? "var(--green)" : "#fff",
                    color: uploadTab === "device" ? "#fff" : "var(--ink)",
                    border: "1px solid",
                    borderColor: uploadTab === "device" ? "var(--green)" : "#cfdad2",
                    padding: "7px 16px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>💻</span> Upload from Device (PC / Phone)
                </button>

                <button
                  type="button"
                  onClick={() => setUploadTab("url")}
                  style={{
                    background: uploadTab === "url" ? "var(--green)" : "#fff",
                    color: uploadTab === "url" ? "#fff" : "var(--ink)",
                    border: "1px solid",
                    borderColor: uploadTab === "url" ? "var(--green)" : "#cfdad2",
                    padding: "7px 16px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🔗</span> Paste Image URL
                </button>
              </div>

              {uploadTab === "device" ? (
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => projectFileInputRef.current?.click()}
                    style={{
                      border: isDragging ? "2px dashed var(--green)" : "2px dashed #b8c7bd",
                      borderRadius: "8px",
                      padding: "28px 20px",
                      textAlign: "center",
                      background: isDragging ? "#eef6f1" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      ref={projectFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          void uploadFilesFromDevice(e.target.files);
                        }
                      }}
                    />
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📁</div>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--deep)", marginBottom: "4px" }}>
                      Click to choose images from your PC or device
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px" }}>
                      Or drag and drop files directly here. Supports JPG, PNG, WEBP, GIF. You can select multiple images at once.
                    </div>
                    <button
                      type="button"
                      className="btn btn-small"
                      style={{ fontSize: "12px", pointerEvents: "none" }}
                    >
                      {uploadingImages ? "Uploading images..." : "+ Browse Photos from Device"}
                    </button>
                    {uploadingImages && (
                      <div style={{ marginTop: "12px", color: "var(--green)", fontWeight: 600, fontSize: "12px" }}>
                        ⏳ Uploading and processing images, please wait...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
              )}
            </div>
          </div>
        </section>

        {/* Step 4: Submission Actions */}
        <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end", alignItems: "center" }}>
          <Link
            href="/designer/dashboard"
            style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "underline", marginRight: "auto" }}
          >
            ← Back to Designer Dashboard
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
