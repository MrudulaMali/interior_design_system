import { db } from "@/db";
import { users, designerProfiles, enquiries, portfolioProjects } from "@/db/schema";
import { eq, and, sql, gte, lte, desc, asc, inArray } from "drizzle-orm";

export interface ReportFilterOptions {
  startDate?: string;
  endDate?: string;
  city?: string;
  status?: string;
  designerId?: number;
}

// -------------------------------------------------------------
// REPORT 1: Location-Wise Designer Availability
// -------------------------------------------------------------
export interface LocationAvailabilityItem {
  location: string;
  totalDesigners: number;
  approvedDesigners: number;
  pendingDesigners: number;
  rejectedDesigners: number;
  draftDesigners: number;
  approvalPercentage: number;
  assignedEnquiriesCount: number;
}

export interface Report1Data {
  summary: {
    totalDesigners: number;
    approvedDesigners: number;
    pendingDesigners: number;
    rejectedDesigners: number;
    draftDesigners: number;
    overallApprovalRate: number;
    totalLocationsCovered: number;
  };
  locations: LocationAvailabilityItem[];
  generatedAt: string;
}

export async function getLocationAvailabilityReport(
  filters: ReportFilterOptions = {}
): Promise<Report1Data> {
  // Query all designer profiles
  const profiles = await db
    .select({
      id: designerProfiles.id,
      city: designerProfiles.city,
      status: designerProfiles.status,
      serviceLocations: designerProfiles.serviceLocations,
      createdAt: designerProfiles.createdAt,
    })
    .from(designerProfiles);

  // Query enquiries to see customer demand per location
  const allEnquiries = await db
    .select({
      id: enquiries.id,
      city: enquiries.city,
    })
    .from(enquiries);

  // Map demand by normalized city
  const enquiryCountByCity: Record<string, number> = {};
  for (const enq of allEnquiries) {
    const c = (enq.city || "Unknown").trim().toLowerCase();
    enquiryCountByCity[c] = (enquiryCountByCity[c] || 0) + 1;
  }

  // Aggregate by location
  const locMap: Record<
    string,
    {
      locationName: string;
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      draft: number;
      enquiries: number;
    }
  > = {};

  let totalAll = 0;
  let approvedAll = 0;
  let pendingAll = 0;
  let rejectedAll = 0;
  let draftAll = 0;

  for (const p of profiles) {
    // Apply date filters if provided
    if (filters.startDate && new Date(p.createdAt) < new Date(filters.startDate)) continue;
    if (filters.endDate && new Date(p.createdAt) > new Date(filters.endDate)) continue;

    totalAll++;
    if (p.status === "approved") approvedAll++;
    else if (p.status === "pending") pendingAll++;
    else if (p.status === "rejected") rejectedAll++;
    else draftAll++;

    // Primary city normalization
    const rawCity = (p.city || "Unknown").trim();
    // Split if multiple cities entered like "Pune, goa"
    const cityList = rawCity.includes(",") ? rawCity.split(",").map((s) => s.trim()) : [rawCity];

    for (const rawName of cityList) {
      if (!rawName) continue;
      // Capitalize first letter
      const locKey = rawName.toLowerCase();
      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      if (filters.city && filters.city !== "all" && locKey !== filters.city.toLowerCase()) {
        continue;
      }

      if (!locMap[locKey]) {
        locMap[locKey] = {
          locationName: displayName,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          draft: 0,
          enquiries: enquiryCountByCity[locKey] || 0,
        };
      }

      locMap[locKey].total++;
      if (p.status === "approved") locMap[locKey].approved++;
      else if (p.status === "pending") locMap[locKey].pending++;
      else if (p.status === "rejected") locMap[locKey].rejected++;
      else locMap[locKey].draft++;
    }
  }

  const locationsList: LocationAvailabilityItem[] = Object.values(locMap)
    .map((item) => ({
      location: item.locationName,
      totalDesigners: item.total,
      approvedDesigners: item.approved,
      pendingDesigners: item.pending,
      rejectedDesigners: item.rejected,
      draftDesigners: item.draft,
      approvalPercentage:
        item.total > 0 ? Number(((item.approved / item.total) * 100).toFixed(1)) : 0,
      assignedEnquiriesCount: item.enquiries,
    }))
    .sort((a, b) => b.approvedDesigners - a.approvedDesigners || b.totalDesigners - a.totalDesigners);

  return {
    summary: {
      totalDesigners: totalAll,
      approvedDesigners: approvedAll,
      pendingDesigners: pendingAll,
      rejectedDesigners: rejectedAll,
      draftDesigners: draftAll,
      overallApprovalRate:
        totalAll > 0 ? Number(((approvedAll / totalAll) * 100).toFixed(1)) : 0,
      totalLocationsCovered: locationsList.length,
    },
    locations: locationsList,
    generatedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// REPORT 2: Customer Enquiry Analysis
// -------------------------------------------------------------
export interface CustomerEnquiryItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  budget: string;
  status: string;
  assignedDesignerId: number | null;
  assignedDesignerName: string | null;
  createdAt: string;
}

export interface Report2Data {
  summary: {
    totalEnquiries: number;
    newEnquiries: number;
    contactedEnquiries: number;
    inProgressEnquiries: number;
    completedEnquiries: number;
    cancelledEnquiries: number;
    unresolvedCount: number; // new + contacted + in_progress
    resolvedCount: number; // completed + cancelled
    resolutionRate: number; // completed / total * 100
    unassignedCount: number;
  };
  statusBreakdown: { status: string; count: number; percentage: number }[];
  cityBreakdown: { city: string; count: number }[];
  enquiries: CustomerEnquiryItem[];
  generatedAt: string;
}

export async function getCustomerEnquiryAnalysisReport(
  filters: ReportFilterOptions = {}
): Promise<Report2Data> {
  const query = db
    .select({
      id: enquiries.id,
      fullName: enquiries.fullName,
      email: enquiries.email,
      phone: enquiries.phone,
      city: enquiries.city,
      propertyType: enquiries.propertyType,
      budget: enquiries.budget,
      status: enquiries.status,
      assignedDesignerId: enquiries.assignedDesignerId,
      createdAt: enquiries.createdAt,
      designerName: designerProfiles.displayName,
      designerUserFullName: users.fullName,
    })
    .from(enquiries)
    .leftJoin(users, eq(enquiries.assignedDesignerId, users.id))
    .leftJoin(designerProfiles, eq(users.id, designerProfiles.userId))
    .orderBy(desc(enquiries.createdAt));

  const records = await query;

  let filtered = records;
  if (filters.startDate) {
    filtered = filtered.filter((r) => new Date(r.createdAt) >= new Date(filters.startDate!));
  }
  if (filters.endDate) {
    filtered = filtered.filter((r) => new Date(r.createdAt) <= new Date(filters.endDate!));
  }
  if (filters.city && filters.city !== "all") {
    filtered = filtered.filter(
      (r) => (r.city || "").toLowerCase() === filters.city!.toLowerCase()
    );
  }
  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((r) => r.status === filters.status);
  }
  if (filters.designerId) {
    filtered = filtered.filter((r) => r.assignedDesignerId === filters.designerId);
  }

  let countNew = 0;
  let countContacted = 0;
  let countInProgress = 0;
  let countCompleted = 0;
  let countCancelled = 0;
  let unassignedCount = 0;
  const cityMap: Record<string, number> = {};

  const items: CustomerEnquiryItem[] = [];

  for (const r of filtered) {
    if (r.status === "new") countNew++;
    else if (r.status === "contacted") countContacted++;
    else if (r.status === "in_progress") countInProgress++;
    else if (r.status === "completed") countCompleted++;
    else if (r.status === "cancelled") countCancelled++;

    if (!r.assignedDesignerId) unassignedCount++;

    const normCity = (r.city || "Unknown").trim();
    const cityCapital = normCity.charAt(0).toUpperCase() + normCity.slice(1).toLowerCase();
    cityMap[cityCapital] = (cityMap[cityCapital] || 0) + 1;

    items.push({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      city: r.city,
      propertyType: r.propertyType,
      budget: r.budget,
      status: r.status,
      assignedDesignerId: r.assignedDesignerId,
      assignedDesignerName: r.designerName || r.designerUserFullName || null,
      createdAt: r.createdAt.toISOString(),
    });
  }

  const total = filtered.length;
  const unresolved = countNew + countContacted + countInProgress;
  const resolved = countCompleted + countCancelled;

  const statusBreakdown = [
    { status: "New", count: countNew, percentage: total > 0 ? Number(((countNew / total) * 100).toFixed(1)) : 0 },
    { status: "Contacted", count: countContacted, percentage: total > 0 ? Number(((countContacted / total) * 100).toFixed(1)) : 0 },
    { status: "In Progress", count: countInProgress, percentage: total > 0 ? Number(((countInProgress / total) * 100).toFixed(1)) : 0 },
    { status: "Completed", count: countCompleted, percentage: total > 0 ? Number(((countCompleted / total) * 100).toFixed(1)) : 0 },
    { status: "Cancelled", count: countCancelled, percentage: total > 0 ? Number(((countCancelled / total) * 100).toFixed(1)) : 0 },
  ];

  const cityBreakdown = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);

  return {
    summary: {
      totalEnquiries: total,
      newEnquiries: countNew,
      contactedEnquiries: countContacted,
      inProgressEnquiries: countInProgress,
      completedEnquiries: countCompleted,
      cancelledEnquiries: countCancelled,
      unresolvedCount: unresolved,
      resolvedCount: resolved,
      resolutionRate: total > 0 ? Number(((countCompleted / total) * 100).toFixed(1)) : 0,
      unassignedCount,
    },
    statusBreakdown,
    cityBreakdown,
    enquiries: items,
    generatedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// REPORT 3: Designer Performance Report
// -------------------------------------------------------------
export interface DesignerPerformanceItem {
  designerId: number;
  userId: number;
  designerName: string;
  city: string;
  totalAssigned: number;
  acceptedCount: number; // contacted + in_progress + completed
  completedCount: number;
  pendingCount: number; // new + contacted + in_progress
  cancelledCount: number;
  completionRate: number; // (completed / totalAssigned) * 100
  acceptanceRate: number; // (accepted / totalAssigned) * 100
  rating: string;
  status: string;
}

export interface Report3Data {
  summary: {
    totalDesignersEvaluated: number;
    totalAssignedEnquiries: number;
    overallCompletedEnquiries: number;
    averageCompletionRate: number;
    mostUnresolvedDesigner: { name: string; unresolvedCount: number } | null;
  };
  designers: DesignerPerformanceItem[];
  generatedAt: string;
}

export async function getDesignerPerformanceReport(
  filters: ReportFilterOptions = {}
): Promise<Report3Data> {
  // Query all designer profiles
  const designersQuery = await db
    .select({
      id: designerProfiles.id,
      userId: designerProfiles.userId,
      displayName: designerProfiles.displayName,
      city: designerProfiles.city,
      rating: designerProfiles.rating,
      status: designerProfiles.status,
      userFullName: users.fullName,
    })
    .from(designerProfiles)
    .innerJoin(users, eq(designerProfiles.userId, users.id));

  // Query all enquiries
  const enquiriesQuery = await db
    .select({
      id: enquiries.id,
      assignedDesignerId: enquiries.assignedDesignerId,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
    })
    .from(enquiries);

  // Group enquiries by assignedDesignerId (matches users.id)
  const enquiryStatsMap: Record<
    number,
    { total: number; newCount: number; contacted: number; inProgress: number; completed: number; cancelled: number }
  > = {};

  for (const enq of enquiriesQuery) {
    if (filters.startDate && new Date(enq.createdAt) < new Date(filters.startDate)) continue;
    if (filters.endDate && new Date(enq.createdAt) > new Date(filters.endDate)) continue;

    if (!enq.assignedDesignerId) continue;
    const dId = enq.assignedDesignerId;

    if (!enquiryStatsMap[dId]) {
      enquiryStatsMap[dId] = { total: 0, newCount: 0, contacted: 0, inProgress: 0, completed: 0, cancelled: 0 };
    }

    enquiryStatsMap[dId].total++;
    if (enq.status === "new") enquiryStatsMap[dId].newCount++;
    else if (enq.status === "contacted") enquiryStatsMap[dId].contacted++;
    else if (enq.status === "in_progress") enquiryStatsMap[dId].inProgress++;
    else if (enq.status === "completed") enquiryStatsMap[dId].completed++;
    else if (enq.status === "cancelled") enquiryStatsMap[dId].cancelled++;
  }

  let totalAssignedAll = 0;
  let totalCompletedAll = 0;
  const items: DesignerPerformanceItem[] = [];

  for (const d of designersQuery) {
    if (filters.city && filters.city !== "all") {
      const c = (d.city || "").toLowerCase();
      if (!c.includes(filters.city.toLowerCase())) continue;
    }

    const stats = enquiryStatsMap[d.userId] || {
      total: 0,
      newCount: 0,
      contacted: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };

    const accepted = stats.contacted + stats.inProgress + stats.completed;
    const pending = stats.newCount + stats.contacted + stats.inProgress;
    const completionRate = stats.total > 0 ? Number(((stats.completed / stats.total) * 100).toFixed(1)) : 0;
    const acceptanceRate = stats.total > 0 ? Number(((accepted / stats.total) * 100).toFixed(1)) : 0;

    totalAssignedAll += stats.total;
    totalCompletedAll += stats.completed;

    items.push({
      designerId: d.id,
      userId: d.userId,
      designerName: d.displayName || d.userFullName,
      city: d.city,
      totalAssigned: stats.total,
      acceptedCount: accepted,
      completedCount: stats.completed,
      pendingCount: pending,
      cancelledCount: stats.cancelled,
      completionRate,
      acceptanceRate,
      rating: d.rating || "4.8",
      status: d.status,
    });
  }

  // Sort by highest total assigned, then highest completion rate
  items.sort((a, b) => b.totalAssigned - a.totalAssigned || b.completionRate - a.completionRate);

  const designersWithUnresolved = [...items].sort((a, b) => b.pendingCount - a.pendingCount);
  const mostUnresolved =
    designersWithUnresolved.length > 0 && designersWithUnresolved[0].pendingCount > 0
      ? { name: designersWithUnresolved[0].designerName, unresolvedCount: designersWithUnresolved[0].pendingCount }
      : null;

  return {
    summary: {
      totalDesignersEvaluated: items.length,
      totalAssignedEnquiries: totalAssignedAll,
      overallCompletedEnquiries: totalCompletedAll,
      averageCompletionRate:
        totalAssignedAll > 0 ? Number(((totalCompletedAll / totalAssignedAll) * 100).toFixed(1)) : 0,
      mostUnresolvedDesigner: mostUnresolved,
    },
    designers: items,
    generatedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// REPORT 4: Specialization-Wise Designer Availability
// -------------------------------------------------------------
export interface SpecializationAvailabilityItem {
  specialization: string;
  totalDesigners: number;
  approvedDesigners: number;
  pendingDesigners: number;
  rejectedOrDraftDesigners: number;
  approvedPercentage: number;
}

export interface Report4Data {
  summary: {
    totalDistinctDesigners: number;
    totalApprovedDistinctDesigners: number;
    totalSpecializationOfferings: number;
    categoriesTracked: number;
    highestCoveredSpecialization: string | null;
    leastCoveredSpecialization: string | null;
  };
  specializations: SpecializationAvailabilityItem[];
  generatedAt: string;
}

export async function getSpecializationAvailabilityReport(
  filters: ReportFilterOptions = {}
): Promise<Report4Data> {
  const profiles = await db
    .select({
      id: designerProfiles.id,
      status: designerProfiles.status,
      specializations: designerProfiles.specializations,
      createdAt: designerProfiles.createdAt,
    })
    .from(designerProfiles);

  const specMap: Record<
    string,
    { total: number; approved: number; pending: number; other: number }
  > = {};

  const distinctApprovedDesigners = new Set<number>();
  const distinctTotalDesigners = new Set<number>();
  let totalOfferingsCount = 0;

  for (const p of profiles) {
    if (filters.startDate && new Date(p.createdAt) < new Date(filters.startDate)) continue;
    if (filters.endDate && new Date(p.createdAt) > new Date(filters.endDate)) continue;

    distinctTotalDesigners.add(p.id);
    if (p.status === "approved") {
      distinctApprovedDesigners.add(p.id);
    }

    const specs = Array.isArray(p.specializations) ? p.specializations : [];

    for (const spec of specs) {
      if (!spec || typeof spec !== "string") continue;
      const cleanSpec = spec.trim();
      if (!cleanSpec) continue;

      totalOfferingsCount++;

      if (!specMap[cleanSpec]) {
        specMap[cleanSpec] = { total: 0, approved: 0, pending: 0, other: 0 };
      }

      specMap[cleanSpec].total++;
      if (p.status === "approved") specMap[cleanSpec].approved++;
      else if (p.status === "pending") specMap[cleanSpec].pending++;
      else specMap[cleanSpec].other++;
    }
  }

  const items: SpecializationAvailabilityItem[] = Object.entries(specMap).map(
    ([spec, counts]) => ({
      specialization: spec,
      totalDesigners: counts.total,
      approvedDesigners: counts.approved,
      pendingDesigners: counts.pending,
      rejectedOrDraftDesigners: counts.other,
      approvedPercentage:
        counts.total > 0 ? Number(((counts.approved / counts.total) * 100).toFixed(1)) : 0,
    })
  );

  items.sort((a, b) => b.approvedDesigners - a.approvedDesigners || b.totalDesigners - a.totalDesigners);

  return {
    summary: {
      totalDistinctDesigners: distinctTotalDesigners.size,
      totalApprovedDistinctDesigners: distinctApprovedDesigners.size,
      totalSpecializationOfferings: totalOfferingsCount,
      categoriesTracked: items.length,
      highestCoveredSpecialization: items.length > 0 ? items[0].specialization : null,
      leastCoveredSpecialization:
        items.length > 0 ? items[items.length - 1].specialization : null,
    },
    specializations: items,
    generatedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// REPORT 5: Designer Approval and Verification Report
// -------------------------------------------------------------
export interface ApprovalVerificationItem {
  profileId: number;
  userId: number;
  designerName: string;
  userFullName: string;
  email: string;
  phone: string | null;
  city: string;
  yearsExperience: number;
  status: string;
  rejectionReason: string | null;
  submissionDate: string;
  lastReviewDate: string;
  daysPending: number;
}

export interface Report5Data {
  summary: {
    totalProfiles: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    draftCount: number;
    longestPendingDays: number;
  };
  profiles: ApprovalVerificationItem[];
  longestPendingProfiles: ApprovalVerificationItem[];
  generatedAt: string;
}

export async function getDesignerApprovalReport(
  filters: ReportFilterOptions = {}
): Promise<Report5Data> {
  const query = db
    .select({
      id: designerProfiles.id,
      userId: designerProfiles.userId,
      displayName: designerProfiles.displayName,
      title: designerProfiles.title,
      city: designerProfiles.city,
      phone: designerProfiles.phone,
      yearsExperience: designerProfiles.yearsExperience,
      status: designerProfiles.status,
      rejectionReason: designerProfiles.rejectionReason,
      createdAt: designerProfiles.createdAt,
      updatedAt: designerProfiles.updatedAt,
      userFullName: users.fullName,
      email: users.email,
    })
    .from(designerProfiles)
    .innerJoin(users, eq(designerProfiles.userId, users.id))
    .orderBy(desc(designerProfiles.createdAt));

  const records = await query;
  const now = new Date();

  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let draftCount = 0;

  const items: ApprovalVerificationItem[] = [];

  for (const r of records) {
    if (filters.startDate && new Date(r.createdAt) < new Date(filters.startDate)) continue;
    if (filters.endDate && new Date(r.createdAt) > new Date(filters.endDate)) continue;
    if (filters.status && filters.status !== "all" && r.status !== filters.status) continue;
    if (filters.city && filters.city !== "all" && !r.city.toLowerCase().includes(filters.city.toLowerCase())) continue;

    if (r.status === "pending") pendingCount++;
    else if (r.status === "approved") approvedCount++;
    else if (r.status === "rejected") rejectedCount++;
    else draftCount++;

    const created = new Date(r.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const daysPending = r.status === "pending" ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;

    items.push({
      profileId: r.id,
      userId: r.userId,
      designerName: r.displayName,
      userFullName: r.userFullName,
      email: r.email,
      phone: r.phone,
      city: r.city,
      yearsExperience: r.yearsExperience,
      status: r.status,
      rejectionReason: r.rejectionReason,
      submissionDate: r.createdAt.toISOString(),
      lastReviewDate: r.updatedAt.toISOString(),
      daysPending,
    });
  }

  // Find longest pending profiles
  const longestPending = items
    .filter((p) => p.status === "pending")
    .sort((a, b) => b.daysPending - a.daysPending);

  const maxPendingDays = longestPending.length > 0 ? longestPending[0].daysPending : 0;

  return {
    summary: {
      totalProfiles: items.length,
      pendingCount,
      approvedCount,
      rejectedCount,
      draftCount,
      longestPendingDays: maxPendingDays,
    },
    profiles: items,
    longestPendingProfiles: longestPending.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// REPORT 6: Monthly Platform Growth
// -------------------------------------------------------------
export interface MonthlyGrowthItem {
  monthKey: string; // YYYY-MM
  monthLabel: string; // "Oct 2026"
  customerRegistrations: number;
  designerRegistrations: number;
  designerApprovals: number;
  enquiriesSubmitted: number;
  completedEnquiries: number;
  totalNewUsers: number;
  momCustomerGrowth: number | null; // % MoM
  momEnquiryGrowth: number | null; // % MoM
}

export interface Report6Data {
  summary: {
    totalCustomerRegistrations: number;
    totalDesignerRegistrations: number;
    totalDesignerApprovals: number;
    totalEnquiriesSubmitted: number;
    totalCompletedEnquiries: number;
    averageMonthlyEnquiries: number;
  };
  monthlyTrends: MonthlyGrowthItem[];
  generatedAt: string;
}

export async function getMonthlyPlatformGrowthReport(
  monthsBack = 6
): Promise<Report6Data> {
  const usersRecords = await db
    .select({
      id: users.id,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  const profilesRecords = await db
    .select({
      id: designerProfiles.id,
      status: designerProfiles.status,
      createdAt: designerProfiles.createdAt,
      updatedAt: designerProfiles.updatedAt,
    })
    .from(designerProfiles);

  const enquiriesRecords = await db
    .select({
      id: enquiries.id,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      updatedAt: enquiries.updatedAt,
    })
    .from(enquiries);

  // Generate continuous list of months
  const now = new Date();
  const monthMap: Record<
    string,
    {
      monthKey: string;
      monthLabel: string;
      customers: number;
      designers: number;
      approvals: number;
      enquiries: number;
      completedEnquiries: number;
    }
  > = {};

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    monthMap[key] = {
      monthKey: key,
      monthLabel: label,
      customers: 0,
      designers: 0,
      approvals: 0,
      enquiries: 0,
      completedEnquiries: 0,
    };
  }

  // Populate users
  for (const u of usersRecords) {
    const d = new Date(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap[key]) {
      if (u.role === "customer") monthMap[key].customers++;
      else if (u.role === "designer") monthMap[key].designers++;
    }
  }

  // Populate profiles
  for (const p of profilesRecords) {
    if (p.status === "approved") {
      const d = new Date(p.updatedAt || p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthMap[key]) {
        monthMap[key].approvals++;
      }
    }
  }

  // Populate enquiries
  for (const e of enquiriesRecords) {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap[key]) {
      monthMap[key].enquiries++;
      if (e.status === "completed") {
        monthMap[key].completedEnquiries++;
      }
    }
  }

  // Calculate MoM growth
  const sortedKeys = Object.keys(monthMap).sort();
  const trends: MonthlyGrowthItem[] = [];

  let totalCust = 0;
  let totalDes = 0;
  let totalAppr = 0;
  let totalEnq = 0;
  let totalComp = 0;

  for (let idx = 0; idx < sortedKeys.length; idx++) {
    const key = sortedKeys[idx];
    const data = monthMap[key];

    totalCust += data.customers;
    totalDes += data.designers;
    totalAppr += data.approvals;
    totalEnq += data.enquiries;
    totalComp += data.completedEnquiries;

    let momCust: number | null = null;
    let momEnq: number | null = null;

    if (idx > 0) {
      const prevKey = sortedKeys[idx - 1];
      const prev = monthMap[prevKey];
      if (prev.customers > 0) {
        momCust = Number((((data.customers - prev.customers) / prev.customers) * 100).toFixed(1));
      }
      if (prev.enquiries > 0) {
        momEnq = Number((((data.enquiries - prev.enquiries) / prev.enquiries) * 100).toFixed(1));
      }
    }

    trends.push({
      monthKey: data.monthKey,
      monthLabel: data.monthLabel,
      customerRegistrations: data.customers,
      designerRegistrations: data.designers,
      designerApprovals: data.approvals,
      enquiriesSubmitted: data.enquiries,
      completedEnquiries: data.completedEnquiries,
      totalNewUsers: data.customers + data.designers,
      momCustomerGrowth: momCust,
      momEnquiryGrowth: momEnq,
    });
  }

  return {
    summary: {
      totalCustomerRegistrations: totalCust,
      totalDesignerRegistrations: totalDes,
      totalDesignerApprovals: totalAppr,
      totalEnquiriesSubmitted: totalEnq,
      totalCompletedEnquiries: totalComp,
      averageMonthlyEnquiries:
        sortedKeys.length > 0 ? Number((totalEnq / sortedKeys.length).toFixed(1)) : 0,
    },
    monthlyTrends: trends,
    generatedAt: new Date().toISOString(),
  };
}
