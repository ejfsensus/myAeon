"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { ChartLocation } from "@/lib/astrologyTypes";

type PlaceResult = ChartLocation & { region?: string; country?: string };
export function resolvedPlace(place: ChartLocation) {
  let timezoneValid = false;
  try { new Intl.DateTimeFormat('en', { timeZone: place.timezone }); timezoneValid = place.timezone === 'UTC' || place.timezone.includes('/'); } catch { /* Incomplete manual timezone. */ }
  return Boolean(place.city.trim() && /^[A-Z]{2}$/.test(place.nation) && Number.isFinite(place.latitude) && Math.abs(place.latitude) <= 90 && Number.isFinite(place.longitude) && Math.abs(place.longitude) <= 180 && timezoneValid);
}
export default function PlaceSearch({ selected, onSelect, onClear }: {
  selected: ChartLocation | null; onSelect: (location: ChartLocation) => void; onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const statusId = useId();
  useEffect(() => {
    input.current?.setCustomValidity(selected ? '' : 'Choose a birthplace from the results, or complete the manual location details.');
  }, [selected, query]);
  useEffect(() => {
    setResults([]);
    if (selected || query.trim().length < 2) { setStatus(''); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('Searching places…');
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (controller.signal.aborted) return;
        const places = Array.isArray(data.locations) ? data.locations : [];
        setResults(places);
        setStatus(places.length ? 'Choose your birthplace below.' : 'No matches. Try a nearby town, or add the country name.');
      } catch (error) {
        if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : 'Search unavailable. Try again or use manual location details.');
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, selected]);
  return <div className="place-search">
    {selected ? <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--panel-border)] p-3">
      <div><strong>{selected.city}, {selected.nation}</strong><p className="!m-0">Local timezone: {selected.timezone.replaceAll('_', ' ')}</p></div>
      <button type="button" className="min-h-11 px-3 text-sm text-astral-cyan" onClick={() => { setQuery(''); setStatus(''); onClear(); }}>Change birthplace</button>
    </div> : <>
      <label>Find your birthplace<input ref={input} className="birth-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="City or town, country" autoComplete="off" required aria-describedby={statusId} /></label>
      <p id={statusId} role="status">{status || 'Search and choose a result. We fill in coordinates and timezone for you.'}</p>
      <ul aria-label="Matching birthplaces">{results.map(place => <li key={`${place.nation}:${place.latitude}:${place.longitude}`}>
        <button type="button" onClick={() => {
          const { city, nation, latitude, longitude, timezone } = place;
          onSelect({ city, nation, latitude, longitude, timezone }); setResults([]); setQuery('');
        }}><strong>{place.city}, {place.country || place.nation}</strong><span>{[place.region, place.timezone.replaceAll('_', ' ')].filter(Boolean).join(' · ')}</span></button>
      </li>)}</ul>
      <small>Place data: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo / GeoNames</a>. Only your search text is sent.</small>
    </>}
  </div>;
}
