# Weather Dashboard – Task

## Task Overview

Your team is developing a weather dashboard feature for a travel-focused web application. The dashboard lets users search any city and view its latest weather information using a third-party API. Ensuring responsive user experience is key: rapid search inputs must not trigger excessive API requests, results should not "flicker" due to concurrent fetches, and every successful search should be logged on the backend without blocking the UI.

## Objectives
- Create a city search interface that avoids repeated fetches by stabilizing user input before triggering network activity.
- Retrieve weather information asynchronously and ensure that the interface always reflects the most up-to-date search, regardless of the order in which responses return.
- Represent loading and error behavior clearly so users understand the current state of the lookup.
- Record successful searches using a background call to a dedicated API route, allowing the main UI to update without interruption.
- Use TypeScript interfaces throughout the components and API layers to maintain strict typing across weather data, search logs, and form handling.

## How to Verify
- Interact with the search input by typing quickly and observe that only the final, stable entry initiates a real weather lookup, with no outdated results appearing.
- Confirm that loading indicators appear during network activity and that failed requests display meaningful error information.
- Query the logging endpoint to confirm that search events are being stored during the session.
- Check that the UI remains responsive when performing rapid searches or when multiple fetches are triggered in quick succession.
- Make sure the project with type checking enabled to ensure no TypeScript errors appear and the app builds cleanly.

## Helpful Tips
- Review the existing Next.js (13+) project structure and ensure all work stays within the app directory while using TypeScript consistently.
- The dashboard should provide a single city search field; consider how to avoid unnecessary requests by triggering fetches only after user input stabilizes.
- Think about how asynchronous weather lookups can overlap and plan so that only the most recent result is displayed, even if earlier responses arrive later.
- When a search completes successfully, record the lookup in the background through a dedicated Next.js API route—this should not delay the weather display.
- Keep component design simple and typed, using functional components and clear interfaces for weather results, form state, and log entries.
- Apply minimal, clean styling through CSS Modules or Tailwind to keep the focus on functionality.
- Weather data may come from any lightweight public service or a mock source, whichever is most convenient.
