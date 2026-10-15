"use client";
import PlaceSearch, { resolvedPlace } from "./PlaceSearch";
import { getSunSign, type ZodiacSign } from '@/lib/zodiac';
import type { AstrologyUsage, BirthProfile, ChartLocation } from '@/lib/astrologyTypes';
import { publicMessage } from './chartPresentation';

export type BirthInput = {
  mode?: "today" | "full"; name: string; birthDate: string; birthTime: string; timeConfidence: 'known' | 'estimated' | 'unknown';
  preferences?: import('@/lib/astrologyTypes').ReadingPreferences;
  birthPlace: string; location: ChartLocation; readingDate: string; confirmed: boolean; dstChoice?: 'earlier' | 'later';
};
export function londonToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function initialBirthInput(): BirthInput {
  return { mode: 'today', name: '', birthDate: '', birthTime: '', timeConfidence: 'unknown', birthPlace: 'London, UK', location: { city: 'London', nation: 'GB', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' }, readingDate: londonToday(), confirmed: false };
}
export function birthProfile(input: BirthInput): BirthProfile {
  return { birthDate: input.birthDate, ...(input.timeConfidence !== 'unknown' ? { birthTime: input.birthTime } : {}), timeConfidence: input.timeConfidence, location: { city: input.location.city, nation: input.location.nation, latitude: input.location.latitude, longitude: input.location.longitude, timezone: input.location.timezone }, confirmed: true, providerConsent: true, ...(input.dstChoice ? { dstChoice: input.dstChoice } : {}) };
}
export function profileFingerprint(input: BirthInput) { return JSON.stringify({ ...birthProfile(input), confirmed: input.confirmed }); }
export function readingFingerprint(input: BirthInput) { return JSON.stringify([profileFingerprint(input), input.readingDate, input.name, input.mode, input.preferences]); }
export type BirthFormProps = {
  input: BirthInput; onChange: (input: BirthInput) => void; onSubmit: (input: BirthInput, sunSign: ZodiacSign) => void;
  onConfirm: (input: BirthInput) => void; loading: boolean; confirming: boolean; profileConfirmed: boolean;
  status: string | null; usage: AstrologyUsage | null; enrichmentEnabled: boolean;
  formId?: string; hideSubmit?: boolean;
};
export default function BirthDetailsForm({ input, onChange, onSubmit, onConfirm, loading, confirming, profileConfirmed, status, formId, hideSubmit }: BirthFormProps) {
  const update = (patch: Partial<BirthInput>) => onChange({ ...input, ...patch });
  const location = (patch: Partial<ChartLocation>) => update({ location: { ...input.location, ...patch } });
  const placeReady = resolvedPlace(input.location);
  const busy = loading || confirming;
  return <form id={formId} className="space-y-3 text-[var(--app-text)]" onSubmit={event => { event.preventDefault(); if (input.birthDate && placeReady) onSubmit(input, getSunSign(new Date(`${input.birthDate}T12:00:00Z`))); }}>
    <fieldset className="reading-mode"><legend>Reading length</legend><div role="group" aria-label="Reading length">{(["today", "full"] as const).map(mode => <button type="button" key={mode} aria-pressed={(input.mode ?? "today") === mode} onClick={() => update({ mode })}>{mode === "today" ? "Today · quick" : "Full reading"}</button>)}</div><p>{input.mode === "full" ? "Four horizons, with a spoken journey under ten minutes." : "A focused reading for your selected day, with music, speech and PDF."}</p></fieldset>
    <Field label="Name (optional)"><input className="birth-input" maxLength={80} value={input.name} onChange={e => update({ name: e.target.value })} placeholder="Your name" /></Field>
    <Field label="Birth date"><input className="birth-input" type="date" min="1900-01-01" max="2100-12-31" required value={input.birthDate} onChange={e => update({ birthDate: e.target.value })} /></Field>
    <Field label="How certain is your birth time?"><select className="birth-input" value={input.timeConfidence} onChange={e => update({ timeConfidence: e.target.value as BirthInput['timeConfidence'] })}><option value="unknown">Unknown</option><option value="known">Known / recorded</option><option value="estimated">Estimated</option></select></Field>
    {input.timeConfidence !== 'unknown' && <>
      <Field label="Recorded local birth time"><input className="birth-input" type="time" required value={input.birthTime} onChange={e => update({ birthTime: e.target.value })} /></Field>
      <details className="text-xs"><summary className="min-h-8 cursor-pointer opacity-70">Born during a clock change?</summary><Field label="If the recorded time occurred twice"><select className="birth-input" value={input.dstChoice || ''} onChange={e => update({ dstChoice: (e.target.value || undefined) as BirthInput['dstChoice'] })}><option value="">Detect automatically</option><option value="earlier">Earlier occurrence</option><option value="later">Later occurrence</option></select></Field></details>
    </>}
    <div><span className="mb-1 block text-xs opacity-70">Birthplace</span>
      <PlaceSearch selected={placeReady ? input.location : null} onClear={() => update({ location: { city: '', nation: '', latitude: NaN, longitude: NaN, timezone: '' }, birthPlace: '', dstChoice: undefined })} onSelect={place => update({ location: place, birthPlace: `${place.city}, ${place.nation}`, dstChoice: undefined })} />
      <details className="mt-2 text-xs"><summary className="min-h-8 cursor-pointer opacity-70">Manual location details</summary><div className="space-y-3 rounded-lg border border-[var(--panel-border)] p-3">
        <p className="leading-5 opacity-70">Only needed if your birthplace is missing from search. Use its coordinates and local timezone.</p>
        <Field label="City"><input className="birth-input" maxLength={100} value={input.location.city} onChange={e => location({ city: e.target.value })} /></Field>
        <Field label="Country code"><input className="birth-input" pattern="[A-Z]{2}" maxLength={2} placeholder="GB" value={input.location.nation} onChange={e => location({ nation: e.target.value.toUpperCase() })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Latitude"><input className="birth-input" type="number" min={-90} max={90} step="any" value={Number.isFinite(input.location.latitude) ? input.location.latitude : ''} onChange={e => location({ latitude: e.target.value === '' ? NaN : Number(e.target.value) })} /></Field>
          <Field label="Longitude"><input className="birth-input" type="number" min={-180} max={180} step="any" value={Number.isFinite(input.location.longitude) ? input.location.longitude : ''} onChange={e => location({ longitude: e.target.value === '' ? NaN : Number(e.target.value) })} /></Field>
        </div>
        <Field label="IANA birth timezone"><input className="birth-input" maxLength={80} placeholder="Europe/London" value={input.location.timezone} onChange={e => location({ timezone: e.target.value })} /></Field>
      </div></details>
    </div>
    <p className="text-xs leading-5 opacity-70">Birth times use your birthplace&apos;s local timezone. {input.timeConfidence === 'unknown' ? 'You can still receive sky and lunar guidance without a birth time.' : input.timeConfidence === 'estimated' ? 'We keep an estimated chart approximate and leave out time-sensitive details.' : 'Your recorded time lets us include your full birth chart.'} Reading dates use noon in London.</p>
    <details className="rounded-lg border border-[var(--panel-border)] p-3 text-xs"><summary className="min-h-8 cursor-pointer">Make this reading more useful (optional)</summary><div className="mt-2 space-y-3">
      <Field label="What would you like support with?"><select className="birth-input" value={input.preferences?.focus || ''} onChange={e => update({ preferences: { ...input.preferences, focus: (e.target.value || undefined) as NonNullable<BirthInput['preferences']>['focus'] } })}><option value="">An open perspective</option><option value="connection">Connection and relationships</option><option value="work">Work and direction</option><option value="rest">Rest and a manageable pace</option><option value="inner">Reflection and inner clarity</option></select></Field>
      <Field label="How much room do you have today?"><select className="birth-input" value={input.preferences?.capacity || ''} onChange={e => update({ preferences: { ...input.preferences, capacity: (e.target.value || undefined) as NonNullable<BirthInput['preferences']>['capacity'] } })}><option value="">Let me choose as I go</option><option value="low">Keep it gentle and small</option><option value="steady">A little room for one useful step</option><option value="full">Room to explore something more</option></select></Field>
    </div></details>
    <Field label="Sky date"><input className="birth-input" type="date" min="1900-01-01" max="2100-12-01" required value={input.readingDate} onChange={e => update({ readingDate: e.target.value })} /></Field>
    <label className="flex items-start gap-3 rounded-lg border border-[var(--panel-border)] p-3 text-xs leading-5"><input className="mt-1 h-4 w-4 shrink-0 accent-[#d4a437]" type="checkbox" required checked={input.confirmed} onChange={e => update({ confirmed: e.target.checked })} /><span>Use these birth details to calculate my chart and personalise my reading/conversation. <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-astral-cyan underline underline-offset-2">Privacy policy</a></span></label>
    <p className="text-xs leading-5 opacity-70">Your details are confirmed automatically when you start your reading.</p>
    <details className="text-xs"><summary className="min-h-8 cursor-pointer opacity-70">Use these details with Zeus before reading</summary>
    <button type="button" disabled={busy || !placeReady || !input.confirmed || !input.birthDate || (input.timeConfidence !== 'unknown' && !input.birthTime)} onClick={event => { if (event.currentTarget.form?.reportValidity()) onConfirm(input); }} className="min-h-11 w-full rounded-lg border border-[var(--panel-border)] px-3 text-sm disabled:opacity-40">{confirming ? 'Confirming…' : profileConfirmed ? 'Birth details confirmed for Zeus' : 'Confirm birth details for Zeus'}</button></details>
    {status && <p role="status" className="text-xs leading-5 text-astral-cyan">{publicMessage(status, 'Could not confirm birth details. Please try again.')}</p>}
    {!hideSubmit && <button type="submit" disabled={busy || !input.birthDate || !input.confirmed} className="min-h-12 w-full rounded-lg bg-[#d4a437] px-3 text-sm font-semibold text-[#15120b] disabled:opacity-60">{loading ? 'Reading the stars…' : input.mode === 'full' ? 'Cast full reading' : 'Read today'}</button>}
    <style jsx>{`.birth-input { width:100%; min-height:44px; background:var(--field-bg); border:1px solid var(--field-border); color:var(--field-text); padding:0.5rem 0.65rem; border-radius:0.5rem; font-size:1rem; } .birth-input:focus { outline:2px solid var(--astral-gold); outline-offset:2px; }`}</style>
  </form>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-xs opacity-70">{label}</span>{children}</label>; }
