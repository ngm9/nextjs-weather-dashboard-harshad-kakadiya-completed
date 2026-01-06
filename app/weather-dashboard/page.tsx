"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { WeatherData } from "../../types/weather";

export default function WeatherDashboard() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to log search in the background (fire and forget)
  const logSearch = useCallback((cityName: string) => {
    fetch("/api/log-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ city: cityName }),
    }).catch((err) => {
      // Silently fail - logging should not block UI
      console.error("Failed to log search:", err);
    });
  }, []);

  // Function to fetch weather data
  const fetchWeather = useCallback(async (cityName: string, searchId: number) => {
    if (!cityName.trim()) {
      setWeather(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);

      // Only update if this is still the latest search
      if (searchId !== searchRef.current) {
        return; // Ignore outdated results
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch weather");
      }

      const data: WeatherData = await response.json();
      
      // Double-check this is still the latest search before updating
      if (searchId === searchRef.current) {
        setWeather(data);
        setError(null);
        // Log the search in the background (fire and forget)
        logSearch(cityName);
      }
    } catch (err) {
      // Only update error if this is still the latest search
      if (searchId === searchRef.current) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setWeather(null);
      }
    } finally {
      // Only update loading if this is still the latest search
      if (searchId === searchRef.current) {
        setLoading(false);
      }
    }
  }, [logSearch]);

  // Debounced effect for city input
  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Increment search ID for race condition handling
    searchRef.current += 1;
    const currentSearchId = searchRef.current;

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      fetchWeather(city, currentSearchId);
    }, 500); // 500ms debounce delay

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [city, fetchWeather]);

  return (
    <main className="max-w-xl mx-auto py-10 px-2">
      <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Weather Dashboard
        </h1>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading weather data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {weather && !loading && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{weather.location.name}</h2>
                <p className="text-sm opacity-90">
                  {weather.location.region}, {weather.location.country}
                </p>
              </div>
              {weather.current.condition?.icon && (
                <img
                  src={`https:${weather.current.condition.icon}`}
                  alt={weather.current.condition?.text}
                  className="w-16 h-16"
                />
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-5xl font-bold mb-2">
                {Math.round(weather.current.temp_c)}°C
              </p>
              <p className="text-lg capitalize">
                {weather.current.condition?.text}
              </p>
              <p className="text-sm opacity-90 mt-1">
                Last updated: {new Date(weather.current.last_updated).toLocaleTimeString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-400">
              <div>
                <p className="text-sm opacity-90">Feels Like</p>
                <p className="text-xl font-semibold">
                  {Math.round(weather.current.feelslike_c)}°C
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90">Humidity</p>
                <p className="text-xl font-semibold">{weather.current.humidity}%</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Wind Speed</p>
                <p className="text-xl font-semibold">{weather.current.wind_kph} km/h</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Wind Direction</p>
                <p className="text-xl font-semibold">{weather.current.wind_dir}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Pressure</p>
                <p className="text-xl font-semibold">{weather.current.pressure_mb} mb</p>
              </div>
              <div>
                <p className="text-sm opacity-90">UV Index</p>
                <p className="text-xl font-semibold">{weather.current.uv}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Visibility</p>
                <p className="text-xl font-semibold">{weather.current.vis_km} km</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Cloud Cover</p>
                <p className="text-xl font-semibold">{weather.current.cloud}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
