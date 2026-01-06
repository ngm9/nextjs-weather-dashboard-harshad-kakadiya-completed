"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { WeatherData } from "../../types/weather";
import { searchLogger } from "../../lib/search-logger";
import { DEBOUNCE_DELAY_MS, ERROR_MESSAGES } from "../../lib/constants";

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Weather Dashboard Component
 * 
 * Features:
 * - Debounced search input (prevents excessive API calls)
 * - Race condition handling (only latest search result is shown)
 * - Background search logging (non-blocking)
 * - Clear loading and error states
 * - Responsive and user-friendly UI
 */
export default function WeatherDashboard() {
  const [city, setCity] = useState("");
  const [weatherState, setWeatherState] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
  });

  // Track search requests to handle race conditions
  const searchIdRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Updates weather state safely, only if this is still the latest search
   */
  const updateWeatherState = useCallback(
    (searchId: number, updates: Partial<WeatherState>) => {
      if (searchId === searchIdRef.current) {
        setWeatherState((prev) => ({ ...prev, ...updates }));
      }
    },
    []
  );

  /**
   * Fetches weather data for a given city
   * Implements race condition protection to ensure only latest result is shown
   */
  const fetchWeather = useCallback(async (cityName: string, searchId: number) => {
    const trimmedCity = cityName.trim();

    // Clear state for empty input
    if (!trimmedCity) {
      updateWeatherState(searchId, {
        data: null,
        error: null,
        loading: false,
      });
      return;
    }

    // Set loading state
    updateWeatherState(searchId, {
      loading: true,
      error: null,
    });

    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(trimmedCity)}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        }
      );

      // Check if this is still the latest search
      if (searchId !== searchIdRef.current) {
        return; // Ignore outdated results
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || ERROR_MESSAGES.UNKNOWN_ERROR;
        throw new Error(errorMessage);
      }

      const data: WeatherData = await response.json();

      // Double-check this is still the latest search before updating
      if (searchId === searchIdRef.current) {
        updateWeatherState(searchId, {
          data,
          error: null,
          loading: false,
        });

        // Log search in background (fire and forget - non-blocking)
        searchLogger.logSearch(trimmedCity).catch(() => {
          // Silently fail - logging should never affect UI
        });
      }
    } catch (error) {
      // Only update error if this is still the latest search
      if (searchId === searchIdRef.current) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.UNKNOWN_ERROR;
        updateWeatherState(searchId, {
          error: errorMessage,
          data: null,
          loading: false,
        });
      }
    }
  }, [updateWeatherState]);

  /**
   * Debounced effect for city input
   * Prevents excessive API calls while user is typing
   */
  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Increment search ID for race condition handling
    searchIdRef.current += 1;
    const currentSearchId = searchIdRef.current;

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      fetchWeather(city, currentSearchId);
    }, DEBOUNCE_DELAY_MS);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [city, fetchWeather]);

  /**
   * Memoized formatted date for last updated time
   */
  const lastUpdatedTime = useMemo(() => {
    if (!weatherState.data) return null;
    try {
      return new Date(weatherState.data.current.last_updated).toLocaleTimeString();
    } catch {
      return null;
    }
  }, [weatherState.data]);

  return (
    <main className="max-w-xl mx-auto py-10 px-2 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Weather Dashboard
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Search for any city to get current weather information
        </p>
        
        <div className="mb-6">
          <label htmlFor="city-input" className="sr-only">
            Enter city name
          </label>
          <input
            id="city-input"
            type="text"
            placeholder="Enter city name (e.g., London, New York, Tokyo)..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
            aria-label="City search input"
            aria-describedby="city-input-description"
          />
          <p id="city-input-description" className="text-xs text-gray-500 mt-1">
            Start typing to search for weather information
          </p>
        </div>

        {weatherState.loading && (
          <div className="text-center py-12" role="status" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading weather data...</p>
            <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the latest information</p>
          </div>
        )}

        {weatherState.error && !weatherState.loading && (
          <div 
            className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{weatherState.error}</p>
              </div>
            </div>
          </div>
        )}

        {weatherState.data && !weatherState.loading && (
          <div 
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg animate-fade-in"
            role="region"
            aria-label="Weather information"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{weatherState.data.location.name}</h2>
                <p className="text-sm opacity-90">
                  {weatherState.data.location.region}, {weatherState.data.location.country}
                </p>
              </div>
              {weatherState.data.current.condition?.icon && (
                <img
                  src={`https:${weatherState.data.current.condition.icon}`}
                  alt={weatherState.data.current.condition?.text || "Weather condition icon"}
                  className="w-16 h-16"
                  loading="lazy"
                />
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-5xl font-bold mb-2">
                {Math.round(weatherState.data.current.temp_c)}°C
              </p>
              <p className="text-lg capitalize">
                {weatherState.data.current.condition?.text}
              </p>
              {lastUpdatedTime && (
                <p className="text-sm opacity-90 mt-1">
                  Last updated: {lastUpdatedTime}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-400">
              <div>
                <p className="text-sm opacity-90">Feels Like</p>
                <p className="text-xl font-semibold">
                  {Math.round(weatherState.data.current.feelslike_c)}°C
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90">Humidity</p>
                <p className="text-xl font-semibold">{weatherState.data.current.humidity}%</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Wind Speed</p>
                <p className="text-xl font-semibold">{weatherState.data.current.wind_kph} km/h</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Wind Direction</p>
                <p className="text-xl font-semibold">{weatherState.data.current.wind_dir}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Pressure</p>
                <p className="text-xl font-semibold">{weatherState.data.current.pressure_mb} mb</p>
              </div>
              <div>
                <p className="text-sm opacity-90">UV Index</p>
                <p className="text-xl font-semibold">{weatherState.data.current.uv}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Visibility</p>
                <p className="text-xl font-semibold">{weatherState.data.current.vis_km} km</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Cloud Cover</p>
                <p className="text-xl font-semibold">{weatherState.data.current.cloud}%</p>
              </div>
            </div>
          </div>
        )}

        {!weatherState.loading && !weatherState.error && !weatherState.data && city.trim() && (
          <div className="text-center py-8 text-gray-500">
            <p>No weather data to display</p>
          </div>
        )}
      </div>
    </main>
  );
}
