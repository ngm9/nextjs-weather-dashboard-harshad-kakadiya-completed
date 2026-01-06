/**
 * Search logging service - handles background logging of search events
 */

import { logger } from "./logger";

interface SearchLogPayload {
  city: string;
  timestamp: string;
}

class SearchLogger {
  private readonly LOG_ENDPOINT = "/api/log-search";

  /**
   * Logs a search event in the background (fire and forget)
   * This should never block the UI or throw errors to the caller
   */
  async logSearch(city: string): Promise<void> {
    if (!city || !city.trim()) {
      logger.debug("Skipping log for empty city");
      return;
    }

    const payload: SearchLogPayload = {
      city: city.trim(),
      timestamp: new Date().toISOString(),
    };

    // Fire and forget - don't await or throw
    fetch(this.LOG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          logger.warn("Search log request failed", {
            status: response.status,
            city: payload.city,
          });
        } else {
          logger.debug("Search logged successfully", { city: payload.city });
        }
      })
      .catch((error) => {
        // Silently fail - logging should never block UI
        logger.error("Failed to log search", error, { city: payload.city });
      });
  }
}

export const searchLogger = new SearchLogger();

