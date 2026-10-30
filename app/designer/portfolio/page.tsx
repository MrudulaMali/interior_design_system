"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface PortfolioImage {
  url: string;
  caption?: string;
}

interface PortfolioProject {
  id: number;
  designerProfileId: number;
  title: string;
  category: string;
  description: string | null;
  images: PortfolioImage[];
  createdAt: string;
}

const categoryOptions = [
  "Residential",
  "Commercial",
  "Kitchen",
  "Living Room",
  "Bedroom",
  "Dining",
  "Bathroom",
  "Office",
  "Hospitality",
  "Other",
];

export default function ManagePortfolio() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Editor modal/form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Residential");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<PortfolioImage[]>([]);

  // Image input states
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [uploadTab, setUploadTab] = useState<"device" | "url">("device");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/designer/portfolio");
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data.projects) ? data.projects : []);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Unable to load portfolio projects.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  function handleOpenNew() {
    setEditingId(null);
    setTitle("");
    setCategory("Residential");
    setDescription("");
    setImages([]);
    setNewImageUrl("");
    setNewImageCaption("");
    setIsEditing(true);
    setError("");
    setNotice("");
  }

  function handleOpenEdit(project: PortfolioProject) {
    setEditingId(project.id);
    setTitle(project.title || "");
    setCategory(project.category || "Residential");
    setDescription(project.description || "");
    setImages(Array.isArray(project.images) ? [...project.images] : []);
    setNewImageUrl("");
    setNewImageCaption("");
    setIsEditing(true);
    setError("");
    setNotice("");
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditingId(null);
  }

  async function uploadFilesFromDevice(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setError("Please select valid image files (JPG, PNG, WEBP, GIF, etc.).");
      return;
    }

    setUploading(true);
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
      console.warn("API upload failed, using fallback FileReader:", err);
      try {
        const fallbackItems: PortfolioImage[] = [];
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
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleAddImageUrl() {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      { url: newImageUrl.trim(), caption: newImageCaption.trim() || "Project Image" },
    ]);
    setNewImageUrl("");
    setNewImageCaption("");
  }

  function handleUpdateCaption(index: number, newCaption: string) {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption: newCaption } : img))
    );
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a project title.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/designer/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: title.trim(),
          category,
          description: description.trim(),
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save portfolio project.");
      }

      setNotice(editingId ? "Project updated successfully!" : "New project added to portfolio!");
      setIsEditing(false);
      setEditingId(null);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(id: number, projectTitle: string) {
    if (!confirm(`Are you sure you want to delete "${projectTitle}" from your portfolio?`)) {
      return;
    }

    try {
      setError("");
      setNotice("");
      const res = await fetch(`/api/designer/portfolio?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete project.");
      }

      setNotice(`"${projectTitle}" was deleted.`);
      if (editingId === id) {
        setIsEditing(false);
        setEditingId(null);
      }
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete project.");
    }
  }

  return (
    <div className="page-wrap" style={{ maxWidth: "1050px", margin: "34px auto 80px" }}>
      {/* Top Header */}
      <section className="page-hero" style={{ marginBottom: "28px" }}>
        <span className="eyebrow">DESIGNER WORKSPACE</span>
        <h1 style={{ marginBottom: "8px" }}>Manage Portfolio & Project Galleries</h1>
        <p style={{ maxWidth: "620px", color: "var(--muted)", lineHeight: 1.6 }}>
          Showcase real transformations, high-resolution photography, and room concepts. Your approved portfolio projects appear on your profile and the public inspiration directory.
        </p>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
          <Link href="/designer/dashboard" className="outline-btn btn-small" style={{ fontSize: "12px" }}>
            ← Back to Workspace Overview
          </Link>
          <Link href="/designer/profile" className="outline-btn btn-small" style={{ fontSize: "12px" }}>
            ✎ Edit Profile & Studio Details →
          </Link>
        </div>
      </section>

      {/* Alerts */}
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

      {/* Top Action Strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "18px", margin: "0 0 4px", color: "var(--deep)" }}>
            Your Projects ({projects.length})
          </h2>
          <small style={{ color: "var(--muted)" }}>
            Total photos uploaded: {projects.reduce((acc, p) => acc + (Array.isArray(p.images) ? p.images.length : 0), 0)}
          </small>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="btn btn-small"
            onClick={handleOpenNew}
            style={{ fontSize: "12px" }}
          >
            + Add New Portfolio Project
          </button>
        )}
      </div>

      {/* Project Editor Form (When Adding or Editing) */}
      {isEditing && (
        <div
          className="content-panel"
          style={{
            border: "2px solid var(--green)",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "32px",
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", color: "var(--deep)" }}>
              {editingId ? "Edit Portfolio Project" : "Create New Portfolio Project"}
            </h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                color: "var(--muted)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveProject}>
            <div className="field-grid">
              <label>
                Project Title *
                <input
                  required
                  placeholder="e.g. Modern Japandi 3BHK Penthouse"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label>
                Category *
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wide">
                Project Story & Description
                <textarea
                  rows={3}
                  placeholder="Describe the architectural concept, color palette, custom cabinetry, materials, and unique highlights..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            </div>

            {/* Photos Upload Section */}
            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--deep)" }}>
                  Project Photos ({images.length})
                </span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  The first photo acts as the project cover.
                </span>
              </div>

              {/* Photos Grid */}
              {images.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "14px",
                    marginBottom: "20px",
                  }}
                >
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid #dce4dd",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          height: "130px",
                          backgroundImage: `url(${img.url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: "#e8ede7",
                          position: "relative",
                        }}
                      >
                        {idx === 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              background: "var(--green)",
                              color: "#fff",
                              fontSize: "9px",
                              fontWeight: 700,
                              padding: "3px 6px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                            }}
                          >
                            Cover
                          </span>
                        )}
                      </div>

                      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <input
                          placeholder="Caption (e.g. Master Bedroom)"
                          value={img.caption || ""}
                          onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                          style={{ fontSize: "11px", padding: "5px 8px" }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#b91c1c",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            Delete Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Image Controls (Device vs URL) */}
              <div
                style={{
                  background: "#f9faf8",
                  border: "1px solid #e2e8e0",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setUploadTab("device")}
                    style={{
                      background: uploadTab === "device" ? "var(--green)" : "#fff",
                      color: uploadTab === "device" ? "#fff" : "var(--ink)",
                      border: "1px solid",
                      borderColor: uploadTab === "device" ? "var(--green)" : "#cfdad2",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    💻 Upload from PC / Device
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadTab("url")}
                    style={{
                      background: uploadTab === "url" ? "var(--green)" : "#fff",
                      color: uploadTab === "url" ? "#fff" : "var(--ink)",
                      border: "1px solid",
                      borderColor: uploadTab === "url" ? "var(--green)" : "#cfdad2",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🔗 Paste Image URL
                  </button>
                </div>

                {uploadTab === "device" ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) {
                        void uploadFilesFromDevice(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragging ? "2px dashed var(--green)" : "2px dashed #b8c7bd",
                      borderRadius: "8px",
                      padding: "26px 16px",
                      textAlign: "center",
                      background: isDragging ? "#eef6f1" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files) void uploadFilesFromDevice(e.target.files);
                      }}
                    />
                    <div style={{ fontSize: "30px", marginBottom: "6px" }}>📁</div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--deep)", marginBottom: "4px" }}>
                      Click to choose photos from your device
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>
                      Drag and drop files here. Multi-photo upload supported (JPG, PNG, WEBP).
                    </div>
                    <button type="button" className="btn btn-small" style={{ fontSize: "11px", pointerEvents: "none" }}>
                      {uploading ? "Uploading photos..." : "+ Choose Files from Device"}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      placeholder="Image URL (https://...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      style={{ flex: 1, minWidth: "220px", fontSize: "12px" }}
                    />
                    <input
                      placeholder="Caption (e.g. Living room corner)"
                      value={newImageCaption}
                      onChange={(e) => setNewImageCaption(e.target.value)}
                      style={{ width: "200px", fontSize: "12px" }}
                    />
                    <button type="button" onClick={handleAddImageUrl} className="btn btn-small" style={{ fontSize: "12px" }}>
                      + Add Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button type="button" className="outline-btn" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving Project..." : editingId ? "Update Project ↗" : "Save Project ↗"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          Loading your portfolio projects...
        </div>
      ) : projects.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px dashed var(--line)",
            borderRadius: "8px",
            padding: "50px 20px",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: "17px", color: "var(--deep)", marginBottom: "8px" }}>
            No portfolio projects added yet
          </h3>
          <p style={{ color: "var(--muted)", maxWidth: "460px", margin: "0 auto 20px", fontSize: "13px" }}>
            Add showcase projects to display your craftsmanship and aesthetic style. Portfolios help clients choose you for their interior projects.
          </p>
          <button type="button" className="btn" onClick={handleOpenNew}>
            + Create Your First Portfolio Project
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          {projects.map((project) => {
            const projectImages = Array.isArray(project.images) ? project.images : [];
            return (
              <div
                key={project.id}
                className="content-panel"
                style={{
                  padding: "20px 24px",
                  borderRadius: "8px",
                  background: "#fff",
                  border: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h3 style={{ margin: 0, fontSize: "18px", color: "var(--deep)" }}>
                        {project.title}
                      </h3>
                      <span
                        style={{
                          background: "var(--mint)",
                          color: "var(--green)",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          textTransform: "uppercase",
                        }}
                      >
                        {project.category}
                      </span>
                    </div>

                    {project.description && (
                      <p style={{ margin: "4px 0 12px", color: "#4f5e55", fontSize: "13px", lineHeight: 1.5, maxWidth: "700px" }}>
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="outline-btn btn-small"
                      onClick={() => handleOpenEdit(project)}
                      style={{ fontSize: "11px", padding: "6px 12px" }}
                    >
                      ✎ Edit Project
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      style={{
                        background: "none",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        fontSize: "11px",
                        padding: "6px 12px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Thumbnails */}
                {projectImages.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: "10px",
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px solid #f0f3ef",
                    }}
                  >
                    {projectImages.map((img, i) => (
                      <div
                        key={i}
                        style={{
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "1px solid var(--line)",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            height: "90px",
                            backgroundImage: `url(${img.url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundColor: "#e8ede7",
                          }}
                        />
                        {img.caption && (
                          <div
                            style={{
                              padding: "4px 6px",
                              fontSize: "10px",
                              color: "var(--muted)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              background: "#fff",
                            }}
                          >
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: "12px", fontStyle: "italic" }}>
                    No photos added to this project yet. Click &quot;Edit Project&quot; to add photos from your device.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
