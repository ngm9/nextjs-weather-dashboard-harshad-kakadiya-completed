import { NextRequest, NextResponse } from "next/server";
import { SearchLog } from "../../../types/weather";

let logs: SearchLog[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { city } = body;

    if (!city || typeof city !== "string") {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    const logEntry: SearchLog = {
      city: city.trim(),
      timestamp: new Date().toISOString(),
    };

    logs.push(logEntry);

    // Return success without waiting for any additional processing
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error logging search:", error);
    // Still return success to not block the UI
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ logs }, { status: 200 });
}
