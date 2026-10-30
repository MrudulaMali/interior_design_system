"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReportCardDef {
  id: string;
  reportNumber: number;
  title: string;
  description: string;
  icon: string;
  badge: string;
  primaryMetricLabel: string;
  primaryMetricValue: string | number;
}

export default function AdminReportsHub() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    totalDesigners: number;
    approvedDesigners: number;
    totalEnquiries: number;
    unresolvedEnquiries: number;
    pendingApprovals: number;
    activeCities: number;
  }>({
    totalDesigners: 0,
    approvedDesigners: 0,
    totalEnquiries: 0,
    unresolvedEnquiries: 0,
    pendingApprovals: 0,
    activeCities: 0,
  });

  useEffect(() => {
    async function loadHubSummary() {
      try {
        setLoading(true);
        // Fetch quick summary from API
        const [r1Res, r2Res, r5Res] = await Promise.all([
          fetch("/api/admin/reports?type=1"),
          fetch("/api/admin/reports?type=2"),
          fetch("/api/admin/reports?type=5"),
        ]);

        const r1 = r1Res.ok ? await r1Res.json() : null;
        const r2 = r2Res.ok ? await r2Res.json() : null;
        const r5 = r5Res.ok ? await r5Res.json() : null;

        setMetrics({
          totalDesigners: r1?.data?.summary?.totalDesigners || 0,
          approvedDesigners: r1?.data?.summary?.approvedDesigners || 0,
          activeCities: r1?.data?.summary?.totalLocationsCovered || 0,
          totalEnquiries: r2?.data?.summary?.totalEnquiries || 0,
          unresolvedEnquiries: r2?.data?.summary?.unresolvedCount || 0,
          pendingApprovals: r5?.data?.summary?.pendingCount || 0,
        });
      } catch (err) {
        console.error("Failed to load reports summary:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadHubSummary();
  }, []);

  const reportCards: ReportCardDef[] = [
    {
      id: "location-availability",
      reportNumber: 1,
      title: "Location-Wise Designer Availability",
      description:
        "Analyze designer distribution by city, approval ratios, and compare location-based supply with customer demand.",
      icon: "📍",
      badge: "Regional Coverage",
      primaryMetricLabel: "Locations Tracked",
      primaryMetricValue: loading ? "—" : `${metrics.activeCities} Cities`,
    },
    {
      id: "enquiry-analysis",
      reportNumber: 2,
      title: "Customer Enquiry Analysis",
      description:
        "Breakdown of customer consultation requests by lifecycle status (New, Contacted, In Progress, Completed), dates, and unassigned leads.",
      icon: "✉",
      badge: "Demand & Leads",
      primaryMetricLabel: "Total Enquiries",
      primaryMetricValue: loading ? "—" : `${metrics.totalEnquiries} Leads`,
    },
    {
      id: "designer-performance",
      reportNumber: 3,
      title: "Designer Performance",
      description:
        "Evaluate assigned project counts, consultation acceptance, finalized completions, and completion rates by designer.",
      icon: "★",
      badge: "Workload & SLA",
      primaryMetricLabel: "Approved Studios",
      primaryMetricValue: loading ? "—" : `${metrics.approvedDesigners} Active`,
    },
    {
      id: "specialization-availability",
      reportNumber: 4,
      title: "Specialization-Wise Designer Availability",
      description:
        "Monitor designer coverage across design styles (Modern, Contemporary, Luxury, Modular Kitchen) without duplicate counting.",
      icon: "🎨",
      badge: "Styles & Aesthetics",
      primaryMetricLabel: "Coverage Metrics",
      primaryMetricValue: "Style Breakdown",
    },
    {
      id: "designer-approvals",
      reportNumber: 5,
      title: "Designer Approval & Verification",
      description:
        "Prioritize pending designer profile submissions, queue aging duration, audit rejection reasons, and verified profile status.",
      icon: "✓",
      badge: "Quality & Onboarding",
      primaryMetricLabel: "Pending Review",
      primaryMetricValue: loading ? "—" : `${metrics.pendingApprovals} Profiles`,
    },
    {
      id: "monthly-growth",
      reportNumber: 6,
      title: "Monthly Platform Growth",
      description:
        "Track month-over-month trajectory in customer signups, designer onboarding, platform approvals, and completed design projects.",
      icon: "📈",
      badge: "Platform Trajectory",
      primaryMetricLabel: "Trend Period",
      primaryMetricValue: "6-Month MoM",
    },
  ];

  return (
    <div className="page-wrap" style={{ maxWidth: "1200px", margin: "28px auto 80px" }}>
      {/* Header */}
      <section className="page-hero" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="eyebrow">ADMINISTRATIVE INTELLIGENCE</span>
            <h1 style={{ marginBottom: "8px" }}>Executive Decision Reports</h1>
            <p style={{ maxWidth: "680px", color: "var(--muted)", lineHeight: 1.6 }}>
              Actionable operational intelligence computed directly from the PostgreSQL database. Export data directly to formatted Excel (.xlsx) and printable PDF reports.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/admin/dashboard" className="outline-btn btn-small" style={{ fontSize: "12px" }}>
              ← Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Global Summary KPI Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div style={{ background: "#fff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>Total Registered Designers</span>
            <strong style={{ fontSize: "20px", color: "var(--deep)" }}>
              {loading ? "..." : metrics.totalDesigners}
            </strong>
          </div>

          <div style={{ background: "#fff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>Approved Active Studios</span>
            <strong style={{ fontSize: "20px", color: "var(--green)" }}>
              {loading ? "..." : metrics.approvedDesigners}
            </strong>
          </div>

          <div style={{ background: "#fff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>Profiles Pending Review</span>
            <strong style={{ fontSize: "20px", color: metrics.pendingApprovals > 0 ? "#b88636" : "var(--muted)" }}>
              {loading ? "..." : metrics.pendingApprovals}
            </strong>
          </div>

          <div style={{ background: "#fff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>Total Customer Enquiries</span>
            <strong style={{ fontSize: "20px", color: "var(--deep)" }}>
              {loading ? "..." : metrics.totalEnquiries}
            </strong>
          </div>
        </div>
      </section>

      {/* 6 Report Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "22px" }}>
        {reportCards.map((card) => (
          <div
            key={card.id}
            className="content-panel"
            style={{
              padding: "24px",
              borderRadius: "10px",
              background: "#fff",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            {/* Card Top */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "var(--mint)",
                  color: "var(--green)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "20px",
                }}
              >
                {card.icon}
              </div>

              <span
                style={{
                  background: "#f4f7f4",
                  color: "var(--green)",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Report {card.reportNumber} · {card.badge}
              </span>
            </div>

            {/* Title & Description */}
            <h3 style={{ fontSize: "17px", margin: "0 0 8px", color: "var(--deep)", fontWeight: 700 }}>
              {card.title}
            </h3>

            <p style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px", flex: 1 }}>
              {card.description}
            </p>

            {/* Bottom Meta & Action */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "14px",
                borderTop: "1px solid #f0f3f0",
              }}
            >
              <div>
                <small style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", display: "block" }}>
                  {card.primaryMetricLabel}
                </small>
                <strong style={{ fontSize: "13px", color: "var(--deep)" }}>
                  {card.primaryMetricValue}
                </strong>
              </div>

              <Link
                href={`/admin/reports/${card.id}`}
                className="btn btn-small"
                style={{ fontSize: "12px", padding: "8px 16px" }}
              >
                View Report ↗
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
