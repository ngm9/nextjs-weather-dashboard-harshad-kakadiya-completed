import { NextRequest, NextResponse } from "next/server";
import { WeatherData } from "../../../types/weather";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json(
      { error: "City parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Using WeatherAPI.com
    const apiKey = process.env.WEATHER_API_KEY || "1bec88bba1934004919140951260601";
    
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 400) {
        return NextResponse.json(
          { error: errorData.error?.message || "City not found" },
          { status: 400 }
        );
      }
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data: WeatherData = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}

