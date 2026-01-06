import { NextRequest, NextResponse } from "next/server";
import WeatherService from "../../../lib/weather-service";
import { logger } from "../../../lib/logger";
import { WeatherAPIError, ValidationError, NetworkError } from "../../../lib/errors";
import { HTTP_STATUS, ERROR_MESSAGES } from "../../../lib/constants";

/**
 * GET /api/weather
 * Fetches current weather data for a given city
 * 
 * Query parameters:
 * - city: string (required) - City name to fetch weather for
 * 
 * Returns:
 * - 200: Weather data
 * - 400: Invalid city parameter or city not found
 * - 500: Server error
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const searchParams = req.nextUrl.searchParams;
  const city = searchParams.get("city");

  if (!city) {
    logger.warn("Weather API called without city parameter");
    return NextResponse.json(
      { error: ERROR_MESSAGES.CITY_REQUIRED },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    const apiKey = process.env.WEATHER_API_KEY || "1bec88bba1934004919140951260601";
    const weatherService = new WeatherService({ apiKey });
    
    const weatherData = await weatherService.fetchWeather(city);
    
    const duration = Date.now() - startTime;
    logger.info("Weather API request completed", {
      city,
      duration: `${duration}ms`,
      status: HTTP_STATUS.OK,
    });

    return NextResponse.json(weatherData, { status: HTTP_STATUS.OK });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof ValidationError) {
      logger.warn("Validation error in weather API", { city, error: error.message, duration: `${duration}ms` });
      return NextResponse.json(
        { error: error.message },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (error instanceof WeatherAPIError) {
      logger.error("Weather API error", error, { city, duration: `${duration}ms` });
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (error instanceof NetworkError) {
      logger.error("Network error in weather API", error, { city, duration: `${duration}ms` });
      return NextResponse.json(
        { error: error.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Unknown error
    logger.error("Unexpected error in weather API", error, { city, duration: `${duration}ms` });
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

