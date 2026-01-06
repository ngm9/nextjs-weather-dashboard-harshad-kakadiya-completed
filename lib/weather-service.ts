/**
 * Weather service layer - handles all weather API interactions
 */

import { WeatherData } from "../types/weather";
import { WeatherAPIError, NetworkError, ValidationError } from "./errors";
import { logger } from "./logger";
import {
  WEATHER_API_BASE_URL,
  WEATHER_API_TIMEOUT_MS,
  ERROR_MESSAGES,
} from "./constants";

interface WeatherServiceConfig {
  apiKey: string;
  timeout?: number;
}

class WeatherService {
  private apiKey: string;
  private timeout: number;

  constructor(config: WeatherServiceConfig) {
    if (!config.apiKey) {
      throw new ValidationError(ERROR_MESSAGES.API_KEY_MISSING);
    }
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || WEATHER_API_TIMEOUT_MS;
  }

  /**
   * Fetches weather data for a given city
   * @param city - City name to fetch weather for
   * @returns Promise resolving to weather data
   * @throws WeatherAPIError | NetworkError | ValidationError
   */
  async fetchWeather(city: string): Promise<WeatherData> {
    if (!city || typeof city !== "string" || !city.trim()) {
      throw new ValidationError(ERROR_MESSAGES.CITY_REQUIRED);
    }

    const trimmedCity = city.trim();
    const url = `${WEATHER_API_BASE_URL}?key=${this.apiKey}&q=${encodeURIComponent(trimmedCity)}&aqi=no`;

    logger.debug("Fetching weather data", { city: trimmedCity, url });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        logger.warn("Weather API error response", {
          status: response.status,
          city: trimmedCity,
          error: errorData,
        });

        if (response.status === 400) {
          throw new WeatherAPIError(
            errorData.message || ERROR_MESSAGES.CITY_NOT_FOUND,
            response.status
          );
        }

        throw new WeatherAPIError(
          ERROR_MESSAGES.SERVER_ERROR,
          response.status
        );
      }

      const data: WeatherData = await response.json();
      logger.info("Weather data fetched successfully", { city: trimmedCity });
      return data;
    } catch (error) {
      if (error instanceof WeatherAPIError || error instanceof ValidationError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        logger.error("Weather API request timeout", error, { city: trimmedCity });
        throw new NetworkError(ERROR_MESSAGES.NETWORK_ERROR, error);
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        logger.error("Network error fetching weather", error, { city: trimmedCity });
        throw new NetworkError(ERROR_MESSAGES.NETWORK_ERROR, error);
      }

      logger.error("Unexpected error fetching weather", error, { city: trimmedCity });
      throw new WeatherAPIError(ERROR_MESSAGES.UNKNOWN_ERROR, 500, error as Error);
    }
  }

  /**
   * Parses error response from API
   */
  private async parseErrorResponse(response: Response): Promise<{ message?: string }> {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }
}

export default WeatherService;

