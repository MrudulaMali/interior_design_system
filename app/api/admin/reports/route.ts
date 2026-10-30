import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getLocationAvailabilityReport,
  getCustomerEnquiryAnalysisReport,
  getDesignerPerformanceReport,
  getSpecializationAvailabilityReport,
  getDesignerApprovalReport,
  getMonthlyPlatformGrowthReport,
} from "@/lib/reports";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Administrator permissions required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "1";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const city = searchParams.get("city") || undefined;
    const status = searchParams.get("status") || undefined;
    const designerId = searchParams.get("designerId")
      ? Number(searchParams.get("designerId"))
      : undefined;

    const filters = { startDate, endDate, city, status, designerId };

    switch (reportType) {
      case "1":
      case "location-availability": {
        const data = await getLocationAvailabilityReport(filters);
        return NextResponse.json({ success: true, reportType: 1, data }, { headers: { "Cache-Control": "no-store" } });
      }

      case "2":
      case "enquiry-analysis": {
        const data = await getCustomerEnquiryAnalysisReport(filters);
        return NextResponse.json({ success: true, reportType: 2, data }, { headers: { "Cache-Control": "no-store" } });
      }

      case "3":
      case "designer-performance": {
        const data = await getDesignerPerformanceReport(filters);
        return NextResponse.json({ success: true, reportType: 3, data }, { headers: { "Cache-Control": "no-store" } });
      }

      case "4":
      case "specialization-availability": {
        const data = await getSpecializationAvailabilityReport(filters);
        return NextResponse.json({ success: true, reportType: 4, data }, { headers: { "Cache-Control": "no-store" } });
      }

      case "5":
      case "designer-approvals": {
        const data = await getDesignerApprovalReport(filters);
        return NextResponse.json({ success: true, reportType: 5, data }, { headers: { "Cache-Control": "no-store" } });
      }

      case "6":
      case "monthly-growth": {
        const months = searchParams.get("months") ? Number(searchParams.get("months")) : 6;
        const data = await getMonthlyPlatformGrowthReport(months);
        return NextResponse.json({ success: true, reportType: 6, data }, { headers: { "Cache-Control": "no-store" } });
      }

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${reportType}. Supported types: 1 through 6.` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json(
      { error: "Internal server error while generating report." },
      { status: 500 }
    );
  }
}
