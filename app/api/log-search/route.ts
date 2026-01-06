import { NextRequest, NextResponse } from "next/server";
import { SearchLog } from "../../../types/weather";
import { logger } from "../../../lib/logger";
import { HTTP_STATUS } from "../../../lib/constants";

/**
 * In-memory storage for search logs
 * In production, this should be replaced with a database
 */
const searchLogs: SearchLog[] = [];
const MAX_LOGS = 1000; // Prevent memory issues

/**
 * POST /api/log-search
 * Logs a city search event in the background
 * 
 * Body:
 * - city: string (required) - City name that was searched
 * 
 * Returns:
 * - 200: Success (always returns success to not block UI)
 * - 400: Invalid request
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { city } = body;

    if (!city || typeof city !== "string" || !city.trim()) {
      logger.warn("Log search called with invalid city", { city });
      return NextResponse.json(
        { error: "City is required and must be a non-empty string" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const trimmedCity = city.trim();
    const logEntry: SearchLog = {
      city: trimmedCity,
      timestamp: new Date().toISOString(),
    };

    // Add to logs, maintaining max size
    searchLogs.push(logEntry);
    if (searchLogs.length > MAX_LOGS) {
      searchLogs.shift(); // Remove oldest entry
    }

    const duration = Date.now() - startTime;
    logger.debug("Search logged successfully", {
      city: trimmedCity,
      duration: `${duration}ms`,
      totalLogs: searchLogs.length,
    });

    // Always return success to not block the UI
    return NextResponse.json(
      { success: true, loggedAt: logEntry.timestamp },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Error logging search", error, { duration: `${duration}ms` });
    
    // Still return success to not block the UI
    // This is intentional - logging failures should never affect user experience
    return NextResponse.json(
      { success: false, error: "Logging failed but request processed" },
      { status: HTTP_STATUS.OK }
    );
  }
}

/**
 * GET /api/log-search
 * Retrieves all search logs (for debugging/monitoring)
 * 
 * Returns:
 * - 200: Array of search logs
 */
export async function GET() {
  try {
    logger.debug("Retrieving search logs", { count: searchLogs.length });
    return NextResponse.json(
      { logs: searchLogs, count: searchLogs.length },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    logger.error("Error retrieving search logs", error);
    return NextResponse.json(
      { error: "Failed to retrieve logs" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
