"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ChooseJourney() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.fullName) {
          setUserName(d.user.fullName);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-wrap" style={{ maxWidth: "1000px", margin: "40px auto 80px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <span className="eyebrow" style={{ letterSpacing: "2px" }}>
          GET STARTED WITH INTERIOR FINDER
        </span>
        <h1 style={{ fontSize: "36px", color: "#173f36", margin: "8px 0 12px" }}>
          Welcome{userName ? `, ${userName}` : ""}! Choose Your Journey
        </h1>
        <p style={{ color: "#68756d", fontSize: "14px", maxWidth: "600px", margin: "0 auto" }}>
          Whether you want to renovate your dream home or offer your professional interior design services, select how you want to use the platform.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px" }}>
        {/* OPTION A: Customer Journey */}
        <div
          className="content-panel"
          style={{
            padding: "36px 30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "2px solid #e4e8e2",
            borderRadius: "10px",
            transition: "all 0.2s",
          }}
        >
          <div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                background: "#eaf1ec",
                color: "#14594c",
                display: "grid",
                placeItems: "center",
                fontSize: "24px",
                marginBottom: "20px",
              }}
            >
              ⌂
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "#14594c" }}>
              OPTION A — FOR HOMEOWNERS & CLIENTS
            </span>
            <h2 style={{ fontSize: "24px", margin: "10px 0 12px", color: "#24352f" }}>
              I Want to Find an Interior Designer
            </h2>
            <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#68756d", marginBottom: "20px" }}>
              Discover verified designers in your city, browse room photo galleries, compare budgets, and submit direct enquiries for your space.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "grid", gap: "10px", fontSize: "12px", color: "#526158" }}>
              <li>✓ Browse top-rated designers across Pune, Mumbai, Kolhapur & more</li>
              <li>✓ Explore living rooms, modular kitchens, bedrooms & office portfolios</li>
              <li>✓ Send custom enquiries matching your room size and budget</li>
              <li>✓ Track enquiry status in your personal customer dashboard</li>
            </ul>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/designers" className="btn full" style={{ textAlign: "center" }}>
              Explore Designers ↗
            </Link>
            <Link href="/dashboard" className="outline-btn full" style={{ textAlign: "center" }}>
              View My Dashboard & Enquiries
            </Link>
          </div>
        </div>

        {/* OPTION B: Designer Journey */}
        <div
          className="content-panel"
          style={{
            padding: "36px 30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "2px solid #14594c",
            borderRadius: "10px",
            background: "#fafcf9",
            transition: "all 0.2s",
          }}
        >
          <div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                background: "#14594c",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "24px",
                marginBottom: "20px",
              }}
            >
              ✦
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "#14594c" }}>
              OPTION B — FOR INTERIOR DESIGNERS
            </span>
            <h2 style={{ fontSize: "24px", margin: "10px 0 12px", color: "#24352f" }}>
              I Want to Find Clients & Projects
            </h2>
            <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#68756d", marginBottom: "20px" }}>
              Create your professional public profile, showcase completed room projects, receive client enquiries, and grow your design practice.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "grid", gap: "10px", fontSize: "12px", color: "#526158" }}>
              <li>✓ Create a dedicated professional profile with bio & specializations</li>
              <li>✓ Upload high-resolution project photos with room captions</li>
              <li>✓ Receive client enquiries directly assigned to your profile</li>
              <li>✓ Verified designer badge upon administrator review</li>
            </ul>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/designer/onboarding" className="btn full" style={{ textAlign: "center", background: "#14594c" }}>
              Create Your Designer Profile ↗
            </Link>
            <Link href="/dashboard" className="outline-btn full" style={{ textAlign: "center" }}>
              Go to Designer Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
