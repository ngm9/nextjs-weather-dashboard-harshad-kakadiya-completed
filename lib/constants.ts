/**
 * Application-wide constants
 */

export const DEBOUNCE_DELAY_MS = 500;
export const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1/current.json";
export const WEATHER_API_TIMEOUT_MS = 10000; // 10 seconds

export const ERROR_MESSAGES = {
  CITY_REQUIRED: "Please enter a city name",
  CITY_NOT_FOUND: "City not found. Please check the spelling and try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  API_KEY_MISSING: "Weather API key is not configured.",
} as const;

export const SUCCESS_MESSAGES = {
  WEATHER_LOADED: "Weather data loaded successfully",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

