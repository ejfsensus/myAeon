"use client";
import { useEffect, useState } from "react";
import type { ChartLocation } from "@/lib/astrologyTypes";
export default function PlaceSearch({
  onSelect,
}: {
  onSelect: (location: ChartLocation) => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<Array<ChartLocation & { region: string }>>(
      [],
    ),
    [status, setStatus] = useState("");
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("Searching places…");
      try {
        const response = await fetch(
          `/api/locations?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setResults(data.locations);
        setStatus(
          data.locations.length
            ? "Choose and confirm your birthplace."
            : "No matches. Try adding a country.",
        );
      } catch (e) {
        if (!controller.signal.aborted)
          setStatus(e instanceof Error ? e.message : "Search unavailable.");
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div className="place-search">
      <label>
        Find a birthplace
        <input
          className="birth-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City, country"
          autoComplete="off"
        />
      </label>
      <p role="status">{status}</p>
      <ul>
        {results.map((place, i) => (
          <li key={`${place.city}-${i}`}>
            <button
              type="button"
              onClick={() => {
                onSelect(place);
                setResults([]);
                setStatus(`${place.city} selected · ${place.timezone}`);
              }}
            >
              <strong>
                {place.city}, {place.nation}
              </strong>
              <span>
                {place.region} · {place.timezone}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <small>
        Place data:{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo / GeoNames
        </a>
        . Only your search text is sent.
      </small>
    </div>
  );
}
