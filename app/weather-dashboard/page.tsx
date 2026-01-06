import { useState, useRef } from "react";
import { WeatherData } from "../../types/weather";

export default function WeatherDashboard() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<number>(0);

  // Implement debounce city search, fetch weather, handle only latest, and log search (background)

  return (
    <main className="max-w-xl mx-auto py-10 px-2">
      {/* Input, loading/error states, weather card go here */}
    </main>
  );
}
