import { NextRequest, NextResponse } from "next/server";
import { getActivePeriod } from "@/lib/periods";

export async function GET(request: NextRequest) {
  try {
    const activePeriod = await getActivePeriod();

    if (!activePeriod) {
      return NextResponse.json(
        { error: "No active period found" },
        { status: 404 }
      );
    }

    return NextResponse.json(activePeriod);
  } catch (error: any) {
    console.error("Error fetching active period:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch active period" },
      { status: 500 }
    );
  }
}