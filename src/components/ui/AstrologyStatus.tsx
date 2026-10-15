import type { AstrologyMetadata } from '@/lib/astrologyTypes';
import { chartPointLabel, publicMessage } from './chartPresentation';
export default function AstrologyStatus({ metadata }: { metadata?: AstrologyMetadata }) {
  if (!metadata) return null;
  return <details className="rounded-xl border border-[var(--panel-border)] p-3 text-xs leading-5">
    <summary className="cursor-pointer font-medium text-astral-cyan">What shaped this reading</summary>
    <p className="mt-2">{metadata.natalSummary?.length ? 'Your available birth-chart patterns, the selected sky and lunar rhythm inform one reading.' : 'The selected sky, lunar rhythm and broad Sun theme inform this reading.'} Suggestions are invitations to reflect and adapt to your own circumstances.</p>
    {metadata.sunFoundation && <p className="mt-2">Sun foundation: {metadata.sunFoundation.signs.join(' / ')} · {metadata.sunFoundation.basis === 'verified-natal' ? 'calculated from your recorded birth time' : metadata.sunFoundation.basis === 'estimated-natal' ? 'approximate, using your estimated time' : metadata.sunFoundation.signs.length > 1 ? 'birth time is needed to distinguish these signs' : 'checked across the possible birth-day interval'}.</p>}
    <p className="mt-2 opacity-70">Private chart facts, separate from AI interpretation. Snapshots at noon {metadata.targetTimezone}.</p>
    {metadata.natalSummary?.length ? <p className="mt-2">Calculated natal facts: {metadata.natalSummary.map(p => `${chartPointLabel(p.name)} in ${p.sign} ${p.degree}°`).join(' · ')}</p> : null}
    <ul className="mt-2 list-disc space-y-1 pl-4 opacity-80">{metadata.limitations.filter(item => publicMessage(item, '')).map(item => <li key={item}>{item}</li>)}</ul>
  </details>;
}
