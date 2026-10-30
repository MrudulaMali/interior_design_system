"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart,
  DonutChart,
  HorizontalBarChart,
  MonthlyTrendChart,
} from "@/components/reports/ReportCharts";
import {
  exportReportToExcel,
  exportReportToPdf,
  ExportColumn,
  ExportSummaryCard,
} from "@/lib/exportReports";

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = (params?.reportId as string) || "location-availability";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  // Filters state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [tableSearch, setTableSearch] = useState("");

  // Map reportId to metadata
  const reportMeta = useMemo(() => {
    switch (reportId) {
      case "location-availability":
        return {
          num: 1,
          typeParam: "1",
          title: "Location-Wise Designer Availability",
          subtitle: "Analyze approved interior designer coverage and identify regional supply gaps across cities.",
          purpose: "Helps administrators allocate marketing and designer onboarding efforts to underserved cities.",
        };
      case "enquiry-analysis":
        return {
          num: 2,
          typeParam: "2",
          title: "Customer Enquiry Analysis",
          subtitle: "Track customer lead volume, lifecycle states, lead velocity, and unassigned project demands.",
          purpose: "Identifies customer demand hotspots and pinpoints unresolved enquiries requiring direct follow-up.",
        };
      case "designer-performance":
        return {
          num: 3,
          typeParam: "3",
          title: "Designer Performance & SLA Tracking",
          subtitle: "Evaluate assigned enquiry handling, acceptance rates, project completions, and responsiveness by designer.",
          purpose: "Helps administrators balance project workloads and identify top-performing and overloaded design studios.",
        };
      case "specialization-availability":
        return {
          num: 4,
          typeParam: "4",
          title: "Specialization-Wise Designer Availability",
          subtitle: "Measure verified designer availability across aesthetic styles (Modern, Luxury, Modular Kitchen).",
          purpose: "Identifies specialized interior design categories with insufficient approved coverage without double counting.",
        };
      case "designer-approvals":
        return {
          num: 5,
          typeParam: "5",
          title: "Designer Approval & Verification Audit",
          subtitle: "Prioritize pending profile submissions, queue aging duration, audit rejection reasons, and verified profile status.",
          purpose: "Helps administrators eliminate review backlogs and maintain high verification quality standards.",
        };
      case "monthly-growth":
        return {
          num: 6,
          typeParam: "6",
          title: "Monthly Platform Growth Trajectory",
          subtitle: "Track month-over-month trajectory in customer registrations, designer onboarding, and consultation leads.",
          purpose: "Provides executive visibility into platform expansion, seasonal trends, and adoption rates.",
        };
      default:
        return {
          num: 1,
          typeParam: "1",
          title: "Platform Decision Report",
          subtitle: "Executive intelligence report computed from actual platform data.",
          purpose: "Operational decision-making.",
        };
    }
  }, [reportId]);

  async function fetchReportData() {
    try {
      setLoading(true);
      setError("");

      const queryParams = new URLSearchParams();
      queryParams.set("type", reportMeta.typeParam);
      if (startDate) queryParams.set("startDate", startDate);
      if (endDate) queryParams.set("endDate", endDate);
      if (city && city !== "all") queryParams.set("city", city);
      if (status && status !== "all") queryParams.set("status", status);

      const res = await fetch(`/api/admin/reports?${queryParams.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Administrator permissions required to view this report.");
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load report data.");
      }

      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading report.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchReportData();
  }, [reportMeta.typeParam]);

  function handleResetFilters() {
    setStartDate("");
    setEndDate("");
    setCity("all");
    setStatus("all");
    setTableSearch("");
  }

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    void fetchReportData();
  }

  // -----------------------------------------------------------
  // Excel and PDF Export Dispatcher
  // -----------------------------------------------------------
  function handleExportExcel() {
    if (!data) return;
    const { columns, rows, summaryCards, keyFindings } = buildExportPayload();
    exportReportToExcel({
      reportTitle: reportMeta.title,
      fileName: `InteriorFinder_Report_${reportMeta.num}_${reportId}`,
      filtersApplied: {
        "Start Date": startDate || "All Time",
        "End Date": endDate || "Current",
        City: city !== "all" ? city : "All Locations",
        Status: status !== "all" ? status : "All Statuses",
      },
      summaryCards,
      columns,
      rows,
      keyFindings,
    });
  }

  function handleExportPdf() {
    if (!data) return;
    const { columns, rows, summaryCards, keyFindings } = buildExportPayload();
    exportReportToPdf({
      reportTitle: reportMeta.title,
      reportSubtitle: reportMeta.subtitle,
      fileName: `InteriorFinder_Report_${reportMeta.num}_${reportId}`,
      filtersApplied: {
        "Start Date": startDate || "All Time",
        "End Date": endDate || "Current",
        City: city !== "all" ? city : "All Locations",
        Status: status !== "all" ? status : "All Statuses",
      },
      summaryCards,
      columns,
      rows,
      keyFindings,
    });
  }

  function buildExportPayload(): {
    columns: ExportColumn[];
    rows: any[];
    summaryCards: ExportSummaryCard[];
    keyFindings: string[];
  } {
    if (reportId === "location-availability") {
      const summary = data?.summary || {};
      const locations = data?.locations || [];
      return {
        columns: [
          { header: "Location / City", key: "location", width: 22 },
          { header: "Total Designers", key: "totalDesigners", width: 16, type: "number" },
          { header: "Approved Active", key: "approvedDesigners", width: 16, type: "number" },
          { header: "Pending Review", key: "pendingDesigners", width: 16, type: "number" },
          { header: "Rejected / Draft", key: "rejectedDesigners", width: 16, type: "number" },
          { header: "Approval Rate (%)", key: "approvalPercentage", width: 18, type: "percent" },
          { header: "Customer Enquiries", key: "assignedEnquiriesCount", width: 18, type: "number" },
        ],
        rows: locations,
        summaryCards: [
          { label: "Total Registered", value: summary.totalDesigners || 0 },
          { label: "Approved Available", value: summary.approvedDesigners || 0 },
          { label: "Pending Approvals", value: summary.pendingDesigners || 0 },
          { label: "Overall Approval Rate", value: `${summary.overallApprovalRate || 0}%` },
          { label: "Cities Covered", value: summary.totalLocationsCovered || 0 },
        ],
        keyFindings: [
          `Overall platform approval rate across registered designers stands at ${summary.overallApprovalRate || 0}%.`,
          locations.length > 0
            ? `Top city by approved designer density: ${locations[0].location} with ${locations[0].approvedDesigners} approved studios.`
            : "No regional supply detected.",
          locations.some((l: any) => l.assignedEnquiriesCount > 0 && l.approvedDesigners === 0)
            ? "Notice: Some locations have registered customer enquiries with zero approved designers available."
            : "All locations with customer enquiries currently have active designer coverage.",
        ],
      };
    }

    if (reportId === "enquiry-analysis") {
      const summary = data?.summary || {};
      const enquiriesList = data?.enquiries || [];
      return {
        columns: [
          { header: "Enquiry ID", key: "id", width: 12, type: "number" },
          { header: "Client Name", key: "fullName", width: 20 },
          { header: "Contact Email", key: "email", width: 24 },
          { header: "Phone", key: "phone", width: 16 },
          { header: "City", key: "city", width: 16 },
          { header: "Property Type", key: "propertyType", width: 18 },
          { header: "Budget Bracket", key: "budget", width: 16 },
          { header: "Status", key: "status", width: 14 },
          { header: "Assigned Designer", key: "assignedDesignerName", width: 22 },
          { header: "Submission Date", key: "createdAt", width: 20, type: "date" },
        ],
        rows: enquiriesList.map((e: any) => ({
          ...e,
          assignedDesignerName: e.assignedDesignerName || "Unassigned Lead",
          createdAt: e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-IN") : "—",
        })),
        summaryCards: [
          { label: "Total Enquiries", value: summary.totalEnquiries || 0 },
          { label: "New Uncontacted", value: summary.newEnquiries || 0 },
          { label: "In Consultation", value: (summary.inProgressEnquiries || 0) + (summary.contactedEnquiries || 0) },
          { label: "Completed Projects", value: summary.completedEnquiries || 0 },
          { label: "Resolution Rate", value: `${summary.resolutionRate || 0}%` },
        ],
        keyFindings: [
          `Total of ${summary.totalEnquiries || 0} customer enquiries recorded across the platform.`,
          `${summary.unresolvedCount || 0} enquiries currently require active follow-up (${summary.newEnquiries || 0} awaiting initial contact).`,
          summary.unassignedCount > 0
            ? `Attention required: ${summary.unassignedCount} enquiries are currently unassigned to any designer.`
            : "All client enquiries are assigned to qualified interior designers.",
        ],
      };
    }

    if (reportId === "designer-performance") {
      const summary = data?.summary || {};
      const list = data?.designers || [];
      return {
        columns: [
          { header: "Designer Name", key: "designerName", width: 24 },
          { header: "Primary City", key: "city", width: 16 },
          { header: "Total Assigned", key: "totalAssigned", width: 16, type: "number" },
          { header: "Accepted Leads", key: "acceptedCount", width: 16, type: "number" },
          { header: "Completed Projects", key: "completedCount", width: 16, type: "number" },
          { header: "Pending / In Progress", key: "pendingCount", width: 18, type: "number" },
          { header: "Completion Rate (%)", key: "completionRate", width: 18, type: "percent" },
          { header: "Rating", key: "rating", width: 12 },
        ],
        rows: list,
        summaryCards: [
          { label: "Designers Evaluated", value: summary.totalDesignersEvaluated || 0 },
          { label: "Total Leads Assigned", value: summary.totalAssignedEnquiries || 0 },
          { label: "Finished Projects", value: summary.overallCompletedEnquiries || 0 },
          { label: "Average Completion Rate", value: `${summary.averageCompletionRate || 0}%` },
        ],
        keyFindings: [
          `Average project completion rate across active studios is ${summary.averageCompletionRate || 0}%.`,
          summary.mostUnresolvedDesigner
            ? `Highest pending workload: ${summary.mostUnresolvedDesigner.name} with ${summary.mostUnresolvedDesigner.unresolvedCount} active client discussions.`
            : "No heavy pending bottlenecks detected.",
          "Note: Completion rates are calculated strictly as (Completed Projects / Total Assigned Leads). Low enquiry volume does not indicate poor service quality.",
        ],
      };
    }

    if (reportId === "specialization-availability") {
      const summary = data?.summary || {};
      const list = data?.specializations || [];
      return {
        columns: [
          { header: "Design Aesthetic / Style", key: "specialization", width: 26 },
          { header: "Total Studios Offering", key: "totalDesigners", width: 20, type: "number" },
          { header: "Approved Available", key: "approvedDesigners", width: 18, type: "number" },
          { header: "Pending Review", key: "pendingDesigners", width: 16, type: "number" },
          { header: "Approval Coverage (%)", key: "approvedPercentage", width: 20, type: "percent" },
        ],
        rows: list,
        summaryCards: [
          { label: "Distinct Approved Designers", value: summary.totalApprovedDistinctDesigners || 0 },
          { label: "Total Distinct Designers", value: summary.totalDistinctDesigners || 0 },
          { label: "Specialty Offerings Tracked", value: summary.totalSpecializationOfferings || 0 },
          { label: "Categories Catalogued", value: summary.categoriesTracked || 0 },
        ],
        keyFindings: [
          `The platform tracks ${summary.categoriesTracked || 0} design specializations across ${summary.totalApprovedDistinctDesigners || 0} distinct approved studios.`,
          `Most widely offered aesthetic: ${summary.highestCoveredSpecialization || "None"}.`,
          `Specialty with lowest active coverage: ${summary.leastCoveredSpecialization || "None"} — consider targeted recruitment.`,
          "Duplicate Prevention Rule: Distinct designer counts are evaluated separately from total category offerings since professionals support multiple styles.",
        ],
      };
    }

    if (reportId === "designer-approvals") {
      const summary = data?.summary || {};
      const list = data?.profiles || [];
      return {
        columns: [
          { header: "Studio Display Name", key: "designerName", width: 22 },
          { header: "User Full Name", key: "userFullName", width: 20 },
          { header: "Contact Email", key: "email", width: 24 },
          { header: "City", key: "city", width: 16 },
          { header: "Experience", key: "yearsExperience", width: 14, type: "number" },
          { header: "Approval Status", key: "status", width: 16 },
          { header: "Days in Queue", key: "daysPending", width: 16, type: "number" },
          { header: "Submission Date", key: "submissionDate", width: 18, type: "date" },
        ],
        rows: list.map((p: any) => ({
          ...p,
          submissionDate: p.submissionDate ? new Date(p.submissionDate).toLocaleDateString("en-IN") : "—",
        })),
        summaryCards: [
          { label: "Total Profiles", value: summary.totalProfiles || 0 },
          { label: "Awaiting Review", value: summary.pendingCount || 0 },
          { label: "Approved Live", value: summary.approvedCount || 0 },
          { label: "Rejected / Revision", value: summary.rejectedCount || 0 },
          { label: "Max Days in Queue", value: `${summary.longestPendingDays || 0} Days` },
        ],
        keyFindings: [
          `${summary.pendingCount || 0} profile submissions currently await administrator review.`,
          summary.longestPendingDays > 0
            ? `The longest pending submission has been in the queue for ${summary.longestPendingDays} days.`
            : "No submissions are delayed in the verification queue.",
          "Workflow note: This report provides an audit view; profile approvals and rejections must be actioned through the Admin Review section.",
        ],
      };
    }

    // Default Report 6: Monthly Growth
    const summary = data?.summary || {};
    const trends = data?.monthlyTrends || [];
    return {
      columns: [
        { header: "Month", key: "monthLabel", width: 16 },
        { header: "Customer Signups", key: "customerRegistrations", width: 18, type: "number" },
        { header: "Designer Signups", key: "designerRegistrations", width: 18, type: "number" },
        { header: "Designer Approvals", key: "designerApprovals", width: 18, type: "number" },
        { header: "Enquiries Submitted", key: "enquiriesSubmitted", width: 20, type: "number" },
        { header: "Completed Projects", key: "completedEnquiries", width: 18, type: "number" },
        { header: "Customer MoM (%)", key: "momCustomerGrowth", width: 18, type: "percent" },
        { header: "Enquiry MoM (%)", key: "momEnquiryGrowth", width: 18, type: "percent" },
      ],
      rows: trends,
      summaryCards: [
        { label: "Total Customers", value: summary.totalCustomerRegistrations || 0 },
        { label: "Total Designers", value: summary.totalDesignerRegistrations || 0 },
        { label: "Total Approvals", value: summary.totalDesignerApprovals || 0 },
        { label: "Total Enquiries", value: summary.totalEnquiriesSubmitted || 0 },
        { label: "Avg Monthly Enquiries", value: summary.averageMonthlyEnquiries || 0 },
      ],
      keyFindings: [
        `Recorded ${summary.totalCustomerRegistrations || 0} customer registrations and ${summary.totalDesignerRegistrations || 0} designer registrations.`,
        `Average monthly enquiry velocity is ${summary.averageMonthlyEnquiries || 0} client leads.`,
        "All metrics are calculated using authoritative timestamps stored in PostgreSQL.",
      ],
    };
  }

  // Filter table rows based on tableSearch
  const tableRows = useMemo(() => {
    if (!data) return [];
    let rows: any[] = [];
    if (reportId === "location-availability") rows = data.locations || [];
    else if (reportId === "enquiry-analysis") rows = data.enquiries || [];
    else if (reportId === "designer-performance") rows = data.designers || [];
    else if (reportId === "specialization-availability") rows = data.specializations || [];
    else if (reportId === "designer-approvals") rows = data.profiles || [];
    else if (reportId === "monthly-growth") rows = data.monthlyTrends || [];

    if (!tableSearch.trim()) return rows;
    const term = tableSearch.toLowerCase().trim();
    return rows.filter((r) =>
      Object.values(r).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, reportId, tableSearch]);

  return (
    <div className="page-wrap" style={{ maxWidth: "1200px", margin: "28px auto 80px" }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Link href="/admin/dashboard" style={{ color: "var(--green)", fontWeight: 600 }}>
            Admin Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin/reports" style={{ color: "var(--green)", fontWeight: 600 }}>
            Reports Hub
          </Link>
          <span>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{reportMeta.title}</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleExportExcel}
            className="outline-btn btn-small"
            style={{ fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            disabled={loading || !data}
          >
            <span>📊</span> Export Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="btn btn-small"
            style={{ fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            disabled={loading || !data}
          >
            <span>📥</span> Download PDF
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <section className="page-hero" style={{ marginBottom: "24px" }}>
        <span className="eyebrow">DECISION REPORT #{reportMeta.num}</span>
        <h1 style={{ marginBottom: "8px" }}>{reportMeta.title}</h1>
        <p style={{ maxWidth: "720px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "8px" }}>
          {reportMeta.subtitle}
        </p>
        <small style={{ color: "#475950", fontSize: "11.5px", display: "block" }}>
          <strong>Decision Purpose:</strong> {reportMeta.purpose}
        </small>
      </section>

      {/* Filter Toolbar */}
      <form
        onSubmit={handleApplyFilters}
        style={{
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "14px",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--muted)", marginBottom: "4px" }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "7px 10px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "5px" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--muted)", marginBottom: "4px" }}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "7px 10px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "5px" }}
          />
        </div>

        {(reportId === "location-availability" ||
          reportId === "enquiry-analysis" ||
          reportId === "designer-performance" ||
          reportId === "designer-approvals") && (
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--muted)", marginBottom: "4px" }}>
              Filter by City
            </label>
            <input
              type="text"
              placeholder="e.g. Pune, Mumbai..."
              value={city === "all" ? "" : city}
              onChange={(e) => setCity(e.target.value || "all")}
              style={{ padding: "7px 10px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "5px", width: "150px" }}
            />
          </div>
        )}

        {(reportId === "enquiry-analysis" || reportId === "designer-approvals") && (
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--muted)", marginBottom: "4px" }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ padding: "7px 10px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "5px", background: "#fff" }}
            >
              <option value="all">All Statuses</option>
              {reportId === "enquiry-analysis" ? (
                <>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="draft">Draft</option>
                </>
              )}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <button type="submit" className="btn btn-small" style={{ fontSize: "11.5px" }} disabled={loading}>
            {loading ? "Refreshing..." : "Apply Filters"}
          </button>

          {(startDate || endDate || city !== "all" || status !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="outline-btn btn-small"
              style={{ fontSize: "11.5px" }}
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "16px 20px",
            borderRadius: "8px",
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

      {/* Loading state */}
      {loading && !data && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>⏳</div>
          <p>Querying PostgreSQL database and computing report analytics...</p>
        </div>
      )}

      {/* Main Content when loaded */}
      {data && (
        <div style={{ display: "grid", gap: "24px" }}>
          {/* Summary Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            {buildExportPayload().summaryCards.map((c, i) => (
              <div
                key={i}
                className="content-panel"
                style={{
                  padding: "16px 18px",
                  borderRadius: "8px",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderTop: "3px solid var(--green)",
                }}
              >
                <small style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  {c.label}
                </small>
                <strong style={{ fontSize: "22px", color: "var(--deep)" }}>
                  {c.value}
                </strong>
              </div>
            ))}
          </div>

          {/* Interactive Chart Section */}
          <div
            className="content-panel"
            style={{
              padding: "24px",
              borderRadius: "8px",
              background: "#fff",
              border: "1px solid var(--line)",
            }}
          >
            <h3 style={{ fontSize: "16px", color: "var(--deep)", margin: "0 0 16px" }}>
              Visual Distribution & Comparisons
            </h3>

            {/* Chart based on reportId */}
            {reportId === "location-availability" && (
              <BarChart
                items={(data.locations || []).slice(0, 10).map((l: any) => ({
                  label: l.location,
                  value: l.approvedDesigners,
                  secondaryValue: l.totalDesigners,
                }))}
                primaryLabel="Approved Available"
                secondaryLabel="Total Registered"
              />
            )}

            {reportId === "enquiry-analysis" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", alignItems: "center" }}>
                <DonutChart
                  centerTitle="Enquiries"
                  centerValue={data.summary?.totalEnquiries || 0}
                  segments={[
                    { label: "New Leads", value: data.summary?.newEnquiries || 0, color: "#b88636" },
                    { label: "Contacted", value: data.summary?.contactedEnquiries || 0, color: "#4069a7" },
                    { label: "In Progress", value: data.summary?.inProgressEnquiries || 0, color: "#2d8050" },
                    { label: "Completed", value: data.summary?.completedEnquiries || 0, color: "var(--green)" },
                    { label: "Cancelled", value: data.summary?.cancelledEnquiries || 0, color: "#991b1b" },
                  ]}
                />

                <div>
                  <h4 style={{ fontSize: "13px", color: "var(--deep)", margin: "0 0 12px" }}>
                    Top Enquiring Cities
                  </h4>
                  <HorizontalBarChart
                    items={(data.cityBreakdown || []).slice(0, 5).map((c: any) => ({
                      label: c.city,
                      value: c.count,
                      total: data.summary?.totalEnquiries || 1,
                    }))}
                  />
                </div>
              </div>
            )}

            {reportId === "designer-performance" && (
              <BarChart
                items={(data.designers || []).slice(0, 8).map((d: any) => ({
                  label: d.designerName.split(" ")[0],
                  value: d.completedCount,
                  secondaryValue: d.totalAssigned,
                }))}
                primaryLabel="Completed Projects"
                secondaryLabel="Total Assigned"
              />
            )}

            {reportId === "specialization-availability" && (
              <BarChart
                items={(data.specializations || []).slice(0, 8).map((s: any) => ({
                  label: s.specialization.length > 12 ? `${s.specialization.slice(0, 10)}...` : s.specialization,
                  value: s.approvedDesigners,
                  secondaryValue: s.totalDesigners,
                }))}
                primaryLabel="Approved Designers"
                secondaryLabel="Total Offering"
              />
            )}

            {reportId === "designer-approvals" && (
              <DonutChart
                centerTitle="Profiles"
                centerValue={data.summary?.totalProfiles || 0}
                segments={[
                  { label: "Pending Review", value: data.summary?.pendingCount || 0, color: "#b88636" },
                  { label: "Approved Live", value: data.summary?.approvedCount || 0, color: "var(--green)" },
                  { label: "Rejected / Revision", value: data.summary?.rejectedCount || 0, color: "#991b1b" },
                  { label: "Draft Mode", value: data.summary?.draftCount || 0, color: "#94a3b8" },
                ]}
              />
            )}

            {reportId === "monthly-growth" && (
              <MonthlyTrendChart
                data={{
                  labels: (data.monthlyTrends || []).map((t: any) => t.monthLabel),
                  series: [
                    {
                      name: "Customer Signups",
                      color: "#4069a7",
                      values: (data.monthlyTrends || []).map((t: any) => t.customerRegistrations),
                    },
                    {
                      name: "Designer Signups",
                      color: "#b88636",
                      values: (data.monthlyTrends || []).map((t: any) => t.designerRegistrations),
                    },
                    {
                      name: "Enquiries Submitted",
                      color: "var(--green)",
                      values: (data.monthlyTrends || []).map((t: any) => t.enquiriesSubmitted),
                    },
                    {
                      name: "Approved Studios",
                      color: "#0c4037",
                      values: (data.monthlyTrends || []).map((t: any) => t.designerApprovals),
                    },
                  ],
                }}
              />
            )}
          </div>

          {/* Key Findings Card */}
          <div
            style={{
              background: "#edf5f0",
              borderLeft: "4px solid var(--green)",
              borderRadius: "0 8px 8px 0",
              padding: "16px 20px",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--deep)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>💡</span> Key Decision Findings
            </h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12.5px", color: "#32443b", lineHeight: 1.6 }}>
              {buildExportPayload().keyFindings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          </div>

          {/* Detailed Data Table */}
          <div
            className="content-panel table-panel"
            style={{
              padding: "20px 24px",
              borderRadius: "8px",
              background: "#fff",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "var(--deep)" }}>
                  Detailed Data Records
                </h3>
                <small style={{ color: "var(--muted)" }}>
                  Showing {tableRows.length} rows based on active filter criteria
                </small>
              </div>

              <input
                type="search"
                placeholder="Search table rows..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  padding: "7px 12px",
                  fontSize: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "5px",
                  width: "220px",
                }}
              />
            </div>

            {tableRows.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {buildExportPayload().columns.map((col) => (
                        <th
                          key={col.key}
                          style={{
                            textAlign: col.align === "right" || col.type === "number" || col.type === "percent" ? "right" : "left",
                          }}
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row: any, rIdx: number) => (
                      <tr key={rIdx}>
                        {buildExportPayload().columns.map((col) => {
                          const val = row[col.key];
                          const isRight = col.align === "right" || col.type === "number" || col.type === "percent";
                          return (
                            <td key={col.key} style={{ textAlign: isRight ? "right" : "left" }}>
                              {col.type === "percent" ? (
                                <strong>{Number(val || 0).toFixed(1)}%</strong>
                              ) : col.key === "status" ? (
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    background:
                                      val === "approved" || val === "completed"
                                        ? "#e4f3e8"
                                        : val === "pending" || val === "new"
                                        ? "#fff1d8"
                                        : val === "in_progress" || val === "contacted"
                                        ? "#e0e7ff"
                                        : "#fee2e2",
                                    color:
                                      val === "approved" || val === "completed"
                                        ? "#2d8050"
                                        : val === "pending" || val === "new"
                                        ? "#9a6b15"
                                        : val === "in_progress" || val === "contacted"
                                        ? "#3730a3"
                                        : "#991b1b",
                                  }}
                                >
                                  {val}
                                </span>
                              ) : val !== null && val !== undefined ? (
                                String(val)
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "13px" }}>
                No records match the current filter and search conditions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
