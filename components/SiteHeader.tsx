"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export default function SiteHeader() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brandmark">⌂</span>
        <span>
          Interior<span className="brandlight">Finder</span>
        </span>
      </Link>

      <nav>
        <Link href="/">Home</Link>

        {user?.role === "designer" ? (
          <>
            <Link href="/designer/dashboard" style={{ fontWeight: 600, color: "var(--green)" }}>
              My Workspace
            </Link>
            <Link href="/designer/profile">Edit Profile & Studio</Link>
            <Link href="/designer/portfolio">Manage Portfolio</Link>
            <Link href="/portfolio">Portfolio</Link>
          </>
        ) : user?.role === "customer" ? (
          <>
            <Link href="/designers">Find Designers</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/enquiry">Submit Enquiry</Link>
            <Link href="/customer/dashboard" style={{ fontWeight: 600, color: "var(--green)" }}>
              My Enquiries
            </Link>
          </>
        ) : user?.role === "admin" ? (
          <>
            <Link href="/designers">Find Designers</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/admin/dashboard" style={{ fontWeight: 700, color: "var(--green)" }}>
              Admin Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/designers">Find Designers</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/enquiry">Enquiries</Link>
          </>
        )}
      </nav>

      <div className="navactions">
        {loading ? (
          <span style={{ fontSize: "12px", color: "#85877f" }}>...</span>
        ) : user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#24352f" }}>
              {user.fullName.split(" ")[0]}
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "9px",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  background:
                    user.role === "admin"
                      ? "#fef3c7"
                      : user.role === "designer"
                        ? "#e9f0e9"
                        : "#eff6ff",
                  color:
                    user.role === "admin"
                      ? "#92400e"
                      : user.role === "designer"
                        ? "#14594c"
                        : "#1d4ed8",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {user.role}
              </span>
            </span>

            <button
              onClick={handleLogout}
              className="outline-btn btn-small"
              style={{ cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link className="loginlink" href="/login">
              Login
            </Link>
            <Link className="btn btn-small" href="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
